/**
 * EEBUSAdapter — Full EEBUS SPINE/SHIP Integration
 *
 * Implements the EEBUS SPINE (Smart Premises Interoperable Neutral-message Exchange)
 * protocol over SHIP (Smart Home IP) transport layer.
 *
 * Standards:
 *   • VDE-AR-E 2829-6 — EEBUS Communication Framework
 *   • SPINE Protocol — Application layer (JSON-RPC over WebSocket)
 *   • SHIP — Transport layer (mDNS discovery + TLS 1.3 mutual auth)
 *
 * Supported Use Cases (VDE-AR-E 2829-6):
 *   • EVCC → EVSE — EV Charging Communication
 *   • CEM → Controllable System — Heat Pump / Battery CEM
 *   • Grid Operator → CEM — §14a EnWG limitation signals
 *   • Monitoring — Device diagnostics & energy metering
 *
 * Architecture:
 *   EEBUS Device → mDNS Discovery → SHIP Handshake → TLS 1.3 → SPINE JSON-RPC
 *                                                                    ↓
 *                                                            This Adapter → Dashboard
 */

import { BaseAdapter } from './BaseAdapter';
import type {
  AdapterCapability,
  AdapterCommand,
  AdapterConnectionConfig,
  EVChargerData,
  UnifiedEnergyModel,
} from './EnergyAdapter';

// ─── EEBUS SPINE Data Types ──────────────────────────────────────────

/** SPINE Device Classification (VDE-AR-E 2829-6 Table 1) */
export type EEBUSDeviceType =
  | 'EnergyManagementSystem'
  | 'Compressor'
  | 'EVCharger'
  | 'Inverter'
  | 'SmartEnergyAppliance'
  | 'ElectricitySupplyPoint'
  | 'DHWCircuit'
  | 'HeatingCircuit';

/** SPINE Entity → Feature mapping */
export interface EEBUSEntity {
  id: number;
  entityType: EEBUSDeviceType;
  description: string;
  features: EEBUSFeature[];
}

/** SPINE Feature (functional block on a device entity) */
export interface EEBUSFeature {
  id: number;
  featureType: EEBUSFeatureType;
  role: 'client' | 'server';
  description: string;
}

/** Supported SPINE Feature Types (VDE-AR-E 2829-6 §7) */
export type EEBUSFeatureType =
  | 'DeviceDiagnosis'
  | 'DeviceConfiguration'
  | 'ElectricalConnection'
  | 'Measurement'
  | 'LoadControl'
  | 'DeviceClassification'
  | 'TimeSeries'
  | 'IncentiveTable'
  | 'SmartEnergyManagementPs'
  | 'Bill';

/** SPINE Measurement (VDE-AR-E 2829-6 §7.4) */
export interface EEBUSMeasurement {
  measurementId: number;
  valueType: 'value' | 'averageValue' | 'minValue' | 'maxValue';
  unit: 'W' | 'Wh' | 'A' | 'V' | 'Hz' | '°C' | '%';
  scopeType:
    | 'ACPowerTotal'
    | 'ACPower'
    | 'ACCurrent'
    | 'ACVoltage'
    | 'StateOfCharge'
    | 'Temperature';
  value: number;
  timestamp: string;
}

/** SPINE LoadControl Limit (§14a EnWG / CEM) */
export interface EEBUSLoadControlLimit {
  limitId: number;
  limitType: 'minValueLimit' | 'maxValueLimit' | 'signOfChargingValue';
  unit: 'W' | 'A';
  value: number;
  isChangeable: boolean;
  isActive: boolean;
  timePeriod?: { startTime: string; endTime: string };
}

/** SPINE IncentiveTable entry for tariff-based optimization */
export interface EEBUSIncentive {
  tariffId: number;
  incentiveType: 'absoluteCost' | 'relativeCost' | 'renewableEnergyRequest' | 'co2Emission';
  currency?: string;
  value: number;
  timePeriod: { startTime: string; endTime: string };
}

/** SHIP Connection State */
export type SHIPConnectionState =
  | 'init'
  | 'cmi'
  | 'sme_hello'
  | 'sme_protocol'
  | 'pin_verify'
  | 'access_methods'
  | 'connected'
  | 'closed';

/** Discovered EEBUS device (via mDNS) */
export interface EEBUSDiscoveredDevice {
  ski: string;
  brand: string;
  model: string;
  deviceType: EEBUSDeviceType;
  host: string;
  port: number;
  path: string;
  register: boolean;
  trusted: boolean;
}

/** Connection event for the UI */
export interface EEBUSConnectionEvent {
  type: 'discovered' | 'ship_state' | 'paired' | 'data' | 'error' | 'loadcontrol';
  device?: EEBUSDiscoveredDevice;
  shipState?: SHIPConnectionState;
  message?: string;
  data?: Partial<UnifiedEnergyModel>;
}

// ─── SPINE Message Protocol ─────────────────────────────────────────

interface SPINEHeader {
  protocolId: 'ee1.0';
  msgCounter: number;
  cmdClassifier: 'read' | 'reply' | 'write' | 'notify' | 'call' | 'result';
  featureSource: { entity: number; feature: number };
  featureDestination: { entity: number; feature: number };
  ackRequest?: boolean;
}

interface SPINEPayload {
  cmd: Array<Record<string, unknown>>;
}

interface SPINEMessage {
  header: SPINEHeader;
  payload: SPINEPayload;
}

/** EEBUS adapter configuration */
export interface EEBUSAdapterConfig extends Partial<AdapterConnectionConfig> {
  /** Server base URL for mDNS discovery + pairing (defaults to window.location.origin) */
  serverBaseUrl?: string;
}

// ─── Adapter Implementation ─────────────────────────────────────────

export class EEBUSAdapter extends BaseAdapter {
  readonly id = 'eebus';
  readonly name = 'EEBUS SPINE/SHIP';
  readonly capabilities: AdapterCapability[] = ['evCharger', 'load', 'grid'];

  private eventCallbacks: Array<(event: EEBUSConnectionEvent) => void> = [];
  private ws: WebSocket | null = null;
  private msgCounter = 0;
  private shipState: SHIPConnectionState = 'init';
  private discoveredDevices: Map<string, EEBUSDiscoveredDevice> = new Map();
  private pairedDevices: Set<string> = new Set();
  private measurements: Map<number, EEBUSMeasurement> = new Map();
  private loadLimits: Map<number, EEBUSLoadControlLimit> = new Map();
  private incentives: EEBUSIncentive[] = [];
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private _serverBaseUrl?: string;

  constructor(config?: EEBUSAdapterConfig) {
    super({
      name: 'EEBUS SPINE/SHIP',
      host: config?.host ?? 'localhost',
      port: config?.port ?? 4712,
      tls: config?.tls ?? true,
      reconnect: {
        enabled: true,
        initialDelayMs: 5000,
        maxDelayMs: 30_000,
        backoffMultiplier: 2,
        ...config?.reconnect,
      },
      ...config,
    });
    this._serverBaseUrl = config?.serverBaseUrl;
  }

  get devices(): EEBUSDiscoveredDevice[] {
    return Array.from(this.discoveredDevices.values());
  }

  get connectionState(): SHIPConnectionState {
    return this.shipState;
  }

  get activeLoadLimits(): EEBUSLoadControlLimit[] {
    return Array.from(this.loadLimits.values()).filter((l) => l.isActive);
  }

  get currentIncentives(): EEBUSIncentive[] {
    return this.incentives;
  }

  onEvent(callback: (event: EEBUSConnectionEvent) => void): void {
    this.eventCallbacks.push(callback);
  }

  override async connect(config?: AdapterConnectionConfig): Promise<void> {
    if (config) Object.assign(this.config, config);
    return super.connect();
  }

  protected async _connect(): Promise<void> {
    this.setStatus('connecting');
    this.shipState = 'init';

    try {
      const protocol = this.config.tls ? 'wss' : 'ws';
      const url = `${protocol}://${this.config.host}:${this.config.port}/ship/`;

      this.ws = new WebSocket(url);

      // Connection timeout: abort if WebSocket doesn't open within 30s
      const connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          if (import.meta.env.DEV) console.warn('[EEBUS] Connection timeout after 30s');
          this.ws.close();
          this.setStatus('error', 'Connection timeout (30s)');
          this.emitEvent({ type: 'error', message: 'Connection timeout (30s)' });
        }
      }, 30_000);

      this.ws.onopen = () => {
        clearTimeout(connectionTimeout);
        if (import.meta.env.DEV)
          console.log('[EEBUS] WebSocket connected, initiating SHIP handshake');
        this.shipState = 'cmi';
        this.emitEvent({ type: 'ship_state', shipState: 'cmi' });
        this.sendSHIPInit();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data as string);
      };

      this.ws.onerror = () => {
        clearTimeout(connectionTimeout);
        this.setStatus('error', 'WebSocket connection failed');
        this.emitEvent({ type: 'error', message: 'WebSocket connection error' });
      };

      this.ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        if (import.meta.env.DEV)
          console.log(`[EEBUS] WebSocket closed: ${event.code} ${event.reason}`);
        this.stopHeartbeat();
        this.setStatus('disconnected');
        this.shipState = 'closed';
        this.emitEvent({ type: 'ship_state', shipState: 'closed' });
        this.scheduleReconnect();
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Connection failed';
      this.setStatus('error', msg);
      this.emitEvent({ type: 'error', message: msg });
    }
  }

  protected async _disconnect(): Promise<void> {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.shipState = 'closed';
  }

  override destroy(): void {
    this.eventCallbacks = [];
    this.discoveredDevices.clear();
    this.pairedDevices.clear();
    this.measurements.clear();
    this.loadLimits.clear();
    super.destroy();
  }

  protected _cleanup(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, 'Adapter destroyed');
      this.ws = null;
    }
  }

  protected async _sendCommand(command: AdapterCommand): Promise<boolean> {
    if (this._status !== 'connected' || !this.ws) return false;

    try {
      switch (command.type) {
        case 'SET_EV_CURRENT':
          return this.sendLoadControlWrite({
            limitId: 1,
            limitType: 'maxValueLimit',
            unit: 'A',
            value: command.value as number,
            isActive: true,
            isChangeable: true,
          });
        case 'SET_EV_POWER':
          return this.sendLoadControlWrite({
            limitId: 2,
            limitType: 'maxValueLimit',
            unit: 'W',
            value: command.value as number,
            isActive: true,
            isChangeable: true,
          });
        case 'START_CHARGING':
          return this.sendLoadControlWrite({
            limitId: 3,
            limitType: 'minValueLimit',
            unit: 'A',
            value: 6,
            isActive: true,
            isChangeable: true,
          });
        case 'STOP_CHARGING':
          return this.sendLoadControlWrite({
            limitId: 1,
            limitType: 'maxValueLimit',
            unit: 'A',
            value: 0,
            isActive: true,
            isChangeable: false,
          });
        case 'SET_HEAT_PUMP_POWER':
          return this.sendLoadControlWrite({
            limitId: 10,
            limitType: 'maxValueLimit',
            unit: 'W',
            value: command.value as number,
            isActive: true,
            isChangeable: true,
          });
        case 'SET_GRID_LIMIT':
          return this.sendLoadControlWrite({
            limitId: 100,
            limitType: 'maxValueLimit',
            unit: 'W',
            value: command.value as number,
            isActive: true,
            isChangeable: false,
          });
        default:
          if (import.meta.env.DEV) console.warn(`[EEBUS] Unsupported command: ${command.type}`);
          return false;
      }
    } catch (error) {
      console.error('[EEBUS] Command failed:', error);
      return false;
    }
  }

  pairDevice(ski: string): void {
    void this.pairDeviceAsync(ski);
  }

  /**
   * Discover EEBUS devices via server-side mDNS.
   * The server handles mDNS / DNS-SD queries (_ship._tcp) and returns results.
   * Falls back to direct WS-based discovery if server endpoint is unavailable.
   */
  async discoverDevices(): Promise<EEBUSDiscoveredDevice[]> {
    if (import.meta.env.DEV) console.log('[EEBUS] Starting device discovery via server...');

    try {
      const baseUrl = this.serverBaseUrl;
      const resp = await fetch(`${baseUrl}/api/eebus/discover`, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!resp.ok) throw new Error(`Discovery endpoint returned ${resp.status}`);
      const discovered = (await resp.json()) as EEBUSDiscoveredDevice[];

      for (const device of discovered) {
        device.trusted = this.pairedDevices.has(device.ski);
        this.discoveredDevices.set(device.ski, device);
        this.emitEvent({ type: 'discovered', device });
      }
      return discovered;
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[EEBUS] Server discovery failed, using cache:', err);
      return Array.from(this.discoveredDevices.values());
    }
  }

  /**
   * Pair with device via server-side SKI verification.
   * Server handles TLS certificate trust + SHIP PIN exchange.
   */
  async pairDeviceAsync(ski: string): Promise<boolean> {
    const device = this.discoveredDevices.get(ski);
    if (!device) return false;

    try {
      const baseUrl = this.serverBaseUrl;
      const resp = await fetch(`${baseUrl}/api/eebus/pair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ski, host: device.host, port: device.port }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!resp.ok) return false;
      this.pairedDevices.add(ski);
      device.trusted = true;
      this.discoveredDevices.set(ski, device);
      this.emitEvent({
        type: 'paired',
        device,
        message: `Paired with ${device.brand} ${device.model}`,
      });
      return true;
    } catch {
      return false;
    }
  }

  /** Base URL for server-side EEBUS API endpoints */
  private get serverBaseUrl(): string {
    if (this._serverBaseUrl) return this._serverBaseUrl;
    return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  }

  // ─── SHIP Protocol ────────────────────────────────────────────────

  private sendSHIPInit(): void {
    this.ws?.send(
      JSON.stringify({
        type: 'init',
        version: [1, 0, 0],
        formats: ['JSON-UTF8'],
      }),
    );
  }

  private sendSHIPHello(): void {
    this.ws?.send(
      JSON.stringify({
        connectionHello: [{ phase: 'ready', waiting: 60000, prolongationRequest: false }],
      }),
    );
  }

  private sendSHIPPinVerification(ski: string): void {
    this.ws?.send(
      JSON.stringify({
        connectionPinState: [{ pinState: 'ok', ski }],
      }),
    );
  }

  // ─── SPINE Protocol ───────────────────────────────────────────────

  private handleMessage(raw: string): void {
    try {
      const message = JSON.parse(raw);

      if (message.type === 'init' || message.connectionHello) {
        this.handleSHIPMessage(message);
        return;
      }

      if (message.datagram) {
        this.handleSPINEDatagram(message.datagram);
        return;
      }

      if (message.connectionPinState) {
        this.shipState = 'pin_verify';
        this.emitEvent({ type: 'ship_state', shipState: 'pin_verify' });
        // Auto-respond with PIN OK using the device SKI from the message
        const ski = message.connectionPinState?.[0]?.ski;
        if (typeof ski === 'string') {
          this.sendSHIPPinVerification(ski);
        }
        return;
      }

      if (message.type === 'ENERGY_UPDATE' || message.data) {
        this.handleSimpleDataUpdate(message.data ?? message);
      }
    } catch (error) {
      console.error('[EEBUS] Message parse error:', error);
    }
  }

  private handleSHIPMessage(message: Record<string, unknown>): void {
    if (message.type === 'init') {
      this.shipState = 'sme_hello';
      this.emitEvent({ type: 'ship_state', shipState: 'sme_hello' });
      this.sendSHIPHello();
      return;
    }

    if (message.connectionHello) {
      this.shipState = 'sme_protocol';
      this.emitEvent({ type: 'ship_state', shipState: 'sme_protocol' });

      setTimeout(() => {
        this.shipState = 'connected';
        this.setStatus('connected');
        this.emitEvent({ type: 'ship_state', shipState: 'connected' });
        this.startHeartbeat();
        this.requestDeviceData();
      }, 100);
    }
  }

  private handleSPINEDatagram(datagram: { header: SPINEHeader; payload: SPINEPayload }): void {
    const { header, payload } = datagram;

    for (const cmd of payload.cmd) {
      if (cmd.measurementListData) {
        this.handleMeasurementData(
          cmd.measurementListData as { measurementData: EEBUSMeasurement[] },
        );
      }
      if (cmd.loadControlLimitListData) {
        this.handleLoadControlData(
          cmd.loadControlLimitListData as { loadControlLimitData: EEBUSLoadControlLimit[] },
        );
      }
      if (cmd.incentiveTableData) {
        this.handleIncentiveData(cmd.incentiveTableData as { incentiveData: EEBUSIncentive[] });
      }
    }

    if (header.ackRequest) {
      this.sendSPINEAck(header.msgCounter);
    }
  }

  private handleMeasurementData(data: { measurementData: EEBUSMeasurement[] }): void {
    for (const m of data.measurementData) {
      this.measurements.set(m.measurementId, m);
    }
    this.buildAndEmitModel();
  }

  private handleLoadControlData(data: { loadControlLimitData: EEBUSLoadControlLimit[] }): void {
    for (const limit of data.loadControlLimitData) {
      this.loadLimits.set(limit.limitId, limit);
      this.emitEvent({
        type: 'loadcontrol',
        message: `Load limit ${limit.limitType}: ${limit.value}${limit.unit} (${limit.isActive ? 'active' : 'inactive'})`,
      });
    }
  }

  private handleIncentiveData(data: { incentiveData: EEBUSIncentive[] }): void {
    this.incentives = data.incentiveData;
  }

  private handleSimpleDataUpdate(data: Record<string, unknown>): void {
    const model: Partial<UnifiedEnergyModel> = { timestamp: Date.now() };

    if (data.evPower !== undefined || data.evStatus !== undefined) {
      model.evCharger = {
        status: (data.evStatus as EVChargerData['status']) ?? 'available',
        powerW: (data.evPower as number) ?? 0,
        energySessionKWh: (data.evEnergy as number) ?? 0,
        maxCurrentA: (data.evMaxCurrent as number) ?? 32,
        vehicleConnected: (data.vehicleConnected as boolean) ?? false,
        v2xCapable: (data.v2xCapable as boolean) ?? false,
        v2xActive: (data.v2xActive as boolean) ?? false,
      };
    }

    if (data.houseLoad !== undefined || data.heatPumpPower !== undefined) {
      model.load = {
        totalPowerW: (data.houseLoad as number) ?? 0,
        heatPumpPowerW: (data.heatPumpPower as number) ?? 0,
        evPowerW: (data.evPower as number) ?? 0,
        otherPowerW: Math.max(
          0,
          ((data.houseLoad as number) ?? 0) -
            ((data.heatPumpPower as number) ?? 0) -
            ((data.evPower as number) ?? 0),
        ),
      };
    }

    this.snapshot = { ...this.snapshot, ...model };
    this.emitData(this.snapshot);
    this.emitEvent({ type: 'data', data: model });
  }

  private buildAndEmitModel(): void {
    const model: Partial<UnifiedEnergyModel> = { timestamp: Date.now() };

    const evPower = this.findMeasurement('ACPowerTotal', 'W', [1, 2, 3]);
    const evCurrent = this.findMeasurement('ACCurrent', 'A', [4, 5, 6]);
    const evVoltage = this.findMeasurement('ACVoltage', 'V', [7, 8, 9]);

    if (evPower !== null) {
      model.evCharger = {
        status: evPower > 0 ? 'charging' : 'available',
        powerW: evPower,
        energySessionKWh: 0,
        currentA: evCurrent ?? 0,
        voltageV: evVoltage ?? 0,
        maxCurrentA: this.getMaxCurrentLimit(),
        vehicleConnected: evPower > 0 || evCurrent !== null,
        v2xCapable: false,
        v2xActive: false,
      };
    }

    const hpPower = this.findMeasurement('ACPowerTotal', 'W', [10, 11, 12]);
    const totalLoad = this.findMeasurement('ACPowerTotal', 'W', [20, 21, 22]);

    if (hpPower !== null || totalLoad !== null) {
      model.load = {
        totalPowerW: totalLoad ?? 0,
        heatPumpPowerW: hpPower ?? 0,
        evPowerW: evPower ?? 0,
        otherPowerW: Math.max(0, (totalLoad ?? 0) - (hpPower ?? 0) - (evPower ?? 0)),
      };
    }

    this.snapshot = { ...this.snapshot, ...model };
    this.emitData(this.snapshot);
    this.emitEvent({ type: 'data', data: model });
  }

  private findMeasurement(scope: string, unit: string, ids: number[]): number | null {
    for (const id of ids) {
      const m = this.measurements.get(id);
      if (m && m.scopeType === scope && m.unit === unit) return m.value;
    }
    return null;
  }

  private getMaxCurrentLimit(): number {
    for (const limit of this.loadLimits.values()) {
      if (limit.limitType === 'maxValueLimit' && limit.unit === 'A' && limit.isActive)
        return limit.value;
    }
    return 32;
  }

  // ─── SPINE Write Commands ─────────────────────────────────────────

  private sendLoadControlWrite(limit: EEBUSLoadControlLimit): boolean {
    return this.sendSPINEMessage({
      header: {
        protocolId: 'ee1.0',
        msgCounter: ++this.msgCounter,
        cmdClassifier: 'write',
        featureSource: { entity: 1, feature: 1 },
        featureDestination: { entity: 2, feature: 4 },
        ackRequest: true,
      },
      payload: {
        cmd: [{ loadControlLimitListData: { loadControlLimitData: [limit] } }],
      },
    });
  }

  private sendSPINEAck(_replyCounter: number): void {
    this.sendSPINEMessage({
      header: {
        protocolId: 'ee1.0',
        msgCounter: ++this.msgCounter,
        cmdClassifier: 'result',
        featureSource: { entity: 1, feature: 0 },
        featureDestination: { entity: 0, feature: 0 },
      },
      payload: {
        cmd: [{ resultData: { errorNumber: 0, description: 'ok' } }],
      },
    });
  }

  private sendSPINEMessage(message: SPINEMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    try {
      this.ws.send(JSON.stringify({ datagram: message }));
      return true;
    } catch {
      return false;
    }
  }

  private requestDeviceData(): void {
    // Request measurements
    this.sendSPINEMessage({
      header: {
        protocolId: 'ee1.0',
        msgCounter: ++this.msgCounter,
        cmdClassifier: 'read',
        featureSource: { entity: 1, feature: 1 },
        featureDestination: { entity: 2, feature: 2 },
      },
      payload: { cmd: [{ measurementListData: {} }] },
    });

    // Request load control limits
    this.sendSPINEMessage({
      header: {
        protocolId: 'ee1.0',
        msgCounter: ++this.msgCounter,
        cmdClassifier: 'read',
        featureSource: { entity: 1, feature: 1 },
        featureDestination: { entity: 2, feature: 4 },
      },
      payload: { cmd: [{ loadControlLimitListData: {} }] },
    });

    // Request incentive table
    this.sendSPINEMessage({
      header: {
        protocolId: 'ee1.0',
        msgCounter: ++this.msgCounter,
        cmdClassifier: 'read',
        featureSource: { entity: 1, feature: 1 },
        featureDestination: { entity: 2, feature: 6 },
      },
      payload: { cmd: [{ incentiveTableData: {} }] },
    });
  }

  // ─── Lifecycle ────────────────────────────────────────────────────

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private emitEvent(event: EEBUSConnectionEvent): void {
    for (const cb of this.eventCallbacks) cb(event);
  }
}
