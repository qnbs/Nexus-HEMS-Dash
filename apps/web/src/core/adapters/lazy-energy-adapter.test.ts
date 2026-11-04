import { describe, expect, it, vi } from 'vitest';
import type { EnergyAdapter } from './EnergyAdapter';
import { createLazyEnergyAdapter } from './lazy-energy-adapter';

describe('createLazyEnergyAdapter', () => {
  it('loads module on connect and forwards subscribe callbacks', async () => {
    const onData = vi.fn();
    const onStatus = vi.fn();
    const inner: EnergyAdapter = {
      id: 'ocpp-21',
      name: 'OCPP 2.1',
      status: 'connected',
      capabilities: [],
      connect: vi.fn(async () => {}),
      disconnect: vi.fn(async () => {}),
      onData,
      onStatus,
      sendCommand: vi.fn(async () => true),
      getSnapshot: () => ({}),
      destroy: vi.fn(),
    };

    class MockOcpp {
      constructor(_config?: unknown) {
        Object.assign(this, inner);
      }
    }

    const loader = vi.fn(async () => ({ OCPP21Adapter: MockOcpp }));

    const lazy = createLazyEnergyAdapter('ocpp-21', 'OCPP 2.1', loader, 'OCPP21Adapter');
    lazy.onData(() => {});
    lazy.onStatus(() => {});

    await lazy.connect();

    expect(loader).toHaveBeenCalledOnce();
    expect(inner.connect).toHaveBeenCalledOnce();
    expect(onData).toHaveBeenCalledOnce();
    expect(onStatus).toHaveBeenCalledOnce();
  });
});
