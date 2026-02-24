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

export type CommandType = 'SET_EV_POWER' | 'SET_HEAT_PUMP_POWER' | 'SET_BATTERY_POWER';

export interface EvState {
  mode: string;
  power: number;
  message: string;
}

export interface HpState {
  mode: string;
  power: number;
  message: string;
}
