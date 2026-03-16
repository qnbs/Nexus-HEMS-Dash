/**
 * Shelly REST Adapter — Shelly smart devices via Gen2+ REST/RPC API
 *
 * Connects to Shelly devices (Pro, Plus, Gen3) using their local HTTP
 * REST API and optional WebSocket for real-time updates.
 *
 * Supported devices:
 *   - Shelly Pro 3EM  — 3-phase energy meter (grid monitoring)
 *   - Shelly Pro EM   — energy meter
 *   - Shelly Plus Plug — smart plug with power metering
 *   - Shelly Pro 4PM  — 4-channel relay with power monitoring
 *   - Shelly Plus 1PM — 1-channel relay with power monitoring
 *
 * Gen2+ API endpoints:
 *   GET /rpc/Shelly.GetStatus   — full device status
 *   GET /rpc/EM.GetStatus       — energy meter reading (Pro 3EM)
 *   GET /rpc/EMData.GetStatus   — historical energy data
 *   GET /rpc/Switch.GetStatus   — relay/switch state
 *   POST /rpc/Switch.Set        — control relay
 *
 * Prerequisites:
 *   - Shelly devices on local network (Gen2+ firmware)
 *   - HTTP reachable (mDNS: shellyproem-XXXX.local, fallback: IP)
 *   - Optional: device password for authenticated access
 */

import { BaseAdapter } from '../BaseAdapter';
import type {
  AdapterCapability,
  AdapterCommand,
  AdapterConnectionConfig,
  UnifiedEnergyModel,
} from '../EnergyAdapter';
import { registerAdapter } from '../adapter-registry';

// ─── Shelly Gen2 API types ──────────────────────────────────────────

interface ShellyEMStatus {
  /** Phase A */
  a_act_power?: number;
  a_aprt_power?: number;
  a_current?: number;
  a_voltage?: number;
  a_freq?: number;
  /** Phase B */
  b_act_power?: number;
  b_current?: number;
  b_voltage?: number;
  /** Phase C */
  c_act_power?: number;
  c_current?: number;
  c_voltage?: number;
  /** Total */
  total_act_power?: number;
  total_current?: number;
}

interface ShellyEMData {
  total_act?: number; // Wh import
  total_act_ret?: number; // Wh export
}

interface ShellySwitchStatus {
  id: number;
  output: boolean;
  apower?: number; // Active power W
  voltage?: number; // V
  current?: number; // A
  aenergy?: { total: number }; // Wh total
}

interface ShellyDeviceStatus {
  'em:0'?: ShellyEMStatus;
  'emdata:0'?: ShellyEMData;
  'switch:0'?: ShellySwitchStatus;
  'switch:1'?: ShellySwitchStatus;
  'switch:2'?: ShellySwitchStatus;
  'switch:3'?: ShellySwitchStatus;
  sys?: { mac: string; model: string; fw_id?: string };
}

// ─── Config ─────────────────────────────────────────────────────────

export interface ShellyRESTConfig extends Partial<AdapterConnectionConfig> {
  /** List of Shelly device hosts to poll */
  devices?: { host: string; name?: string; type?: 'em' | 'plug' | 'relay' }[];
  /** Polling interval (ms, default: 5000) */
  pollIntervalMs?: number;
  /** Device auth password (Shelly Gen2 digest auth) */
  devicePassword?: string;
}

// ─── Per-device state ───────────────────────────────────────────────

interface ShellyDeviceReading {
  host: string;
  name: string;
  type: 'em' | 'plug' | 'relay';
  totalPowerW: number;
  voltage: number;
  energyImportWh: number;
  energyExportWh: number;
  phases?: { powerW: number; voltageV: number; currentA: number }[];
  relayStates?: boolean[];
  lastSeen: number;
}

// ─── Adapter ────────────────────────────────────────────────────────

export class ShellyRESTAdapter extends BaseAdapter {
  readonly id = 'shelly-rest';
  readonly name = 'Shelly REST';
  readonly capabilities: AdapterCapability[] = ['grid', 'load'];

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private pollIntervalMs: number;
  private deviceConfigs: { host: string; name: string; type: 'em' | 'plug' | 'relay' }[];
  private deviceReadings: Map<string, ShellyDeviceReading> = new Map();
  private devicePassword?: string;

  constructor(config?: ShellyRESTConfig) {
    super({
      name: 'Shelly REST',
      host: config?.host ?? 'localhost',
      port: config?.port ?? 80,
      tls: config?.tls ?? false,
      reconnect: config?.reconnect,
      ...config,
    });

    this.pollIntervalMs = config?.pollIntervalMs ?? 5000;
    this.devicePassword = config?.devicePassword;
    this.deviceConfigs = (config?.devices ?? []).map((d) => ({
      host: d.host,
      name: d.name ?? d.host,
      type: d.type ?? 'plug',
    }));
  }

  protected async _connect(): Promise<void> {
    if (this.deviceConfigs.length === 0) {
      throw new Error('No Shelly devices configured');
    }

    // Test connectivity to first device
    const first = this.deviceConfigs[0];
    await this.fetchDeviceStatus(first.host);

    this.setStatus('connected');

    // Start polling all devices
    this.pollTimer = setInterval(() => {
      void this.poll();
    }, this.pollIntervalMs);
  }

  protected async _disconnect(): Promise<void> {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  protected async _sendCommand(command: AdapterCommand): Promise<boolean> {
    if (!command.targetDeviceId) return false;

    // Find the device
    const device = this.deviceConfigs.find(
      (d) => d.host === command.targetDeviceId || d.name === command.targetDeviceId,
    );
    if (!device) return false;

    switch (command.type) {
      case 'KNX_TOGGLE_LIGHTS': {
        const url = this.buildUrl(device.host, '/rpc/Switch.Set');
        const resp = await fetch(url, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify({ id: 0, on: Boolean(command.value) }),
        });
        return resp.ok;
      }
      default:
        return false;
    }
  }

  async poll(): Promise<Partial<UnifiedEnergyModel>> {
    const promises = this.deviceConfigs.map(async (device) => {
      try {
        const status = await this.fetchDeviceStatus(device.host);
        this.parseDeviceStatus(device, status);
      } catch {
        // Device unreachable — keep last known reading
      }
    });

    await Promise.allSettled(promises);
    const model = this.buildModel();
    this.emitData(model);
    return model;
  }

  private async fetchDeviceStatus(host: string): Promise<ShellyDeviceStatus> {
    const url = this.buildUrl(host, '/rpc/Shelly.GetStatus');
    const resp = await fetch(url, {
      headers: this.buildHeaders(),
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) throw new Error(`Shelly ${host}: HTTP ${resp.status}`);
    return (await resp.json()) as ShellyDeviceStatus;
  }

  private buildUrl(host: string, path: string): string {
    const protocol = this.config.tls ? 'https' : 'http';
    return `${protocol}://${host}${path}`;
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    // Gen2 uses digest auth, but basic auth header as fallback
    if (this.devicePassword) {
      headers['Authorization'] = `Basic ${btoa(`admin:${this.devicePassword}`)}`;
    }
    return headers;
  }

  private parseDeviceStatus(
    device: { host: string; name: string; type: 'em' | 'plug' | 'relay' },
    status: ShellyDeviceStatus,
  ): void {
    const reading: ShellyDeviceReading = {
      host: device.host,
      name: device.name,
      type: device.type,
      totalPowerW: 0,
      voltage: 230,
      energyImportWh: 0,
      energyExportWh: 0,
      lastSeen: Date.now(),
    };

    // Energy meter (Pro 3EM)
    const em = status['em:0'];
    if (em) {
      reading.totalPowerW = em.total_act_power ?? 0;
      reading.voltage = em.a_voltage ?? 230;
      reading.phases = [
        {
          powerW: em.a_act_power ?? 0,
          voltageV: em.a_voltage ?? 230,
          currentA: em.a_current ?? 0,
        },
        {
          powerW: em.b_act_power ?? 0,
          voltageV: em.b_voltage ?? 230,
          currentA: em.b_current ?? 0,
        },
        {
          powerW: em.c_act_power ?? 0,
          voltageV: em.c_voltage ?? 230,
          currentA: em.c_current ?? 0,
        },
      ];
    }

    // Energy data (cumulative)
    const emData = status['emdata:0'];
    if (emData) {
      reading.energyImportWh = emData.total_act ?? 0;
      reading.energyExportWh = emData.total_act_ret ?? 0;
    }

    // Switch/plug channels
    const relayStates: boolean[] = [];
    for (const key of ['switch:0', 'switch:1', 'switch:2', 'switch:3'] as const) {
      const sw = status[key];
      if (!sw) continue;
      relayStates.push(sw.output);
      if (sw.apower != null) {
        if (!em) reading.totalPowerW += sw.apower;
        reading.voltage = sw.voltage ?? reading.voltage;
      }
      if (sw.aenergy?.total != null) {
        reading.energyImportWh += sw.aenergy.total;
      }
    }
    reading.relayStates = relayStates;

    this.deviceReadings.set(device.host, reading);
  }

  private buildModel(): Partial<UnifiedEnergyModel> {
    let gridPowerW = 0;
    let loadPowerW = 0;
    let gridVoltage = 230;
    let gridFrequency: number | undefined;
    let energyImportKWh = 0;
    let energyExportKWh = 0;
    const phases: { voltageV: number; currentA: number; powerW: number }[] = [];

    for (const reading of this.deviceReadings.values()) {
      if (reading.type === 'em') {
        // Energy meters report grid power (import/export)
        gridPowerW += reading.totalPowerW;
        gridVoltage = reading.voltage;
        energyImportKWh += reading.energyImportWh / 1000;
        energyExportKWh += reading.energyExportWh / 1000;
        if (reading.phases) {
          for (const p of reading.phases) phases.push(p);
        }
      } else {
        // Plugs/relays report load consumption
        loadPowerW += reading.totalPowerW;
      }
    }

    return {
      timestamp: Date.now(),
      grid: {
        powerW: gridPowerW,
        voltageV: gridVoltage,
        frequencyHz: gridFrequency,
        energyImportKWh: energyImportKWh > 0 ? energyImportKWh : undefined,
        energyExportKWh: energyExportKWh > 0 ? energyExportKWh : undefined,
        phases: phases.length > 0 ? phases : undefined,
      },
      load: {
        totalPowerW: loadPowerW || gridPowerW,
        heatPumpPowerW: 0,
        evPowerW: 0,
        otherPowerW: loadPowerW || gridPowerW,
      },
    };
  }
}

// ─── Registration ───────────────────────────────────────────────────

export function register(): void {
  registerAdapter(
    'shelly-rest',
    (config) => new ShellyRESTAdapter(config as ShellyRESTConfig | undefined),
    {
      displayName: 'Shelly REST',
      description: 'Shelly Gen2+ Geräte (Pro 3EM, Plus Plug, Pro 4PM)',
      source: 'contrib',
    },
  );
}
