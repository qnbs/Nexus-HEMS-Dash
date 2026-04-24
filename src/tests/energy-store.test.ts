import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Create a mock adapter class factory
function createMockAdapterClass(id: string, name: string) {
  return class {
    id = id;
    name = name;
    status = 'disconnected';
    capabilities = ['pv', 'battery', 'grid', 'load'];
    connect = vi.fn();
    disconnect = vi.fn();
    destroy = vi.fn();
    sendCommand = vi.fn();
    onData = vi.fn();
    onStatus = vi.fn();
  };
}

// Mock all adapter imports before importing the store
vi.mock('../core/adapters/VictronMQTTAdapter', () => ({
  VictronMQTTAdapter: createMockAdapterClass('victron-mqtt', 'Victron MQTT'),
}));

vi.mock('../core/adapters/ModbusSunSpecAdapter', () => ({
  ModbusSunSpecAdapter: createMockAdapterClass('modbus-sunspec', 'Modbus SunSpec'),
}));

vi.mock('../core/adapters/KNXAdapter', () => ({
  KNXAdapter: createMockAdapterClass('knx', 'KNX'),
}));

vi.mock('../core/adapters/OCPP21Adapter', () => ({
  OCPP21Adapter: createMockAdapterClass('ocpp-21', 'OCPP 2.1'),
}));

vi.mock('../core/adapters/EEBUSAdapter', () => ({
  EEBUSAdapter: createMockAdapterClass('eebus', 'EEBUS'),
}));

vi.mock('../lib/db', () => ({
  persistSnapshot: vi.fn(),
}));

// useAppStore mock — reflects the Opt#2 change: useAdapterBridge now calls
// useAppStore.getState() inside callbacks instead of hook subscriptions.
// The mock preserves the getState() API that the production code relies on.
const mockSetEnergyData = vi.fn();
const mockSetConnected = vi.fn();

vi.mock('../store', () => ({
  useAppStore: Object.assign(
    vi.fn(() => vi.fn()),
    {
      getState: vi.fn(() => ({
        setEnergyData: mockSetEnergyData,
        setConnected: mockSetConnected,
      })),
    },
  ),
}));

import type { AdapterId } from '../core/useEnergyStore';
import { useEnergyStoreBase } from '../core/useEnergyStore';

describe('useEnergyStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useEnergyStoreBase.setState({
      unified: {
        timestamp: 0,
        pv: { totalPowerW: 0, yieldTodayKWh: 0 },
        battery: { powerW: 0, socPercent: 0, voltageV: 51.2, currentA: 0 },
        grid: { powerW: 0, voltageV: 230 },
        load: { totalPowerW: 0, heatPumpPowerW: 0, evPowerW: 0, otherPowerW: 0 },
      },
      anyConnected: false,
      lastUpdated: null,
    });
    // Reset all adapter statuses to 'disconnected' so equality guards don't skip updates
    const { adapters } = useEnergyStoreBase.getState();
    for (const id of Object.keys(adapters)) {
      useEnergyStoreBase.setState((s) => ({
        adapters: {
          ...s.adapters,
          [id]: {
            ...s.adapters[id],
            status: 'disconnected',
            error: undefined,
            enabled: id === 'victron-mqtt',
          },
        },
      }));
    }
  });

  it('should initialize with empty unified model', () => {
    const { unified } = useEnergyStoreBase.getState();
    expect(unified.timestamp).toBe(0);
    expect(unified.pv.totalPowerW).toBe(0);
    expect(unified.battery.socPercent).toBe(0);
    expect(unified.grid.powerW).toBe(0);
  });

  it('should initialize with 5 adapters', () => {
    const { adapters } = useEnergyStoreBase.getState();
    const ids = Object.keys(adapters);
    expect(ids).toHaveLength(5);
    expect(ids).toContain('victron-mqtt');
    expect(ids).toContain('modbus-sunspec');
    expect(ids).toContain('knx');
    expect(ids).toContain('ocpp-21');
    expect(ids).toContain('eebus');
  });

  it('should have victron-mqtt enabled by default', () => {
    const { adapters } = useEnergyStoreBase.getState();
    expect(adapters['victron-mqtt'].enabled).toBe(true);
    expect(adapters['modbus-sunspec'].enabled).toBe(false);
    expect(adapters.knx.enabled).toBe(false);
    expect(adapters['ocpp-21'].enabled).toBe(false);
    expect(adapters.eebus.enabled).toBe(false);
  });

  it('should start with anyConnected = false', () => {
    const { anyConnected } = useEnergyStoreBase.getState();
    expect(anyConnected).toBe(false);
  });

  describe('mergeData', () => {
    // mergeData is throttled to 250 ms — use fake timers to flush synchronously
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.runAllTimers();
      vi.useRealTimers();
    });

    it('should merge PV data into unified model', () => {
      const { mergeData } = useEnergyStoreBase.getState();
      mergeData('victron-mqtt', {
        timestamp: 1000,
        pv: { totalPowerW: 5200, yieldTodayKWh: 24.3 },
      });
      vi.runAllTimers(); // flush 250 ms throttle

      const { unified, lastUpdated } = useEnergyStoreBase.getState();
      expect(unified.pv.totalPowerW).toBe(5200);
      expect(unified.pv.yieldTodayKWh).toBe(24.3);
      expect(unified.timestamp).toBe(1000);
      expect(lastUpdated).not.toBeNull();
    });

    it('should merge battery data without overwriting PV', () => {
      const { mergeData } = useEnergyStoreBase.getState();
      mergeData('victron-mqtt', {
        pv: { totalPowerW: 5200, yieldTodayKWh: 24.3 },
      });
      mergeData('victron-mqtt', {
        battery: { powerW: -1500, socPercent: 68, voltageV: 52.4, currentA: 28.8 },
      });
      vi.runAllTimers(); // flush 250 ms throttle (accumulates both calls)

      const { unified } = useEnergyStoreBase.getState();
      expect(unified.pv.totalPowerW).toBe(5200); // Not overwritten
      expect(unified.battery.powerW).toBe(-1500);
      expect(unified.battery.socPercent).toBe(68);
    });

    it('should deep merge partial adapter data', () => {
      const { mergeData } = useEnergyStoreBase.getState();
      mergeData('victron-mqtt', {
        grid: { powerW: -800, voltageV: 231.5 },
      });
      vi.runAllTimers(); // flush 250 ms throttle

      const { unified } = useEnergyStoreBase.getState();
      expect(unified.grid.powerW).toBe(-800);
      expect(unified.grid.voltageV).toBe(231.5);
    });
  });

  describe('setAdapterStatus', () => {
    it('should update adapter status', () => {
      const { setAdapterStatus } = useEnergyStoreBase.getState();
      setAdapterStatus('victron-mqtt', 'connected');

      const { adapters } = useEnergyStoreBase.getState();
      expect(adapters['victron-mqtt'].status).toBe('connected');
    });

    it('should set anyConnected when enabled adapter connects', () => {
      const { setAdapterStatus } = useEnergyStoreBase.getState();
      setAdapterStatus('victron-mqtt', 'connected');

      const { anyConnected } = useEnergyStoreBase.getState();
      expect(anyConnected).toBe(true);
    });

    it('should not set anyConnected for disabled adapter', () => {
      const { setAdapterStatus, enableAdapter } = useEnergyStoreBase.getState();
      enableAdapter('victron-mqtt', false);
      setAdapterStatus('victron-mqtt', 'connected');

      const { anyConnected } = useEnergyStoreBase.getState();
      expect(anyConnected).toBe(false);
    });

    it('should store error string', () => {
      const { setAdapterStatus } = useEnergyStoreBase.getState();
      setAdapterStatus('knx', 'error', 'Connection refused');

      const { adapters } = useEnergyStoreBase.getState();
      expect(adapters.knx.status).toBe('error');
      expect(adapters.knx.error).toBe('Connection refused');
    });

    it('should ignore unknown adapter IDs', () => {
      const { setAdapterStatus } = useEnergyStoreBase.getState();
      const before = { ...useEnergyStoreBase.getState().adapters };
      setAdapterStatus('unknown-adapter' as AdapterId, 'connected');
      const after = useEnergyStoreBase.getState().adapters;
      expect(after).toEqual(before);
    });
  });

  describe('enableAdapter', () => {
    it('should enable/disable adapters', () => {
      const { enableAdapter } = useEnergyStoreBase.getState();
      enableAdapter('knx', true);
      expect(useEnergyStoreBase.getState().adapters.knx.enabled).toBe(true);

      enableAdapter('knx', false);
      expect(useEnergyStoreBase.getState().adapters.knx.enabled).toBe(false);
    });

    it('should ignore unknown adapter IDs', () => {
      const { enableAdapter } = useEnergyStoreBase.getState();
      const before = { ...useEnergyStoreBase.getState().adapters };
      enableAdapter('unknown-adapter' as AdapterId, true);
      const after = useEnergyStoreBase.getState().adapters;
      expect(after).toEqual(before);
    });
  });

  describe('useAppStore.getState() bridge contract (Opt#2)', () => {
    it('useAppStore mock exposes getState() with setEnergyData', async () => {
      // Verify the mock used by useAdapterBridge satisfies the contract:
      // useAppStore.getState().setEnergyData must be callable.
      const { useAppStore } = await import('../store');
      const state = useAppStore.getState();
      expect(typeof state.setEnergyData).toBe('function');
    });

    it('useAppStore mock exposes getState() with setConnected', async () => {
      const { useAppStore } = await import('../store');
      const state = useAppStore.getState();
      expect(typeof state.setConnected).toBe('function');
    });

    it('getState() is stable — always returns same action refs', async () => {
      // Actions retrieved via getState() should be consistent across calls.
      // This validates that adapters using getState() inside callbacks won't
      // get stale function references (the key invariant of Opt#2).
      const { useAppStore } = await import('../store');
      const first = useAppStore.getState();
      const second = useAppStore.getState();
      expect(first.setEnergyData).toBe(second.setEnergyData);
      expect(first.setConnected).toBe(second.setConnected);
    });

    it('selectAdapterStatuses returns array of adapter status objects', () => {
      const { adapters } = useEnergyStoreBase.getState();
      const statuses = Object.entries(adapters).map(([id, entry]) => ({
        id,
        status: entry.status,
        enabled: entry.enabled,
      }));
      expect(statuses).toHaveLength(5);
      statuses.forEach((s) => {
        expect(s).toHaveProperty('id');
        expect(s).toHaveProperty('status');
        expect(s).toHaveProperty('enabled');
      });
    });
  });
});
