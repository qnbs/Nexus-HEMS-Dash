/**
 * HEMS Protocol Adapters — Barrel Export
 *
 * All adapter implementations and the core interface are re-exported from here.
 */

// Core types & interface
export type {
  EnergyAdapter,
  AdapterStatus,
  AdapterCapability,
  AdapterConnectionConfig,
  AdapterCommand,
  AdapterCommandType,
  AdapterDataCallback,
  AdapterStatusCallback,
  AdapterEvent,
  AdapterEventType,
  UnifiedEnergyModel,
  PVData,
  BatteryData,
  GridData,
  LoadData,
  EVChargerData,
  KNXData,
  KNXRoom,
  TariffData,
} from './EnergyAdapter';

// Adapter implementations
export { VictronMQTTAdapter } from './VictronMQTTAdapter';
export { ModbusSunSpecAdapter } from './ModbusSunSpecAdapter';
export { KNXAdapter } from './KNXAdapter';
export { OCPP21Adapter } from './OCPP21Adapter';
export { EEBUSAdapter } from './EEBUSAdapter';
