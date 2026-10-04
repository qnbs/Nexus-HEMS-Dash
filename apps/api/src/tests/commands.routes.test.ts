import express from 'express';
import supertest from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { clearIdempotencyCacheForTests } from '../data/idempotency-cache.js';
import { resetPhysicalCommandLedgerForTests } from '../services/physical-command-ledger.js';
import { resetSyncPersistenceForTests } from '../services/sync-persistence.js';

const SECRET = 'nexus-hems-ci-fixture-jwt-signing-key-not-a-real-credential';

describe('commands routes', () => {
  const prevEnv = { ...process.env };

  let createCommandsRoutes: typeof import('../routes/commands.routes.js').createCommandsRoutes;
  let signToken: typeof import('../jwt-utils.js').signToken;
  let mockData: typeof import('../data/mock-data.js').mockData;

  beforeAll(async () => {
    vi.resetModules();
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = SECRET;
    delete process.env.JWT_SECRET_NEW;
    delete process.env.ADAPTER_MODE;
    delete process.env.ALLOW_LIVE_HARDWARE;

    createCommandsRoutes = (await import('../routes/commands.routes.js')).createCommandsRoutes;
    signToken = (await import('../jwt-utils.js')).signToken;
    mockData = (await import('../data/mock-data.js')).mockData;
  }, 60_000);

  afterEach(() => {
    clearIdempotencyCacheForTests();
    resetPhysicalCommandLedgerForTests();
    resetSyncPersistenceForTests();
    mockData.evPower = 0;
    mockData.batteryPower = -500;
    mockData.heatPumpPower = 800;
  });

  afterAll(() => {
    process.env = { ...prevEnv };
    vi.resetModules();
  });

  function buildApp() {
    const app = express();
    app.use(express.json());
    app.use(createCommandsRoutes());
    return supertest(app);
  }

  function replayEnvelope(idempotencyKey: string, createdAt = Date.now()) {
    return {
      commandId: '22222222-2222-4222-8222-222222222222',
      idempotencyKey,
      createdAt,
      expiresAt: createdAt + 300_000,
    };
  }

  it('POST /api/commands/replay requires authentication', async () => {
    await buildApp()
      .post('/api/commands/replay')
      .send({
        type: 'battery-control',
        payload: { powerW: 1000 },
        envelope: replayEnvelope('no-auth'),
      })
      .expect(401);
  });

  it('replays battery-control in mock mode', async () => {
    const bearer = await signToken({ sub: 'writer', scope: 'readwrite' }, '1h');
    const res = await buildApp()
      .post('/api/commands/replay')
      .set('Authorization', `Bearer ${bearer}`)
      .send({
        type: 'battery-control',
        payload: { powerW: 1500 },
        envelope: replayEnvelope('replay-battery-1'),
      })
      .expect(200);

    expect(res.body).toMatchObject({ ok: true, mode: 'mock', value: 1500 });
    expect(mockData.batteryPower).toBe(1500);
  });

  it('deduplicates replay via X-Idempotency-Key', async () => {
    const bearer = await signToken({ sub: 'writer', scope: 'readwrite' }, '1h');
    const agent = buildApp();
    const headers = {
      Authorization: `Bearer ${bearer}`,
      'X-Idempotency-Key': 'replay-dedupe-1',
    };

    const envelope = replayEnvelope('replay-dedupe-1');
    const body = {
      type: 'ev-control' as const,
      payload: { currentA: 10 },
      envelope,
    };
    const first = await agent.post('/api/commands/replay').set(headers).send(body).expect(200);
    mockData.evPower = 9999;
    const second = await agent.post('/api/commands/replay').set(headers).send(body).expect(200);

    expect(second.body).toEqual(first.body);
    expect(mockData.evPower).toBe(9999);
  });

  it('returns unknown outcome and blocks duplicate dispatch when live handler throws', async () => {
    process.env.ADAPTER_MODE = 'live';
    process.env.ALLOW_LIVE_HARDWARE = 'true';

    vi.resetModules();
    const router = await import('../protocols/ProtocolCommandRouter.js');
    const dispatchSpy = vi.spyOn(router, 'dispatchProtocolCommand').mockResolvedValue({
      handled: true,
      success: false,
      dispatchOutcome: 'unknown',
      error: 'transport dropped mid-flight',
    });
    const { createCommandsRoutes: createLiveRoutes } = await import('../routes/commands.routes.js');

    const bearer = await signToken({ sub: 'writer', scope: 'readwrite' }, '1h');
    const envelope = replayEnvelope('replay-unknown-1');
    const body = {
      type: 'battery-control' as const,
      payload: { powerW: 1200 },
      envelope,
    };

    const app = express();
    app.use(express.json());
    app.use(createLiveRoutes());
    const agent = supertest(app);
    const first = await agent
      .post('/api/commands/replay')
      .set('Authorization', `Bearer ${bearer}`)
      .set('X-Idempotency-Key', 'replay-unknown-1')
      .send(body)
      .expect(409);

    expect(first.body).toMatchObject({ outcome: 'unknown', commandId: envelope.commandId });

    mockData.batteryPower = 7777;
    const second = await agent
      .post('/api/commands/replay')
      .set('Authorization', `Bearer ${bearer}`)
      .set('X-Idempotency-Key', 'replay-unknown-1')
      .send(body)
      .expect(409);

    expect(second.body).toEqual(first.body);
    expect(mockData.batteryPower).toBe(7777);

    dispatchSpy.mockRestore();
    delete process.env.ADAPTER_MODE;
    delete process.env.ALLOW_LIVE_HARDWARE;
  });
});
