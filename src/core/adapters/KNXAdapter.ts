/**
 * KNXAdapter — KNX/IP building automation adapter
 *
 * Connects to a KNX/IP gateway (e.g. Weinzierl, ABB, MDT) via a WebSocket
 * bridge that translates KNX group addresses to JSON payloads.
 *
 * Architecture:
 *   KNX Bus → KNX/IP Gateway → knx-bridge (Node.js / knxd) → WebSocket → This Adapter
 *
 * Supported group address conventions (ETS export):
 *   • 1/x/x  – Lighting (switch, dimming)
 *   • 2/x/x  – Heating / Climate (setpoint, actual, valve)
 *   • 3/x/x  – Sensors (temperature, humidity, CO₂, window contact)
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
  KNXRoom,
} from './EnergyAdapter';

// ─── KNX telegram message from bridge ────────────────────────────────

interface KNXTelegram {
  /** KNX group address, e.g. "1/1/0" */
  ga: string;
  /** Datapoint type, e.g. "DPT1.001" */
  dpt: string;
  /** Decoded value */
  value: boolean | number | string;
  /** Source physical address */
  src?: string;
}

/** Room definition from KNX project config */
interface KNXRoomConfig {
  id: string;
  name: string;
  /** Group address for light switching */
  lightGA: string;
  /** Group address for light dimming value */
  dimGA?: string;
  /** Group address for temperature actual value */
  tempGA: string;
  /** Group address for setpoint */
  setpointGA?: string;
  /** Group address for window contact */
  windowGA?: string;
  /** Group address for humidity */
  humidityGA?: string;
  /** Group address for CO₂ */
  co2GA?: string;
}

const DEFAULT_ROOMS: KNXRoomConfig[] = [
  {
    id: 'living',
    name: 'Living Room',
    lightGA: '1/1/0',
    dimGA: '1/1/1',
    tempGA: '3/1/0',
    setpointGA: '2/1/0',
    windowGA: '3/1/1',
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    lightGA: '1/2/0',
    tempGA: '3/2/0',
    windowGA: '3/2/1',
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    lightGA: '1/3/0',
    tempGA: '3/3/0',
    humidityGA: '3/3/2',
  },
];

const DEFAULT_RECONNECT = {
  enabled: true,
  initialDelayMs: 2000,
  maxDelayMs: 15_000,
  backoffMultiplier: 1.5,
};

export class KNXAdapter implements EnergyAdapter {
  readonly id = 'knx';
  readonly name = 'KNX/IP Gateway';
  readonly capabilities: AdapterCapability[] = ['knx'];

  private _status: AdapterStatus = 'disconnected';
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private retryDelay: number;
  private destroyed = false;

  private dataCallbacks: AdapterDataCallback[] = [];
  private statusCallbacks: AdapterStatusCallback[] = [];

  /** Live room state, keyed by room id */
  private rooms: Map<string, KNXRoom> = new Map();
  /** GA → room id + field mapping */
  private gaIndex: Map<string, { roomId: string; field: string }> = new Map();

  private readonly config: AdapterConnectionConfig;
  private readonly roomConfigs: KNXRoomConfig[];

  constructor(config?: Partial<AdapterConnectionConfig>, roomConfigs?: KNXRoomConfig[]) {
    this.config = {
      name: 'KNX/IP',
      host: config?.host ?? '192.168.1.101',
      port: config?.port ?? 3671,
      tls: config?.tls ?? false,
      reconnect: { ...DEFAULT_RECONNECT, ...config?.reconnect },
      ...config,
    };
    this.retryDelay = this.config.reconnect?.initialDelayMs ?? DEFAULT_RECONNECT.initialDelayMs;
    this.roomConfigs = roomConfigs ?? DEFAULT_ROOMS;
    this.initRooms();
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
    if (this.ws?.readyState !== WebSocket.OPEN) return false;

    let telegram: { ga: string; value: boolean | number | string } | null = null;

    if (command.type === 'KNX_TOGGLE_LIGHTS' && command.targetDeviceId) {
      const roomCfg = this.roomConfigs.find((r) => r.id === command.targetDeviceId);
      if (roomCfg) {
        telegram = { ga: roomCfg.lightGA, value: Boolean(command.value) };
      }
    } else if (command.type === 'KNX_SET_TEMPERATURE' && command.targetDeviceId) {
      const roomCfg = this.roomConfigs.find((r) => r.id === command.targetDeviceId);
      if (roomCfg?.setpointGA) {
        telegram = { ga: roomCfg.setpointGA, value: Number(command.value) };
      }
    }

    if (!telegram) return false;

    this.ws.send(JSON.stringify({ type: 'WRITE', ...telegram }));
    return true;
  }

  getSnapshot(): Partial<UnifiedEnergyModel> {
    return {
      knx: { rooms: Array.from(this.rooms.values()) },
    };
  }

  // ─── Internal ─────────────────────────────────────────────────────

  private initRooms(): void {
    for (const cfg of this.roomConfigs) {
      this.rooms.set(cfg.id, {
        id: cfg.id,
        name: cfg.name,
        temperature: 21.0,
        lightsOn: false,
        windowOpen: false,
      });

      // Build reverse lookup: GA → room + field
      this.gaIndex.set(cfg.lightGA, { roomId: cfg.id, field: 'lightsOn' });
      if (cfg.dimGA) this.gaIndex.set(cfg.dimGA, { roomId: cfg.id, field: 'brightness' });
      this.gaIndex.set(cfg.tempGA, { roomId: cfg.id, field: 'temperature' });
      if (cfg.setpointGA) this.gaIndex.set(cfg.setpointGA, { roomId: cfg.id, field: 'setpoint' });
      if (cfg.windowGA) this.gaIndex.set(cfg.windowGA, { roomId: cfg.id, field: 'windowOpen' });
      if (cfg.humidityGA) this.gaIndex.set(cfg.humidityGA, { roomId: cfg.id, field: 'humidity' });
      if (cfg.co2GA) this.gaIndex.set(cfg.co2GA, { roomId: cfg.id, field: 'co2ppm' });
    }
  }

  private doConnect(): void {
    this.setStatus('connecting');

    const protocol = this.config.tls ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${this.config.host}:${this.config.port}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      this.retryDelay = this.config.reconnect?.initialDelayMs ?? DEFAULT_RECONNECT.initialDelayMs;
      this.setStatus('connected');
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const telegram = JSON.parse(String(event.data)) as KNXTelegram;
        this.handleTelegram(telegram);
      } catch {
        // Ignore non-JSON
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

  private handleTelegram(telegram: KNXTelegram): void {
    const mapping = this.gaIndex.get(telegram.ga);
    if (!mapping) return;

    const room = this.rooms.get(mapping.roomId);
    if (!room) return;

    // Update the specific field
    switch (mapping.field) {
      case 'lightsOn':
        room.lightsOn = Boolean(telegram.value);
        break;
      case 'brightness':
        room.brightness = Number(telegram.value);
        break;
      case 'temperature':
        room.temperature = Number(telegram.value);
        break;
      case 'setpoint':
        room.setpoint = Number(telegram.value);
        break;
      case 'windowOpen':
        room.windowOpen = Boolean(telegram.value);
        break;
      case 'humidity':
        room.humidity = Number(telegram.value);
        break;
      case 'co2ppm':
        room.co2ppm = Number(telegram.value);
        break;
    }

    this.rooms.set(mapping.roomId, room);

    // Emit snapshot with all rooms
    const model: Partial<UnifiedEnergyModel> = {
      timestamp: Date.now(),
      knx: { rooms: Array.from(this.rooms.values()) },
    };
    for (const cb of this.dataCallbacks) cb(model);
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
}
