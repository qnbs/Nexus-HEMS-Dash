/**
 * useEnergyStore — Central adapter aggregation store
 *
 * This Zustand store manages adapter lifecycle, merges data from all active
 * adapters into a single UnifiedEnergyModel, and bridges backwards to the
 * existing useAppStore for 100% compatibility with current components.
 *
 * Usage in pages:
 *   const { unified, adapterStatus, sendCommand } = useEnergyStore();
 *
 * Page-level adapter selection:
 *   const { evCharger } = useEnergyStore((s) => ({ evCharger: s.unified.evCharger }));
 */

import { create } from 'zustand';
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

import { VictronMQTTAdapter } from './adapters/VictronMQTTAdapter';
import { ModbusSunSpecAdapter } from './adapters/ModbusSunSpecAdapter';
import { KNXAdapter } from './adapters/KNXAdapter';
import { OCPP21Adapter } from './adapters/OCPP21Adapter';
import { EEBUSAdapter } from './adapters/EEBUSAdapter';
import { CircuitBreaker } from './circuit-breaker';
import type { CircuitState } from './circuit-breaker';
import { validateCommand, logCommandAudit } from './command-safety';

// ─── Adapter registry ────────────────────────────────────────────────

export type AdapterId = 'victron-mqtt' | 'modbus-sunspec' | 'knx' | 'ocpp-21' | 'eebus';

export interface AdapterEntry {
  adapter: EnergyAdapter;
  enabled: boolean;
  status: AdapterStatus;
  error?: string;
  circuitBreaker: CircuitBreaker;
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

function createAdapterInstance(
  id: AdapterId,
  config?: Partial<AdapterConnectionConfig>,
): EnergyAdapter {
  switch (id) {
    case 'victron-mqtt':
      return new VictronMQTTAdapter(config);
    case 'modbus-sunspec':
      return new ModbusSunSpecAdapter(config);
    case 'knx':
      return new KNXAdapter(config);
    case 'ocpp-21':
      return new OCPP21Adapter(config);
    case 'eebus':
      return new EEBUSAdapter();
  }
}

function createDefaultAdapters(): Record<AdapterId, AdapterEntry> {
  return {
    'victron-mqtt': {
      adapter: createAdapterInstance('victron-mqtt'),
      enabled: true, // Primary adapter — always enabled by default
      status: 'disconnected',
      circuitBreaker: new CircuitBreaker(),
      circuitState: 'closed',
    },
    'modbus-sunspec': {
      adapter: createAdapterInstance('modbus-sunspec'),
      enabled: false,
      status: 'disconnected',
      circuitBreaker: new CircuitBreaker(),
      circuitState: 'closed',
    },
    knx: {
      adapter: createAdapterInstance('knx'),
      enabled: false,
      status: 'disconnected',
      circuitBreaker: new CircuitBreaker(),
      circuitState: 'closed',
    },
    'ocpp-21': {
      adapter: createAdapterInstance('ocpp-21'),
      enabled: false,
      status: 'disconnected',
      circuitBreaker: new CircuitBreaker(),
      circuitState: 'closed',
    },
    eebus: {
      adapter: createAdapterInstance('eebus'),
      enabled: false,
      status: 'disconnected',
      circuitBreaker: new CircuitBreaker(),
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
      return { unified: merged, lastUpdated: Date.now() };
    });
  },

  setAdapterStatus: (adapterId, status, error) => {
    set((state) => {
      const entry = state.adapters[adapterId];
      if (!entry) return state;

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
}));

// ─── Deep merge helper ───────────────────────────────────────────────

function deepMergeModel(
  base: UnifiedEnergyModel,
  partial: Partial<UnifiedEnergyModel>,
): UnifiedEnergyModel {
  return {
    timestamp: partial.timestamp ?? base.timestamp,
    pv: partial.pv ? { ...base.pv, ...partial.pv } : base.pv,
    battery: partial.battery ? { ...base.battery, ...partial.battery } : base.battery,
    grid: partial.grid ? { ...base.grid, ...partial.grid } : base.grid,
    load: partial.load ? { ...base.load, ...partial.load } : base.load,
    evCharger: partial.evCharger ?? base.evCharger,
    knx: partial.knx ?? base.knx,
    tariff: partial.tariff ?? base.tariff,
  };
}

// ─── Standalone command dispatcher ───────────────────────────────────

/**
 * sendAdapterCommand — Sends a command to all connected adapters.
 * Validates input via Zod schemas and logs to audit trail.
 * Pure function using getState(), no React hook required.
 */
export function sendAdapterCommand(command: AdapterCommand): void {
  // Validate command before sending
  const validation = validateCommand(command);
  if (!validation.valid) {
    if (import.meta.env.DEV) {
      console.warn(`[sendAdapterCommand] Rejected: ${validation.error}`);
    }
    void logCommandAudit({
      timestamp: Date.now(),
      commandType: command.type,
      value: command.value,
      targetDeviceId: command.targetDeviceId,
      status: 'rejected',
      error: validation.error,
    });
    return;
  }

  const entries = Object.entries(useEnergyStoreBase.getState().adapters) as [
    AdapterId,
    AdapterEntry,
  ][];
  for (const [id, entry] of entries) {
    if (entry.enabled && entry.status === 'connected' && entry.circuitBreaker.canExecute()) {
      void entry.adapter.sendCommand(command).then((success) => {
        void logCommandAudit({
          timestamp: Date.now(),
          commandType: command.type,
          value: command.value,
          targetDeviceId: command.targetDeviceId,
          status: success ? 'executed' : 'failed',
          adapterId: id,
          error: success ? undefined : 'Adapter rejected command',
        });
      });
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

      // Wire circuit breaker state changes into the store
      entry.circuitBreaker.onStateChange((circuitState) => {
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
        entry.circuitBreaker.recordSuccess();

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

        if (status === 'error') {
          entry.circuitBreaker.recordFailure();
        }

        // Bridge connection status (connected if any adapter is connected)
        const currentAdapters = useEnergyStoreBase.getState().adapters;
        const anyConn = Object.values(currentAdapters).some(
          (a) => a.enabled && a.status === 'connected',
        );
        setConnected(anyConn);
      });

      // Connect (only if circuit breaker allows)
      if (entry.circuitBreaker.canExecute()) {
        void entry.adapter.connect();
      }
    }

    return () => {
      for (const [, entry] of entries) {
        entry.circuitBreaker.destroy();
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

/** Selector: get adapter status map */
export const selectAdapterStatuses = (state: EnergyStoreState) =>
  Object.fromEntries(
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
