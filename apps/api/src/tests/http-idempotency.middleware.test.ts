import express from 'express';
import rateLimit from 'express-rate-limit';
import supertest from 'supertest';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { clearIdempotencyCacheForTests } from '../data/idempotency-cache.js';
import { resetSyncPersistenceForTests } from '../services/sync-persistence.js';

const SECRET = 'nexus-hems-ci-fixture-jwt-signing-key-not-a-real-credential';

describe('idempotencyMiddleware composite scope', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = SECRET;
  });

  afterEach(() => {
    clearIdempotencyCacheForTests();
    resetSyncPersistenceForTests();
  });

  async function buildApp() {
    vi.resetModules();
    const { idempotencyMiddleware } = await import('../middleware/idempotency.js');
    const { requireJWT } = await import('../middleware/auth.js');
    const { signToken } = await import('../jwt-utils.js');

    let hitCount = 0;
    const app = express();
    app.use(express.json());
    app.use(
      rateLimit({
        windowMs: 60_000,
        max: 1000,
        standardHeaders: true,
        legacyHeaders: false,
      }),
    );
    app.post('/api/a', requireJWT, idempotencyMiddleware, (_req, res) => {
      hitCount += 1;
      res.json({ route: 'a', hitCount });
    });
    app.post('/api/b', requireJWT, idempotencyMiddleware, (_req, res) => {
      res.json({ route: 'b' });
    });

    const tokenA = await signToken({ sub: 'user-a', scope: 'readwrite' }, '1h');
    const tokenB = await signToken({ sub: 'user-b', scope: 'readwrite' }, '1h');
    return { app: supertest(app), tokenA, tokenB };
  }

  it('replays same key + same body on the same route', async () => {
    const { app, tokenA } = await buildApp();
    const headers = {
      Authorization: `Bearer ${tokenA}`,
      'X-Idempotency-Key': 'dup-1',
    };
    const first = await app.post('/api/a').set(headers).send({ n: 1 }).expect(200);
    const second = await app.post('/api/a').set(headers).send({ n: 1 }).expect(200);
    expect(second.body).toEqual(first.body);
  });

  it('returns 409 when the same key is reused with a different body', async () => {
    const { app, tokenA } = await buildApp();
    const headers = {
      Authorization: `Bearer ${tokenA}`,
      'X-Idempotency-Key': 'dup-2',
    };
    await app.post('/api/a').set(headers).send({ n: 1 }).expect(200);
    await app.post('/api/a').set(headers).send({ n: 2 }).expect(409);
  });

  it('does not share cache across routes for the same client key', async () => {
    const { app, tokenA } = await buildApp();
    const headers = {
      Authorization: `Bearer ${tokenA}`,
      'X-Idempotency-Key': 'cross-route',
    };
    const onA = await app.post('/api/a').set(headers).send({ n: 5 }).expect(200);
    const onB = await app.post('/api/b').set(headers).send({ n: 5 }).expect(200);
    expect(onA.body.route).toBe('a');
    expect(onB.body.route).toBe('b');
  });

  it('does not share cache across principals', async () => {
    const { app, tokenA, tokenB } = await buildApp();
    const key = 'shared-key';
    const body = { n: 9 };
    const resA = await app
      .post('/api/a')
      .set({ Authorization: `Bearer ${tokenA}`, 'X-Idempotency-Key': key })
      .send(body)
      .expect(200);
    const resB = await app
      .post('/api/a')
      .set({ Authorization: `Bearer ${tokenB}`, 'X-Idempotency-Key': key })
      .send(body)
      .expect(200);
    expect(resA.body.hitCount).toBe(1);
    expect(resB.body.hitCount).toBe(2);
  });
});
