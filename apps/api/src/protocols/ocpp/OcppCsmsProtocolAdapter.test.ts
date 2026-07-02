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
});
