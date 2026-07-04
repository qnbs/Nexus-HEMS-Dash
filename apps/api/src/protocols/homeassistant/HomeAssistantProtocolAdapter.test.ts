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
  class MockWebSocket {
    private readonly listeners = new Map<string, Set<(...args: unknown[]) => void>>();
    send = vi.fn();
    close = vi.fn();
    removeAllListeners = vi.fn(() => this.listeners.clear());

    constructor(_url: string) {
      mockWsHolder.current = this;
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
    { entityId: 'number.wallbox_max_current', metric: 'POWER_W', role: 'ev' },
    { entityId: 'switch.wallbox_charging', metric: 'POWER_W', role: 'ev' },
  ],
  wallboxCurrentEntityId: 'number.wallbox_max_current',
  wallboxSwitchEntityId: 'switch.wallbox_charging',
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

  it('sends call_service for START_CHARGING when connected', async () => {
    const connectPromise = adapter.connect();

    await vi.waitFor(() => {
      expect(mockWsHolder.current).not.toBeNull();
    });

    const ws = mockWsHolder.current;
    ws?.emit('message', JSON.stringify({ type: 'auth_required' }));
    ws?.emit('message', JSON.stringify({ type: 'auth_ok' }));
    await connectPromise;

    const result = await adapter.sendCommand({ type: 'START_CHARGING', value: true });
    expect(result).toEqual({ handled: true, success: true, adapterId: 'test-ha-01' });

    const serviceCall = ws?.send.mock.calls.find((call) => {
      const payload = JSON.parse(String(call[0])) as { type: string };
      return payload.type === 'call_service';
    });
    expect(serviceCall).toBeDefined();
    const payload = JSON.parse(String(serviceCall?.[0])) as {
      type: string;
      domain: string;
      service: string;
      target: { entity_id: string };
    };
    expect(payload.domain).toBe('switch');
    expect(payload.service).toBe('turn_on');
    expect(payload.target.entity_id).toBe('switch.wallbox_charging');
  });
});
