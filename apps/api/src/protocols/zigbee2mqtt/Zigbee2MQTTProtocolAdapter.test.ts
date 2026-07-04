/**
 * Zigbee2MQTTProtocolAdapter unit tests — mock mqtt client, no real broker.
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

import {
  createZigbee2MQTTAdapterFromEnv,
  Zigbee2MQTTProtocolAdapter,
  type Zigbee2MQTTProtocolAdapterConfig,
} from './Zigbee2MQTTProtocolAdapter.js';

const testConfig: Zigbee2MQTTProtocolAdapterConfig = {
  id: 'test-z2m-01',
  brokerUrl: 'mqtt://localhost:1883',
  baseTopic: 'zigbee2mqtt',
  deviceId: 'z2m-home',
  deviceMappings: [{ friendlyName: 'grid_meter', role: 'grid' }],
};

describe('Zigbee2MQTTProtocolAdapter', () => {
  let adapter: Zigbee2MQTTProtocolAdapter;

  beforeEach(async () => {
    vi.clearAllMocks();
    adapter = new Zigbee2MQTTProtocolAdapter(testConfig);
    await adapter.connect();
  });

  afterEach(async () => {
    await adapter.disconnect().catch(() => {
      /* ignore */
    });
  });

  it('has correct id and protocol', () => {
    expect(adapter.id).toBe('test-z2m-01');
    expect(adapter.protocol).toBe('zigbee2mqtt');
  });

  it('yields power datapoints from device state messages', async () => {
    const stream = adapter.getDataStream();
    const nextPromise = stream.next();

    mockClientInstance.emit(
      'message',
      'zigbee2mqtt/grid_meter',
      Buffer.from(JSON.stringify({ power: 1250 })),
      { retain: false },
    );

    const result = await nextPromise;
    await adapter.disconnect();

    expect(result.done).toBe(false);
    expect(result.value).toMatchObject({
      protocol: 'zigbee2mqtt',
      metric: 'POWER_W',
      role: 'grid',
      value: 1250,
      deviceId: 'z2m-home:grid_meter',
    });
  });

  it('auto-discovers energy devices from bridge/devices', async () => {
    const stream = adapter.getDataStream();
    const nextPromise = stream.next();

    mockClientInstance.emit(
      'message',
      'zigbee2mqtt/bridge/devices',
      Buffer.from(
        JSON.stringify([
          {
            friendly_name: 'heat_pump_plug',
            type: 'EndDevice',
            definition: {
              exposes: [
                { type: 'switch', name: 'state' },
                { type: 'numeric', name: 'power' },
              ],
            },
          },
        ]),
      ),
      { retain: false },
    );

    mockClientInstance.emit(
      'message',
      'zigbee2mqtt/heat_pump_plug',
      Buffer.from(JSON.stringify({ power: 800 })),
      { retain: false },
    );

    const result = await nextPromise;
    await adapter.disconnect();

    expect(result.value?.role).toBe('heatpump');
    expect(result.value?.value).toBe(800);
  });

  it('createZigbee2MQTTAdapterFromEnv returns null without broker URL', () => {
    expect(createZigbee2MQTTAdapterFromEnv({})).toBeNull();
    expect(
      createZigbee2MQTTAdapterFromEnv({ Z2M_BROKER_URL: 'mqtt://localhost:1883' }),
    ).not.toBeNull();
  });
});
