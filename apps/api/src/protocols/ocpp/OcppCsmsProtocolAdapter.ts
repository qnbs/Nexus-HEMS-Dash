/**
 * OcppCsmsProtocolAdapter — Backend OCPP 2.1 CSMS WebSocket gateway.
 *
 * Listens for charge-point (EVSE) WebSocket connections and responds as a
 * minimal Central System (BootNotification, Heartbeat, Authorize). Maps
 * MeterValues / TransactionEvent telemetry to role-tagged UnifiedEnergyDatapoint
 * values for the EventBus.
 *
 * Env (live mode only):
 *   OCPP_CSMS_PORT=9000          — enables gateway when set (default path /ocpp)
 *   OCPP_CSMS_HOST=0.0.0.0       — bind address (default 0.0.0.0)
 *   OCPP_CSMS_PATH=/ocpp         — WebSocket HTTP upgrade path
 *
 * Security: SP0 (plain WS) only in this pass; SP3 mTLS tracked as HIGH-12.
 */

import EventEmitter from 'node:events';
import { appendFileSync, mkdirSync } from 'node:fs';
import {
  type AdapterHealth,
  energyDatapointSchema,
  type IProtocolAdapter,
  type MetricType,
  type ProtocolType,
  type UnifiedEnergyDatapoint,
} from '@nexus-hems/shared-types';
import { WebSocket, WebSocketServer } from 'ws';
import { recordAdapterDlq, recordAdapterError } from '../../middleware/adapter-metrics.js';
import { API_RUNTIME_DIR, DEAD_LETTER_QUEUE_PATH } from '../../runtime-paths.js';

const OCPP_CALL = 2;
const OCPP_CALLRESULT = 3;
const OCPP_CALLERROR = 4;

const HEARTBEAT_INTERVAL_S = 300;
const MAX_DLQ_LINES = 10_000;
let dlqLineCount = 0;

type OcppInboundMessage =
  | [typeof OCPP_CALL, string, string, Record<string, unknown>]
  | [typeof OCPP_CALLRESULT, string, Record<string, unknown>]
  | [typeof OCPP_CALLERROR, string, string, string, Record<string, unknown>];

interface ChargePointSession {
  chargePointId: string;
  lastPowerW: number;
  lastEnergyKWh: number;
  lastSocPercent: number | undefined;
  lastSeenMs: number;
}

export interface OcppCsmsProtocolAdapterConfig {
  id: string;
  host?: string;
  port: number;
  path?: string;
}

interface DLQEntry {
  ts: number;
  source: string;
  rawPayload: string;
  error: string;
  protocol: ProtocolType;
}

export class OcppCsmsProtocolAdapter implements IProtocolAdapter {
  readonly id: string;
  readonly protocol: ProtocolType = 'ocpp';

  private readonly config: Required<Pick<OcppCsmsProtocolAdapterConfig, 'host' | 'path'>> &
    OcppCsmsProtocolAdapterConfig;
  private wss: WebSocketServer | null = null;
  private listening = false;
  private lastSuccessMs: number | undefined;
  private consecutiveErrors = 0;
  private readonly sessions = new Map<WebSocket, ChargePointSession>();
  private readonly emitter = new EventEmitter();

  constructor(config: OcppCsmsProtocolAdapterConfig) {
    this.config = {
      ...config,
      host: config.host ?? '0.0.0.0',
      path: config.path ?? '/ocpp',
    };
    this.id = config.id;
  }

  /** Exposed for tests — actual bound port when `port: 0` was requested. */
  getBoundPort(): number | undefined {
    if (!this.wss) return undefined;
    const addr = this.wss.address();
    return addr && typeof addr === 'object' ? addr.port : undefined;
  }

  async connect(): Promise<void> {
    if (this.listening) return;

    await new Promise<void>((resolve, reject) => {
      const wss = new WebSocketServer({ host: this.config.host, port: this.config.port }, () => {
        this.listening = true;
        this.consecutiveErrors = 0;
        resolve();
      });

      wss.on('error', (err) => {
        if (!this.listening) reject(err);
      });

      wss.on('connection', (ws, req) => {
        const pathParts = (req.url ?? '/').split('/').filter(Boolean);
        const chargePointId = pathParts.at(-1) ?? 'unknown-cp';
        this.sessions.set(ws, {
          chargePointId,
          lastPowerW: 0,
          lastEnergyKWh: 0,
          lastSocPercent: undefined,
          lastSeenMs: Date.now(),
        });

        ws.on('message', (data) => {
          try {
            const raw =
              typeof data === 'string' ? data : Buffer.from(data as Buffer).toString('utf8');
            const msg = JSON.parse(raw) as OcppInboundMessage;
            this.handleMessage(ws, msg);
          } catch (err) {
            recordAdapterError(this.id, this.protocol, 'parse');
            writeToDLQ({
              ts: Date.now(),
              source: 'ocpp-csms-ws',
              rawPayload: String(data).slice(0, 512),
              error: err instanceof Error ? err.message : String(err),
              protocol: this.protocol,
            });
            recordAdapterDlq(this.id, this.protocol);
          }
        });

        ws.on('close', () => {
          this.sessions.delete(ws);
        });

        ws.on('error', () => {
          ws.close();
        });
      });

      this.wss = wss;
    });
  }

  async disconnect(): Promise<void> {
    this.emitter.emit('destroy');
    this.emitter.removeAllListeners();

    for (const ws of this.sessions.keys()) {
      ws.close(1000, 'csms shutdown');
    }
    this.sessions.clear();

    if (this.wss) {
      await new Promise<void>((resolve) => {
        this.wss!.close(() => resolve());
      });
      this.wss = null;
    }
    this.listening = false;
  }

  async healthCheck(): Promise<AdapterHealth> {
    const sessionCount = this.sessions.size;
    return {
      status: this.listening
        ? sessionCount > 0 && this.consecutiveErrors === 0
          ? 'healthy'
          : sessionCount > 0
            ? 'degraded'
            : 'healthy'
        : 'offline',
      lastSuccessMs: this.lastSuccessMs,
      errorMessage: this.listening
        ? sessionCount === 0
          ? 'CSMS listening — no charge points connected'
          : this.consecutiveErrors > 0
            ? `${this.consecutiveErrors} consecutive parse errors`
            : undefined
        : 'CSMS gateway not listening',
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
          await new Promise<void>((r) => {
            notify = r;
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

  private handleMessage(ws: WebSocket, msg: OcppInboundMessage): void {
    if (msg[0] !== OCPP_CALL) return;

    const [, messageId, action, payload] = msg;
    const session = this.sessions.get(ws);
    if (!session) return;

    session.lastSeenMs = Date.now();

    switch (action) {
      case 'BootNotification': {
        const station = payload.chargingStation as { serialNumber?: string } | undefined;
        if (station?.serialNumber) {
          session.chargePointId = station.serialNumber;
        }
        this.sendCallResult(ws, messageId, {
          currentTime: new Date().toISOString(),
          interval: HEARTBEAT_INTERVAL_S,
          status: 'Accepted',
        });
        break;
      }
      case 'Heartbeat':
        this.sendCallResult(ws, messageId, { currentTime: new Date().toISOString() });
        break;
      case 'Authorize':
        this.sendCallResult(ws, messageId, {
          idTokenInfo: { status: 'Accepted' },
        });
        break;
      case 'StatusNotification':
        this.sendCallResult(ws, messageId, {});
        break;
      case 'MeterValues':
        this.ingestMeterPayload(session, payload);
        this.sendCallResult(ws, messageId, {});
        break;
      case 'TransactionEvent':
        this.ingestTransactionPayload(session, payload);
        this.sendCallResult(ws, messageId, {});
        break;
      default:
        this.sendCallError(ws, messageId, 'NotImplemented', `Action ${action} not supported`);
    }
  }

  private ingestMeterPayload(session: ChargePointSession, payload: Record<string, unknown>): void {
    const meterValue = payload.meterValue as
      | { sampledValue: { value: number | string; measurand?: string; unit?: string }[] }[]
      | undefined;
    if (!meterValue) return;
    this.applySampledValues(session, meterValue);
  }

  private ingestTransactionPayload(
    session: ChargePointSession,
    payload: Record<string, unknown>,
  ): void {
    const meterValue = payload.meterValue as
      | { sampledValue: { value: number | string; measurand?: string; unit?: string }[] }[]
      | undefined;
    if (meterValue) {
      this.applySampledValues(session, meterValue);
    }
    if (payload.eventType === 'Ended') {
      session.lastPowerW = 0;
      this.emitMetric(session, 'POWER_W', 0);
    }
  }

  private applySampledValues(
    session: ChargePointSession,
    meterValue: { sampledValue: { value: number | string; measurand?: string; unit?: string }[] }[],
  ): void {
    for (const mv of meterValue) {
      for (const sv of mv.sampledValue) {
        const value = Number(sv.value);
        if (!Number.isFinite(value)) continue;

        switch (sv.measurand) {
          case 'Power.Active.Import':
            session.lastPowerW = value;
            this.emitMetric(session, 'POWER_W', value);
            break;
          case 'Energy.Active.Import.Register': {
            const kwh = sv.unit === 'Wh' ? value / 1000 : value;
            session.lastEnergyKWh = kwh;
            this.emitMetric(session, 'ENERGY_KWH', kwh);
            break;
          }
          case 'SoC':
            session.lastSocPercent = value;
            this.emitMetric(session, 'SOC_PERCENT', value);
            break;
          default:
            break;
        }
      }
    }
  }

  private emitMetric(session: ChargePointSession, metric: MetricType, value: number): void {
    const candidate = {
      timestamp: Date.now(),
      deviceId: session.chargePointId,
      protocol: this.protocol,
      metric,
      value,
      qualityIndicator: 'GOOD' as const,
      role: 'ev' as const,
    };

    const parsed = energyDatapointSchema.safeParse(candidate);
    if (parsed.success) {
      this.emitter.emit('data', parsed.data);
      this.lastSuccessMs = Date.now();
      this.consecutiveErrors = 0;
    } else {
      this.consecutiveErrors++;
      writeToDLQ({
        ts: Date.now(),
        source: session.chargePointId,
        rawPayload: JSON.stringify(candidate),
        error: parsed.error.message,
        protocol: this.protocol,
      });
      recordAdapterDlq(this.id, this.protocol);
    }
  }

  private sendCallResult(ws: WebSocket, messageId: string, payload: Record<string, unknown>): void {
    if (ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify([OCPP_CALLRESULT, messageId, payload]));
  }

  private sendCallError(
    ws: WebSocket,
    messageId: string,
    errorCode: string,
    errorDescription: string,
  ): void {
    if (ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify([OCPP_CALLERROR, messageId, errorCode, errorDescription, {}]));
  }
}

export function createOcppCsmsAdapterFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): OcppCsmsProtocolAdapter | null {
  const portRaw = env.OCPP_CSMS_PORT?.trim();
  if (!portRaw) return null;
  const port = Number(portRaw);
  if (!Number.isFinite(port) || port < 1 || port > 65_535) return null;

  return new OcppCsmsProtocolAdapter({
    id: env.OCPP_CSMS_ADAPTER_ID?.trim() || 'ocpp-csms-01',
    host: env.OCPP_CSMS_HOST?.trim() || '0.0.0.0',
    port,
    path: env.OCPP_CSMS_PATH?.trim() || '/ocpp',
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
