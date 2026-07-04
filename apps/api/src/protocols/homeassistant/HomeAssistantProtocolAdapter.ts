/**
 * HomeAssistantProtocolAdapter — Backend IProtocolAdapter for Home Assistant.
 *
 * Phase 1 (MVP): ha-ws-api transport — WebSocket API at `/api/websocket`,
 * Long-Lived Access Token auth, `state_changed` subscription, static entity map
 * + device_class heuristics. Read-only telemetry (no service calls).
 *
 * Env vars (live mode only):
 *   HA_HOST              — HA hostname (required to enable)
 *   HA_PORT              — WebSocket port (default: 8123)
 *   HA_TLS               — "true" for wss://
 *   HA_TOKEN             — Long-Lived Access Token (required)
 *   HA_ADAPTER_ID        — adapter instance id (default: homeassistant-01)
 *   HA_DEVICE_ID         — deviceId prefix for datapoints (default: ha-site)
 *   HA_ENTITY_MAP_PATH   — override path to entity map JSON
 */

import EventEmitter from 'node:events';
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type AdapterHealth,
  energyDatapointSchema,
  type IProtocolAdapter,
  type ProtocolType,
  type UnifiedEnergyDatapoint,
} from '@nexus-hems/shared-types';
import { WebSocket } from 'ws';
import {
  recordAdapterDlq,
  recordAdapterError,
  recordAdapterReconnect,
} from '../../middleware/adapter-metrics.js';
import { API_RUNTIME_DIR, DEAD_LETTER_QUEUE_PATH } from '../../runtime-paths.js';
import {
  type HAEntityMapping,
  parseHANumericState,
  resolveHAEntityRole,
} from './ha-role-resolver.js';

const CONNECT_TIMEOUT_MS = 15_000;
const MAX_DLQ_LINES = 10_000;
let dlqLineCount = 0;

interface HAStateChangedEvent {
  event_type: 'state_changed';
  data: {
    entity_id: string;
    new_state: {
      state: string;
      attributes: {
        unit_of_measurement?: string;
        device_class?: string;
        friendly_name?: string;
      };
    } | null;
  };
}

interface HAWSMessage {
  id?: number;
  type: string;
  access_token?: string;
  event_filter?: { event_type?: string };
  event?: HAStateChangedEvent;
  success?: boolean;
  error?: { code: string; message: string };
}

export interface HomeAssistantProtocolAdapterConfig {
  id: string;
  host: string;
  port?: number;
  tls?: boolean;
  token: string;
  deviceId?: string;
  entityMappings?: HAEntityMapping[];
}

interface DLQEntry {
  ts: number;
  source: string;
  rawPayload: string;
  error: string;
  protocol: ProtocolType;
}

export class HomeAssistantProtocolAdapter implements IProtocolAdapter {
  readonly id: string;
  readonly protocol: ProtocolType = 'homeassistant-mqtt';

  private readonly config: Required<
    Pick<HomeAssistantProtocolAdapterConfig, 'host' | 'port' | 'tls' | 'token'>
  > &
    HomeAssistantProtocolAdapterConfig;
  private readonly deviceId: string;
  private readonly entityMap: Map<string, HAEntityMapping>;
  private ws: WebSocket | null = null;
  private wsMsgId = 1;
  private connected = false;
  private destroyed = false;
  private lastSuccessMs: number | undefined;
  private consecutiveErrors = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private readonly emitter = new EventEmitter();

  constructor(config: HomeAssistantProtocolAdapterConfig) {
    this.config = {
      ...config,
      port: config.port ?? 8123,
      tls: config.tls ?? false,
    };
    this.id = config.id;
    this.deviceId = config.deviceId ?? 'ha-site';
    this.entityMap = new Map((config.entityMappings ?? []).map((entry) => [entry.entityId, entry]));
  }

  async connect(): Promise<void> {
    if (this.destroyed) return;
    await this.openWebSocket();
  }

  async disconnect(): Promise<void> {
    this.destroyed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.emitter.emit('destroy');
  }

  async healthCheck(): Promise<AdapterHealth> {
    if (this.destroyed) {
      return { status: 'offline', consecutiveErrors: this.consecutiveErrors };
    }
    if (this.connected) {
      return {
        status: 'healthy',
        ...(this.lastSuccessMs !== undefined ? { lastSuccessMs: this.lastSuccessMs } : {}),
        consecutiveErrors: this.consecutiveErrors,
      };
    }
    return {
      status: 'offline',
      errorMessage: 'HA WebSocket not connected',
      consecutiveErrors: this.consecutiveErrors,
    };
  }

  async *getDataStream(): AsyncGenerator<UnifiedEnergyDatapoint> {
    const queue: Array<UnifiedEnergyDatapoint | null> = [];
    let notify: (() => void) | null = null;

    const onData = (dp: UnifiedEnergyDatapoint): void => {
      queue.push(dp);
      notify?.();
      notify = null;
    };
    const onDestroy = (): void => {
      queue.push(null);
      notify?.();
      notify = null;
    };

    this.emitter.on('data', onData);
    this.emitter.once('destroy', onDestroy);

    try {
      while (true) {
        if (queue.length === 0) {
          await new Promise<void>((resolve) => {
            notify = resolve;
          });
        }
        const item = queue.shift();
        if (item === null || item === undefined) break;
        yield item;
      }
    } finally {
      this.emitter.off('data', onData);
      this.emitter.off('destroy', onDestroy);
    }
  }

  private openWebSocket(): Promise<void> {
    const protocol = this.config.tls ? 'wss' : 'ws';
    const url = `${protocol}://${this.config.host}:${this.config.port}/api/websocket`;

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      this.ws = ws;
      let settled = false;

      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error('HA WebSocket connection timeout'));
        }
      }, CONNECT_TIMEOUT_MS);

      const finish = (err?: Error): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (err) reject(err);
        else resolve();
      };

      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(String(raw)) as HAWSMessage;
          this.handleWsMessage(
            msg,
            () => finish(),
            (err) => finish(err),
          );
        } catch (err) {
          recordAdapterError(this.id, this.protocol, 'parse_error');
          this.consecutiveErrors++;
          writeToDLQ({
            ts: Date.now(),
            source: url,
            rawPayload: String(raw).slice(0, 4096),
            error: err instanceof Error ? err.message : String(err),
            protocol: this.protocol,
          });
        }
      });

      ws.on('error', () => {
        recordAdapterError(this.id, this.protocol, 'ws_error');
        this.consecutiveErrors++;
        finish(new Error('HA WebSocket connection error'));
      });

      ws.on('close', () => {
        this.connected = false;
        if (!this.destroyed) {
          this.scheduleReconnect();
        }
      });
    });
  }

  private handleWsMessage(
    msg: HAWSMessage,
    onReady: () => void,
    onFail: (err: Error) => void,
  ): void {
    switch (msg.type) {
      case 'auth_required':
        this.sendWs({ type: 'auth', access_token: this.config.token });
        break;
      case 'auth_ok':
        this.connected = true;
        this.reconnectAttempt = 0;
        this.subscribeStateChanges();
        onReady();
        break;
      case 'auth_invalid':
        onFail(new Error('HA authentication invalid'));
        break;
      case 'event':
        if (msg.event?.event_type === 'state_changed') {
          this.handleStateChanged(msg.event);
        }
        break;
      default:
        break;
    }
  }

  private subscribeStateChanges(): void {
    this.sendWs({
      id: this.wsMsgId++,
      type: 'subscribe_events',
      event_filter: { event_type: 'state_changed' },
    });
  }

  private handleStateChanged(event: HAStateChangedEvent): void {
    const { entity_id: entityId, new_state: newState } = event.data;
    if (!newState) return;

    const deviceClass = newState.attributes.device_class ?? '';
    const unit = newState.attributes.unit_of_measurement ?? '';
    const resolution = resolveHAEntityRole(entityId, deviceClass, unit, this.entityMap);
    if (!resolution) return;

    const value = parseHANumericState(newState.state, unit, resolution.metric, resolution.scale);
    if (value === null) {
      writeToDLQ({
        ts: Date.now(),
        source: entityId,
        rawPayload: newState.state,
        error: 'non_numeric_state',
        protocol: this.protocol,
      });
      recordAdapterDlq(this.id, this.protocol);
      return;
    }

    const datapoint = energyDatapointSchema.safeParse({
      timestamp: Date.now(),
      deviceId: `${this.deviceId}:${entityId}`,
      protocol: this.protocol,
      metric: resolution.metric,
      value,
      qualityIndicator: 'GOOD',
      role: resolution.role,
    });

    if (!datapoint.success) {
      writeToDLQ({
        ts: Date.now(),
        source: entityId,
        rawPayload: newState.state,
        error: datapoint.error.message,
        protocol: this.protocol,
      });
      recordAdapterDlq(this.id, this.protocol);
      return;
    }

    this.lastSuccessMs = Date.now();
    this.consecutiveErrors = 0;
    this.emitter.emit('data', datapoint.data);
  }

  private sendWs(payload: HAWSMessage): void {
    this.ws?.send(JSON.stringify(payload));
  }

  private scheduleReconnect(): void {
    if (this.destroyed || this.reconnectTimer) return;
    const delay = Math.min(60_000, 1000 * 2 ** this.reconnectAttempt);
    this.reconnectAttempt++;
    recordAdapterReconnect(this.id, this.protocol);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.openWebSocket().catch(() => {
        this.scheduleReconnect();
      });
    }, delay);
  }
}

export function loadHAEntityMappings(path: string): HAEntityMapping[] {
  try {
    const raw = readFileSync(path, 'utf8');
    return JSON.parse(raw) as HAEntityMapping[];
  } catch {
    return [];
  }
}

export function createHomeAssistantAdapterFromEnv(
  env: NodeJS.ProcessEnv = process.env,
  entityMappings?: HAEntityMapping[],
): HomeAssistantProtocolAdapter | null {
  const host = env.HA_HOST?.trim();
  const token = env.HA_TOKEN?.trim();
  if (!host || !token) return null;

  const mapPath =
    env.HA_ENTITY_MAP_PATH?.trim() ||
    join(dirname(fileURLToPath(import.meta.url)), '../../data/ha-entity-map.json');

  return new HomeAssistantProtocolAdapter({
    id: env.HA_ADAPTER_ID?.trim() || 'homeassistant-01',
    host,
    port: env.HA_PORT ? Number(env.HA_PORT) : 8123,
    tls: env.HA_TLS === 'true',
    token,
    deviceId: env.HA_DEVICE_ID?.trim() || 'ha-site',
    entityMappings: entityMappings ?? loadHAEntityMappings(mapPath),
  });
}

function writeToDLQ(entry: DLQEntry): void {
  if (dlqLineCount >= MAX_DLQ_LINES) return;
  try {
    mkdirSync(API_RUNTIME_DIR, { recursive: true });
    appendFileSync(DEAD_LETTER_QUEUE_PATH, `${JSON.stringify(entry)}\n`, 'utf8');
    dlqLineCount++;
  } catch {
    /* best-effort */
  }
}
