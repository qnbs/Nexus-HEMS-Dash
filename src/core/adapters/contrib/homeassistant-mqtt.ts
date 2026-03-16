/**
 * Home Assistant MQTT Adapter — Integration via HA MQTT Discovery
 *
 * Connects to a Home Assistant instance through its MQTT broker to read
 * energy sensor states. Uses HA's MQTT Discovery topic convention:
 *
 *   homeassistant/<component>/<object_id>/state
 *   homeassistant/sensor/<object_id>/config   (discovery payload)
 *
 * Supports:
 *   - PV production (sensor.solar_power, sensor.solar_energy_today)
 *   - Battery state (sensor.battery_power, sensor.battery_soc)
 *   - Grid import/export (sensor.grid_power)
 *   - House consumption (sensor.house_power)
 *   - EV charger entities (sensor.wallbox_*)
 *
 * Prerequisites:
 *   - Home Assistant with MQTT integration enabled
 *   - Mosquitto broker (or any MQTT broker) reachable via WebSocket
 *   - Energy entities configured in HA energy dashboard
 */

import { BaseAdapter } from '../BaseAdapter';
import type {
  AdapterCapability,
  AdapterCommand,
  AdapterConnectionConfig,
  UnifiedEnergyModel,
} from '../EnergyAdapter';
import { registerAdapter } from '../adapter-registry';

// ─── HA Entity → HEMS mapping ───────────────────────────────────────

/** Default HA entity mappings (user-configurable) */
const DEFAULT_ENTITY_MAP = {
  pvPower: 'sensor.solar_power',
  pvEnergyToday: 'sensor.solar_energy_today',
  batteryPower: 'sensor.battery_power',
  batterySoc: 'sensor.battery_soc',
  gridPower: 'sensor.grid_power',
  housePower: 'sensor.house_power',
  evPower: 'sensor.wallbox_power',
  evSoc: 'sensor.ev_soc',
  evStatus: 'sensor.wallbox_status',
} as const;

type EntityMap = Record<keyof typeof DEFAULT_ENTITY_MAP, string>;

// ─── Config ─────────────────────────────────────────────────────────

export interface HomeAssistantMQTTConfig extends Partial<AdapterConnectionConfig> {
  /** MQTT topic prefix (default: 'homeassistant') */
  topicPrefix?: string;
  /** HA entity → topic mapping overrides */
  entityMap?: Partial<EntityMap>;
  /** MQTT username (often 'homeassistant') */
  mqttUser?: string;
  /** MQTT password */
  mqttPassword?: string;
}

// ─── Adapter ────────────────────────────────────────────────────────

export class HomeAssistantMQTTAdapter extends BaseAdapter {
  readonly id = 'homeassistant-mqtt';
  readonly name = 'Home Assistant MQTT';
  readonly capabilities: AdapterCapability[] = ['pv', 'battery', 'grid', 'load', 'evCharger'];

  private ws: WebSocket | null = null;
  private topicPrefix: string;
  private entityMap: EntityMap;
  private subscriptions: Map<string, string> = new Map();
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  /** MQTT credentials — sent via connect payload when broker requires auth */
  private mqttCredentials?: { user: string; password: string };

  // Accumulated state from HA sensors
  private pvPowerW = 0;
  private pvEnergyTodayKWh = 0;
  private batteryPowerW = 0;
  private batterySocPercent = 0;
  private gridPowerW = 0;
  private housePowerW = 0;
  private evPowerW = 0;
  private evSocPercent = 0;
  private evStatus: string = 'available';

  constructor(config?: HomeAssistantMQTTConfig) {
    super({
      name: 'Home Assistant MQTT',
      host: config?.host ?? 'homeassistant.local',
      port: config?.port ?? 1884, // Default HA WebSocket MQTT port
      tls: config?.tls ?? false,
      reconnect: config?.reconnect,
      ...config,
    });

    this.topicPrefix = config?.topicPrefix ?? 'homeassistant';
    this.entityMap = { ...DEFAULT_ENTITY_MAP, ...config?.entityMap };

    if (config?.mqttUser && config?.mqttPassword) {
      this.mqttCredentials = { user: config.mqttUser, password: config.mqttPassword };
    }

    // Build reverse lookup: topic → state field
    for (const [key, entityId] of Object.entries(this.entityMap)) {
      this.subscriptions.set(entityId, key);
    }
  }

  protected async _connect(): Promise<void> {
    const protocol = this.config.tls ? 'wss' : 'ws';
    const url = `${protocol}://${this.config.host}:${this.config.port}`;

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10_000);

      this.ws.onopen = () => {
        clearTimeout(timeout);

        // Authenticate if credentials provided
        if (this.mqttCredentials) {
          this.ws?.send(
            JSON.stringify({
              type: 'auth',
              username: this.mqttCredentials.user,
              password: this.mqttCredentials.password,
            }),
          );
        }

        // Send MQTT CONNECT packet via WebSocket
        // In practice, HA uses its own WS API or mosquitto-ws
        this.setStatus('connected');

        // Subscribe to all mapped entity state topics
        for (const entityId of this.subscriptions.keys()) {
          const topic = `${this.topicPrefix}/sensor/${entityId.replace('sensor.', '')}/state`;
          this.ws?.send(JSON.stringify({ type: 'subscribe', topic }));
        }

        // Keepalive ping
        this.pingInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30_000);

        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(String(event.data)) as {
            entity_id?: string;
            state?: string;
            topic?: string;
            payload?: string;
          };
          this.handleMessage(msg);
        } catch {
          // Ignore non-JSON messages
        }
      };

      this.ws.onerror = () => {
        clearTimeout(timeout);
        this.setStatus('error', 'WebSocket error');
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

    // Map HEMS commands to HA service calls via MQTT
    const serviceCall = this.mapCommandToService(command);
    if (!serviceCall) return false;

    this.ws.send(JSON.stringify(serviceCall));
    return true;
  }

  private handleMessage(msg: {
    entity_id?: string;
    state?: string;
    topic?: string;
    payload?: string;
  }): void {
    const entityId = msg.entity_id ?? msg.topic?.split('/').pop();
    if (!entityId) return;

    const fieldKey = this.subscriptions.get(entityId);
    if (!fieldKey) return;

    const value = parseFloat(msg.state ?? msg.payload ?? '');
    if (Number.isNaN(value) && fieldKey !== 'evStatus') return;

    switch (fieldKey) {
      case 'pvPower':
        this.pvPowerW = value;
        break;
      case 'pvEnergyToday':
        this.pvEnergyTodayKWh = value;
        break;
      case 'batteryPower':
        this.batteryPowerW = value;
        break;
      case 'batterySoc':
        this.batterySocPercent = value;
        break;
      case 'gridPower':
        this.gridPowerW = value;
        break;
      case 'housePower':
        this.housePowerW = value;
        break;
      case 'evPower':
        this.evPowerW = value;
        break;
      case 'evSoc':
        this.evSocPercent = value;
        break;
      case 'evStatus':
        this.evStatus = msg.state ?? msg.payload ?? 'available';
        break;
    }

    const model = this.buildModel();
    this.emitData(model);
  }

  private buildModel(): Partial<UnifiedEnergyModel> {
    return {
      timestamp: Date.now(),
      pv: {
        totalPowerW: this.pvPowerW,
        yieldTodayKWh: this.pvEnergyTodayKWh,
      },
      battery: {
        powerW: this.batteryPowerW,
        socPercent: this.batterySocPercent,
        voltageV: 0,
        currentA: 0,
      },
      grid: {
        powerW: this.gridPowerW,
        voltageV: 230,
      },
      load: {
        totalPowerW: this.housePowerW,
        heatPumpPowerW: 0,
        evPowerW: this.evPowerW,
        otherPowerW: Math.max(0, this.housePowerW - this.evPowerW),
      },
      evCharger:
        this.evPowerW > 0 || this.evStatus !== 'available'
          ? {
              status: this.mapEvStatus(this.evStatus),
              powerW: this.evPowerW,
              energySessionKWh: 0,
              socPercent: this.evSocPercent || undefined,
              maxCurrentA: 32,
              vehicleConnected: this.evStatus !== 'available',
              v2xCapable: false,
              v2xActive: false,
            }
          : undefined,
    };
  }

  private mapEvStatus(
    status: string,
  ): 'available' | 'preparing' | 'charging' | 'suspended' | 'finishing' | 'faulted' {
    const map: Record<
      string,
      'available' | 'preparing' | 'charging' | 'suspended' | 'finishing' | 'faulted'
    > = {
      available: 'available',
      preparing: 'preparing',
      charging: 'charging',
      suspended_ev: 'suspended',
      suspended_evse: 'suspended',
      finishing: 'finishing',
      faulted: 'faulted',
      error: 'faulted',
    };
    return map[status.toLowerCase()] ?? 'available';
  }

  private mapCommandToService(
    command: AdapterCommand,
  ): { type: string; domain: string; service: string; data: Record<string, unknown> } | null {
    switch (command.type) {
      case 'SET_EV_CURRENT':
        return {
          type: 'call_service',
          domain: 'number',
          service: 'set_value',
          data: { entity_id: 'number.wallbox_max_current', value: command.value },
        };
      case 'START_CHARGING':
        return {
          type: 'call_service',
          domain: 'switch',
          service: 'turn_on',
          data: { entity_id: 'switch.wallbox_charging' },
        };
      case 'STOP_CHARGING':
        return {
          type: 'call_service',
          domain: 'switch',
          service: 'turn_off',
          data: { entity_id: 'switch.wallbox_charging' },
        };
      default:
        return null;
    }
  }
}

// ─── Registration (auto-discovered by loadAllContribAdapters) ───────

export function register(): void {
  registerAdapter(
    'homeassistant-mqtt',
    (config) => new HomeAssistantMQTTAdapter(config as HomeAssistantMQTTConfig | undefined),
    {
      displayName: 'Home Assistant MQTT',
      description: 'Home Assistant via MQTT Discovery (Mosquitto)',
      source: 'contrib',
    },
  );
}
