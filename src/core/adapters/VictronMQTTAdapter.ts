/**
 * VictronMQTTAdapter — Adapter for Victron Cerbo GX via Node-RED WebSocket
 *
 * Migrates the existing useWebSocket.ts connection into the adapter pattern.
 * Supports both the current Node-RED WebSocket relay and direct MQTT (Victron's
 * dbus-mqtt bridge on port 1883/9001).
 *
 * Data flow:  Cerbo GX → Node-RED → WebSocket → This Adapter → UnifiedEnergyModel
 */

import type {
  EnergyAdapter,
  AdapterStatus,
  AdapterCapability,
  AdapterConnectionConfig,
  AdapterCommand,
  AdapterDataCallback,
  AdapterStatusCallback,
  UnifiedEnergyModel,
} from './EnergyAdapter';

// ─── Victron dbus topic → field mapping ──────────────────────────────

/** Raw message from Node-RED WebSocket (current format) */
interface NodeREDEnergyMessage {
  type: 'ENERGY_UPDATE';
  data: {
    gridPower?: number;
    pvPower?: number;
    batteryPower?: number;
    houseLoad?: number;
    batterySoC?: number;
    heatPumpPower?: number;
    evPower?: number;
    gridVoltage?: number;
    batteryVoltage?: number;
    pvYieldToday?: number;
    priceCurrent?: number;
  };
}

const DEFAULT_RECONNECT = {
  enabled: true,
  initialDelayMs: 1500,
  maxDelayMs: 10_000,
  backoffMultiplier: 1.6,
};

export class VictronMQTTAdapter implements EnergyAdapter {
  readonly id = 'victron-mqtt';
  readonly name = 'Victron Cerbo GX (Node-RED)';
  readonly capabilities: AdapterCapability[] = ['pv', 'battery', 'grid', 'load'];

  private _status: AdapterStatus = 'disconnected';
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private retryDelay: number;
  private destroyed = false;

  private dataCallbacks: AdapterDataCallback[] = [];
  private statusCallbacks: AdapterStatusCallback[] = [];
  private snapshot: Partial<UnifiedEnergyModel> = {};

  private readonly config: AdapterConnectionConfig;

  constructor(config?: Partial<AdapterConnectionConfig>) {
    this.config = {
      name: 'Victron Cerbo GX',
      host: config?.host ?? window.location.hostname,
      port: config?.port ?? (window.location.port ? Number(window.location.port) : 443),
      tls: config?.tls ?? window.location.protocol === 'https:',
      reconnect: { ...DEFAULT_RECONNECT, ...config?.reconnect },
      ...config,
    };
    this.retryDelay = this.config.reconnect?.initialDelayMs ?? DEFAULT_RECONNECT.initialDelayMs;
  }

  get status(): AdapterStatus {
    return this._status;
  }

  // ─── Lifecycle ────────────────────────────────────────────────────

  async connect(): Promise<void> {
    if (this._status === 'connected' || this._status === 'connecting') return;
    this.destroyed = false;
    this.doConnect();
  }

  async disconnect(): Promise<void> {
    this.clearReconnect();
    this.ws?.close();
    this.ws = null;
    this.setStatus('disconnected');
  }

  destroy(): void {
    this.destroyed = true;
    void this.disconnect();
    this.dataCallbacks = [];
    this.statusCallbacks = [];
  }

  // ─── Subscriptions ───────────────────────────────────────────────

  onData(callback: AdapterDataCallback): void {
    this.dataCallbacks.push(callback);
  }

  onStatus(callback: AdapterStatusCallback): void {
    this.statusCallbacks.push(callback);
  }

  // ─── Commands ─────────────────────────────────────────────────────

  async sendCommand(command: AdapterCommand): Promise<boolean> {
    const mapped = this.mapCommand(command);
    if (!mapped) return false;

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(mapped));
      return true;
    }
    return false;
  }

  getSnapshot(): Partial<UnifiedEnergyModel> {
    return { ...this.snapshot };
  }

  // ─── Internal ─────────────────────────────────────────────────────

  private doConnect(): void {
    this.setStatus('connecting');

    const protocol = this.config.tls ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${this.config.host}:${this.config.port}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      this.retryDelay =
        this.config.reconnect?.initialDelayMs ?? DEFAULT_RECONNECT.initialDelayMs;
      this.setStatus('connected');
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(String(event.data)) as NodeREDEnergyMessage;
        if (message.type === 'ENERGY_UPDATE') {
          const model = this.toUnifiedModel(message.data);
          this.snapshot = model;
          for (const cb of this.dataCallbacks) cb(model);
        }
      } catch {
        // Non-JSON or unknown message format — ignore
      }
    };

    ws.onclose = () => {
      this.setStatus('disconnected');
      if (!this.destroyed && this.config.reconnect?.enabled) {
        this.scheduleReconnect();
      }
    };

    ws.onerror = () => {
      ws.close();
    };

    this.ws = ws;
  }

  private scheduleReconnect(): void {
    this.clearReconnect();
    this.reconnectTimer = setTimeout(() => {
      const maxDelay = this.config.reconnect?.maxDelayMs ?? DEFAULT_RECONNECT.maxDelayMs;
      const multiplier =
        this.config.reconnect?.backoffMultiplier ?? DEFAULT_RECONNECT.backoffMultiplier;
      this.retryDelay = Math.min(this.retryDelay * multiplier, maxDelay);
      this.doConnect();
    }, this.retryDelay);
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private setStatus(status: AdapterStatus, error?: string): void {
    this._status = status;
    for (const cb of this.statusCallbacks) cb(status, error);
  }

  /** Map Node-RED's flat data to UnifiedEnergyModel */
  private toUnifiedModel(
    data: NodeREDEnergyMessage['data'],
  ): Partial<UnifiedEnergyModel> {
    return {
      timestamp: Date.now(),
      pv: {
        totalPowerW: data.pvPower ?? 0,
        yieldTodayKWh: data.pvYieldToday ?? 0,
      },
      battery: {
        powerW: data.batteryPower ?? 0,
        socPercent: data.batterySoC ?? 0,
        voltageV: data.batteryVoltage ?? 51.2,
        currentA: (data.batteryPower ?? 0) / (data.batteryVoltage || 51.2),
      },
      grid: {
        powerW: data.gridPower ?? 0,
        voltageV: data.gridVoltage ?? 230,
      },
      load: {
        totalPowerW: data.houseLoad ?? 0,
        heatPumpPowerW: data.heatPumpPower ?? 0,
        evPowerW: data.evPower ?? 0,
        otherPowerW: Math.max(
          0,
          (data.houseLoad ?? 0) - (data.heatPumpPower ?? 0) - (data.evPower ?? 0),
        ),
      },
      tariff: data.priceCurrent != null
        ? { currentPriceEurKWh: data.priceCurrent, provider: 'tibber' }
        : undefined,
    };
  }

  /** Map adapter-agnostic commands to Node-RED format */
  private mapCommand(
    command: AdapterCommand,
  ): { type: string; value: number | string | boolean } | null {
    const mapping: Record<string, string> = {
      SET_EV_POWER: 'SET_EV_POWER',
      SET_HEAT_PUMP_POWER: 'SET_HEAT_PUMP_POWER',
      SET_HEAT_PUMP_MODE: 'SET_HEAT_PUMP_POWER',
      SET_BATTERY_POWER: 'SET_BATTERY_POWER',
      SET_BATTERY_MODE: 'SET_BATTERY_POWER',
    };

    const type = mapping[command.type];
    if (!type) return null;
    return { type, value: command.value };
  }
}
