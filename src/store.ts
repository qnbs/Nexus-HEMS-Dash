import { create } from 'zustand';
import { EnergyData } from './types';

interface AppState {
  energyData: EnergyData;
  connected: boolean;
  setEnergyData: (data: Partial<EnergyData>) => void;
  setConnected: (status: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  energyData: {
    gridPower: 0,
    pvPower: 0,
    batteryPower: 0,
    houseLoad: 0,
    batterySoC: 0,
    heatPumpPower: 0,
    evPower: 0,
    gridVoltage: 0,
    batteryVoltage: 0,
    pvYieldToday: 0,
    priceCurrent: 0,
  },
  connected: false,
  setEnergyData: (data) => set((state) => ({ energyData: { ...state.energyData, ...data } })),
  setConnected: (status) => set({ connected: status }),
}));
