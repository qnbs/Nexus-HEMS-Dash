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
export { VictronMQTTAdapter, VENUS_DBUS_PATHS, VENUS_MQTT_PREFIX } from './VictronMQTTAdapter';
export type { VictronGatewayType } from './VictronMQTTAdapter';
export { ModbusSunSpecAdapter } from './ModbusSunSpecAdapter';
export { KNXAdapter } from './KNXAdapter';
export { OCPP21Adapter } from './OCPP21Adapter';
export { EEBUSAdapter } from './EEBUSAdapter';
export type {
  EEBUSDeviceType,
  EEBUSEntity,
  EEBUSFeature,
  EEBUSFeatureType,
  EEBUSMeasurement,
  EEBUSLoadControlLimit,
  EEBUSIncentive,
  SHIPConnectionState,
  EEBUSDiscoveredDevice,
  EEBUSConnectionEvent,
} from './EEBUSAdapter';
