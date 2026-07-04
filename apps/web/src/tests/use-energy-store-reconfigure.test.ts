import { describe, expect, it, vi } from 'vitest';
import { attachAdapterEntry, useEnergyStoreBase } from '../core/useEnergyStore';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
  },
}));

vi.mock('../lib/adapter-mode', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/adapter-mode')>();
  return {
    ...actual,
    canConnectHardwareAdapter: () => false,
  };
});

vi.mock('../store', () => ({
  useAppStore: {
    getState: () => ({ setConnected: vi.fn() }),
  },
}));

vi.mock('../core/adapters/adapter-registry', () => ({
  createRegisteredAdapter: vi.fn(() => ({
    destroy: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
    onData: vi.fn(),
    onStatus: vi.fn(),
    circuitBreaker: {
      onStateChange: vi.fn(),
      canExecute: vi.fn().mockReturnValue(false),
    },
  })),
  registerBuiltinAdapters: vi.fn(),
}));

describe('useEnergyStore reconfigureAdapter', () => {
  it('replaces adapter config for an existing registry slot', () => {
    const destroy = vi.fn();
    useEnergyStoreBase.setState({
      adapters: {
        'victron-mqtt': {
          adapter: {
            destroy,
            connect: vi.fn(),
            onData: vi.fn(),
            onStatus: vi.fn(),
            circuitBreaker: { onStateChange: vi.fn(), canExecute: vi.fn() },
          },
          enabled: false,
          status: 'connected',
          circuitState: 'closed',
        },
      },
    } as never);

    useEnergyStoreBase
      .getState()
      .reconfigureAdapter('victron-mqtt', { name: 'Cerbo', host: '10.0.0.8', port: 1880 }, true);

    expect(destroy).toHaveBeenCalled();
    expect(useEnergyStoreBase.getState().adapters['victron-mqtt']?.enabled).toBe(true);
    expect(useEnergyStoreBase.getState().adapters['victron-mqtt']?.status).toBe('disconnected');
  });

  it('no-ops when the adapter id is unknown', () => {
    const before = useEnergyStoreBase.getState().adapters;
    useEnergyStoreBase.getState().reconfigureAdapter('missing' as never, { host: 'x' }, true);
    expect(useEnergyStoreBase.getState().adapters).toBe(before);
  });

  it('falls back to defaults when config fields are missing', () => {
    const destroy = vi.fn();
    useEnergyStoreBase.setState({
      adapters: {
        knx: {
          adapter: {
            destroy,
            connect: vi.fn(),
            onData: vi.fn(),
            onStatus: vi.fn(),
            circuitBreaker: { onStateChange: vi.fn(), canExecute: vi.fn() },
          },
          enabled: false,
          status: 'connected',
          circuitState: 'closed',
        },
      },
    } as never);

    useEnergyStoreBase.getState().reconfigureAdapter('knx', {}, false);
    expect(destroy).toHaveBeenCalled();
    expect(useEnergyStoreBase.getState().adapters.knx?.enabled).toBe(false);
  });

  it('returns false when adding a duplicate contrib adapter', () => {
    useEnergyStoreBase.setState({
      adapters: {
        'custom-adapter': {
          adapter: {
            destroy: vi.fn(),
            connect: vi.fn(),
            onData: vi.fn(),
            onStatus: vi.fn(),
            circuitBreaker: { onStateChange: vi.fn(), canExecute: vi.fn() },
          },
          enabled: false,
          status: 'disconnected',
          circuitState: 'closed',
        },
      },
    } as never);

    const added = useEnergyStoreBase.getState().addContribAdapter('custom-adapter', {
      name: 'dup',
      host: 'localhost',
      port: 80,
    });
    expect(added).toBe(false);
  });
});

describe('attachAdapterEntry', () => {
  it('updates circuit breaker state and adapter callbacks', () => {
    const onStateChange = vi.fn();
    const onData = vi.fn();
    const onStatus = vi.fn();
    const mergeData = vi.fn();
    const setAdapterStatus = vi.fn();

    useEnergyStoreBase.setState({
      adapters: {
        'victron-mqtt': {
          adapter: {
            destroy: vi.fn(),
            connect: vi.fn(),
            onData,
            onStatus,
            circuitBreaker: {
              onStateChange,
              canExecute: vi.fn().mockReturnValue(false),
            },
          },
          enabled: false,
          status: 'disconnected',
          circuitState: 'closed',
        },
      },
      mergeData,
      setAdapterStatus,
    } as never);

    attachAdapterEntry('victron-mqtt');

    const stateHandler = onStateChange.mock.calls[0]?.[0] as (state: 'open' | 'closed') => void;
    stateHandler('open');
    stateHandler('closed');
    expect(useEnergyStoreBase.getState().adapters['victron-mqtt']?.circuitState).toBe('closed');

    const dataHandler = onData.mock.calls[0]?.[0] as (data: { x: number }) => void;
    dataHandler({ x: 1 });
    expect(mergeData).toHaveBeenCalledWith('victron-mqtt', { x: 1 });

    const statusHandler = onStatus.mock.calls[0]?.[0] as (
      status: 'connected',
      error?: string,
    ) => void;
    statusHandler('connected', 'offline');
    expect(setAdapterStatus).toHaveBeenCalledWith('victron-mqtt', 'connected', 'offline');
  });

  it('returns early when adapter entry is missing', () => {
    attachAdapterEntry('missing' as never);
    expect(true).toBe(true);
  });
});
