/**
 * Zigbee2MQTT Adapter — Zigbee devices via Zigbee2MQTT bridge
 *
 * Connects to the Zigbee2MQTT MQTT broker to read energy-related
 * Zigbee device data (smart plugs, energy meters, sensors).
 *
 * Topic layout (Zigbee2MQTT default):
 *   zigbee2mqtt/<friendly_name>              — device state (JSON)
 *   zigbee2mqtt/<friendly_name>/set          — write commands
 *   zigbee2mqtt/<friendly_name>/availability — online/offline
 *   zigbee2mqtt/bridge/devices               — device list
 *   zigbee2mqtt/bridge/state                 — bridge online/offline
 *
 * Energy-relevant Zigbee clusters:
 *   - seMetering (0x0702)        → energy (kWh), power (W)
 *   - haElectricalMeasurement    → activePower, rmsCurrent, rmsVoltage
 *   - genAnalogInput             → generic sensor readings
 *
 * Prerequisites:
 *   - Zigbee2MQTT running with MQTT broker (Mosquitto)
 *   - WebSocket MQTT bridge reachable (e.g. mosquitto with ws listener)
 *   - Zigbee energy devices paired (Aqara, NOUS, Sonoff, Tuya, etc.)
 */

import { registerAdapter } from '../adapter-registry';
import { BaseAdapter } from '../BaseAdapter';
import type {
  AdapterCapability,
  AdapterCommand,
  AdapterConnectionConfig,
  UnifiedEnergyModel,
} from '../EnergyAdapter';

// ─── Config ─────────────────────────────────────────────────────────

export interface Zigbee2MQTTConfig extends Partial<AdapterConnectionConfig> {
  /** MQTT base topic (default: 'zigbee2mqtt') */
  baseTopic?: string;
  /** Friendly names of energy-monitoring devices */
  energyDevices?: string[];
  /** MQTT credentials */
  mqttUser?: string;
  mqttPassword?: string;
}

// ─── Zigbee device state payload ────────────────────────────────────

interface ZigbeeDeviceState {
  power?: number | undefined; // Watts
  energy?: number | undefined; // kWh
  voltage?: number | undefined; // V
  current?: number | undefined; // A
  state?: 'ON' | 'OFF' | undefined;
  temperature?: number | undefined;
  humidity?: number | undefined;
  linkquality?: number | undefined;
}

interface ZigbeeBridgeDevice {
  friendly_name: string;
  ieee_address: string;
  type: string;
  definition?: {
    model: string;
    vendor: string;
    exposes?: { type: string; name?: string }[];
  };
}

// ─── Adapter ────────────────────────────────────────────────────────

export class Zigbee2MQTTAdapter extends BaseAdapter {
  readonly id = 'zigbee2mqtt';
  readonly name = 'Zigbee2MQTT';
  readonly capabilities: AdapterCapability[] = ['load', 'grid'];

  private ws: WebSocket | null = null;
  private baseTopic: string;
  private energyDevices: Set<string>;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  /** Per-device power/energy readings */
  private deviceStates: Map<string, ZigbeeDeviceState> = new Map();
  /** Discovered devices from bridge */
  private knownDevices: Map<string, ZigbeeBridgeDevice> = new Map();

  constructor(config?: Zigbee2MQTTConfig) {
    super({
      name: 'Zigbee2MQTT',
      host: config?.host ?? 'localhost',
      port: config?.port ?? 9001, // Mosquitto default WS port
      tls: config?.tls ?? false,
      ...config,
    });

    this.baseTopic = config?.baseTopic ?? 'zigbee2mqtt';
    this.energyDevices = new Set(config?.energyDevices ?? []);
  }

  protected async _connect(): Promise<void> {
    const protocol = this.config.tls ? 'wss' : 'ws';
    const url = `${protocol}://${this.config.host}:${this.config.port}`;

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url, 'mqtt');

      const timeout = setTimeout(() => {
        reject(new Error('Zigbee2MQTT broker connection timeout'));
      }, 10_000);

      this.ws.onopen = () => {
        clearTimeout(timeout);
        this.setStatus('connected');

        // Subscribe to bridge state + all energy devices
        this.subscribe(`${this.baseTopic}/bridge/state`);
        this.subscribe(`${this.baseTopic}/bridge/devices`);

        // Subscribe to all energy devices
        for (const device of this.energyDevices) {
          this.subscribe(`${this.baseTopic}/${device}`);
        }

        // Wildcard subscribe if no specific devices configured
        if (this.energyDevices.size === 0) {
          this.subscribe(`${this.baseTopic}/+`);
        }

        this.pingInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30_000);

        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const raw = String(event.data);
          // Zigbee2MQTT sends topic + payload via WS bridge
          const msg = JSON.parse(raw) as {
            topic?: string;
            payload?: string | Record<string, unknown>;
          };
          if (msg.topic) {
            const payload = typeof msg.payload === 'string' ? JSON.parse(msg.payload) : msg.payload;
            this.handleTopic(msg.topic, payload as Record<string, unknown>);
          }
        } catch {
          // Ignore non-JSON messages
        }
      };

      this.ws.onerror = () => {
        clearTimeout(timeout);
        this.setStatus('error', 'MQTT WebSocket error');
        reject(new Error('WebSocket error'));
      };

      this.ws.onclose = () => {
        this.setStatus('disconnected');
        this.scheduleReconnect();
      };
    });
  }

  protected async _disconnect(): Promise<void> {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }

  protected async _sendCommand(command: AdapterCommand): Promise<boolean> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;

    // Zigbee2MQTT commands → set topic
    if (!command.targetDeviceId) return false;

    const topic = `${this.baseTopic}/${command.targetDeviceId}/set`;

    switch (command.type) {
      case 'KNX_TOGGLE_LIGHTS':
        this.ws.send(
          JSON.stringify({
            topic,
            payload: JSON.stringify({ state: command.value ? 'ON' : 'OFF' }),
          }),
        );
        return true;
      default:
        return false;
    }
  }

  private subscribe(topic: string): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'subscribe', topic }));
  }

  private handleTopic(topic: string, payload: Record<string, unknown>): void {
    // Bridge device list
    if (topic === `${this.baseTopic}/bridge/devices`) {
      const devices = payload as unknown as ZigbeeBridgeDevice[];
      if (Array.isArray(devices)) {
        for (const dev of devices) {
          this.knownDevices.set(dev.friendly_name, dev);
          // Auto-discover devices that expose power readings
          if (
            dev.definition?.exposes?.some(
              (e) => e.name === 'power' || e.name === 'energy' || e.name === 'voltage',
            )
          ) {
            this.energyDevices.add(dev.friendly_name);
            this.subscribe(`${this.baseTopic}/${dev.friendly_name}`);
          }
        }
      }
      return;
    }

    // Bridge state
    if (topic === `${this.baseTopic}/bridge/state`) {
      const state = (payload as { state?: string }).state;
      if (state === 'offline') {
        this.setStatus('error', 'Zigbee2MQTT bridge offline');
      }
      return;
    }

    // Device state update
    const deviceName = topic.replace(`${this.baseTopic}/`, '').split('/')[0];
    if (!deviceName || deviceName === 'bridge') return;

    const state: ZigbeeDeviceState = {
      power: typeof payload.power === 'number' ? payload.power : undefined,
      energy: typeof payload.energy === 'number' ? payload.energy : undefined,
      voltage: typeof payload.voltage === 'number' ? payload.voltage : undefined,
      current: typeof payload.current === 'number' ? payload.current : undefined,
      state: payload.state === 'ON' || payload.state === 'OFF' ? payload.state : undefined,
      temperature: typeof payload.temperature === 'number' ? payload.temperature : undefined,
    };

    this.deviceStates.set(deviceName, state);
    this.emitModel();
  }

  private emitModel(): void {
    let totalPowerW = 0;

    for (const state of this.deviceStates.values()) {
      if (state.power != null) totalPowerW += state.power;
    }

    const model: Partial<UnifiedEnergyModel> = {
      timestamp: Date.now(),
      grid: {
        powerW: totalPowerW, // Metered load via smart plugs
        voltageV: 230,
      },
      load: {
        totalPowerW,
        heatPumpPowerW: 0,
        evPowerW: 0,
        otherPowerW: totalPowerW,
      },
    };
    this.emitData(model);
  }
}

// ─── Registration ───────────────────────────────────────────────────

export function register(): void {
  registerAdapter(
    'zigbee2mqtt',
    (config) => new Zigbee2MQTTAdapter(config as Zigbee2MQTTConfig | undefined),
    {
      displayName: 'Zigbee2MQTT',
      description: 'Zigbee-Geräte über Zigbee2MQTT Bridge',
      source: 'contrib',
    },
  );
}
