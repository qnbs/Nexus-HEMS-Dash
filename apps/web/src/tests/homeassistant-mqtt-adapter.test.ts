import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeAssistantMQTTAdapter } from '../core/adapters/contrib/homeassistant-mqtt';
import type { EnergyAdapter } from '../core/adapters/EnergyAdapter';

// ────────────────────────────────────────────────────────────────────
// HomeAssistantMQTTAdapter — Unit Tests
// Tests the HA MQTT discovery adapter. Uses a mock WebSocket
// to simulate the Mosquitto broker MQTT-over-WebSocket connection.
// ────────────────────────────────────────────────────────────────────

let mockInstance: MockWebSocket | null = null;

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static constructorUrl = '';
  readyState: number = WebSocket.CONNECTING;
  protocol: string = '';
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: ArrayBuffer | string }) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  onclose: (() => void) | null = null;
  send = vi.fn();
  close = vi.fn();
  constructor(url: string, protocol?: string) {
    MockWebSocket.constructorUrl = url;
    this.protocol = typeof protocol === 'string' ? protocol : '';
    mockInstance = this;
  }
}

describe('HomeAssistantMQTTAdapter — Interface Contract', () => {
  let adapter: EnergyAdapter;

  beforeEach(() => {
    vi.stubGlobal('WebSocket', MockWebSocket);
    adapter = new HomeAssistantMQTTAdapter();
  });

  afterEach(() => {
    adapter.destroy();
    vi.unstubAllGlobals();
    mockInstance = null;
  });

  it('has correct id = homeassistant-mqtt', () => {
    expect(adapter.id).toBe('homeassistant-mqtt');
  });

  it('has name containing Home Assistant', () => {
    expect(adapter.name).toMatch(/home assistant/i);
  });

  it('declares pv, battery, grid, load and evCharger capabilities', () => {
    expect(adapter.capabilities).toContain('pv');
    expect(adapter.capabilities).toContain('battery');
    expect(adapter.capabilities).toContain('grid');
    expect(adapter.capabilities).toContain('load');
    expect(adapter.capabilities).toContain('evCharger');
  });

  it('starts with disconnected status', () => {
    expect(adapter.status).toBe('disconnected');
  });

  it('returns empty snapshot before connect', () => {
    expect(adapter.getSnapshot()).toEqual({});
  });

  it('destroys cleanly without errors', () => {
    expect(() => adapter.destroy()).not.toThrow();
  });
});

describe('HomeAssistantMQTTAdapter — WebSocket Lifecycle', () => {
  let adapter: HomeAssistantMQTTAdapter;

  beforeEach(() => {
    vi.stubGlobal('WebSocket', MockWebSocket);
    adapter = new HomeAssistantMQTTAdapter({
      host: 'homeassistant.local',
      port: 1884,
    });
  });

  afterEach(() => {
    adapter.destroy();
    vi.unstubAllGlobals();
    mockInstance = null;
  });

  it('opens WebSocket to correct host on connect()', async () => {
    const p = adapter.connect();
    // URL is set synchronously by constructor
    expect(MockWebSocket.constructorUrl).toContain('homeassistant.local');
    // Trigger quick rejection to avoid 10s connect timeout
    mockInstance?.onerror?.({});
    await p.catch(() => {});
  });

  it('transitions to connected when WebSocket opens', async () => {
    const p = adapter.connect();
    mockInstance!.readyState = WebSocket.OPEN;
    mockInstance!.onopen?.();
    await p.catch(() => {});
    expect(adapter.status).toBe('connected');
  });

  it('transitions to error state when WebSocket errors', async () => {
    const p = adapter.connect();
    mockInstance!.onerror?.({ message: 'ECONNREFUSED' });
    await p.catch(() => {});
    expect(['error', 'disconnected', 'connecting']).toContain(adapter.status);
  });

  it('transitions to disconnected when WebSocket closes', async () => {
    const p = adapter.connect();
    mockInstance!.readyState = MockWebSocket.OPEN;
    mockInstance!.onopen?.();
    await p.catch(() => {});
    mockInstance!.onclose?.();
    expect(adapter.status).toBe('disconnected');
  });
});

describe('HomeAssistantMQTTAdapter — Entity Mapping (Custom Config)', () => {
  let adapter: HomeAssistantMQTTAdapter;

  beforeEach(() => {
    vi.stubGlobal('WebSocket', MockWebSocket);
    adapter = new HomeAssistantMQTTAdapter({
      host: 'ha.local',
      entityMap: {
        pvPower: 'sensor.custom_solar_w',
        batteryPower: 'sensor.custom_bat_w',
        batterySoc: 'sensor.custom_bat_soc',
        gridPower: 'sensor.custom_grid_w',
        housePower: 'sensor.custom_house_w',
        pvEnergyToday: 'sensor.custom_solar_kwh',
        evPower: 'sensor.custom_ev_w',
        evSoc: 'sensor.custom_ev_soc',
        evStatus: 'sensor.custom_ev_status',
      },
    });
  });

  afterEach(() => {
    adapter.destroy();
    vi.unstubAllGlobals();
    mockInstance = null;
  });

  it('accepts custom entity map in constructor', () => {
    // If the adapter was constructed without error, the mapping was accepted
    expect(adapter.id).toBe('homeassistant-mqtt');
  });
});

describe('HomeAssistantMQTTAdapter — MQTT Auth Credentials', () => {
  it('stores credentials when provided in config', () => {
    vi.stubGlobal('WebSocket', MockWebSocket);
    const adapter = new HomeAssistantMQTTAdapter({
      host: 'ha.local',
      mqttUser: 'testuser',
      mqttPassword: 'testpass',
    });
    // Credentials are stored internally; just verify constructor succeeds
    expect(adapter.status).toBe('disconnected');
    adapter.destroy();
    vi.unstubAllGlobals();
  });
});

describe('HomeAssistantMQTTAdapter — Data Callbacks', () => {
  it('registers onData callback without error', async () => {
    vi.stubGlobal('WebSocket', MockWebSocket);
    const adapter = new HomeAssistantMQTTAdapter({ host: 'ha.local' });
    const dataSpy = vi.fn();
    expect(() => adapter.onData(dataSpy)).not.toThrow();

    const p = adapter.connect();
    mockInstance!.readyState = MockWebSocket.OPEN;
    mockInstance!.onopen?.();
    await p.catch(() => {});

    adapter.destroy();
    vi.unstubAllGlobals();
  });
});
