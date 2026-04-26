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

import { sanitizeObjectStrings, sanitizeUntrustedText } from '@nexus-hems/shared-types';
import { useEffect, useRef } from 'react';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { persistSnapshot } from '../lib/db';
import { queryClient } from '../lib/query-client';
import { useAppStore } from '../store';
import { createRegisteredAdapter, registerBuiltinAdapters } from './adapters/adapter-registry';

import type { BaseAdapter } from './adapters/BaseAdapter';
import type {
  AdapterCommand,
  AdapterConnectionConfig,
  AdapterStatus,
  EnergyAdapter,
  UnifiedEnergyModel,
} from './adapters/EnergyAdapter';
import type { CircuitState } from './circuit-breaker';
import { validateCommand } from './command-safety';

// ─── Adapter registry ────────────────────────────────────────────────

/** Built-in adapter identifiers */
export type BuiltinAdapterId = 'victron-mqtt' | 'modbus-sunspec' | 'knx' | 'ocpp-21' | 'eebus';

/** Adapter ID — built-in or dynamically registered contrib/npm adapter */
export type AdapterId = BuiltinAdapterId | (string & {});

export interface AdapterEntry {
  adapter: EnergyAdapter;
  enabled: boolean;
  status: AdapterStatus;
  error?: string | undefined;
  circuitState: CircuitState;
}

/** One time-series snapshot appended to the ring buffer on every 250 ms flush */
export type HistoryPoint = UnifiedEnergyModel & { ts: number };

export interface EnergyStoreState {
  /** Merged model from all adapters */
  unified: UnifiedEnergyModel;
  /** Per-adapter status */
  adapters: Record<AdapterId, AdapterEntry>;
  /** Whether at least one adapter is connected */
  anyConnected: boolean;
  /** Timestamp of last data update */
  lastUpdated: number | null;
  /** Sliding-window ring buffer — up to 1 000 flushed snapshots, newest last */
  history: HistoryPoint[];

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

// ─── 250 ms UI-throttle accumulator ─────────────────────────────────
// WS frames can arrive every 10–100 ms. Accumulate all incoming partials
// and flush to Zustand at most once per UI_THROTTLE_MS to keep re-render
// pressure off the main thread.

const UI_THROTTLE_MS = 250;

/**
 * Per-adapter maximum ring-buffer snapshot count.
 * Replaces the fixed 1 000-item global cap — reduces memory ~80% for typical
 * 10-adapter setups by only keeping as many points as each adapter needs.
 * The effective global ring buffer max is the sum of sizes for all *enabled* adapters.
 */
export const RING_BUFFER_SIZES: Readonly<Record<string, number>> = {
  'ocpp-21': 500,
  'victron-mqtt': 200,
  eebus: 200,
  'modbus-sunspec': 150,
  knx: 100,
  'homeassistant-mqtt': 200,
  zigbee2mqtt: 150,
  'shelly-rest': 100,
  'matter-thread': 100,
  default: 100,
};

/** Compute the effective ring-buffer cap from all enabled adapters. */
function computeHistoryMax(adapters: Record<string, AdapterEntry>): number {
  let total = 0;
  for (const [id, entry] of Object.entries(adapters)) {
    if (entry.enabled) {
      total += RING_BUFFER_SIZES[id] ?? RING_BUFFER_SIZES.default;
    }
  }
  // Fallback: if no adapter is enabled yet, use a sensible default
  return total > 0 ? total : RING_BUFFER_SIZES.default;
}

let _pendingMerge: Partial<UnifiedEnergyModel> | null = null;
let _flushTimer: ReturnType<typeof setTimeout> | null = null;

// ─── Store ───────────────────────────────────────────────────────────

export const useEnergyStoreBase = create<EnergyStoreState>()((set) => ({
  unified: { ...emptyModel },
  adapters: createDefaultAdapters(),
  anyConnected: false,
  lastUpdated: null,
  history: [],

  mergeData: (_adapterId, data) => {
    const sanitizedData = sanitizeObjectStrings(data, 128);
    // Accumulate into pending buffer; single flush dispatched per 250 ms window
    if (_pendingMerge) {
      accumulatePending(_pendingMerge, sanitizedData);
    } else {
      _pendingMerge = { ...sanitizedData };
    }
    if (_flushTimer === null) {
      _flushTimer = setTimeout(flushMerge, UI_THROTTLE_MS);
    }
  },

  setAdapterStatus: (adapterId, status, error) => {
    const sanitizedError = error ? sanitizeUntrustedText(error, 160) : undefined;
    set((state) => {
      const entry = state.adapters[adapterId];
      if (!entry) return state;
      // Skip update if status hasn't changed
      if (entry.status === status && entry.error === sanitizedError) return state;

      const newAdapters = {
        ...state.adapters,
        [adapterId]: { ...entry, status, error: sanitizedError },
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

// ─── Throttle flush & accumulator ────────────────────────────────────
// Declared with `function` so declarations are hoisted above the
// store's create() call — mergeData() can reference them before they
// appear in the source text.

/** Deep-merge incoming partial into a pending accumulator in place. */
function accumulatePending(
  p: Partial<UnifiedEnergyModel>,
  data: Partial<UnifiedEnergyModel>,
): void {
  if (data.pv) p.pv = p.pv ? { ...p.pv, ...data.pv } : data.pv;
  if (data.battery) p.battery = p.battery ? { ...p.battery, ...data.battery } : data.battery;
  if (data.grid) p.grid = p.grid ? { ...p.grid, ...data.grid } : data.grid;
  if (data.load) p.load = p.load ? { ...p.load, ...data.load } : data.load;
  if (data.timestamp !== undefined) p.timestamp = data.timestamp;
  if (data.evCharger !== undefined) p.evCharger = data.evCharger;
  if (data.knx !== undefined) p.knx = data.knx;
  if (data.tariff !== undefined) p.tariff = data.tariff;
}

function flushMerge(): void {
  _flushTimer = null;
  const pending = _pendingMerge;
  _pendingMerge = null;
  if (!pending) return;
  useEnergyStoreBase.setState((state) => {
    const merged = deepMergeModel(state.unified, pending);
    if (merged === state.unified) return state;
    const ts = Date.now();
    const point: HistoryPoint = { ...merged, ts };
    // Ring buffer: adaptive max based on enabled adapters' RING_BUFFER_SIZES
    const maxPoints = computeHistoryMax(state.adapters);
    const history =
      state.history.length >= maxPoints
        ? [...state.history.slice(1), point]
        : [...state.history, point];
    return { unified: merged, lastUpdated: ts, history };
  });
}

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
 * 4. Syncs to TanStack Query cache (queryClient.setQueryData)
 * 5. Persists snapshots to Dexie.js
 *
 * Mount this ONCE in App.tsx (replaces the old useWebSocket hook).
 * Uses getState() for actions to avoid full-store subscription.
 */
export function useAdapterBridge() {
  // Zustand actions are stable — no hook subscriptions needed.
  // Retrieve via getState() inside callbacks to avoid stale closures.
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
        bridgeToAppStore(data, useAppStore.getState().setEnergyData);

        // Sync to TanStack Query cache — components using useQuery(['energy-live'])
        // get push-based updates without polling. staleTime: Infinity ensures
        // React Query never refetches; Zustand is the single source of truth.
        const currentUnified = useEnergyStoreBase.getState().unified;
        const legacySnapshot = unifiedToLegacy(currentUnified);
        queryClient.setQueryData(['energy-live'], legacySnapshot);

        // Cache energy snapshot for offline fallback
        queryClient.setQueryData(['energy-snapshot', Date.now()], legacySnapshot);

        // Persist to Dexie.js (single write — no duplicate)
        if (data.timestamp) {
          void persistSnapshot(legacySnapshot);
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
        useAppStore.getState().setConnected(anyConn);
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
  }, []); // Only on mount — adapters are stable references, callbacks via refs
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

/** Selector: get EV charger data (for Devices page) */
export const selectEVCharger = (state: EnergyStoreState) => state.unified.evCharger;

/** Selector: get KNX room data (for Devices page) */
export const selectKNXRooms = (state: EnergyStoreState) => state.unified.knx?.rooms ?? [];

/** Selector: get PV data (for Live Energy Flow page) */
export const selectPV = (state: EnergyStoreState) => state.unified.pv;

/** Selector: get battery data (for Live Energy Flow page) */
export const selectBattery = (state: EnergyStoreState) => state.unified.battery;

/** Selector: get grid data (for Live Energy Flow page) */
export const selectGrid = (state: EnergyStoreState) => state.unified.grid;

/** Selector: get tariff data (for Tariffs page) */
export const selectTariff = (state: EnergyStoreState) => state.unified.tariff;

/** Selector: get sliding-window history ring buffer (for time-series charts) */
export const selectHistory = (state: EnergyStoreState) => state.history;

/** Selector: get adapter status map (memoized — stable reference when values unchanged) */
let _prevAdapters: Record<AdapterId, AdapterEntry> | null = null;
let _cachedStatuses: Record<
  string,
  { status: AdapterStatus; enabled: boolean; name: string; error?: string | undefined }
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
        name: sanitizeUntrustedText(entry.adapter.name, 80),
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

// ─── useServerWebSocket ───────────────────────────────────────────────

const WS_BACKOFF_INITIAL_MS = 1_000;
const WS_BACKOFF_MAX_MS = 30_000;
const WS_BACKOFF_MULTIPLIER = 2;

/**
 * useServerWebSocket — connects the browser to the HEMS Express WebSocket
 * server with exponential backoff + jitter.
 *
 * Receives ENERGY_UPDATE broadcasts and merges them into useEnergyStore.
 * Useful in mock/dev mode and as a fallback when hardware adapters are
 * not configured. Call with `enabled={true}` to activate.
 *
 * Reconnect schedule: 1 s → 2 s → 4 s → 8 s → 16 s → 30 s (max).
 * ±25 % jitter prevents thundering herd after a server restart.
 *
 * Mount once — e.g. in App.tsx alongside useAdapterBridge().
 */
export function useServerWebSocket(enabled: boolean): void {
  const wsRef = useRef<WebSocket | null>(null);
  const retryDelayRef = useRef(WS_BACKOFF_INITIAL_MS);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const destroyedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    destroyedRef.current = false;

    function connect(): void {
      if (destroyedRef.current) return;
      if (wsRef.current?.readyState === WebSocket.CONNECTING) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${protocol}//${window.location.host}`;

      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
      } catch {
        scheduleReconnect();
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        retryDelayRef.current = WS_BACKOFF_INITIAL_MS;
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(String(event.data)) as { type: string; data: unknown };
          if (msg.type === 'ENERGY_UPDATE') {
            // Route server-pushed data into the adapter store under the
            // 'server' virtual adapter ID so UI components react normally.
            useEnergyStoreBase
              .getState()
              .mergeData('server' as AdapterId, msg.data as Partial<UnifiedEnergyModel>);
          }
        } catch {
          // Ignore unparseable frames
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        scheduleReconnect();
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    function scheduleReconnect(): void {
      if (destroyedRef.current) return;
      const jitter = 0.75 + Math.random() * 0.5; // ±25 %
      const delay = Math.min(retryDelayRef.current * jitter, WS_BACKOFF_MAX_MS);
      retryDelayRef.current = Math.min(
        retryDelayRef.current * WS_BACKOFF_MULTIPLIER,
        WS_BACKOFF_MAX_MS,
      );
      retryTimerRef.current = setTimeout(connect, delay);
    }

    connect();

    return () => {
      destroyedRef.current = true;
      if (retryTimerRef.current !== null) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      wsRef.current?.close();
      wsRef.current = null;
      retryDelayRef.current = WS_BACKOFF_INITIAL_MS;
    };
  }, [enabled]);
}
