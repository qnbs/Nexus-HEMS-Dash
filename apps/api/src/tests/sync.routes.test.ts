import express from 'express';
import supertest from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const SECRET = 'nexus-hems-ci-fixture-jwt-signing-key-not-a-real-credential';

describe('GET /api/sync/version', () => {
  const prevEnv = { ...process.env };

  let createSyncRoutes: typeof import('../routes/sync.routes.js').createSyncRoutes;
  let signToken: typeof import('../jwt-utils.js').signToken;
  let getSyncVersion: typeof import('../data/sync-version-store.js').getSyncVersion;

  beforeAll(async () => {
    vi.resetModules();
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = SECRET;
    delete process.env.JWT_SECRET_NEW;

    const store = await import('../data/sync-version-store.js');
    store.resetSyncVersionForTests(42);
    getSyncVersion = store.getSyncVersion;

    createSyncRoutes = (await import('../routes/sync.routes.js')).createSyncRoutes;
    signToken = (await import('../jwt-utils.js')).signToken;
  }, 60_000);

  afterAll(() => {
    process.env = { ...prevEnv };
    vi.resetModules();
  });

  function buildApp() {
    const app = express();
    app.use(createSyncRoutes());
    return supertest(app);
  }

  it('rejects unauthenticated requests', async () => {
    await buildApp().get('/api/sync/version').expect(401);
  });

  it('returns the current sync version for authenticated clients', async () => {
    const bearer = await signToken({ sub: 'reader', scope: 'read' }, '1h');
    const res = await buildApp()
      .get('/api/sync/version')
      .set('Authorization', `Bearer ${bearer}`)
      .expect(200);

    expect(res.body).toEqual({ version: getSyncVersion() });
    expect(typeof res.body.version).toBe('number');
  });
});
