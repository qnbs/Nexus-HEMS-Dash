/**
 * HomeAssistantProtocolAdapter unit tests — mock WebSocket, no real HA instance.
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
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();

  class MockWebSocket {
    send = vi.fn();
    close = vi.fn();
    removeAllListeners = vi.fn(() => listeners.clear());

    constructor(_url: string) {
      mockWsHolder.current = this;
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
  createHomeAssistantAdapterFromEnv,
  HomeAssistantProtocolAdapter,
  type HomeAssistantProtocolAdapterConfig,
} from './HomeAssistantProtocolAdapter.js';

const testConfig: HomeAssistantProtocolAdapterConfig = {
  id: 'test-ha-01',
  host: 'homeassistant.local',
  port: 8123,
  token: 'test-token',
  deviceId: 'ha-home',
  entityMappings: [
    { entityId: 'sensor.solar_power', metric: 'POWER_W', role: 'pv' },
    { entityId: 'sensor.battery_soc', metric: 'SOC_PERCENT', role: 'battery' },
  ],
};

describe('HomeAssistantProtocolAdapter', () => {
  let adapter: HomeAssistantProtocolAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new HomeAssistantProtocolAdapter(testConfig);
  });

  afterEach(async () => {
    await adapter.disconnect().catch(() => {
      /* ignore */
    });
  });

  it('has correct id and protocol', () => {
    expect(adapter.id).toBe('test-ha-01');
    expect(adapter.protocol).toBe('homeassistant-mqtt');
  });

  it('connects via HA auth handshake and yields mapped state_changed datapoints', async () => {
    const stream = adapter.getDataStream();
    const nextPromise = stream.next();

    const connectPromise = adapter.connect();

    await vi.waitFor(() => {
      expect(mockWsHolder.current).not.toBeNull();
    });

    const ws = mockWsHolder.current;
    ws?.emit('message', JSON.stringify({ type: 'auth_required' }));
    expect(ws?.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'auth', access_token: 'test-token' }),
    );

    ws?.emit('message', JSON.stringify({ type: 'auth_ok' }));
    await connectPromise;

    ws?.emit(
      'message',
      JSON.stringify({
        type: 'event',
        event: {
          event_type: 'state_changed',
          data: {
            entity_id: 'sensor.solar_power',
            new_state: {
              state: '4200',
              attributes: { unit_of_measurement: 'W', device_class: 'power' },
            },
          },
        },
      }),
    );

    const result = await nextPromise;
    expect(result.done).toBe(false);
    expect(result.value).toMatchObject({
      protocol: 'homeassistant-mqtt',
      metric: 'POWER_W',
      role: 'pv',
      value: 4200,
      deviceId: 'ha-home:sensor.solar_power',
    });

    await adapter.disconnect();
    await stream.next();
  });

  it('reports offline health before connect', async () => {
    const health = await adapter.healthCheck();
    expect(health.status).toBe('offline');
  });

  it('createHomeAssistantAdapterFromEnv returns null without host/token', () => {
    expect(createHomeAssistantAdapterFromEnv({})).toBeNull();
    expect(
      createHomeAssistantAdapterFromEnv({ HA_HOST: 'ha.local', HA_TOKEN: 'secret' }),
    ).not.toBeNull();
  });
});
