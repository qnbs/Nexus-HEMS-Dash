/**
 * OpenEMSProtocolAdapter unit tests — mock WebSocket JSON-RPC, no real Edge instance.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockWsHolder = vi.hoisted(() => ({
  current: null as {
    send: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    removeAllListeners: ReturnType<typeof vi.fn>;
    on: (event: string, cb: (...args: unknown[]) => void) => void;
    emit: (event: string, ...args: unknown[]) => void;
    readyState: number;
  } | null,
}));

vi.mock('ws', () => {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();

  class MockWebSocket {
    static readonly OPEN = 1;
    static readonly CONNECTING = 0;
    readyState = MockWebSocket.CONNECTING;
    send = vi.fn((payload: string) => {
      const req = JSON.parse(payload) as { id: string; method: string };
      if (req.method === 'authenticateWithPassword') {
        setTimeout(
          () =>
            this.emit(
              'message',
              JSON.stringify({ jsonrpc: '2.0', id: req.id, result: { token: 'sess' } }),
            ),
          0,
        );
      } else if (req.method === 'subscribeChannels') {
        setTimeout(
          () => this.emit('message', JSON.stringify({ jsonrpc: '2.0', id: req.id, result: {} })),
          0,
        );
      }
    });
    close = vi.fn();
    removeAllListeners = vi.fn(() => listeners.clear());

    constructor(_url: string) {
      mockWsHolder.current = this;
      setTimeout(() => {
        this.readyState = MockWebSocket.OPEN;
        this.emit('open');
      }, 0);
    }

    on(event: string, cb: (...args: unknown[]) => void): void {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)?.add(cb);
    }

    emit(event: string, ...args: unknown[]): void {
      for (const cb of listeners.get(event) ?? []) {
        cb(...args);
      }
    }
  }

  return { WebSocket: MockWebSocket };
});

import {
  createOpenEMSAdapterFromEnv,
  OpenEMSProtocolAdapter,
  type OpenEMSProtocolAdapterConfig,
} from './OpenEMSProtocolAdapter.js';

const testConfig: OpenEMSProtocolAdapterConfig = {
  id: 'test-openems-01',
  host: '192.168.1.60',
  port: 8085,
  authToken: 'user',
  deviceId: 'openems-home',
  pollIntervalMs: 60_000,
};

describe('OpenEMSProtocolAdapter', () => {
  let adapter: OpenEMSProtocolAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new OpenEMSProtocolAdapter(testConfig);
  });

  afterEach(async () => {
    await adapter.disconnect().catch(() => {
      /* ignore */
    });
  });

  it('has correct id and protocol', () => {
    expect(adapter.id).toBe('test-openems-01');
    expect(adapter.protocol).toBe('openems');
  });

  it('reports healthy after connect', async () => {
    await adapter.connect();
    const health = await adapter.healthCheck();
    expect(health.status).toBe('healthy');
  });

  it('yields role-tagged datapoints from currentData notifications', async () => {
    const stream = adapter.getDataStream();
    const connectPromise = adapter.connect();
    await connectPromise;

    const dpPromise = stream.next();
    mockWsHolder.current?.emit(
      'message',
      JSON.stringify({
        jsonrpc: '2.0',
        method: 'currentData',
        params: {
          channels: [
            { address: '_sum/ProductionActivePower', value: 4200 },
            { address: '_sum/EssSoc', value: 67 },
            { address: '_sum/GridActivePower', value: 300 },
          ],
        },
      }),
    );

    const collected: string[] = [];
    for (let i = 0; i < 3; i++) {
      const next = i === 0 ? await dpPromise : await stream.next();
      if (next.done) break;
      collected.push(`${next.value?.role}:${next.value?.metric}:${next.value?.value}`);
    }

    await adapter.disconnect();

    expect(collected).toContain('pv:POWER_W:4200');
    expect(collected).toContain('battery:SOC_PERCENT:67');
    expect(collected).toContain('grid:POWER_W:300');
  });

  it('uses configured deviceId on emitted datapoints', async () => {
    const stream = adapter.getDataStream();
    await adapter.connect();

    const dpPromise = stream.next();
    mockWsHolder.current?.emit(
      'message',
      JSON.stringify({
        jsonrpc: '2.0',
        method: 'currentData',
        params: {
          channels: [{ address: '_sum/ProductionActivePower', value: 100 }],
        },
      }),
    );

    const next = await dpPromise;
    await adapter.disconnect();
    expect(next.value?.deviceId).toBe('openems-home');
  });

  it('createOpenEMSAdapterFromEnv returns null without OPENEMS_HOST', () => {
    expect(createOpenEMSAdapterFromEnv({})).toBeNull();
  });

  it('createOpenEMSAdapterFromEnv builds adapter from env', () => {
    const a = createOpenEMSAdapterFromEnv({
      OPENEMS_HOST: 'edge.local',
      OPENEMS_PORT: '9090',
      OPENEMS_DEVICE_ID: 'site-a',
    });
    expect(a?.id).toBe('openems-01');
    expect(a?.protocol).toBe('openems');
  });
});
