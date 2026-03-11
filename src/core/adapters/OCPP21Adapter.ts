/**
 * OCPP21Adapter — OCPP 2.1 EV Charging Station adapter with V2X support
 *
 * Connects to an OCPP 2.1 Central System Management System (CSMS) backend
 * via WebSocket (JSON-RPC over WS, as per OCPP 2.1 specification).
 *
 * Features:
 *   • Real-time charging session monitoring
 *   • Smart charging profiles (TxDefaultProfile, TxProfile)
 *   • V2X (Vehicle-to-Grid / Vehicle-to-Home) discharge control
 *   • ISO 15118 Plug & Charge readiness
 *   • §14a EnWG grid operator curtailment support
 *
 * Architecture:
 *   EVSE (Wallbox) ←→ OCPP 2.1 CSMS Backend ←→ WebSocket ←→ This Adapter
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
  EVChargerData,
} from './EnergyAdapter';

// ─── OCPP 2.1 message types ─────────────────────────────────────────

type OCPPMessageType = 2 | 3 | 4; // CALL, CALLRESULT, CALLERROR

interface OCPPCall {
  0: OCPPMessageType;
  1: string; // messageId
  2: string; // action
  3: Record<string, unknown>; // payload
}

/** Subset of OCPP 2.1 StatusNotification connectorStatus values */
type OCPPConnectorStatus = 'Available' | 'Occupied' | 'Reserved' | 'Unavailable' | 'Faulted';

/** Subset of OCPP 2.1 TransactionEvent data */
interface OCPPTransactionEvent {
  eventType: 'Started' | 'Updated' | 'Ended';
  meterValue?: {
    timestamp: string;
    sampledValue: {
      value: number;
      measurand?:
        | 'Energy.Active.Import.Register'
        | 'Power.Active.Import'
        | 'SoC'
        | 'Current.Import'
        | 'Voltage';
      unit?: string;
    }[];
  }[];
}

/** Internal charger state tracking */
interface ChargerState {
  connectorStatus: OCPPConnectorStatus;
  chargingPowerW: number;
  energySessionKWh: number;
  socPercent: number;
  currentA: number;
  voltageV: number;
  maxCurrentA: number;
  vehicleConnected: boolean;
  v2xCapable: boolean;
  v2xActive: boolean;
  transactionId?: string;
}

const DEFAULT_RECONNECT = {
  enabled: true,
  initialDelayMs: 3000,
  maxDelayMs: 30_000,
  backoffMultiplier: 2,
};

export class OCPP21Adapter implements EnergyAdapter {
  readonly id = 'ocpp-21';
  readonly name = 'OCPP 2.1 Charging Station';
  readonly capabilities: AdapterCapability[] = ['evCharger'];

  private _status: AdapterStatus = 'disconnected';
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private retryDelay: number;
  private destroyed = false;
  private msgCounter = 0;

  private dataCallbacks: AdapterDataCallback[] = [];
  private statusCallbacks: AdapterStatusCallback[] = [];

  private charger: ChargerState = {
    connectorStatus: 'Available',
    chargingPowerW: 0,
    energySessionKWh: 0,
    socPercent: 0,
    currentA: 0,
    voltageV: 230,
    maxCurrentA: 32,
    vehicleConnected: false,
    v2xCapable: false,
    v2xActive: false,
  };

  private readonly config: AdapterConnectionConfig;

  constructor(config?: Partial<AdapterConnectionConfig>) {
    this.config = {
      name: 'OCPP 2.1 CSMS',
      host: config?.host ?? '192.168.1.200',
      port: config?.port ?? 9000,
      tls: config?.tls ?? true,
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
    if (this.ws?.readyState !== WebSocket.OPEN) return false;

    switch (command.type) {
      case 'SET_EV_CURRENT':
        return this.sendSetChargingProfile(Number(command.value));
      case 'START_CHARGING':
        return this.sendRemoteStart();
      case 'STOP_CHARGING':
        return this.sendRemoteStop();
      case 'SET_V2X_DISCHARGE':
        return this.sendV2XDischarge(Number(command.value));
      case 'SET_EV_POWER':
        // Convert power (W) to current (A) at nominal voltage
        return this.sendSetChargingProfile(
          Math.round(Number(command.value) / this.charger.voltageV),
        );
      default:
        return false;
    }
  }

  getSnapshot(): Partial<UnifiedEnergyModel> {
    return { evCharger: this.toEVChargerData() };
  }

  // ─── Internal ─────────────────────────────────────────────────────

  private doConnect(): void {
    this.setStatus('connecting');

    const protocol = this.config.tls ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${this.config.host}:${this.config.port}/ocpp`;

    // OCPP 2.1 requires subprotocol "ocpp2.1"
    const ws = new WebSocket(wsUrl, ['ocpp2.1']);

    ws.onopen = () => {
      this.retryDelay = this.config.reconnect?.initialDelayMs ?? DEFAULT_RECONNECT.initialDelayMs;
      this.setStatus('connected');
      // Send BootNotification
      this.sendCall('BootNotification', {
        chargingStation: {
          model: 'NexusHEMS-Virtual',
          vendorName: 'NexusDash',
        },
        reason: 'PowerUp',
      });
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(String(event.data)) as OCPPCall;
        this.handleMessage(msg);
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

  private handleMessage(msg: OCPPCall): void {
    const messageType = msg[0];

    if (messageType === 2) {
      // CALL from CSMS
      const action = msg[2];
      const payload = msg[3];
      const messageId = msg[1];

      switch (action) {
        case 'StatusNotification':
          this.handleStatusNotification(payload);
          this.sendCallResult(messageId, {});
          break;
        case 'TransactionEvent':
          this.handleTransactionEvent(payload as unknown as OCPPTransactionEvent);
          this.sendCallResult(messageId, {});
          break;
        case 'MeterValues':
          this.handleMeterValues(payload);
          this.sendCallResult(messageId, {});
          break;
        default:
          // Acknowledge unknown calls
          this.sendCallResult(messageId, {});
      }
    }
    // CALLRESULT (3) and CALLERROR (4) are handled implicitly
  }

  private handleStatusNotification(payload: Record<string, unknown>): void {
    const status = payload['connectorStatus'] as OCPPConnectorStatus | undefined;
    if (status) {
      this.charger.connectorStatus = status;
      this.charger.vehicleConnected = status === 'Occupied';
    }
    this.emitData();
  }

  private handleTransactionEvent(event: OCPPTransactionEvent): void {
    if (event.eventType === 'Started') {
      this.charger.energySessionKWh = 0;
    }

    if (event.meterValue) {
      for (const mv of event.meterValue) {
        for (const sv of mv.sampledValue) {
          switch (sv.measurand) {
            case 'Power.Active.Import':
              this.charger.chargingPowerW = sv.value;
              break;
            case 'Energy.Active.Import.Register':
              this.charger.energySessionKWh = sv.value / 1000;
              break;
            case 'SoC':
              this.charger.socPercent = sv.value;
              break;
            case 'Current.Import':
              this.charger.currentA = sv.value;
              break;
            case 'Voltage':
              this.charger.voltageV = sv.value;
              break;
          }
        }
      }
    }

    if (event.eventType === 'Ended') {
      this.charger.chargingPowerW = 0;
      this.charger.currentA = 0;
    }

    this.emitData();
  }

  private handleMeterValues(payload: Record<string, unknown>): void {
    const meterValue = payload['meterValue'] as
      | { sampledValue: { value: number; measurand?: string }[] }[]
      | undefined;

    if (!meterValue) return;

    for (const mv of meterValue) {
      for (const sv of mv.sampledValue) {
        if (sv.measurand === 'Power.Active.Import') {
          this.charger.chargingPowerW = sv.value;
        }
      }
    }

    this.emitData();
  }

  private emitData(): void {
    const model: Partial<UnifiedEnergyModel> = {
      timestamp: Date.now(),
      evCharger: this.toEVChargerData(),
    };
    for (const cb of this.dataCallbacks) cb(model);
  }

  private toEVChargerData(): EVChargerData {
    const statusMap: Record<OCPPConnectorStatus, EVChargerData['status']> = {
      Available: 'available',
      Occupied: 'charging',
      Reserved: 'preparing',
      Unavailable: 'suspended',
      Faulted: 'faulted',
    };

    return {
      status: statusMap[this.charger.connectorStatus] ?? 'available',
      powerW: this.charger.chargingPowerW,
      energySessionKWh: this.charger.energySessionKWh,
      socPercent: this.charger.socPercent || undefined,
      currentA: this.charger.currentA || undefined,
      voltageV: this.charger.voltageV,
      maxCurrentA: this.charger.maxCurrentA,
      vehicleConnected: this.charger.vehicleConnected,
      v2xCapable: this.charger.v2xCapable,
      v2xActive: this.charger.v2xActive,
    };
  }

  // ─── OCPP 2.1 outbound messages ──────────────────────────────────

  private sendCall(action: string, payload: Record<string, unknown>): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    const id = `msg-${++this.msgCounter}`;
    this.ws.send(JSON.stringify([2, id, action, payload]));
  }

  private sendCallResult(messageId: string, payload: Record<string, unknown>): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify([3, messageId, payload]));
  }

  private sendSetChargingProfile(maxCurrentA: number): boolean {
    this.sendCall('SetChargingProfile', {
      evseId: 1,
      chargingProfile: {
        id: 1,
        stackLevel: 0,
        chargingProfilePurpose: 'TxDefaultProfile',
        chargingProfileKind: 'Absolute',
        chargingSchedule: [
          {
            id: 1,
            chargingRateUnit: 'A',
            chargingSchedulePeriod: [{ startPeriod: 0, limit: maxCurrentA }],
          },
        ],
      },
    });
    this.charger.maxCurrentA = maxCurrentA;
    return true;
  }

  private sendRemoteStart(): boolean {
    this.sendCall('RequestStartTransaction', {
      evseId: 1,
      remoteStartId: Date.now(),
      idToken: { idToken: 'nexus-hems', type: 'Central' },
    });
    return true;
  }

  private sendRemoteStop(): boolean {
    if (!this.charger.transactionId) return false;
    this.sendCall('RequestStopTransaction', {
      transactionId: this.charger.transactionId,
    });
    return true;
  }

  /** V2X discharge: negative current = vehicle-to-grid */
  private sendV2XDischarge(dischargePowerW: number): boolean {
    if (!this.charger.v2xCapable) return false;
    const dischargeCurrentA = Math.round(dischargePowerW / this.charger.voltageV);
    this.sendCall('SetChargingProfile', {
      evseId: 1,
      chargingProfile: {
        id: 2,
        stackLevel: 1,
        chargingProfilePurpose: 'TxProfile',
        chargingProfileKind: 'Absolute',
        chargingSchedule: [
          {
            id: 2,
            chargingRateUnit: 'A',
            chargingSchedulePeriod: [{ startPeriod: 0, limit: -dischargeCurrentA }],
          },
        ],
      },
    });
    this.charger.v2xActive = dischargePowerW > 0;
    return true;
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
