/**
 * OcppCsmsProtocolAdapter unit tests — real WebSocket client against ephemeral CSMS port.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import {
  createOcppCsmsAdapterFromEnv,
  OcppCsmsProtocolAdapter,
} from './OcppCsmsProtocolAdapter.js';

describe('OcppCsmsProtocolAdapter', () => {
  let adapter: OcppCsmsProtocolAdapter;
  let boundPort: number;

  beforeEach(async () => {
    adapter = new OcppCsmsProtocolAdapter({ id: 'test-csms', port: 0 });
    await adapter.connect();
    boundPort = adapter.getBoundPort() ?? 0;
    expect(boundPort).toBeGreaterThan(0);
  });

  afterEach(async () => {
    await adapter.disconnect();
  });

  it('has correct id and protocol', () => {
    expect(adapter.id).toBe('test-csms');
    expect(adapter.protocol).toBe('ocpp');
  });

  it('reports healthy when listening', async () => {
    const health = await adapter.healthCheck();
    expect(health.status).toBe('healthy');
  });

  it('responds to BootNotification and emits power from TransactionEvent', async () => {
    const stream = adapter.getDataStream();
    const dpPromise = stream.next();

    const client = new WebSocket(`ws://127.0.0.1:${boundPort}/CP-TEST-01`, 'ocpp2.0.1');
    await new Promise<void>((resolve, reject) => {
      client.once('open', () => resolve());
      client.once('error', reject);
    });

    const bootId = 'boot-1';
    client.send(
      JSON.stringify([
        2,
        bootId,
        'BootNotification',
        {
          chargingStation: {
            model: 'TestEVSE',
            vendorName: 'Test',
            serialNumber: 'CP-TEST-01',
          },
          reason: 'PowerUp',
        },
      ]),
    );

    const bootResult = await new Promise<unknown>((resolve) => {
      client.once('message', (data) => resolve(JSON.parse(String(data))));
    });
    expect(bootResult).toEqual([
      3,
      bootId,
      expect.objectContaining({ status: 'Accepted', interval: 300 }),
    ]);

    const txId = 'tx-1';
    client.send(
      JSON.stringify([
        2,
        txId,
        'TransactionEvent',
        {
          eventType: 'Updated',
          meterValue: [
            {
              timestamp: new Date().toISOString(),
              sampledValue: [{ measurand: 'Power.Active.Import', value: 7200, unit: 'W' }],
            },
          ],
        },
      ]),
    );

    await new Promise<void>((resolve) => {
      client.once('message', () => resolve());
    });

    const next = await dpPromise;
    expect(next.value?.role).toBe('ev');
    expect(next.value?.metric).toBe('POWER_W');
    expect(next.value?.value).toBe(7200);
    expect(next.value?.deviceId).toBe('CP-TEST-01');

    client.close();
  });

  it('createOcppCsmsAdapterFromEnv returns null without OCPP_CSMS_PORT', () => {
    expect(createOcppCsmsAdapterFromEnv({})).toBeNull();
  });

  it('createOcppCsmsAdapterFromEnv builds adapter from env', () => {
    const a = createOcppCsmsAdapterFromEnv({
      OCPP_CSMS_PORT: '9000',
      OCPP_CSMS_ADAPTER_ID: 'csms-edge',
    });
    expect(a?.id).toBe('csms-edge');
    expect(a?.protocol).toBe('ocpp');
  });

  it('supports EV command types', () => {
    expect(adapter.supportsCommand('SET_EV_POWER')).toBe(true);
    expect(adapter.supportsCommand('SET_BATTERY_POWER')).toBe(false);
  });

  it('sends SetChargingProfile on SET_EV_POWER when a charge point is connected', async () => {
    const client = new WebSocket(`ws://127.0.0.1:${boundPort}/CP-CMD-01`, 'ocpp2.0.1');
    await new Promise<void>((resolve, reject) => {
      client.once('open', () => resolve());
      client.once('error', reject);
    });

    const outbound = new Promise<unknown>((resolve) => {
      client.once('message', (data) => resolve(JSON.parse(String(data))));
    });

    const result = await adapter.sendCommand({ type: 'SET_EV_POWER', value: 7200 });
    expect(result).toEqual({ handled: true, success: true, adapterId: 'test-csms' });

    const msg = (await outbound) as [number, string, string, Record<string, unknown>];
    expect(msg[0]).toBe(2);
    expect(msg[2]).toBe('SetChargingProfile');
    expect(msg[3].evseId).toBe(1);

    client.close();
  });

  it('returns error when no charge point is connected', async () => {
    const result = await adapter.sendCommand({ type: 'START_CHARGING', value: true });
    expect(result.handled).toBe(true);
    expect(result.success).toBe(false);
    expect(result.error).toContain('No charge point');
  });

  it('sends RequestStartTransaction on START_CHARGING', async () => {
    const client = new WebSocket(`ws://127.0.0.1:${boundPort}/CP-START`, 'ocpp2.0.1');
    await new Promise<void>((resolve, reject) => {
      client.once('open', () => resolve());
      client.once('error', reject);
    });

    const outbound = new Promise<unknown>((resolve) => {
      client.once('message', (data) => resolve(JSON.parse(String(data))));
    });

    const result = await adapter.sendCommand({ type: 'START_CHARGING', value: true });
    expect(result.success).toBe(true);

    const msg = (await outbound) as [number, string, string, Record<string, unknown>];
    expect(msg[2]).toBe('RequestStartTransaction');
    client.close();
  });

  it('sends SetChargingProfile with amps on SET_EV_CURRENT', async () => {
    const client = new WebSocket(`ws://127.0.0.1:${boundPort}/CP-AMP`, 'ocpp2.0.1');
    await new Promise<void>((resolve, reject) => {
      client.once('open', () => resolve());
      client.once('error', reject);
    });

    const outbound = new Promise<unknown>((resolve) => {
      client.once('message', (data) => resolve(JSON.parse(String(data))));
    });

    const result = await adapter.sendCommand({ type: 'SET_EV_CURRENT', value: 16 });
    expect(result.success).toBe(true);

    const msg = (await outbound) as [number, string, string, Record<string, unknown>];
    expect(msg[2]).toBe('SetChargingProfile');
    const schedule = (
      msg[3].chargingProfile as { chargingSchedule: { chargingRateUnit: string }[] }
    ).chargingSchedule[0];
    expect(schedule?.chargingRateUnit).toBe('A');
    client.close();
  });

  it('sends RequestStopTransaction when a transaction is active', async () => {
    const client = new WebSocket(`ws://127.0.0.1:${boundPort}/CP-STOP`, 'ocpp2.0.1');
    await new Promise<void>((resolve, reject) => {
      client.once('open', () => resolve());
      client.once('error', reject);
    });

    client.send(
      JSON.stringify([
        2,
        'tx-open',
        'TransactionEvent',
        { eventType: 'Started', transactionInfo: { transactionId: 'tx-42' } },
      ]),
    );
    await new Promise<void>((resolve) => {
      client.once('message', () => resolve());
    });

    const outbound = new Promise<unknown>((resolve) => {
      client.once('message', (data) => resolve(JSON.parse(String(data))));
    });

    const result = await adapter.sendCommand({ type: 'STOP_CHARGING', value: true });
    expect(result.success).toBe(true);

    const msg = (await outbound) as [number, string, string, Record<string, unknown>];
    expect(msg[2]).toBe('RequestStopTransaction');
    expect(msg[3].transactionId).toBe('tx-42');
    client.close();
  });

  it('rejects invalid SET_EV_POWER values', async () => {
    const client = new WebSocket(`ws://127.0.0.1:${boundPort}/CP-INVALID`, 'ocpp2.0.1');
    await new Promise<void>((resolve, reject) => {
      client.once('open', () => resolve());
      client.once('error', reject);
    });

    const result = await adapter.sendCommand({ type: 'SET_EV_POWER', value: Number.NaN });
    expect(result.success).toBe(false);
    client.close();
  });
});
