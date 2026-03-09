/**
 * EnergyAdapter — Adapter Pattern Interface for HEMS Protocols
 *
 * Every protocol adapter (Victron MQTT, Modbus SunSpec, KNX, OCPP 2.1, EEBUS)
 * implements this interface so the dashboard can aggregate data from any source.
 */

// ─── Unified Data Models ─────────────────────────────────────────────

/** Granular PV inverter reading (SunSpec Model 103/160) */
export interface PVData {
  totalPowerW: number;
  yieldTodayKWh: number;
  strings?: { id: number; powerW: number; voltageV: number; currentA: number }[];
}

/** Battery Energy Storage System (SunSpec Model 124 / Victron) */
export interface BatteryData {
  powerW: number; // positive = charging, negative = discharging
  socPercent: number;
  voltageV: number;
  currentA: number;
  temperatureC?: number;
  cycleCount?: number;
  stateOfHealthPercent?: number;
}

/** Grid meter reading (SunSpec Model 201–204) */
export interface GridData {
  powerW: number; // positive = import, negative = export
  voltageV: number;
  frequencyHz?: number;
  energyImportKWh?: number;
  energyExportKWh?: number;
  phases?: { voltageV: number; currentA: number; powerW: number }[];
}

/** Household load breakdown */
export interface LoadData {
  totalPowerW: number;
  heatPumpPowerW: number;
  evPowerW: number;
  otherPowerW: number;
}

/** EV charger state (OCPP 2.1 / IEC 61851) */
export interface EVChargerData {
  status: 'available' | 'preparing' | 'charging' | 'suspended' | 'finishing' | 'faulted';
  powerW: number;
  energySessionKWh: number;
  socPercent?: number;
  currentA?: number;
  voltageV?: number;
  maxCurrentA: number;
  vehicleConnected: boolean;
  v2xCapable: boolean;
  v2xActive: boolean;
}

/** KNX building automation state */
export interface KNXData {
  rooms: KNXRoom[];
}

export interface KNXRoom {
  id: string;
  name: string;
  temperature: number;
  setpoint?: number;
  lightsOn: boolean;
  brightness?: number;
  windowOpen: boolean;
  humidity?: number;
  co2ppm?: number;
}

/** Tariff / price signal */
export interface TariffData {
  currentPriceEurKWh: number;
  provider: 'tibber' | 'awattar' | 'entsoe' | 'none';
  sgReadyState?: 1 | 2 | 3 | 4;
}

/** Unified energy model — aggregated from all adapters */
export interface UnifiedEnergyModel {
  timestamp: number;
  pv: PVData;
  battery: BatteryData;
  grid: GridData;
  load: LoadData;
  evCharger?: EVChargerData;
  knx?: KNXData;
  tariff?: TariffData;
}

// ─── Adapter Connection ──────────────────────────────────────────────

export type AdapterStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface AdapterConnectionConfig {
  /** Display name for logs & UI */
  name: string;
  /** Host / IP address */
  host: string;
  /** Port number */
  port: number;
  /** Enable TLS (wss:// / mqtts://) */
  tls?: boolean;
  /** mTLS client certificate (PEM base64) */
  clientCert?: string;
  /** mTLS client key (PEM base64) */
  clientKey?: string;
  /** Authentication token / password */
  authToken?: string;
  /** Reconnection config */
  reconnect?: {
    enabled: boolean;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
  };
  /** Polling interval for poll-based adapters (Modbus) */
  pollIntervalMs?: number;
}

// ─── Adapter Commands ────────────────────────────────────────────────

export type AdapterCommandType =
  | 'SET_EV_POWER'
  | 'SET_EV_CURRENT'
  | 'START_CHARGING'
  | 'STOP_CHARGING'
  | 'SET_V2X_DISCHARGE'
  | 'SET_HEAT_PUMP_MODE'
  | 'SET_HEAT_PUMP_POWER'
  | 'SET_BATTERY_POWER'
  | 'SET_BATTERY_MODE'
  | 'SET_GRID_LIMIT'
  | 'KNX_TOGGLE_LIGHTS'
  | 'KNX_SET_TEMPERATURE'
  | 'KNX_TOGGLE_WINDOW';

export interface AdapterCommand {
  type: AdapterCommandType;
  value: number | string | boolean;
  targetDeviceId?: string;
}

// ─── Adapter Event / Callback ────────────────────────────────────────

export type AdapterEventType = 'data' | 'status' | 'error' | 'command_ack';

export interface AdapterEvent<T = unknown> {
  adapter: string;
  type: AdapterEventType;
  payload: T;
  timestamp: number;
}

export type AdapterDataCallback = (model: Partial<UnifiedEnergyModel>) => void;
export type AdapterStatusCallback = (status: AdapterStatus, error?: string) => void;

// ─── Core Interface ──────────────────────────────────────────────────

/**
 * Every HEMS protocol adapter MUST implement this interface.
 */
export interface EnergyAdapter {
  /** Unique adapter identifier (e.g. "victron-mqtt", "modbus-sunspec") */
  readonly id: string;

  /** Human-readable name */
  readonly name: string;

  /** Current connection status */
  readonly status: AdapterStatus;

  /** Which data domains this adapter provides */
  readonly capabilities: AdapterCapability[];

  /** Connect to the data source */
  connect(): Promise<void>;

  /** Graceful disconnect */
  disconnect(): Promise<void>;

  /** Subscribe to real-time data updates */
  onData(callback: AdapterDataCallback): void;

  /** Subscribe to status changes */
  onStatus(callback: AdapterStatusCallback): void;

  /** Send a command (returns true if the adapter handles this command type) */
  sendCommand(command: AdapterCommand): Promise<boolean>;

  /** Force a one-time poll (useful for Modbus / REST adapters) */
  poll?(): Promise<Partial<UnifiedEnergyModel>>;

  /** Get the latest known snapshot (for offline fallback) */
  getSnapshot(): Partial<UnifiedEnergyModel>;

  /** Cleanup all listeners and timers */
  destroy(): void;
}

export type AdapterCapability =
  | 'pv'
  | 'battery'
  | 'grid'
  | 'load'
  | 'evCharger'
  | 'knx'
  | 'tariff';
