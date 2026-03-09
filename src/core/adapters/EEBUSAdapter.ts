/**
 * EEBUSAdapter — EEBUS SPINE/SHIP stub for 2027
 *
 * EEBUS is the European standard for cross-vendor energy device communication
 * (VDE-AR-E 2829-6). It defines use cases for:
 *   • EV Charging (EVCC ↔ EVSE)
 *   • Heat Pump CEM (Controllable Energy Management)
 *   • Battery / PV Inverter CEM
 *   • Grid operator §14a EnWG limitation
 *
 * Architecture:
 *   EEBUS Device → SHIP (Smart Home IP) → mDNS discovery → TLS 1.3 → This Adapter
 *
 * Status: STUB — returns empty data. Full implementation planned for Q3 2027
 * when EEBUS Go SDK browser bindings become available.
 */

import type {
  EnergyAdapter,
  AdapterStatus,
  AdapterCapability,
  AdapterCommand,
  AdapterDataCallback,
  AdapterStatusCallback,
  UnifiedEnergyModel,
} from './EnergyAdapter';

export class EEBUSAdapter implements EnergyAdapter {
  readonly id = 'eebus';
  readonly name = 'EEBUS SPINE/SHIP (planned 2027)';
  readonly capabilities: AdapterCapability[] = ['evCharger', 'load'];

  private _status: AdapterStatus = 'disconnected';
  private statusCallbacks: AdapterStatusCallback[] = [];

  get status(): AdapterStatus {
    return this._status;
  }

  async connect(): Promise<void> {
    this._status = 'disconnected';
    for (const cb of this.statusCallbacks) {
      cb('disconnected', 'EEBUS adapter not yet implemented — planned for 2027');
    }
    console.info('[EEBUS] Stub adapter — full implementation planned for Q3 2027');
  }

  async disconnect(): Promise<void> {
    this._status = 'disconnected';
  }

  destroy(): void {
    this.statusCallbacks = [];
  }

  onData(_callback: AdapterDataCallback): void {
    // No data emitted from stub
  }

  onStatus(callback: AdapterStatusCallback): void {
    this.statusCallbacks.push(callback);
  }

  async sendCommand(_command: AdapterCommand): Promise<boolean> {
    return false;
  }

  getSnapshot(): Partial<UnifiedEnergyModel> {
    return {};
  }
}
