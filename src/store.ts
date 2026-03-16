import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { LocaleCode, EnergyData, FloorplanState, StoredSettings } from './types';
import { SYSTEM_PRESETS } from './types';
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
  onboardingCompleted: boolean;
  setEnergyData: (data: Partial<EnergyData>) => void;
  setConnected: (status: boolean) => void;
  setLocale: (locale: LocaleCode) => void;
  setTheme: (theme: ThemeName) => void;
  setThemePreference: (preference: ThemePreference) => void;
  updateFloorplan: (data: Partial<FloorplanState>) => void;
  updateSettings: (data: Partial<StoredSettings>) => void;
  setOnboardingCompleted: (completed: boolean) => void;
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

export const defaultSettings: StoredSettings = {
  gatewayType: 'cerbo-gx',
  systemConfig: { ...SYSTEM_PRESETS['victron-3mp2-standard']! },
  victronIp: '192.168.1.100',
  knxIp: '192.168.1.101',
  wsPort: 1880,
  refreshRateMs: 2000,
  tariffProvider: 'tibber',
  tariffRegion: 'DE',
  dynamicGridFees: true,
  gridOperatorName: '',
  chargeThreshold: 0.15,
  maxGridImportKw: 4.2,
  mtls: true,
  telemetryDisabled: true,
  twoFactor: true,
  influxUrl: 'http://192.168.1.102:8086',
  influxToken: '••••••••••••••••',
  historyDays: 30,
  location: { lat: 53.5511, lon: 9.9937 },
  gridPriceAvg: 0.25,
  animations: true,
  compactMode: false,
  glowEffects: true,
  units: 'metric',
  dateFormat: 'dd.mm.yyyy',
  currency: 'eur',
  mqttAutoDiscovery: true,
  fontScale: 1.0,
  reducedMotion: false,
  highContrast: false,
  pushNotifications: true,
  priceAlerts: true,
  batteryAlerts: true,
  gridAlerts: false,
  updateNotifications: true,
  batteryAlertThreshold: 15,
  priceAlertThreshold: 0.1,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  feedInTariff: 0.082,
  gridOperator: '',
  monthlyBudget: 80,
  dashboardRefreshSec: 5,
  sidebarPosition: 'left',
  debugMode: false,
  experimentalFeatures: false,
  performanceMode: false,
  autoBackup: false,
  keyboardShortcuts: true,
};

type PersistedKey =
  | 'locale'
  | 'theme'
  | 'themePreference'
  | 'themeTransitionKey'
  | 'floorplan'
  | 'settings'
  | 'onboardingCompleted';

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      energyData: defaultEnergyData,
      connected: false,
      lastUpdated: null as number | null,
      locale: 'de',
      theme: 'ocean-dark',
      themePreference: 'ocean-dark',
      themeTransitionKey: 0,
      floorplan: {
        lightsOn: true,
        windowOpen: false,
        roomTemperature: 21.5,
      },
      settings: defaultSettings,
      onboardingCompleted: false,
      setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
      setEnergyData: (data) =>
        set((state) => {
          // Skip update if all incoming values match current state
          const cur = state.energyData;
          const keys = Object.keys(data) as (keyof EnergyData)[];
          if (keys.length > 0 && keys.every((k) => cur[k] === data[k])) return state;
          return {
            energyData: { ...cur, ...data },
            lastUpdated: Date.now(),
          };
        }),
      setConnected: (status) =>
        set((state) => (state.connected === status ? state : { connected: status })),
      setLocale: (locale) => set({ locale }),
      setTheme: (theme) =>
        set((state) => ({ theme, themeTransitionKey: state.themeTransitionKey + 1 })),
      setThemePreference: (preference) =>
        set((state) => ({
          themePreference: preference,
          themeTransitionKey: state.themeTransitionKey + 1,
        })),
      updateFloorplan: (data) =>
        set((state) => {
          const cur = state.floorplan;
          const keys = Object.keys(data) as (keyof FloorplanState)[];
          if (keys.length > 0 && keys.every((k) => cur[k] === data[k])) return state;
          return { floorplan: { ...cur, ...data } };
        }),
      updateSettings: (data) => {
        const cur = get().settings;
        const keys = Object.keys(data) as (keyof StoredSettings)[];
        if (keys.length > 0 && keys.every((k) => cur[k] === data[k])) return;
        const nextSettings = { ...cur, ...data };
        set({ settings: nextSettings });
        void persistSettings(nextSettings);
      },
    }),
    {
      name: 'nexus-hems-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state): Pick<AppState, PersistedKey> => ({
        locale: state.locale,
        theme: state.theme,
        themePreference: state.themePreference,
        themeTransitionKey: state.themeTransitionKey,
        floorplan: state.floorplan,
        settings: state.settings,
        onboardingCompleted: state.onboardingCompleted,
      }),
      // Deep-merge persisted settings with defaults so newly added keys
      // are always present even when the user has stale localStorage data.
      merge: (persisted, current) => {
        const p = persisted as Partial<AppState> | undefined;
        if (!p) return current;
        return {
          ...current,
          ...p,
          settings: { ...defaultSettings, ...(p.settings ?? {}) },
          floorplan: { ...current.floorplan, ...(p.floorplan ?? {}) },
        };
      },
    },
  ),
);

// ─── useShallow-wrapped store access ─────────────────────────────────

/**
 * useAppStoreShallow — Shallow-comparing wrapper for useAppStore.
 *
 * Use when selecting multiple values into an object to prevent
 * unnecessary re-renders (shallow compare instead of referential).
 *
 * Example:
 *   const { theme, locale } = useAppStoreShallow((s) => ({ theme: s.theme, locale: s.locale }));
 */
export function useAppStoreShallow<T>(selector: (state: AppState) => T): T {
  return useAppStore(useShallow(selector));
}

// Expose store for E2E / Playwright tests in dev mode
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__NEXUS_STORE__ = useAppStore;
}
