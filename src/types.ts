import type { ThemeName } from './design-tokens';

export interface EnergyData {
  gridPower: number;
  pvPower: number;
  batteryPower: number;
  houseLoad: number;
  batterySoC: number;
  heatPumpPower: number;
  evPower: number;
  gridVoltage: number;
  batteryVoltage: number;
  pvYieldToday: number;
  priceCurrent: number;
}

export type TariffProvider = 'tibber' | 'awattar' | 'none';

export type LocaleCode = 'de' | 'en';

export type CommandType =
  | 'SET_EV_POWER'
  | 'SET_HEAT_PUMP_POWER'
  | 'SET_BATTERY_POWER'
  | 'TOGGLE_KNX_LIGHTS'
  | 'TOGGLE_KNX_WINDOW'
  | 'SET_ROOM_TEMPERATURE';

export interface EvState {
  mode: string;
  power: number;
  message: string;
}

export type GatewayType = 'cerbo-gx' | 'cerbo-gx-mk2' | 'raspberry-pi';

export interface StoredSettings {
  gatewayType: GatewayType;
  victronIp: string;
  knxIp: string;
  wsPort: number;
  refreshRateMs: number;
  tariffProvider: TariffProvider;
  chargeThreshold: number;
  maxGridImportKw: number;
  mtls: boolean;
  telemetryDisabled: boolean;
  twoFactor: boolean;
  influxUrl: string;
  influxToken: string;
  historyDays: number;
}

export interface FloorplanState {
  lightsOn: boolean;
  windowOpen: boolean;
  roomTemperature: number;
}

export interface OptimizerRecommendation {
  id: string;
  severity: 'positive' | 'warning' | 'critical' | 'neutral';
  titleKey: string;
  descriptionKey: string;
  value: string;
}

export interface ThemeOption {
  value: ThemeName;
  label: string;
}

export interface HpState {
  mode: string;
  power: number;
  message: string;
}
