/**
 * MqttAdapter — Backend protocol adapter for MQTT brokers.
 *
 * Subscribes to configured topic patterns, parses payloads, validates against
 * energyDatapointSchema, and emits validated UnifiedEnergyDatapoint values
 * into the provided EventBus.
 *
 * Malformed or unmapped messages are routed to the Dead-Letter Queue.
 */

import EventEmitter from 'node:events';
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type AdapterHealth,
  energyDatapointSchema,
  type IProtocolAdapter,
  type MetricType,
  type ProtocolType,
  type UnifiedEnergyDatapoint,
} from '@nexus-hems/shared-types';
import mqtt, { type IClientOptions, type MqttClient } from 'mqtt';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../../data');
const DLQ_PATH = join(DATA_DIR, 'dead-letter.ndjson');
const MAX_DLQ_LINES = 10_000;
let dlqLineCount = 0;

// ---------------------------------------------------------------------------
// Topic Pattern Configuration
// ---------------------------------------------------------------------------

export interface TopicPattern {
  /** MQTT topic pattern (supports + and # wildcards) */
  pattern: string;
  /** Metric type this topic represents */
  metric: MetricType;
  /**
   * How to extract the deviceId from an incoming topic.
   * 'topic[N]' uses the Nth segment (0-indexed).
   * 'payload.field' reads a JSON field from the payload.
   */
  deviceIdExtract: string;
  /** Optional value multiplier (default: 1) */
  scale?: number;
}

export interface MqttAdapterConfig {
  id: string;
  protocol: ProtocolType;
  brokerUrl: string;
  /** Optional MQTT client options (TLS, auth, QoS, etc.) */
  clientOptions?: IClientOptions;
  /** Topic-to-metric mapping rules */
  topicPatterns: TopicPattern[];
}

// ---------------------------------------------------------------------------
// MqttAdapter
// ---------------------------------------------------------------------------

export class MqttAdapter implements IProtocolAdapter {
  readonly id: string;
  readonly protocol: ProtocolType;

  private readonly config: MqttAdapterConfig;
  private client: MqttClient | null = null;
  private connected = false;
  private lastSuccessMs: number | undefined;
  private consecutiveErrors = 0;
  private readonly emitter = new EventEmitter();
  private destroyed = false;

  constructor(config: MqttAdapterConfig) {
    this.config = config;
    this.id = config.id;
    this.protocol = config.protocol;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const opts: IClientOptions = {
        reconnectPeriod: 5000,
        connectTimeout: 10_000,
        ...this.config.clientOptions,
      };

      this.client = mqtt.connect(this.config.brokerUrl, opts);

      this.client.once('connect', () => {
        this.connected = true;
        this.consecutiveErrors = 0;
        console.log(`[MqttAdapter:${this.id}] Connected to ${this.config.brokerUrl}`);

        // Subscribe to all configured topic patterns
        for (const tp of this.config.topicPatterns) {
          this.client?.subscribe(tp.pattern, { qos: 1 }, (err) => {
            if (err) {
              console.error('[MqttAdapter] Subscribe error:', this.id, tp.pattern, err);
            }
          });
        }

        resolve();
      });

      this.client.once('error', (err) => {
        if (!this.connected) reject(err);
      });

      this.client.on('reconnect', () => {
        console.log(`[MqttAdapter:${this.id}] Reconnecting…`);
        this.connected = false;
      });

      this.client.on('offline', () => {
        this.connected = false;
      });

      this.client.on('message', (topic, payload) => {
        this.handleMessage(topic, payload);
      });
    });
  }

  async disconnect(): Promise<void> {
    this.destroyed = true;
    this.emitter.removeAllListeners();
    await new Promise<void>((resolve) => {
      this.client?.end(true, {}, () => {
        resolve();
      });
    });
    this.connected = false;
  }

  async healthCheck(): Promise<AdapterHealth> {
    return {
      status: this.connected ? (this.consecutiveErrors > 0 ? 'degraded' : 'healthy') : 'offline',
      lastSuccessMs: this.lastSuccessMs,
      consecutiveErrors: this.consecutiveErrors,
    };
  }

  async *getDataStream(): AsyncGenerator<UnifiedEnergyDatapoint> {
    while (!this.destroyed) {
      const datapoint = await new Promise<UnifiedEnergyDatapoint | null>((resolve) => {
        const onData = (dp: UnifiedEnergyDatapoint): void => {
          cleanup();
          resolve(dp);
        };
        const onDestroy = (): void => {
          cleanup();
          resolve(null);
        };
        const cleanup = (): void => {
          this.emitter.off('data', onData);
          this.emitter.off('destroy', onDestroy);
        };
        this.emitter.once('data', onData);
        this.emitter.once('destroy', onDestroy);
      });

      if (datapoint === null) break;
      yield datapoint;
    }
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private handleMessage(topic: string, payload: Buffer): void {
    const matchedPattern = this.findMatchingPattern(topic);
    if (!matchedPattern) {
      writeToDLQ({
        ts: Date.now(),
        source: topic,
        rawPayload: payload.toString('utf8').slice(0, 4096),
        error: 'No matching topic pattern',
        protocol: this.protocol,
      });
      return;
    }

    let rawValue: number;
    let deviceId: string;

    try {
      const payloadStr = payload.toString('utf8');
      const parsed: unknown = JSON.parse(payloadStr);

      rawValue = this.extractValue(parsed, payloadStr);
      deviceId = this.extractDeviceId(topic, parsed, matchedPattern.deviceIdExtract);
    } catch (err) {
      this.consecutiveErrors++;
      writeToDLQ({
        ts: Date.now(),
        source: topic,
        rawPayload: payload.toString('utf8').slice(0, 4096),
        error: err instanceof Error ? err.message : 'Parse error',
        protocol: this.protocol,
      });
      return;
    }

    const scale = matchedPattern.scale ?? 1;
    const candidate = {
      timestamp: Date.now(),
      deviceId,
      protocol: this.protocol,
      metric: matchedPattern.metric,
      value: rawValue * scale,
      qualityIndicator: 'GOOD' as const,
    };

    const result = energyDatapointSchema.safeParse(candidate);
    if (result.success) {
      this.emitter.emit('data', result.data);
      this.lastSuccessMs = Date.now();
      this.consecutiveErrors = 0;
    } else {
      writeToDLQ({
        ts: Date.now(),
        source: topic,
        rawPayload: JSON.stringify(candidate),
        error: result.error.message,
        protocol: this.protocol,
      });
    }
  }

  private findMatchingPattern(topic: string): TopicPattern | null {
    for (const tp of this.config.topicPatterns) {
      if (topicMatchesPattern(topic, tp.pattern)) return tp;
    }
    return null;
  }

  private extractValue(parsed: unknown, rawStr: string): number {
    // Numeric payload (e.g. "3450.5")
    if (typeof parsed === 'number') return parsed;
    // Object with "value" field
    if (typeof parsed === 'object' && parsed !== null && 'value' in parsed) {
      const v = (parsed as Record<string, unknown>).value;
      if (typeof v === 'number') return v;
    }
    // Raw numeric string
    const n = Number(rawStr.trim());
    if (!Number.isNaN(n)) return n;
    throw new Error(`Cannot extract numeric value from payload: ${rawStr.slice(0, 100)}`);
  }

  private extractDeviceId(topic: string, parsed: unknown, extract: string): string {
    if (extract.startsWith('topic[')) {
      const idx = parseInt(extract.slice(6, -1), 10);
      const segments = topic.split('/');
      const segment = segments[idx];
      if (segment === undefined) throw new Error(`Topic segment ${idx} out of range: ${topic}`);
      return segment;
    }
    if (extract.startsWith('payload.') && typeof parsed === 'object' && parsed !== null) {
      const field = extract.slice(8);
      const val = (parsed as Record<string, unknown>)[field];
      if (typeof val === 'string') return val;
    }
    return this.id;
  }
}

// ---------------------------------------------------------------------------
// MQTT topic pattern matching (MQTT wildcard semantics)
// ---------------------------------------------------------------------------

function topicMatchesPattern(topic: string, pattern: string): boolean {
  if (pattern === '#') return true;
  const topicParts = topic.split('/');
  const patternParts = pattern.split('/');

  for (let i = 0; i < patternParts.length; i++) {
    const pp = patternParts[i];
    if (pp === '#') return true;
    if (pp !== '+' && pp !== topicParts[i]) return false;
  }
  return topicParts.length === patternParts.length;
}

// ---------------------------------------------------------------------------
// Dead-Letter Queue
// ---------------------------------------------------------------------------

interface DLQEntry {
  ts: number;
  source: string;
  rawPayload: string;
  error: string;
  protocol?: ProtocolType;
}

function writeToDLQ(entry: DLQEntry): void {
  if (dlqLineCount >= MAX_DLQ_LINES) {
    dlqLineCount = 0;
  }
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    appendFileSync(DLQ_PATH, `${JSON.stringify(entry)}\n`, 'utf8');
    dlqLineCount++;
  } catch {
    // Never let DLQ errors bubble up
  }
}
