/**
 * Matter/Thread Adapter — Smart Home devices via Matter protocol
 *
 * Connects to a Matter controller (e.g. chip-tool, HA Matter Server)
 * through its WebSocket commissioning/control API.
 *
 * Matter device clusters mapped to HEMS:
 *   - ElectricalMeasurement (0x0B04) → power readings
 *   - SimpleMetering (0x0702) → energy counters
 *   - DoorLock (0x0101) / OnOff (0x0006) → load control
 *   - Thermostat (0x0201) → heat pump setpoint
 *   - EnergyPreference — Thread border router energy data
 *
 * Supports Thread 1.3+ mesh networking for low-power sensor data.
 *
 * Prerequisites:
 *   - Matter controller running (python-chip-controller, HA Matter Server)
 *   - WebSocket API endpoint reachable
 *   - Devices commissioned and accessible
 */

import { registerAdapter } from '../adapter-registry';
import { BaseAdapter } from '../BaseAdapter';
import type {
  AdapterCapability,
  AdapterCommand,
  AdapterConnectionConfig,
  UnifiedEnergyModel,
} from '../EnergyAdapter';

// ─── Matter Cluster IDs ─────────────────────────────────────────────

const CLUSTER = {
  ON_OFF: 0x0006,
  THERMOSTAT: 0x0201,
  ELECTRICAL_MEASUREMENT: 0x0b04,
  SIMPLE_METERING: 0x0702,
  POWER_SOURCE: 0x002f,
} as const;

// ─── Config ─────────────────────────────────────────────────────────

export interface MatterThreadConfig extends Partial<AdapterConnectionConfig> {
  /** Controller type (default: 'ha-matter-server') */
  controllerType?: 'ha-matter-server' | 'chip-tool' | 'custom';
  /** Known node IDs to subscribe to */
  nodeIds?: number[];
  /** Polling interval for attribute reads (ms) */
  pollIntervalMs?: number;
}

// ─── Matter message types ───────────────────────────────────────────

interface MatterNodeState {
  nodeId: number;
  endpoints: MatterEndpoint[];
}

interface MatterEndpoint {
  endpointId: number;
  clusters: Record<number, Record<string, unknown>>;
}

interface MatterWSMessage {
  type: string;
  messageId?: string;
  result?: MatterNodeState[];
  event?: string;
  data?: {
    nodeId?: number;
    endpoint?: number;
    cluster?: number;
    attribute?: string;
    value?: number;
  };
}

// ─── Adapter ────────────────────────────────────────────────────────

export class MatterThreadAdapter extends BaseAdapter {
  readonly id = 'matter-thread';
  readonly name = 'Matter/Thread';
  readonly capabilities: AdapterCapability[] = ['pv', 'grid', 'load'];

  private ws: WebSocket | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private pollIntervalMs: number;
  private nodeIds: number[];
  private msgCounter = 0;

  // Aggregated power readings from Matter devices
  private totalLoadW = 0;
  private gridPowerW = 0;
  private pvPowerW = 0;
  private deviceReadings: Map<number, { powerW: number; energyKWh: number }> = new Map();

  constructor(config?: MatterThreadConfig) {
    super({
      name: 'Matter/Thread',
      host: config?.host ?? 'localhost',
      port: config?.port ?? 5580, // HA Matter Server default WS port
      tls: config?.tls ?? false,
      reconnect: config?.reconnect,
      ...config,
    });

    this.pollIntervalMs = config?.pollIntervalMs ?? 10_000;
    this.nodeIds = config?.nodeIds ?? [];
  }

  protected async _connect(): Promise<void> {
    const protocol = this.config.tls ? 'wss' : 'ws';
    const url = `${protocol}://${this.config.host}:${this.config.port}/ws`;

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);

      const timeout = setTimeout(() => {
        reject(new Error('Matter controller connection timeout'));
      }, 15_000);

      this.ws.onopen = () => {
        clearTimeout(timeout);
        this.setStatus('connected');

        // Request initial node list
        this.sendWS({ type: 'get_nodes' });

        // Start polling for attribute updates
        this.pollTimer = setInterval(() => {
          this.pollAttributes();
        }, this.pollIntervalMs);

        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(String(event.data)) as MatterWSMessage;
          this.handleMessage(msg);
        } catch {
          // Ignore malformed messages
        }
      };

      this.ws.onerror = () => {
        clearTimeout(timeout);
        this.setStatus('error', 'Matter controller connection failed');
        reject(new Error('WebSocket error'));
      };

      this.ws.onclose = () => {
        this.setStatus('disconnected');
        this.scheduleReconnect();
      };
    });
  }

  protected async _disconnect(): Promise<void> {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }

  protected async _sendCommand(command: AdapterCommand): Promise<boolean> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;

    switch (command.type) {
      case 'KNX_TOGGLE_LIGHTS': {
        // Map to Matter OnOff cluster
        const nodeId = command.targetDeviceId ? parseInt(command.targetDeviceId, 10) : undefined;
        if (!nodeId) return false;
        this.sendWS({
          type: 'write_attribute',
          data: {
            nodeId,
            endpoint: 1,
            cluster: CLUSTER.ON_OFF,
            attribute: 'onOff',
            value: command.value ? 1 : 0,
          },
        });
        return true;
      }
      case 'SET_HEAT_PUMP_MODE': {
        const nodeId = command.targetDeviceId ? parseInt(command.targetDeviceId, 10) : undefined;
        if (!nodeId) return false;
        this.sendWS({
          type: 'write_attribute',
          data: {
            nodeId,
            endpoint: 1,
            cluster: CLUSTER.THERMOSTAT,
            attribute: 'systemMode',
            value: command.value,
          },
        });
        return true;
      }
      default:
        return false;
    }
  }

  private sendWS(payload: Record<string, unknown>): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.msgCounter += 1;
    this.ws.send(JSON.stringify({ ...payload, messageId: String(this.msgCounter) }));
  }

  private pollAttributes(): void {
    // Request power readings from all known nodes
    for (const nodeId of this.nodeIds) {
      this.sendWS({
        type: 'read_attribute',
        data: {
          nodeId,
          endpoint: 1,
          cluster: CLUSTER.ELECTRICAL_MEASUREMENT,
          attribute: 'activePower',
        },
      });
    }
  }

  private handleMessage(msg: MatterWSMessage): void {
    // Handle node list response
    if (msg.type === 'result' && msg.result) {
      for (const node of msg.result) {
        if (!this.nodeIds.includes(node.nodeId)) {
          this.nodeIds.push(node.nodeId);
        }
        this.parseNodeState(node);
      }
      this.emitModel();
      return;
    }

    // Handle attribute update events
    if (msg.event === 'attribute_updated' && msg.data) {
      const { nodeId, cluster, attribute, value } = msg.data;
      if (
        nodeId != null &&
        cluster === CLUSTER.ELECTRICAL_MEASUREMENT &&
        attribute === 'activePower' &&
        value != null
      ) {
        const existing = this.deviceReadings.get(nodeId) ?? { powerW: 0, energyKWh: 0 };
        existing.powerW = value;
        this.deviceReadings.set(nodeId, existing);
        this.emitModel();
      }
    }
  }

  private parseNodeState(node: MatterNodeState): void {
    for (const ep of node.endpoints) {
      const elec = ep.clusters[CLUSTER.ELECTRICAL_MEASUREMENT];
      if (elec && typeof elec['activePower'] === 'number') {
        const existing = this.deviceReadings.get(node.nodeId) ?? { powerW: 0, energyKWh: 0 };
        existing.powerW = elec['activePower'] as number;
        this.deviceReadings.set(node.nodeId, existing);
      }
    }
  }

  private emitModel(): void {
    // Sum all device power readings
    this.totalLoadW = 0;
    for (const reading of this.deviceReadings.values()) {
      this.totalLoadW += Math.abs(reading.powerW);
    }

    const model: Partial<UnifiedEnergyModel> = {
      timestamp: Date.now(),
      pv: { totalPowerW: this.pvPowerW, yieldTodayKWh: 0 },
      grid: { powerW: this.gridPowerW, voltageV: 230 },
      load: {
        totalPowerW: this.totalLoadW,
        heatPumpPowerW: 0,
        evPowerW: 0,
        otherPowerW: this.totalLoadW,
      },
    };
    this.emitData(model);
  }
}

// ─── Registration ───────────────────────────────────────────────────

export function register(): void {
  registerAdapter(
    'matter-thread',
    (config) => new MatterThreadAdapter(config as MatterThreadConfig | undefined),
    {
      displayName: 'Matter/Thread',
      description: 'Matter-Geräte über Thread/WiFi Mesh',
      source: 'contrib',
    },
  );
}
