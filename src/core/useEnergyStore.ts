/**
 * useEnergyStore — Central adapter aggregation store
 *
 * This Zustand store manages adapter lifecycle, merges data from all active
 * adapters into a single UnifiedEnergyModel, and bridges backwards to the
 * existing useAppStore for 100% compatibility with current components.
 *
 * Performance: useEnergyStore() uses useShallow by default so components
 * only re-render when their selected slice actually changes (shallow compare).
 *
 * Usage in pages:
 *   const { pv, battery } = useEnergyStore((s) => ({ pv: s.unified.pv, battery: s.unified.battery }));
 *
 * Page-level adapter selection:
 *   const evCharger = useEnergyStore((s) => s.unified.evCharger);
 */

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useEffect } from 'react';
import { useAppStore } from '../store';
import { persistSnapshot } from '../lib/db';

import type {
  EnergyAdapter,
  AdapterStatus,
  AdapterCommand,
  UnifiedEnergyModel,
  AdapterConnectionConfig,
} from './adapters/EnergyAdapter';

import { BaseAdapter } from './adapters/BaseAdapter';
import type { CircuitState } from './circuit-breaker';
import { validateCommand } from './command-safety';
import { registerBuiltinAdapters, createRegisteredAdapter } from './adapters/adapter-registry';

// ─── Adapter registry ────────────────────────────────────────────────

/** Built-in adapter identifiers */
export type BuiltinAdapterId = 'victron-mqtt' | 'modbus-sunspec' | 'knx' | 'ocpp-21' | 'eebus';

/** Adapter ID — built-in or dynamically registered contrib/npm adapter */
export type AdapterId = BuiltinAdapterId | (string & {});

export interface AdapterEntry {
  adapter: EnergyAdapter;
  enabled: boolean;
  status: AdapterStatus;
  error?: string;
  circuitState: CircuitState;
}

export interface EnergyStoreState {
  /** Merged model from all adapters */
  unified: UnifiedEnergyModel;
  /** Per-adapter status */
  adapters: Record<AdapterId, AdapterEntry>;
  /** Whether at least one adapter is connected */
  anyConnected: boolean;
  /** Timestamp of last data update */
  lastUpdated: number | null;

  // Actions
  mergeData: (adapterId: string, data: Partial<UnifiedEnergyModel>) => void;
  setAdapterStatus: (adapterId: AdapterId, status: AdapterStatus, error?: string) => void;
  enableAdapter: (adapterId: AdapterId, enabled: boolean) => void;
  /** Add a dynamically loaded contrib/npm adapter to the store */
  addContribAdapter: (id: string, config?: Partial<AdapterConnectionConfig>) => boolean;
  /** Remove a contrib adapter from the store */
  removeContribAdapter: (id: string) => boolean;
}

// ─── Default empty model ─────────────────────────────────────────────

const emptyModel: UnifiedEnergyModel = {
  timestamp: 0,
  pv: { totalPowerW: 0, yieldTodayKWh: 0 },
  battery: { powerW: 0, socPercent: 0, voltageV: 51.2, currentA: 0 },
  grid: { powerW: 0, voltageV: 230 },
  load: { totalPowerW: 0, heatPumpPowerW: 0, evPowerW: 0, otherPowerW: 0 },
};

// ─── Adapter factory ─────────────────────────────────────────────────

// Ensure built-in adapters are registered in the global registry
registerBuiltinAdapters();

function createAdapterInstance(
  id: AdapterId,
  config?: Partial<AdapterConnectionConfig>,
): EnergyAdapter {
  // Use the global adapter registry (built-in + contrib/npm adapters)
  const adapter = createRegisteredAdapter(id, config);
  if (adapter) return adapter;

  throw new Error(
    `[useEnergyStore] Unknown adapter id: "${id}". Register it via registerAdapter() first.`,
  );
}

function createDefaultAdapters(): Record<AdapterId, AdapterEntry> {
  return {
    'victron-mqtt': {
      adapter: createAdapterInstance('victron-mqtt'),
      enabled: true, // Primary adapter — always enabled by default
      status: 'disconnected',
      circuitState: 'closed',
    },
    'modbus-sunspec': {
      adapter: createAdapterInstance('modbus-sunspec'),
      enabled: false,
      status: 'disconnected',
      circuitState: 'closed',
    },
    knx: {
      adapter: createAdapterInstance('knx'),
      enabled: false,
      status: 'disconnected',
      circuitState: 'closed',
    },
    'ocpp-21': {
      adapter: createAdapterInstance('ocpp-21'),
      enabled: false,
      status: 'disconnected',
      circuitState: 'closed',
    },
    eebus: {
      adapter: createAdapterInstance('eebus'),
      enabled: false,
      status: 'disconnected',
      circuitState: 'closed',
    },
  };
}

// ─── Store ───────────────────────────────────────────────────────────

export const useEnergyStoreBase = create<EnergyStoreState>()((set) => ({
  unified: { ...emptyModel },
  adapters: createDefaultAdapters(),
  anyConnected: false,
  lastUpdated: null,

  mergeData: (_adapterId, data) => {
    set((state) => {
      const merged = deepMergeModel(state.unified, data);
      // Skip state update if nothing actually changed (referential stability)
      if (merged === state.unified) return state;
      return { unified: merged, lastUpdated: Date.now() };
    });
  },

  setAdapterStatus: (adapterId, status, error) => {
    set((state) => {
      const entry = state.adapters[adapterId];
      if (!entry) return state;
      // Skip update if status hasn't changed
      if (entry.status === status && entry.error === error) return state;

      const newAdapters = {
        ...state.adapters,
        [adapterId]: { ...entry, status, error },
      };

      const anyConnected = Object.values(newAdapters).some(
        (a) => a.enabled && a.status === 'connected',
      );

      return { adapters: newAdapters, anyConnected };
    });
  },

  enableAdapter: (adapterId, enabled) => {
    set((state) => {
      const entry = state.adapters[adapterId];
      if (!entry) return state;
      return {
        adapters: {
          ...state.adapters,
          [adapterId]: { ...entry, enabled },
        },
      };
    });
  },

  addContribAdapter: (id, config) => {
    const state = useEnergyStoreBase.getState();
    if (state.adapters[id]) return false; // Already exists

    try {
      const adapter = createAdapterInstance(id, config);
      set((s) => ({
        adapters: {
          ...s.adapters,
          [id]: {
            adapter,
            enabled: false,
            status: 'disconnected' as AdapterStatus,
            circuitState: 'closed' as CircuitState,
          },
        },
      }));
      return true;
    } catch {
      return false;
    }
  },

  removeContribAdapter: (id) => {
    const BUILTIN_IDS: BuiltinAdapterId[] = [
      'victron-mqtt',
      'modbus-sunspec',
      'knx',
      'ocpp-21',
      'eebus',
    ];
    if ((BUILTIN_IDS as string[]).includes(id)) return false;

    const state = useEnergyStoreBase.getState();
    const entry = state.adapters[id];
    if (!entry) return false;

    entry.adapter.destroy();
    set((s) => {
      const newAdapters = { ...s.adapters };
      delete newAdapters[id];
      return { adapters: newAdapters };
    });
    return true;
  },
}));

// ─── Deep merge helper (referentially stable) ───────────────────────

/** Shallow-merge two objects, returning the original if nothing changed. */
function stableMerge<T extends object>(base: T, partial: Partial<T>): T {
  const keys = Object.keys(partial) as (keyof T)[];
  if (keys.every((k) => base[k] === partial[k])) return base;
  return { ...base, ...partial };
}

/**
 * Deep-merge adapter data into the unified model.
 * Returns the original `base` reference (===) if no values actually changed,
 * which lets Zustand's shallow selectors skip re-renders.
 */
function deepMergeModel(
  base: UnifiedEnergyModel,
  partial: Partial<UnifiedEnergyModel>,
): UnifiedEnergyModel {
  const pv = partial.pv ? stableMerge(base.pv, partial.pv) : base.pv;
  const battery = partial.battery ? stableMerge(base.battery, partial.battery) : base.battery;
  const grid = partial.grid ? stableMerge(base.grid, partial.grid) : base.grid;
  const load = partial.load ? stableMerge(base.load, partial.load) : base.load;
  const timestamp = partial.timestamp ?? base.timestamp;
  const evCharger = partial.evCharger ?? base.evCharger;
  const knx = partial.knx ?? base.knx;
  const tariff = partial.tariff ?? base.tariff;

  // If every sub-object is the same reference, skip the update
  if (
    pv === base.pv &&
    battery === base.battery &&
    grid === base.grid &&
    load === base.load &&
    timestamp === base.timestamp &&
    evCharger === base.evCharger &&
    knx === base.knx &&
    tariff === base.tariff
  ) {
    return base;
  }

  return { timestamp, pv, battery, grid, load, evCharger, knx, tariff };
}

// ─── Standalone command dispatcher ───────────────────────────────────

/**
 * sendAdapterCommand — Sends a command to all connected adapters.
 * BaseAdapter.sendCommand() handles validation, circuit breaker, audit trail.
 */
export function sendAdapterCommand(command: AdapterCommand): void {
  // Quick pre-check (adapter validates again independently — defense in depth)
  const validation = validateCommand(command);
  if (!validation.valid) {
    if (import.meta.env.DEV) {
      console.warn(`[sendAdapterCommand] Rejected: ${validation.error}`);
    }
    return;
  }

  const entries = Object.entries(useEnergyStoreBase.getState().adapters) as [
    AdapterId,
    AdapterEntry,
  ][];
  for (const [, entry] of entries) {
    if (entry.enabled && entry.status === 'connected') {
      // BaseAdapter.sendCommand() handles CB + validation + confirm + audit internally
      void entry.adapter.sendCommand(command);
    }
  }
}

// ─── Bridge hook: syncs adapters ↔ old store ─────────────────────────

/**
 * useAdapterBridge — React hook that:
 * 1. Connects enabled adapters on mount
 * 2. Merges adapter data into useEnergyStore
 * 3. Bridges data to useAppStore (backwards compat)
 * 4. Persists snapshots to Dexie.js
 *
 * Mount this ONCE in App.tsx (replaces the old useWebSocket hook).
 * Uses getState() for actions to avoid full-store subscription.
 */
export function useAdapterBridge() {
  const setEnergyData = useAppStore((s) => s.setEnergyData);
  const setConnected = useAppStore((s) => s.setConnected);

  useEffect(() => {
    const { adapters, mergeData, setAdapterStatus } = useEnergyStoreBase.getState();
    const entries = Object.entries(adapters) as [AdapterId, AdapterEntry][];

    for (const [id, entry] of entries) {
      if (!entry.enabled) continue;

      const baseAdapter = entry.adapter as BaseAdapter;

      // Wire circuit breaker state changes into the store
      baseAdapter.circuitBreaker.onStateChange((circuitState) => {
        useEnergyStoreBase.setState((state) => {
          const existing = state.adapters[id];
          if (!existing) return state;
          return {
            adapters: {
              ...state.adapters,
              [id]: { ...existing, circuitState },
            },
          };
        });
      });

      // Subscribe to data
      entry.adapter.onData((data) => {
        mergeData(id, data);

        // Bridge to legacy store
        bridgeToAppStore(data, setEnergyData);

        // Persist to Dexie.js (single write — no duplicate)
        if (data.timestamp) {
          void persistSnapshot(unifiedToLegacy(useEnergyStoreBase.getState().unified));
        }
      });

      // Subscribe to status
      entry.adapter.onStatus((status, error) => {
        setAdapterStatus(id, status, error);

        // Bridge connection status (connected if any adapter is connected)
        const currentAdapters = useEnergyStoreBase.getState().adapters;
        const anyConn = Object.values(currentAdapters).some(
          (a) => a.enabled && a.status === 'connected',
        );
        setConnected(anyConn);
      });

      // Connect (only if circuit breaker allows)
      if (baseAdapter.circuitBreaker.canExecute()) {
        void entry.adapter.connect();
      }
    }

    return () => {
      for (const [, entry] of entries) {
        entry.adapter.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount — adapters are stable references
}

// ─── Legacy bridge helpers ───────────────────────────────────────────

/** Convert UnifiedEnergyModel → legacy EnergyData for useAppStore */
function unifiedToLegacy(model: UnifiedEnergyModel) {
  return {
    gridPower: model.grid.powerW,
    pvPower: model.pv.totalPowerW,
    batteryPower: model.battery.powerW,
    houseLoad: model.load.totalPowerW,
    batterySoC: model.battery.socPercent,
    heatPumpPower: model.load.heatPumpPowerW,
    evPower: model.load.evPowerW,
    gridVoltage: model.grid.voltageV,
    batteryVoltage: model.battery.voltageV,
    pvYieldToday: model.pv.yieldTodayKWh,
    priceCurrent: model.tariff?.currentPriceEurKWh ?? 0,
  };
}

/** Bridge Partial<UnifiedEnergyModel> → setEnergyData */
function bridgeToAppStore(
  data: Partial<UnifiedEnergyModel>,
  setEnergyData: (d: Record<string, number>) => void,
) {
  const legacy: Record<string, number> = {};

  if (data.pv) {
    legacy.pvPower = data.pv.totalPowerW;
    legacy.pvYieldToday = data.pv.yieldTodayKWh;
  }
  if (data.battery) {
    legacy.batteryPower = data.battery.powerW;
    legacy.batterySoC = data.battery.socPercent;
    legacy.batteryVoltage = data.battery.voltageV;
  }
  if (data.grid) {
    legacy.gridPower = data.grid.powerW;
    legacy.gridVoltage = data.grid.voltageV;
  }
  if (data.load) {
    legacy.houseLoad = data.load.totalPowerW;
    legacy.heatPumpPower = data.load.heatPumpPowerW;
    legacy.evPower = data.load.evPowerW;
  }
  if (data.tariff) {
    legacy.priceCurrent = data.tariff.currentPriceEurKWh;
  }

  if (Object.keys(legacy).length > 0) {
    setEnergyData(legacy);
  }
}

// ─── Convenience selectors ───────────────────────────────────────────

/** Selector: get EV charger data (for /ev page) */
export const selectEVCharger = (state: EnergyStoreState) => state.unified.evCharger;

/** Selector: get KNX room data (for /floorplan page) */
export const selectKNXRooms = (state: EnergyStoreState) => state.unified.knx?.rooms ?? [];

/** Selector: get PV data (for /production page) */
export const selectPV = (state: EnergyStoreState) => state.unified.pv;

/** Selector: get battery data (for /storage page) */
export const selectBattery = (state: EnergyStoreState) => state.unified.battery;

/** Selector: get grid data (for /consumption page) */
export const selectGrid = (state: EnergyStoreState) => state.unified.grid;

/** Selector: get tariff data (for /tariffs page) */
export const selectTariff = (state: EnergyStoreState) => state.unified.tariff;

/** Selector: get adapter status map (memoized — stable reference when values unchanged) */
let _prevAdapters: Record<AdapterId, AdapterEntry> | null = null;
let _cachedStatuses: Record<
  string,
  { status: AdapterStatus; enabled: boolean; name: string; error?: string }
> | null = null;

export const selectAdapterStatuses = (state: EnergyStoreState) => {
  if (state.adapters === _prevAdapters && _cachedStatuses) return _cachedStatuses;
  _prevAdapters = state.adapters;
  _cachedStatuses = Object.fromEntries(
    Object.entries(state.adapters).map(([id, entry]) => [
      id,
      {
        status: entry.status,
        enabled: entry.enabled,
        name: entry.adapter.name,
        error: entry.error,
      },
    ]),
  );
  return _cachedStatuses;
};

// ─── useShallow-wrapped store access ─────────────────────────────────

/**
 * useEnergyStore — Shallow-comparing wrapper for useEnergyStoreBase.
 *
 * Prevents unnecessary re-renders by doing shallow comparison on the
 * selected slice. Use this instead of useEnergyStoreBase in components.
 *
 * Examples:
 *   // Only re-renders when pv or battery values change (shallow compare):
 *   const { pv, battery } = useEnergyStore((s) => ({ pv: s.unified.pv, battery: s.unified.battery }));
 *
 *   // Single value — shallow compare on primitive:
 *   const anyConnected = useEnergyStore((s) => s.anyConnected);
 */
export function useEnergyStore<T>(selector: (state: EnergyStoreState) => T): T {
  return useEnergyStoreBase(useShallow(selector));
}
