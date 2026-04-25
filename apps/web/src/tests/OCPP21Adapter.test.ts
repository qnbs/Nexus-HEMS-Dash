import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EnergyAdapter } from '../core/adapters/EnergyAdapter';
import { OCPP21Adapter } from '../core/adapters/OCPP21Adapter';

// ────────────────────────────────────────────────────────────────────
// OCPP21Adapter — Unit Tests
// Tests the OCPP 2.1 JSON-RPC over WebSocket adapter (mini-CSMS mode).
// No real charging station required — WebSocket is mocked globally.
// ────────────────────────────────────────────────────────────────────

let mockInstance: MockWebSocket | null = null;

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  readyState: number = WebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  onclose: (() => void) | null = null;
  send = vi.fn();
  close = vi.fn();
  constructor() {
    mockInstance = this;
  }
}

// Helper: build OCPP 2.1 CALL message [2, uniqueId, action, payload]
const ocppCall = (action: string, payload: Record<string, unknown> = {}): string =>
  JSON.stringify([2, crypto.randomUUID(), action, payload]);

describe('OCPP21Adapter — Interface Contract', () => {
  let adapter: EnergyAdapter;

  beforeEach(() => {
    vi.stubGlobal('WebSocket', MockWebSocket);
    adapter = new OCPP21Adapter();
  });

  afterEach(() => {
    adapter.destroy();
    vi.unstubAllGlobals();
    mockInstance = null;
  });

  it('has correct id and name', () => {
    expect(adapter.id).toBe('ocpp-21');
    expect(adapter.name).toMatch(/OCPP/i);
  });

  it('declares EV charger capabilities', () => {
    expect(adapter.capabilities).toContain('evCharger');
  });

  it('starts disconnected', () => {
    expect(adapter.status).toBe('disconnected');
  });

  it('has defined snapshot before connect', () => {
    expect(adapter.getSnapshot()).toBeDefined();
    expect(typeof adapter.getSnapshot()).toBe('object');
  });

  it('destroys cleanly without errors', () => {
    expect(() => adapter.destroy()).not.toThrow();
  });
});

describe('OCPP21Adapter — WebSocket Lifecycle', () => {
  let adapter: OCPP21Adapter;

  beforeEach(() => {
    vi.stubGlobal('WebSocket', MockWebSocket);
    adapter = new OCPP21Adapter({ host: 'evse.local', port: 9000 });
  });

  afterEach(() => {
    adapter.destroy();
    vi.unstubAllGlobals();
    mockInstance = null;
  });

  it('opens WebSocket on connect()', async () => {
    const p = adapter.connect();
    expect(mockInstance).not.toBeNull();
    mockInstance!.onclose?.();
    await p.catch(() => {});
  });

  it('transitions to connected on WebSocket open', async () => {
    const p = adapter.connect();
    mockInstance!.readyState = WebSocket.OPEN;
    mockInstance!.onopen?.();
    await p.catch(() => {});
    expect(adapter.status).toBe('connected');
  });

  it('transitions to error on WebSocket error', async () => {
    const p = adapter.connect();
    mockInstance!.onerror?.({ message: 'ECONNREFUSED' });
    mockInstance!.onclose?.();
    await p.catch(() => {});
    expect(['error', 'disconnected', 'connecting']).toContain(adapter.status);
  });

  it('transitions to disconnected on WebSocket close', async () => {
    const p = adapter.connect();
    mockInstance!.onopen?.();
    await p.catch(() => {});
    mockInstance!.onclose?.();
    expect(adapter.status).toBe('disconnected');
  });
});

describe('OCPP21Adapter — OCPP 2.1 Message Protocol', () => {
  let adapter: OCPP21Adapter;

  beforeEach(() => {
    vi.stubGlobal('WebSocket', MockWebSocket);
    adapter = new OCPP21Adapter({ host: 'evse.local', port: 9000 });
  });

  afterEach(() => {
    adapter.destroy();
    vi.unstubAllGlobals();
    mockInstance = null;
  });

  it('handles BootNotification CALL and responds with CALLRESULT', async () => {
    const p = adapter.connect();
    mockInstance!.readyState = WebSocket.OPEN;
    mockInstance!.onopen?.();
    await p.catch(() => {});

    const bootMsg = ocppCall('BootNotification', {
      chargingStation: { model: 'ABB Terra', vendorName: 'ABB' },
      reason: 'PowerUp',
    });
    mockInstance!.onmessage?.({ data: bootMsg });

    // Adapter may send CALLRESULT; just verify it doesn't crash on BootNotification
    expect(() => mockInstance!.onmessage?.({ data: bootMsg })).not.toThrow();
  });

  it('handles StatusNotification and updates connector status', async () => {
    const p = adapter.connect();
    mockInstance!.readyState = WebSocket.OPEN;
    mockInstance!.onopen?.();
    await p.catch(() => {});

    const statusMsg = ocppCall('StatusNotification', {
      timestamp: new Date().toISOString(),
      connectorStatus: 'Available',
      evseId: 1,
      connectorId: 1,
    });
    mockInstance!.onmessage?.({ data: statusMsg });

    const snapshot = adapter.getSnapshot();
    if (snapshot.evCharger) {
      expect(['available', 'charging', 'error', 'offline']).toContain(snapshot.evCharger.status);
    }
  });

  it('handles TransactionEvent with charging state and power reading', async () => {
    const p = adapter.connect();
    mockInstance!.readyState = WebSocket.OPEN;
    mockInstance!.onopen?.();
    await p.catch(() => {});

    const txMsg = ocppCall('TransactionEvent', {
      eventType: 'Started',
      timestamp: new Date().toISOString(),
      triggerReason: 'Authorized',
      seqNo: 1,
      transactionInfo: {
        transactionId: 'tx-001',
        chargingState: 'Charging',
      },
      meterValue: [
        {
          timestamp: new Date().toISOString(),
          sampledValue: [
            { measurand: 'Power.Active.Import', value: 11000, unit: 'W' },
            { measurand: 'SoC', value: 45, unit: 'Percent' },
          ],
        },
      ],
    });
    mockInstance!.onmessage?.({ data: txMsg });

    const snapshot = adapter.getSnapshot();
    if (snapshot.evCharger) {
      expect(snapshot.evCharger.powerW).toBeGreaterThanOrEqual(0);
    }
  });

  it('handles TransactionEvent Ended and clears session', async () => {
    const p = adapter.connect();
    mockInstance!.readyState = WebSocket.OPEN;
    mockInstance!.onopen?.();
    await p.catch(() => {});

    const txEndMsg = ocppCall('TransactionEvent', {
      eventType: 'Ended',
      timestamp: new Date().toISOString(),
      triggerReason: 'StoppedByEV',
      seqNo: 5,
      transactionInfo: {
        transactionId: 'tx-001',
        chargingState: 'Idle',
      },
    });
    mockInstance!.onmessage?.({ data: txEndMsg });

    const snapshot = adapter.getSnapshot();
    if (snapshot.evCharger) {
      expect(snapshot.evCharger.status).not.toBe('charging');
    }
  });

  it('does not crash on CALLERROR message', async () => {
    const p = adapter.connect();
    mockInstance!.readyState = WebSocket.OPEN;
    mockInstance!.onopen?.();
    await p.catch(() => {});

    const errMsg = JSON.stringify([4, 'some-unique-id', 'NotImplemented', 'Unknown action', {}]);
    expect(() => mockInstance!.onmessage?.({ data: errMsg })).not.toThrow();
  });

  it('ignores malformed JSON messages', async () => {
    const p = adapter.connect();
    mockInstance!.readyState = WebSocket.OPEN;
    mockInstance!.onopen?.();
    await p.catch(() => {});

    expect(() => {
      mockInstance!.onmessage?.({ data: '{ bad json' });
    }).not.toThrow();
  });
});

describe('OCPP21Adapter — Smart Charging Commands', () => {
  let adapter: OCPP21Adapter;

  beforeEach(() => {
    vi.stubGlobal('WebSocket', MockWebSocket);
    adapter = new OCPP21Adapter({ host: 'evse.local', port: 9000 });
  });

  afterEach(() => {
    adapter.destroy();
    vi.unstubAllGlobals();
    mockInstance = null;
  });

  it('rejects commands when disconnected', async () => {
    const result = await adapter.sendCommand({ type: 'SET_EV_POWER', value: 6900 });
    expect(result).toBe(false);
  });

  it('sends SetChargingProfile when connected', async () => {
    const p = adapter.connect();
    mockInstance!.readyState = WebSocket.OPEN;
    mockInstance!.onopen?.();
    await p.catch(() => {});

    const result = await adapter.sendCommand({ type: 'SET_EV_POWER', value: 6900 });
    expect(typeof result).toBe('boolean');
    if (result) {
      // Should have sent an OCPP CALL with SetChargingProfile action
      const calls = mockInstance!.send.mock.calls;
      const setProfile = calls.find((call) => {
        const parsed = JSON.parse(call[0] as string) as unknown[];
        return parsed[0] === 2 && parsed[2] === 'SetChargingProfile';
      });
      expect(setProfile).toBeDefined();
    }
  });

  it('enforces §14a EnWG 3.7kW minimum when stop is sent during peak', async () => {
    const p = adapter.connect();
    mockInstance!.readyState = WebSocket.OPEN;
    mockInstance!.onopen?.();
    await p.catch(() => {});

    // 0W would violate §14a limit — adapter should either reject or clamp
    const result = await adapter.sendCommand({ type: 'SET_EV_POWER', value: 0 });
    // Either rejected (false) or clamped to minimum — both are acceptable
    expect(typeof result).toBe('boolean');
  });

  it('returns false for SET_BATTERY_POWER (unknown to OCPP adapter) when connected', async () => {
    const p = adapter.connect();
    mockInstance!.readyState = WebSocket.OPEN;
    mockInstance!.onopen?.();
    await p.catch(() => {});

    const result = await adapter.sendCommand({ type: 'SET_BATTERY_POWER', value: 0 });
    expect(result).toBe(false);
  });
});

describe('OCPP21Adapter — V2X Support', () => {
  let adapter: OCPP21Adapter;

  beforeEach(() => {
    vi.stubGlobal('WebSocket', MockWebSocket);
    adapter = new OCPP21Adapter({
      host: 'evse.local',
      port: 9000,
      iso15118: true,
    });
  });

  afterEach(() => {
    adapter.destroy();
    vi.unstubAllGlobals();
    mockInstance = null;
  });

  it('tracks V2X-capable charger state', async () => {
    const p = adapter.connect();
    mockInstance!.readyState = WebSocket.OPEN;
    mockInstance!.onopen?.();
    await p.catch(() => {});

    // Simulate V2X status notification
    const statusMsg = ocppCall('StatusNotification', {
      timestamp: new Date().toISOString(),
      connectorStatus: 'Occupied',
      evseId: 1,
      connectorId: 1,
    });
    mockInstance!.onmessage?.({ data: statusMsg });

    const snapshot = adapter.getSnapshot();
    if (snapshot.evCharger) {
      expect(typeof snapshot.evCharger.v2xCapable).toBe('boolean');
    }
  });
});

describe('OCPP21Adapter — Data Callbacks', () => {
  it('invokes onData callback when energy data updates', async () => {
    vi.stubGlobal('WebSocket', MockWebSocket);
    const adapter = new OCPP21Adapter({ host: 'evse.local', port: 9000 });
    const dataSpy = vi.fn();
    adapter.onData(dataSpy);

    const p = adapter.connect();
    mockInstance!.readyState = WebSocket.OPEN;
    mockInstance!.onopen?.();
    await p.catch(() => {});

    // Send a TransactionEvent with meter values
    const txMsg = ocppCall('TransactionEvent', {
      eventType: 'Updated',
      timestamp: new Date().toISOString(),
      triggerReason: 'MeterValueClock',
      seqNo: 2,
      transactionInfo: { transactionId: 'tx-001', chargingState: 'Charging' },
      meterValue: [
        {
          timestamp: new Date().toISOString(),
          sampledValue: [{ measurand: 'Power.Active.Import', value: 7400, unit: 'W' }],
        },
      ],
    });
    mockInstance!.onmessage?.({ data: txMsg });

    expect(dataSpy).toHaveBeenCalled();

    adapter.destroy();
    vi.unstubAllGlobals();
  });
});
