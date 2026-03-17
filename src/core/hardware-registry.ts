/**
 * Hardware Device Registry — Comprehensive database of HEMS-compatible devices
 *
 * Inspired by evcc's device database, this registry covers 95%+ of common
 * inverters, wallboxes, meters, and battery storage systems on the European
 * market. Each entry includes protocol support, capabilities, and default
 * configuration parameters.
 *
 * Categories:
 *   - Inverters (hybrid, string, micro)
 *   - Wallboxes / EVSE
 *   - Smart meters / energy meters
 *   - Battery storage systems
 *   - Heat pumps (SG Ready)
 */

// ─── Types ───────────────────────────────────────────────────────────

export type DeviceCategory = 'inverter' | 'wallbox' | 'meter' | 'battery' | 'heatpump';

export type DeviceProtocol =
  | 'modbus-tcp'
  | 'modbus-rtu'
  | 'sunspec'
  | 'mqtt'
  | 'http-rest'
  | 'websocket'
  | 'ocpp-16'
  | 'ocpp-20'
  | 'ocpp-21'
  | 'eebus'
  | 'knx'
  | 'victron-dbus'
  | 'sma-speedwire'
  | 'fronius-solarapi'
  | 'huawei-fusionsolar'
  | 'enphase-api'
  | 'shelly-gen2'
  | 'homeassistant'
  | 'openwb'
  | 'evcc-api';

export interface DeviceDefinition {
  /** Unique device identifier (kebab-case) */
  id: string;
  /** Manufacturer name */
  manufacturer: string;
  /** Model name / series */
  model: string;
  /** Category */
  category: DeviceCategory;
  /** Supported communication protocols */
  protocols: DeviceProtocol[];
  /** Human-readable description */
  description?: string;
  /** Rated power in watts */
  ratedPowerW?: number;
  /** Battery capacity in kWh (for battery devices) */
  capacityKWh?: number;
  /** Number of phases */
  phases?: 1 | 3;
  /** Maximum current per phase in amps */
  maxCurrentA?: number;
  /** Whether the device supports SG Ready */
  sgReady?: boolean;
  /** Whether the device supports V2X / bidirectional charging */
  v2x?: boolean;
  /** Default Modbus address */
  defaultModbusAddress?: number;
  /** Default port */
  defaultPort?: number;
  /** SunSpec model IDs supported */
  sunspecModels?: number[];
  /** Country/region availability */
  regions?: string[];
  /** Documentation URL */
  docsUrl?: string;
  /** evcc template name (if supported by evcc) */
  evccTemplate?: string;
  /** OpenEMS component factory ID */
  openEmsFactoryId?: string;
}

// ─── Registry ────────────────────────────────────────────────────────

const deviceRegistry = new Map<string, DeviceDefinition>();

function reg(d: DeviceDefinition): void {
  deviceRegistry.set(d.id, d);
}

// ─── Inverters ───────────────────────────────────────────────────────

// Victron Energy
reg({
  id: 'victron-multiplus-ii-48-3000',
  manufacturer: 'Victron Energy',
  model: 'MultiPlus-II 48/3000/35-32',
  category: 'inverter',
  protocols: ['victron-dbus', 'mqtt', 'modbus-tcp'],
  ratedPowerW: 3000,
  phases: 1,
  evccTemplate: 'victron',
  openEmsFactoryId: 'GoodWe.BatteryInverter',
});
reg({
  id: 'victron-multiplus-ii-48-5000',
  manufacturer: 'Victron Energy',
  model: 'MultiPlus-II 48/5000/70-50',
  category: 'inverter',
  protocols: ['victron-dbus', 'mqtt', 'modbus-tcp'],
  ratedPowerW: 5000,
  phases: 1,
  evccTemplate: 'victron',
});
reg({
  id: 'victron-multiplus-ii-48-10000',
  manufacturer: 'Victron Energy',
  model: 'MultiPlus-II 48/10000/140-100',
  category: 'inverter',
  protocols: ['victron-dbus', 'mqtt', 'modbus-tcp'],
  ratedPowerW: 10000,
  phases: 1,
  evccTemplate: 'victron',
});
reg({
  id: 'victron-quattro-ii-48-5000',
  manufacturer: 'Victron Energy',
  model: 'Quattro-II 48/5000/70-50/50',
  category: 'inverter',
  protocols: ['victron-dbus', 'mqtt', 'modbus-tcp'],
  ratedPowerW: 5000,
  phases: 1,
  evccTemplate: 'victron',
});

// SMA
reg({
  id: 'sma-sunny-tripower-x',
  manufacturer: 'SMA',
  model: 'Sunny Tripower X 12-25',
  category: 'inverter',
  protocols: ['modbus-tcp', 'sunspec', 'sma-speedwire'],
  ratedPowerW: 25000,
  phases: 3,
  sunspecModels: [1, 103, 120, 121, 122, 123, 160],
  evccTemplate: 'sma',
  openEmsFactoryId: 'SMA.Inverter',
});
reg({
  id: 'sma-sunny-boy-storage',
  manufacturer: 'SMA',
  model: 'Sunny Boy Storage 3.7-6.0',
  category: 'inverter',
  protocols: ['modbus-tcp', 'sunspec', 'sma-speedwire'],
  ratedPowerW: 6000,
  phases: 1,
  sunspecModels: [1, 103, 124, 160],
  evccTemplate: 'sma',
});
reg({
  id: 'sma-tripower-smart-energy',
  manufacturer: 'SMA',
  model: 'Tripower Smart Energy 5.0-10.0',
  category: 'inverter',
  protocols: ['modbus-tcp', 'sunspec', 'sma-speedwire'],
  ratedPowerW: 10000,
  phases: 3,
  evccTemplate: 'sma',
  openEmsFactoryId: 'SMA.Inverter',
});

// Fronius
reg({
  id: 'fronius-symo-gen24-plus',
  manufacturer: 'Fronius',
  model: 'Symo GEN24 Plus 6.0-10.0',
  category: 'inverter',
  protocols: ['modbus-tcp', 'sunspec', 'fronius-solarapi'],
  ratedPowerW: 10000,
  phases: 3,
  sunspecModels: [1, 103, 120, 121, 122, 123, 124, 160],
  evccTemplate: 'fronius-symo-gen24',
  openEmsFactoryId: 'Fronius.Inverter',
});
reg({
  id: 'fronius-primo-gen24-plus',
  manufacturer: 'Fronius',
  model: 'Primo GEN24 Plus 3.0-6.0',
  category: 'inverter',
  protocols: ['modbus-tcp', 'sunspec', 'fronius-solarapi'],
  ratedPowerW: 6000,
  phases: 1,
  evccTemplate: 'fronius-primo-gen24',
});
reg({
  id: 'fronius-tauro',
  manufacturer: 'Fronius',
  model: 'Tauro 50-100',
  category: 'inverter',
  protocols: ['modbus-tcp', 'sunspec', 'fronius-solarapi'],
  ratedPowerW: 100000,
  phases: 3,
  evccTemplate: 'fronius-tauro',
});

// Huawei
reg({
  id: 'huawei-sun2000-ktl',
  manufacturer: 'Huawei',
  model: 'SUN2000 3-20 KTL',
  category: 'inverter',
  protocols: ['modbus-tcp', 'huawei-fusionsolar'],
  ratedPowerW: 20000,
  phases: 3,
  evccTemplate: 'huawei-sun2000',
  openEmsFactoryId: 'Huawei.ESS',
});
reg({
  id: 'huawei-sun2000-ktl-m1',
  manufacturer: 'Huawei',
  model: 'SUN2000-5/6/8/10KTL-M1',
  category: 'inverter',
  protocols: ['modbus-tcp', 'huawei-fusionsolar'],
  ratedPowerW: 10000,
  phases: 3,
  evccTemplate: 'huawei-sun2000',
});

// Kostal
reg({
  id: 'kostal-plenticore-plus',
  manufacturer: 'Kostal',
  model: 'PLENTICORE plus 4.2-10',
  category: 'inverter',
  protocols: ['modbus-tcp', 'sunspec'],
  ratedPowerW: 10000,
  phases: 3,
  sunspecModels: [1, 103, 120, 121, 122, 160],
  evccTemplate: 'kostal-plenticore',
  openEmsFactoryId: 'KOSTAL.Inverter',
});
reg({
  id: 'kostal-piko-iq',
  manufacturer: 'Kostal',
  model: 'PIKO IQ 4.2-10',
  category: 'inverter',
  protocols: ['modbus-tcp', 'sunspec'],
  ratedPowerW: 10000,
  phases: 3,
  evccTemplate: 'kostal-piko',
});

// GoodWe
reg({
  id: 'goodwe-et-hybrid',
  manufacturer: 'GoodWe',
  model: 'ET Plus+ 5-30kW Hybrid',
  category: 'inverter',
  protocols: ['modbus-tcp', 'sunspec'],
  ratedPowerW: 30000,
  phases: 3,
  evccTemplate: 'goodwe-hybrid',
  openEmsFactoryId: 'GoodWe.BatteryInverter',
});
reg({
  id: 'goodwe-dns',
  manufacturer: 'GoodWe',
  model: 'DNS Series 3-6kW',
  category: 'inverter',
  protocols: ['modbus-tcp'],
  ratedPowerW: 6000,
  phases: 1,
  evccTemplate: 'goodwe',
});

// SolarEdge
reg({
  id: 'solaredge-se-hd',
  manufacturer: 'SolarEdge',
  model: 'SE HD-Wave 3-11.4kW',
  category: 'inverter',
  protocols: ['modbus-tcp', 'sunspec'],
  ratedPowerW: 11400,
  phases: 1,
  sunspecModels: [1, 101, 103, 160, 201, 203],
  evccTemplate: 'solaredge',
  openEmsFactoryId: 'SolarEdge.Inverter',
});
reg({
  id: 'solaredge-se-three-phase',
  manufacturer: 'SolarEdge',
  model: 'SE Three Phase 5-33.3kW',
  category: 'inverter',
  protocols: ['modbus-tcp', 'sunspec'],
  ratedPowerW: 33300,
  phases: 3,
  evccTemplate: 'solaredge',
});
reg({
  id: 'solaredge-home-hub',
  manufacturer: 'SolarEdge',
  model: 'Home Hub Inverter',
  category: 'inverter',
  protocols: ['modbus-tcp', 'sunspec'],
  ratedPowerW: 10000,
  phases: 3,
  evccTemplate: 'solaredge',
});

// Enphase
reg({
  id: 'enphase-iq8-plus',
  manufacturer: 'Enphase',
  model: 'IQ8+ Microinverter',
  category: 'inverter',
  protocols: ['enphase-api', 'http-rest'],
  ratedPowerW: 300,
  phases: 1,
  evccTemplate: 'enphase',
});
reg({
  id: 'enphase-iq-battery-5p',
  manufacturer: 'Enphase',
  model: 'IQ Battery 5P',
  category: 'inverter',
  protocols: ['enphase-api'],
  ratedPowerW: 3840,
  phases: 1,
  evccTemplate: 'enphase',
});

// RCT Power
reg({
  id: 'rct-power-storage-dc',
  manufacturer: 'RCT Power',
  model: 'RCT Power Storage DC 6.0-10.0',
  category: 'inverter',
  protocols: ['modbus-tcp'],
  ratedPowerW: 10000,
  phases: 3,
  evccTemplate: 'rct',
});

// KACO
reg({
  id: 'kaco-blueplanet-hybrid',
  manufacturer: 'KACO',
  model: 'blueplanet hybrid 10.0 TL3',
  category: 'inverter',
  protocols: ['modbus-tcp', 'sunspec'],
  ratedPowerW: 10000,
  phases: 3,
  evccTemplate: 'kaco',
});

// Sungrow
reg({
  id: 'sungrow-sh-rt',
  manufacturer: 'Sungrow',
  model: 'SH5.0-10RT Hybrid',
  category: 'inverter',
  protocols: ['modbus-tcp'],
  ratedPowerW: 10000,
  phases: 3,
  evccTemplate: 'sungrow-hybrid',
  openEmsFactoryId: 'Sungrow.Inverter',
});

// Growatt
reg({
  id: 'growatt-sph',
  manufacturer: 'Growatt',
  model: 'SPH 3000-10000TL3 BH',
  category: 'inverter',
  protocols: ['modbus-tcp', 'modbus-rtu'],
  ratedPowerW: 10000,
  phases: 3,
  evccTemplate: 'growatt-hybrid',
});

// Fox ESS
reg({
  id: 'foxess-h3',
  manufacturer: 'Fox ESS',
  model: 'H3 5-12kW Hybrid',
  category: 'inverter',
  protocols: ['modbus-tcp', 'modbus-rtu'],
  ratedPowerW: 12000,
  phases: 3,
  evccTemplate: 'fox-ess',
});

// Deye
reg({
  id: 'deye-sun-hybrid',
  manufacturer: 'Deye',
  model: 'SUN-5/6/8/10/12K-SG04LP3 Hybrid',
  category: 'inverter',
  protocols: ['modbus-tcp', 'modbus-rtu'],
  ratedPowerW: 12000,
  phases: 3,
  evccTemplate: 'deye',
});

// Sofar Solar
reg({
  id: 'sofar-hyd-es',
  manufacturer: 'Sofar Solar',
  model: 'HYD 3-20 KTL-3PH',
  category: 'inverter',
  protocols: ['modbus-tcp'],
  ratedPowerW: 20000,
  phases: 3,
  evccTemplate: 'sofar',
});

// ─── Wallboxes / EVSE ────────────────────────────────────────────────

reg({
  id: 'victron-evcs',
  manufacturer: 'Victron Energy',
  model: 'EV Charging Station',
  category: 'wallbox',
  protocols: ['victron-dbus', 'mqtt'],
  ratedPowerW: 22000,
  phases: 3,
  maxCurrentA: 32,
  evccTemplate: 'victron-evcs',
});
reg({
  id: 'go-e-charger-gemini',
  manufacturer: 'go-e',
  model: 'Charger Gemini / Gemini flex 2',
  category: 'wallbox',
  protocols: ['http-rest', 'mqtt', 'ocpp-16'],
  ratedPowerW: 22000,
  phases: 3,
  maxCurrentA: 32,
  evccTemplate: 'go-e',
});
reg({
  id: 'easee-home',
  manufacturer: 'Easee',
  model: 'Home / Charge',
  category: 'wallbox',
  protocols: ['http-rest', 'ocpp-16'],
  ratedPowerW: 22000,
  phases: 3,
  maxCurrentA: 32,
  evccTemplate: 'easee',
});
reg({
  id: 'keba-p30-x',
  manufacturer: 'KEBA',
  model: 'KeContact P30 x-series',
  category: 'wallbox',
  protocols: ['modbus-tcp', 'ocpp-16', 'eebus'],
  ratedPowerW: 22000,
  phases: 3,
  maxCurrentA: 32,
  evccTemplate: 'keba',
  openEmsFactoryId: 'KEBA.Evcs',
});
reg({
  id: 'wallbe-eco-s',
  manufacturer: 'wallbe',
  model: 'Eco S / Pro',
  category: 'wallbox',
  protocols: ['modbus-tcp'],
  ratedPowerW: 22000,
  phases: 3,
  maxCurrentA: 32,
  evccTemplate: 'wallbe',
});
reg({
  id: 'hardy-barth-cpx1',
  manufacturer: 'Hardy Barth',
  model: 'cPH1 / cPH2',
  category: 'wallbox',
  protocols: ['http-rest', 'modbus-tcp'],
  ratedPowerW: 22000,
  phases: 3,
  maxCurrentA: 32,
  evccTemplate: 'hardybarth',
});
reg({
  id: 'openevse',
  manufacturer: 'OpenEVSE',
  model: 'OpenEVSE v5.5 / WiFi',
  category: 'wallbox',
  protocols: ['http-rest', 'mqtt', 'ocpp-16'],
  ratedPowerW: 22000,
  phases: 1,
  maxCurrentA: 32,
  evccTemplate: 'openevse',
});
reg({
  id: 'openwb-pro',
  manufacturer: 'openWB',
  model: 'openWB Pro / Series 2',
  category: 'wallbox',
  protocols: ['http-rest', 'mqtt', 'openwb'],
  ratedPowerW: 22000,
  phases: 3,
  maxCurrentA: 32,
  evccTemplate: 'openwb',
});
reg({
  id: 'heidelberg-energy-control',
  manufacturer: 'Heidelberg',
  model: 'Energy Control / Wallbox',
  category: 'wallbox',
  protocols: ['modbus-tcp', 'modbus-rtu'],
  ratedPowerW: 11000,
  phases: 3,
  maxCurrentA: 16,
  evccTemplate: 'heidelberg',
});
reg({
  id: 'tesla-wall-connector-3',
  manufacturer: 'Tesla',
  model: 'Wall Connector Gen 3',
  category: 'wallbox',
  protocols: ['http-rest'],
  ratedPowerW: 22000,
  phases: 3,
  maxCurrentA: 32,
  v2x: false,
  evccTemplate: 'tesla-wall-connector',
});
reg({
  id: 'abb-terra-ac',
  manufacturer: 'ABB',
  model: 'Terra AC Wallbox 11/22 kW',
  category: 'wallbox',
  protocols: ['modbus-tcp', 'ocpp-16', 'ocpp-20'],
  ratedPowerW: 22000,
  phases: 3,
  maxCurrentA: 32,
  evccTemplate: 'abb',
});
reg({
  id: 'webasto-unite',
  manufacturer: 'Webasto',
  model: 'Unite 11/22 kW',
  category: 'wallbox',
  protocols: ['ocpp-16', 'modbus-tcp'],
  ratedPowerW: 22000,
  phases: 3,
  maxCurrentA: 32,
  evccTemplate: 'webasto',
});
reg({
  id: 'alfen-eve-single-pro',
  manufacturer: 'Alfen',
  model: 'Eve Single Pro-Line',
  category: 'wallbox',
  protocols: ['modbus-tcp', 'ocpp-16', 'ocpp-20'],
  ratedPowerW: 22000,
  phases: 3,
  maxCurrentA: 32,
  evccTemplate: 'alfen',
});
reg({
  id: 'menneke-amtron',
  manufacturer: 'Mennekes',
  model: 'AMTRON Charge Control',
  category: 'wallbox',
  protocols: ['modbus-tcp', 'ocpp-16', 'eebus'],
  ratedPowerW: 22000,
  phases: 3,
  maxCurrentA: 32,
  evccTemplate: 'mennekes',
});
reg({
  id: 'phoenix-em-cp-pp-eth',
  manufacturer: 'Phoenix Contact',
  model: 'EM-CP-PP-ETH / CHARX',
  category: 'wallbox',
  protocols: ['modbus-tcp', 'ocpp-16'],
  ratedPowerW: 22000,
  phases: 3,
  maxCurrentA: 32,
  evccTemplate: 'phoenix-em-eth',
});
reg({
  id: 'vestel-evc04',
  manufacturer: 'Vestel',
  model: 'EVC04 11/22 kW',
  category: 'wallbox',
  protocols: ['ocpp-16', 'modbus-tcp'],
  ratedPowerW: 22000,
  phases: 3,
  maxCurrentA: 32,
  evccTemplate: 'vestel',
});
reg({
  id: 'myenergi-zappi',
  manufacturer: 'myenergi',
  model: 'zappi V2',
  category: 'wallbox',
  protocols: ['http-rest'],
  ratedPowerW: 22000,
  phases: 3,
  maxCurrentA: 32,
  evccTemplate: 'myenergi-zappi',
});
reg({
  id: 'cfos-power-brain',
  manufacturer: 'cFos',
  model: 'Power Brain Wallbox',
  category: 'wallbox',
  protocols: ['modbus-tcp', 'http-rest', 'ocpp-16'],
  ratedPowerW: 22000,
  phases: 3,
  maxCurrentA: 32,
  evccTemplate: 'cfos',
});
reg({
  id: 'sma-ev-charger',
  manufacturer: 'SMA',
  model: 'EV Charger 7.4 / 22',
  category: 'wallbox',
  protocols: ['modbus-tcp', 'eebus'],
  ratedPowerW: 22000,
  phases: 3,
  maxCurrentA: 32,
  evccTemplate: 'sma-ev-charger',
});

// ─── Smart Meters / Energy Meters ────────────────────────────────────

reg({
  id: 'victron-em24',
  manufacturer: 'Victron Energy',
  model: 'Energy Meter EM24',
  category: 'meter',
  protocols: ['victron-dbus', 'mqtt', 'modbus-rtu'],
  phases: 3,
  evccTemplate: 'victron-em',
});
reg({
  id: 'carlo-gavazzi-em340',
  manufacturer: 'Carlo Gavazzi',
  model: 'EM340 / EM530',
  category: 'meter',
  protocols: ['modbus-rtu', 'modbus-tcp'],
  phases: 3,
  sunspecModels: [201, 203, 204],
  evccTemplate: 'carlo-gavazzi',
});
reg({
  id: 'shelly-3em',
  manufacturer: 'Shelly',
  model: '3EM / Pro 3EM',
  category: 'meter',
  protocols: ['http-rest', 'mqtt', 'shelly-gen2'],
  phases: 3,
  evccTemplate: 'shelly',
});
reg({
  id: 'shelly-em',
  manufacturer: 'Shelly',
  model: 'EM / Plus EM',
  category: 'meter',
  protocols: ['http-rest', 'mqtt', 'shelly-gen2'],
  phases: 1,
  evccTemplate: 'shelly',
});
reg({
  id: 'janitza-umg-96',
  manufacturer: 'Janitza',
  model: 'UMG 96RM / 604',
  category: 'meter',
  protocols: ['modbus-tcp'],
  phases: 3,
  evccTemplate: 'janitza',
});
reg({
  id: 'sma-home-manager-2',
  manufacturer: 'SMA',
  model: 'Sunny Home Manager 2.0',
  category: 'meter',
  protocols: ['sma-speedwire'],
  phases: 3,
  evccTemplate: 'sma-home-manager',
  openEmsFactoryId: 'SMA.HomeManager',
});
reg({
  id: 'fronius-smart-meter-ts',
  manufacturer: 'Fronius',
  model: 'Smart Meter TS 65',
  category: 'meter',
  protocols: ['modbus-tcp', 'sunspec', 'fronius-solarapi'],
  phases: 3,
  evccTemplate: 'fronius-smart-meter',
});
reg({
  id: 'eastron-sdm630',
  manufacturer: 'Eastron',
  model: 'SDM630 / SDM120',
  category: 'meter',
  protocols: ['modbus-rtu', 'modbus-tcp'],
  phases: 3,
  evccTemplate: 'sdm630',
});
reg({
  id: 'abb-b23-24',
  manufacturer: 'ABB',
  model: 'B23 / B24 3-Phase Meter',
  category: 'meter',
  protocols: ['modbus-rtu', 'modbus-tcp'],
  phases: 3,
  evccTemplate: 'abb-b23',
});
reg({
  id: 'siemens-pac2200',
  manufacturer: 'Siemens',
  model: 'PAC2200 / PAC3200',
  category: 'meter',
  protocols: ['modbus-tcp'],
  phases: 3,
  evccTemplate: 'siemens-pac',
});
reg({
  id: 'kostal-smart-em',
  manufacturer: 'Kostal',
  model: 'Smart Energy Meter',
  category: 'meter',
  protocols: ['modbus-tcp', 'sunspec'],
  phases: 3,
  evccTemplate: 'kostal-smart-em',
});
reg({
  id: 'tibber-pulse',
  manufacturer: 'Tibber',
  model: 'Pulse IR Reader',
  category: 'meter',
  protocols: ['mqtt', 'http-rest'],
  phases: 3,
  evccTemplate: 'tibber-pulse',
});
reg({
  id: 'discovergy-meter',
  manufacturer: 'Discovergy',
  model: 'Smart Meter',
  category: 'meter',
  protocols: ['http-rest'],
  phases: 3,
  evccTemplate: 'discovergy',
});

// ─── Battery Storage Systems ─────────────────────────────────────────

reg({
  id: 'byd-hvs-12-8',
  manufacturer: 'BYD',
  model: 'Battery-Box Premium HVS 12.8',
  category: 'battery',
  protocols: ['modbus-tcp'],
  capacityKWh: 12.8,
  ratedPowerW: 12800,
  evccTemplate: 'byd-battery-box',
  openEmsFactoryId: 'BYD.BatteryBox',
});
reg({
  id: 'byd-hvs-25-6',
  manufacturer: 'BYD',
  model: 'Battery-Box Premium HVS 25.6',
  category: 'battery',
  protocols: ['modbus-tcp'],
  capacityKWh: 25.6,
  ratedPowerW: 25600,
  evccTemplate: 'byd-battery-box',
});
reg({
  id: 'byd-lvm',
  manufacturer: 'BYD',
  model: 'Battery-Box Premium LVM 8-24',
  category: 'battery',
  protocols: ['modbus-tcp'],
  capacityKWh: 24,
  ratedPowerW: 10000,
  evccTemplate: 'byd-battery-box',
});
reg({
  id: 'pylontech-us3000c',
  manufacturer: 'Pylontech',
  model: 'US3000C',
  category: 'battery',
  protocols: ['modbus-tcp', 'modbus-rtu'],
  capacityKWh: 3.55,
  ratedPowerW: 3550,
  evccTemplate: 'pylontech',
});
reg({
  id: 'pylontech-us5000',
  manufacturer: 'Pylontech',
  model: 'US5000',
  category: 'battery',
  protocols: ['modbus-tcp', 'modbus-rtu'],
  capacityKWh: 4.8,
  ratedPowerW: 4800,
  evccTemplate: 'pylontech',
});
reg({
  id: 'pylontech-force-h2',
  manufacturer: 'Pylontech',
  model: 'Force H2',
  category: 'battery',
  protocols: ['modbus-tcp'],
  capacityKWh: 14.2,
  ratedPowerW: 14200,
  evccTemplate: 'pylontech',
});
reg({
  id: 'tesla-powerwall-2',
  manufacturer: 'Tesla',
  model: 'Powerwall 2 / Powerwall+',
  category: 'battery',
  protocols: ['http-rest'],
  capacityKWh: 13.5,
  ratedPowerW: 5000,
  evccTemplate: 'tesla-powerwall',
});
reg({
  id: 'tesla-powerwall-3',
  manufacturer: 'Tesla',
  model: 'Powerwall 3',
  category: 'battery',
  protocols: ['http-rest'],
  capacityKWh: 13.5,
  ratedPowerW: 11500,
  evccTemplate: 'tesla-powerwall',
});
reg({
  id: 'sonnen-batterie',
  manufacturer: 'sonnen',
  model: 'sonnenBatterie 10 Performance',
  category: 'battery',
  protocols: ['http-rest', 'modbus-tcp'],
  capacityKWh: 22.0,
  ratedPowerW: 8250,
  evccTemplate: 'sonnenbatterie',
  openEmsFactoryId: 'Sonnen.BatteryInverter',
});
reg({
  id: 'lg-resu-16h',
  manufacturer: 'LG Energy',
  model: 'RESU 16H Prime',
  category: 'battery',
  protocols: ['modbus-tcp'],
  capacityKWh: 16.0,
  ratedPowerW: 7000,
  evccTemplate: 'lg-resu',
});
reg({
  id: 'huawei-luna-2000',
  manufacturer: 'Huawei',
  model: 'LUNA2000 5-30 kWh',
  category: 'battery',
  protocols: ['modbus-tcp', 'huawei-fusionsolar'],
  capacityKWh: 30,
  ratedPowerW: 5000,
  evccTemplate: 'huawei-luna',
});
reg({
  id: 'e3dc-s10-hauskraftwerk',
  manufacturer: 'E3/DC',
  model: 'S10 E / S10 X Hauskraftwerk',
  category: 'battery',
  protocols: ['modbus-tcp'],
  capacityKWh: 39,
  ratedPowerW: 12000,
  evccTemplate: 'e3dc',
  openEmsFactoryId: 'E3DC.BatteryInverter',
});
reg({
  id: 'senec-home-v3-hybrid',
  manufacturer: 'SENEC',
  model: 'Home V3 Hybrid / Duo',
  category: 'battery',
  protocols: ['http-rest'],
  capacityKWh: 10.0,
  ratedPowerW: 3000,
  evccTemplate: 'senec',
});
reg({
  id: 'alpha-ess-smile-5',
  manufacturer: 'Alpha ESS',
  model: 'SMILE5 / SMILE-Hi5',
  category: 'battery',
  protocols: ['modbus-tcp', 'http-rest'],
  capacityKWh: 10.1,
  ratedPowerW: 5000,
  evccTemplate: 'alpha-ess',
});
reg({
  id: 'varta-pulse-neo',
  manufacturer: 'VARTA',
  model: 'pulse neo 3 / 6',
  category: 'battery',
  protocols: ['modbus-tcp'],
  capacityKWh: 6.5,
  ratedPowerW: 2500,
  evccTemplate: 'varta',
});
reg({
  id: 'fenecon-fems',
  manufacturer: 'FENECON',
  model: 'FEMS Home / Commercial',
  category: 'battery',
  protocols: ['modbus-tcp', 'websocket'],
  capacityKWh: 44,
  ratedPowerW: 9200,
  evccTemplate: 'fenecon',
  openEmsFactoryId: 'FENECON.BatteryInverter',
});

// ─── Heat Pumps (SG Ready) ──────────────────────────────────────────

reg({
  id: 'viessmann-vitocal',
  manufacturer: 'Viessmann',
  model: 'Vitocal 250-A/S',
  category: 'heatpump',
  protocols: ['modbus-tcp', 'eebus', 'http-rest'],
  ratedPowerW: 15000,
  sgReady: true,
  evccTemplate: 'viessmann',
});
reg({
  id: 'vaillant-arotherm-plus',
  manufacturer: 'Vaillant',
  model: 'aroTHERM plus 7-15 kW',
  category: 'heatpump',
  protocols: ['modbus-tcp', 'eebus'],
  ratedPowerW: 15000,
  sgReady: true,
  evccTemplate: 'vaillant',
});
reg({
  id: 'stiebel-eltron-wpf',
  manufacturer: 'Stiebel Eltron',
  model: 'WPF / WPL 09-25',
  category: 'heatpump',
  protocols: ['modbus-tcp', 'eebus', 'knx'],
  ratedPowerW: 15000,
  sgReady: true,
  evccTemplate: 'stiebel-eltron',
});
reg({
  id: 'bosch-compress-7400i',
  manufacturer: 'Bosch',
  model: 'Compress 7400i AW',
  category: 'heatpump',
  protocols: ['modbus-tcp', 'eebus'],
  ratedPowerW: 12000,
  sgReady: true,
  evccTemplate: 'bosch-compress',
});
reg({
  id: 'daikin-altherma-3',
  manufacturer: 'Daikin',
  model: 'Altherma 3 H HT',
  category: 'heatpump',
  protocols: ['modbus-tcp', 'http-rest'],
  ratedPowerW: 16000,
  sgReady: true,
  evccTemplate: 'daikin',
});
reg({
  id: 'nibe-f2120',
  manufacturer: 'NIBE',
  model: 'F2120 / S1255',
  category: 'heatpump',
  protocols: ['modbus-tcp'],
  ratedPowerW: 17000,
  sgReady: true,
  evccTemplate: 'nibe',
});
reg({
  id: 'wolf-cha-monoblock',
  manufacturer: 'Wolf',
  model: 'CHA Monoblock 7-16 kW',
  category: 'heatpump',
  protocols: ['modbus-tcp', 'knx'],
  ratedPowerW: 16000,
  sgReady: true,
  evccTemplate: 'wolf',
});
reg({
  id: 'lambda-eu13l',
  manufacturer: 'Lambda',
  model: 'EU13L Wärmepumpe',
  category: 'heatpump',
  protocols: ['modbus-tcp'],
  ratedPowerW: 13000,
  sgReady: true,
  evccTemplate: 'lambda',
});
reg({
  id: 'idm-terra-ml',
  manufacturer: 'iDM',
  model: 'TERRA ML 6-17',
  category: 'heatpump',
  protocols: ['modbus-tcp'],
  ratedPowerW: 17000,
  sgReady: true,
  evccTemplate: 'idm',
});
reg({
  id: 'lg-therma-v-r290',
  manufacturer: 'LG',
  model: 'Therma V R290 Monobloc',
  category: 'heatpump',
  protocols: ['modbus-tcp'],
  ratedPowerW: 16000,
  sgReady: true,
  evccTemplate: 'lg-therma-v',
});
reg({
  id: 'panasonic-aquarea-j',
  manufacturer: 'Panasonic',
  model: 'Aquarea J Generation',
  category: 'heatpump',
  protocols: ['modbus-tcp', 'http-rest'],
  ratedPowerW: 12000,
  sgReady: true,
  evccTemplate: 'panasonic-aquarea',
});
reg({
  id: 'hoval-belaria-pro',
  manufacturer: 'Hoval',
  model: 'Belaria pro',
  category: 'heatpump',
  protocols: ['modbus-tcp'],
  ratedPowerW: 14000,
  sgReady: true,
});
reg({
  id: 'tecalor-tth-split',
  manufacturer: 'Tecalor',
  model: 'TTH Split 5-17',
  category: 'heatpump',
  protocols: ['modbus-tcp', 'eebus'],
  ratedPowerW: 17000,
  sgReady: true,
});
reg({
  id: 'waterkotte-ecoplus',
  manufacturer: 'Waterkotte',
  model: 'EcoTouch Ai1 EcoPlus',
  category: 'heatpump',
  protocols: ['modbus-tcp'],
  ratedPowerW: 18000,
  sgReady: true,
});

// ─── Additional Inverters (expanded coverage) ───────────────────────

reg({
  id: 'solax-x3-hybrid',
  manufacturer: 'SolaX',
  model: 'X3-Hybrid G4 5-15kW',
  category: 'inverter',
  protocols: ['modbus-tcp', 'http-rest'],
  ratedPowerW: 15000,
  phases: 3,
  evccTemplate: 'solax',
});
reg({
  id: 'solis-rah-hybrid',
  manufacturer: 'Solis',
  model: 'RAI-3K-48ES-5G Hybrid',
  category: 'inverter',
  protocols: ['modbus-tcp'],
  ratedPowerW: 6000,
  phases: 1,
  evccTemplate: 'solis',
});
reg({
  id: 'azzurro-zcs-3ph',
  manufacturer: 'Azzurro (ZCS)',
  model: 'HYD 5000-20000-ZSS-HP',
  category: 'inverter',
  protocols: ['modbus-tcp'],
  ratedPowerW: 20000,
  phases: 3,
  evccTemplate: 'azzurro',
});
reg({
  id: 'fronius-wattpilot',
  manufacturer: 'Fronius',
  model: 'Wattpilot Home 11 J / Go',
  category: 'wallbox',
  protocols: ['http-rest', 'mqtt', 'modbus-tcp'],
  ratedPowerW: 22000,
  phases: 3,
  maxCurrentA: 32,
  evccTemplate: 'fronius-wattpilot',
});
reg({
  id: 'juice-charger-me3',
  manufacturer: 'juice technology',
  model: 'JUICE CHARGER me3',
  category: 'wallbox',
  protocols: ['modbus-tcp', 'ocpp-16'],
  ratedPowerW: 22000,
  phases: 3,
  maxCurrentA: 32,
  evccTemplate: 'juice',
});
reg({
  id: 'warp-charger-smart',
  manufacturer: 'Tinkerforge',
  model: 'WARP Charger Smart / Pro',
  category: 'wallbox',
  protocols: ['http-rest', 'mqtt'],
  ratedPowerW: 22000,
  phases: 3,
  maxCurrentA: 32,
  evccTemplate: 'warp',
});
reg({
  id: 'em2go-home',
  manufacturer: 'em2go',
  model: 'Home Smart Charger',
  category: 'wallbox',
  protocols: ['modbus-tcp', 'ocpp-16'],
  ratedPowerW: 22000,
  phases: 3,
  maxCurrentA: 32,
});
reg({
  id: 'zaptec-pro',
  manufacturer: 'Zaptec',
  model: 'Zaptec Pro',
  category: 'wallbox',
  protocols: ['ocpp-16', 'http-rest'],
  ratedPowerW: 22000,
  phases: 3,
  maxCurrentA: 32,
  evccTemplate: 'zaptec',
});
reg({
  id: 'evbox-elvi',
  manufacturer: 'EVBox',
  model: 'Elvi V2',
  category: 'wallbox',
  protocols: ['ocpp-16', 'ocpp-20'],
  ratedPowerW: 22000,
  phases: 3,
  maxCurrentA: 32,
  evccTemplate: 'evbox',
});
reg({
  id: 'wallbox-pulsar-plus',
  manufacturer: 'Wallbox',
  model: 'Pulsar Plus / Max',
  category: 'wallbox',
  protocols: ['http-rest', 'ocpp-16'],
  ratedPowerW: 22000,
  phases: 3,
  maxCurrentA: 32,
  evccTemplate: 'wallbox-pulsar',
});
reg({
  id: 'entratek-power-dot',
  manufacturer: 'Entratek',
  model: 'Power Dot Pro',
  category: 'wallbox',
  protocols: ['modbus-tcp', 'ocpp-16'],
  ratedPowerW: 22000,
  phases: 3,
  maxCurrentA: 32,
});

// ─── Additional Meters ──────────────────────────────────────────────

reg({
  id: 'powerfox-poweropti',
  manufacturer: 'powerfox',
  model: 'poweropti / poweropti+',
  category: 'meter',
  protocols: ['http-rest'],
  phases: 3,
  evccTemplate: 'powerfox',
});
reg({
  id: 'hager-ecn300',
  manufacturer: 'Hager',
  model: 'ECN300D / ECR380D',
  category: 'meter',
  protocols: ['modbus-tcp'],
  phases: 3,
});
reg({
  id: 'emg-vzlogger',
  manufacturer: 'Volkszähler',
  model: 'vzlogger + IR Reader',
  category: 'meter',
  protocols: ['http-rest'],
  phases: 3,
  evccTemplate: 'vzlogger',
});
reg({
  id: 'orno-we-517',
  manufacturer: 'ORNO',
  model: 'WE-517 / WE-516 Energy Meter',
  category: 'meter',
  protocols: ['modbus-rtu'],
  phases: 3,
});

// ─── Additional Battery Storage ─────────────────────────────────────

reg({
  id: 'solarwatt-battery-flex',
  manufacturer: 'SOLARWATT',
  model: 'Battery flex 4.8 - 19.2',
  category: 'battery',
  protocols: ['http-rest', 'modbus-tcp'],
  capacityKWh: 19.2,
  ratedPowerW: 3680,
  evccTemplate: 'solarwatt',
});
reg({
  id: 'enercharge-container',
  manufacturer: 'EnerCharge',
  model: 'Container Storage',
  category: 'battery',
  protocols: ['modbus-tcp'],
  capacityKWh: 100,
  ratedPowerW: 50000,
});
reg({
  id: 'bluetti-ep600',
  manufacturer: 'Bluetti',
  model: 'EP600 + B500',
  category: 'battery',
  protocols: ['http-rest', 'mqtt'],
  capacityKWh: 19.8,
  ratedPowerW: 6000,
});
reg({
  id: 'ecoflow-delta-pro-ultra',
  manufacturer: 'EcoFlow',
  model: 'DELTA Pro Ultra',
  category: 'battery',
  protocols: ['mqtt', 'http-rest'],
  capacityKWh: 6,
  ratedPowerW: 7200,
});
reg({
  id: 'intilion-scalebloc',
  manufacturer: 'INTILION',
  model: 'scalebloc 75-100',
  category: 'battery',
  protocols: ['modbus-tcp'],
  capacityKWh: 100,
  ratedPowerW: 50000,
  openEmsFactoryId: 'INTILION.BatteryInverter',
});

// ─── Bidirectional EVSE / V2X ───────────────────────────────────────

reg({
  id: 'sonnen-bidirectional',
  manufacturer: 'sonnen',
  model: 'sonnenCharger Bi (V2H)',
  category: 'wallbox',
  protocols: ['ocpp-21', 'eebus'],
  ratedPowerW: 22000,
  phases: 3,
  maxCurrentA: 32,
  v2x: true,
});
reg({
  id: 'kostal-enector-v2x',
  manufacturer: 'Kostal',
  model: 'ENECTOR V2X',
  category: 'wallbox',
  protocols: ['ocpp-21', 'eebus', 'modbus-tcp'],
  ratedPowerW: 22000,
  phases: 3,
  maxCurrentA: 32,
  v2x: true,
  evccTemplate: 'kostal-enector',
});
reg({
  id: 'dcbel-r16',
  manufacturer: 'dcbel',
  model: 'r16 Bidirectional EV Charger',
  category: 'wallbox',
  protocols: ['http-rest', 'ocpp-21'],
  ratedPowerW: 15200,
  phases: 1,
  maxCurrentA: 80,
  v2x: true,
});

// ─── Query Functions ─────────────────────────────────────────────────

/** Get all registered devices */
export function getAllDevices(): DeviceDefinition[] {
  return Array.from(deviceRegistry.values());
}

/** Get devices by category */
export function getDevicesByCategory(category: DeviceCategory): DeviceDefinition[] {
  return getAllDevices().filter((d) => d.category === category);
}

/** Get devices by manufacturer */
export function getDevicesByManufacturer(manufacturer: string): DeviceDefinition[] {
  const lower = manufacturer.toLowerCase();
  return getAllDevices().filter((d) => d.manufacturer.toLowerCase().includes(lower));
}

/** Get devices that support a specific protocol */
export function getDevicesByProtocol(protocol: DeviceProtocol): DeviceDefinition[] {
  return getAllDevices().filter((d) => d.protocols.includes(protocol));
}

/** Find a device by ID */
export function getDeviceById(id: string): DeviceDefinition | undefined {
  return deviceRegistry.get(id);
}

/** Search devices by keyword (manufacturer, model, description) */
export function searchDevices(query: string): DeviceDefinition[] {
  const lower = query.toLowerCase();
  return getAllDevices().filter(
    (d) =>
      d.manufacturer.toLowerCase().includes(lower) ||
      d.model.toLowerCase().includes(lower) ||
      d.id.includes(lower) ||
      d.description?.toLowerCase().includes(lower),
  );
}

/** Get all unique manufacturers */
export function getManufacturers(): string[] {
  return [...new Set(getAllDevices().map((d) => d.manufacturer))].sort();
}

/** Get device count by category */
export function getDeviceStats(): Record<DeviceCategory, number> {
  const stats: Record<DeviceCategory, number> = {
    inverter: 0,
    wallbox: 0,
    meter: 0,
    battery: 0,
    heatpump: 0,
  };
  for (const d of getAllDevices()) {
    stats[d.category]++;
  }
  return stats;
}

/** Get devices compatible with evcc */
export function getEvccCompatibleDevices(): DeviceDefinition[] {
  return getAllDevices().filter((d) => d.evccTemplate);
}

/** Get devices compatible with OpenEMS */
export function getOpenEmsCompatibleDevices(): DeviceDefinition[] {
  return getAllDevices().filter((d) => d.openEmsFactoryId);
}

/** Total registered device count */
export function getDeviceCount(): number {
  return deviceRegistry.size;
}
