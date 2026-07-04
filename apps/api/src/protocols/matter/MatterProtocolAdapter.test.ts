/**
 * MatterProtocolAdapter unit tests — mock WebSocket, no real Matter controller.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockWsHolder = vi.hoisted(() => ({
  current: null as {
    send: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    removeAllListeners: ReturnType<typeof vi.fn>;
    on: (event: string, cb: (...args: unknown[]) => void) => void;
    emit: (event: string, ...args: unknown[]) => void;
  } | null,
}));

vi.mock('ws', () => {
  class MockWebSocket {
    private readonly listeners = new Map<string, Set<(...args: unknown[]) => void>>();
    send = vi.fn();
    close = vi.fn();
    removeAllListeners = vi.fn(() => this.listeners.clear());

    constructor(_url: string) {
      mockWsHolder.current = this;
      setTimeout(() => this.emit('open'), 0);
    }

    on(event: string, cb: (...args: unknown[]) => void): void {
      if (!this.listeners.has(event)) this.listeners.set(event, new Set());
      this.listeners.get(event)?.add(cb);
    }

    emit(event: string, ...args: unknown[]): void {
      for (const cb of this.listeners.get(event) ?? []) {
        cb(...args);
      }
    }
  }

  return { WebSocket: MockWebSocket };
});

import {
  createMatterAdapterFromEnv,
  MatterProtocolAdapter,
  type MatterProtocolAdapterConfig,
} from './MatterProtocolAdapter.js';

const testConfig: MatterProtocolAdapterConfig = {
  id: 'test-matter-01',
  host: 'matter.local',
  port: 5580,
  deviceId: 'matter-home',
  nodeMappings: [{ nodeId: 42, role: 'grid' }],
};

describe('MatterProtocolAdapter', () => {
  let adapter: MatterProtocolAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new MatterProtocolAdapter(testConfig);
  });

  afterEach(async () => {
    await adapter.disconnect().catch(() => {
      /* ignore */
    });
  });

  it('has correct id and protocol', () => {
    expect(adapter.id).toBe('test-matter-01');
    expect(adapter.protocol).toBe('matter-thread');
  });

  it('requests nodes on connect and yields EPM power datapoints', async () => {
    const stream = adapter.getDataStream();
    const nextPromise = stream.next();
    await adapter.connect();

    const ws = mockWsHolder.current;
    expect(ws?.send).toHaveBeenCalledWith(expect.stringContaining('"type":"get_nodes"'));

    ws?.emit(
      'message',
      JSON.stringify({
        type: 'result',
        result: [
          {
            nodeId: 42,
            endpoints: [
              {
                endpointId: 1,
                clusters: {
                  144: { activePower: 2_500_000 },
                },
              },
            ],
          },
        ],
      }),
    );

    const result = await nextPromise;
    await adapter.disconnect();

    expect(result.done).toBe(false);
    expect(result.value).toMatchObject({
      protocol: 'matter-thread',
      metric: 'POWER_W',
      role: 'grid',
      value: 2500,
      deviceId: 'matter-home:node-42',
    });
  });

  it('createMatterAdapterFromEnv returns null without host', () => {
    expect(createMatterAdapterFromEnv({})).toBeNull();
    expect(createMatterAdapterFromEnv({ MATTER_BRIDGE_HOST: 'matter.local' })).not.toBeNull();
  });
});
