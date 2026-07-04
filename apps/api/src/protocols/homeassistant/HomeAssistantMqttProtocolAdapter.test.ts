/**
 * HomeAssistantMqttProtocolAdapter unit tests — mock mqtt client.
 */

import EventEmitter from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class MockMqttClient extends EventEmitter {
  subscribe = vi.fn((_topic: string, _opts: unknown, cb?: (err: Error | null) => void) => {
    cb?.(null);
    return this;
  });
  end = vi.fn((_force: boolean, _opts: unknown, cb?: () => void) => {
    cb?.();
    return this;
  });
}

let mockClientInstance: MockMqttClient;

vi.mock('mqtt', () => ({
  default: {
    connect: vi.fn(() => {
      mockClientInstance = new MockMqttClient();
      setTimeout(() => mockClientInstance.emit('connect'), 0);
      return mockClientInstance;
    }),
  },
}));

vi.mock('../../middleware/adapter-metrics.js', () => ({
  recordAdapterDlq: vi.fn(),
  recordAdapterError: vi.fn(),
  recordAdapterReconnect: vi.fn(),
}));

import { recordAdapterError } from '../../middleware/adapter-metrics.js';
import {
  createHomeAssistantMqttAdapterFromEnv,
  HomeAssistantMqttProtocolAdapter,
  type HomeAssistantMqttProtocolAdapterConfig,
} from './HomeAssistantMqttProtocolAdapter.js';

const testConfig: HomeAssistantMqttProtocolAdapterConfig = {
  id: 'test-ha-mqtt-01',
  brokerUrl: 'mqtt://localhost:1883',
  topicPrefix: 'homeassistant',
  deviceId: 'ha-home',
  entityMappings: [{ entityId: 'sensor.solar_power', metric: 'POWER_W', role: 'pv' }],
};

describe('HomeAssistantMqttProtocolAdapter', () => {
  let adapter: HomeAssistantMqttProtocolAdapter;

  beforeEach(async () => {
    vi.clearAllMocks();
    adapter = new HomeAssistantMqttProtocolAdapter(testConfig);
    await adapter.connect();
  });

  afterEach(async () => {
    await adapter.disconnect().catch(() => {
      /* ignore */
    });
  });

  it('has correct id and protocol', () => {
    expect(adapter.id).toBe('test-ha-mqtt-01');
    expect(adapter.protocol).toBe('homeassistant-mqtt');
  });

  it('yields datapoints from static entity state topics', async () => {
    const stream = adapter.getDataStream();
    const nextPromise = stream.next();

    mockClientInstance.emit(
      'message',
      'homeassistant/sensor/solar_power/state',
      Buffer.from('4200'),
    );

    const result = await nextPromise;
    await adapter.disconnect();

    expect(result.value).toMatchObject({
      protocol: 'homeassistant-mqtt',
      metric: 'POWER_W',
      role: 'pv',
      value: 4200,
      deviceId: 'ha-home:sensor.solar_power',
    });
  });

  it('discovers entities from MQTT discovery config payloads', async () => {
    const stream = adapter.getDataStream();
    const nextPromise = stream.next();

    mockClientInstance.emit(
      'message',
      'homeassistant/sensor/grid_power/config',
      Buffer.from(
        JSON.stringify({
          unique_id: 'sensor.grid_power',
          state_topic: 'homeassistant/sensor/grid_power/state',
          device_class: 'grid_power',
          unit_of_measurement: 'W',
        }),
      ),
    );

    mockClientInstance.emit(
      'message',
      'homeassistant/sensor/grid_power/state',
      Buffer.from('1500'),
    );

    const result = await nextPromise;
    await adapter.disconnect();

    expect(result.value?.role).toBe('grid');
    expect(result.value?.value).toBe(1500);
  });

  it('createHomeAssistantMqttAdapterFromEnv returns null without broker URL', () => {
    expect(createHomeAssistantMqttAdapterFromEnv({})).toBeNull();
    expect(
      createHomeAssistantMqttAdapterFromEnv({ HA_MQTT_BROKER_URL: 'mqtt://localhost:1883' }),
    ).not.toBeNull();
  });

  it('tracks repeated MQTT client errors after connect', async () => {
    mockClientInstance.emit('error', new Error('broker hiccup'));
    mockClientInstance.emit('error', new Error('broker hiccup again'));

    expect(recordAdapterError).toHaveBeenCalledTimes(2);
    const health = await adapter.healthCheck();
    expect(health.consecutiveErrors).toBe(2);
  });
});
