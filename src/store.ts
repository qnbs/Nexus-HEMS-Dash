import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { LocaleCode, EnergyData, FloorplanState, StoredSettings } from './types';
import type { ThemeName } from './design-tokens';
import type { ThemePreference } from './lib/theme';
import { persistSettings } from './lib/db';

interface AppState {
  energyData: EnergyData;
  connected: boolean;
  lastUpdated: number | null;
  locale: LocaleCode;
  theme: ThemeName;
  themePreference: ThemePreference;
  themeTransitionKey: number;
  floorplan: FloorplanState;
  settings: StoredSettings;
  setEnergyData: (data: Partial<EnergyData>) => void;
  setConnected: (status: boolean) => void;
  setLocale: (locale: LocaleCode) => void;
  setTheme: (theme: ThemeName) => void;
  setThemePreference: (preference: ThemePreference) => void;
  updateFloorplan: (data: Partial<FloorplanState>) => void;
  updateSettings: (data: Partial<StoredSettings>) => void;
}

const defaultEnergyData: EnergyData = {
  gridPower: 0,
  pvPower: 0,
  batteryPower: 0,
  houseLoad: 0,
  batterySoC: 0,
  heatPumpPower: 0,
  evPower: 0,
  gridVoltage: 230,
  batteryVoltage: 51.2,
  pvYieldToday: 0,
  priceCurrent: 0.18,
};

const defaultSettings: StoredSettings = {
  gatewayType: 'cerbo-gx',
  victronIp: '192.168.1.100',
  knxIp: '192.168.1.101',
  wsPort: 1880,
  refreshRateMs: 2000,
  tariffProvider: 'tibber',
  chargeThreshold: 0.15,
  maxGridImportKw: 4.2,
  mtls: true,
  telemetryDisabled: true,
  twoFactor: true,
  influxUrl: 'http://192.168.1.102:8086',
  influxToken: '••••••••••••••••',
  historyDays: 30,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      energyData: defaultEnergyData,
      connected: false,
      lastUpdated: null,
      locale: 'de',
      theme: 'energy-dark',
      themePreference: 'energy-dark',
      themeTransitionKey: 0,
      floorplan: {
        lightsOn: true,
        windowOpen: false,
        roomTemperature: 21.5,
      },
      settings: defaultSettings,
      setEnergyData: (data) =>
        set((state) => ({
          energyData: { ...state.energyData, ...data },
          lastUpdated: Date.now(),
        })),
      setConnected: (status) => set({ connected: status }),
      setLocale: (locale) => set({ locale }),
      setTheme: (theme) =>
        set((state) => ({ theme, themeTransitionKey: state.themeTransitionKey + 1 })),
      setThemePreference: (preference) =>
        set((state) => ({
          themePreference: preference,
          themeTransitionKey: state.themeTransitionKey + 1,
        })),
      updateFloorplan: (data) => set((state) => ({ floorplan: { ...state.floorplan, ...data } })),
      updateSettings: (data) => {
        const nextSettings = { ...get().settings, ...data };
        set({ settings: nextSettings });
        void persistSettings(nextSettings);
      },
    }),
    {
      name: 'nexus-hems-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        locale: state.locale,
        theme: state.theme,
        themePreference: state.themePreference,
        themeTransitionKey: state.themeTransitionKey,
        floorplan: state.floorplan,
        settings: state.settings,
      }),
    },
  ),
);
