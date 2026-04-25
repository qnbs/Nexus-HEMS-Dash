/**
 * MqttAdapter unit tests
 * Uses a mock mqtt client to avoid real broker connections.
 */

import EventEmitter from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock mqtt before importing the adapter
// ---------------------------------------------------------------------------

class MockMqttClient extends EventEmitter {
  subscribe = vi.fn((_topic: string, _opts: unknown, cb?: (err: Error | null) => void) => {
    cb?.(null);
    return this;
  });
  end = vi.fn((_force: boolean, _opts: unknown, cb?: () => void) => {
    cb?.();
    return this;
  });
  publish = vi.fn();
}

let mockClientInstance: MockMqttClient;

vi.mock('mqtt', () => {
  return {
    default: {
      connect: vi.fn(() => {
        mockClientInstance = new MockMqttClient();
        // Emit 'connect' on next tick so adapter.connect() resolves
        setTimeout(() => mockClientInstance.emit('connect'), 0);
        return mockClientInstance;
      }),
    },
  };
});

import { MqttAdapter, type MqttAdapterConfig } from '../mqtt/MqttAdapter.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const testConfig: MqttAdapterConfig = {
  id: 'test-mqtt-01',
  protocol: 'victron-mqtt',
  brokerUrl: 'mqtt://localhost:1883',
  topicPatterns: [
    {
      pattern: 'N/+/system/+/Dc/Battery/Power',
      metric: 'POWER_W',
      deviceIdExtract: 'topic[1]',
    },
    {
      pattern: 'N/+/system/+/Dc/Battery/Soc',
      metric: 'SOC_PERCENT',
      deviceIdExtract: 'topic[1]',
    },
  ],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MqttAdapter', () => {
  let adapter: MqttAdapter;

  beforeEach(async () => {
    vi.clearAllMocks();
    adapter = new MqttAdapter(testConfig);
    await adapter.connect();
  });

  afterEach(async () => {
    await adapter.disconnect().catch(() => {
      /* ignore */
    });
  });

  it('has correct id and protocol', () => {
    expect(adapter.id).toBe('test-mqtt-01');
    expect(adapter.protocol).toBe('victron-mqtt');
  });

  it('reports healthy after connect', async () => {
    const health = await adapter.healthCheck();
    expect(health.status).toBe('healthy');
  });

  it('yields datapoint when matching topic message arrives', async () => {
    const stream = adapter.getDataStream();
    const dpPromise = stream.next();

    // Simulate incoming MQTT message
    const payload = Buffer.from(JSON.stringify({ value: 2750 }));
    mockClientInstance.emit('message', 'N/abc123/system/0/Dc/Battery/Power', payload);

    const result = await dpPromise;
    await adapter.disconnect();

    expect(result.done).toBe(false);
    expect(result.value?.metric).toBe('POWER_W');
    expect(result.value?.value).toBe(2750);
    expect(result.value?.deviceId).toBe('abc123');
    expect(result.value?.qualityIndicator).toBe('GOOD');
  });

  it('extracts deviceId from topic segment', async () => {
    const stream = adapter.getDataStream();
    const dpPromise = stream.next();

    const payload = Buffer.from('85.5');
    mockClientInstance.emit('message', 'N/device42/system/0/Dc/Battery/Soc', payload);

    const result = await dpPromise;
    await adapter.disconnect();

    expect(result.value?.deviceId).toBe('device42');
    expect(result.value?.metric).toBe('SOC_PERCENT');
    expect(result.value?.value).toBe(85.5);
  });

  it('routes unmatched topics to DLQ (no data yielded)', async () => {
    // Send a message on an unregistered topic
    const stream = adapter.getDataStream();
    let yielded = false;

    // Start listening but expect no data for 50ms
    const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 50));
    const dpPromise = stream.next().then(() => {
      yielded = true;
    });

    mockClientInstance.emit('message', 'unknown/topic/here', Buffer.from('123'));

    await timeoutPromise;
    await adapter.disconnect();

    // dpPromise may resolve after disconnect — that's fine, we only check yielded flag
    void dpPromise;
    expect(yielded).toBe(false);
  });

  it('handles numeric string payload', async () => {
    const stream = adapter.getDataStream();
    const dpPromise = stream.next();

    mockClientInstance.emit('message', 'N/abc/system/0/Dc/Battery/Power', Buffer.from('1234.56'));

    const result = await dpPromise;
    await adapter.disconnect();

    expect(result.value?.value).toBeCloseTo(1234.56);
  });
});
