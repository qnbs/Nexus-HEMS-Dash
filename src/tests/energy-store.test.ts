import { describe, it, expect, beforeEach, vi } from 'vitest';

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

vi.mock('../store', () => ({
  useAppStore: Object.assign(
    vi.fn(() => vi.fn()),
    {
      getState: vi.fn(() => ({
        setEnergyData: vi.fn(),
        setConnected: vi.fn(),
      })),
    },
  ),
}));

import { useEnergyStoreBase } from '../core/useEnergyStore';
import type { AdapterId } from '../core/useEnergyStore';

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
    it('should merge PV data into unified model', () => {
      const { mergeData } = useEnergyStoreBase.getState();
      mergeData('victron-mqtt', {
        timestamp: 1000,
        pv: { totalPowerW: 5200, yieldTodayKWh: 24.3 },
      });

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
});
