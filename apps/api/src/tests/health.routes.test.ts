import type { Express } from 'express';
import express from 'express';
import supertest from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { computeAdapterHealth } from '../protocols/index.js';
import { createHealthRoutes } from '../routes/health.routes.js';

describe('GET /api/health', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(createHealthRoutes());
  });

  it('returns 200 healthy in mock mode', async () => {
    const originalMode = process.env.ADAPTER_MODE;
    process.env.ADAPTER_MODE = 'mock';
    try {
      const res = await supertest(app).get('/api/health').expect(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.mode).toBe('mock');
      expect(res.body.adapters).toEqual([]);
    } finally {
      if (originalMode === undefined) delete process.env.ADAPTER_MODE;
      else process.env.ADAPTER_MODE = originalMode;
    }
  });

  it('returns 503 unhealthy when live mode has no configured adapters', async () => {
    const originalMode = process.env.ADAPTER_MODE;
    const originalAllow = process.env.ALLOW_LIVE_HARDWARE;
    process.env.ADAPTER_MODE = 'live';
    process.env.ALLOW_LIVE_HARDWARE = 'true';
    try {
      const res = await supertest(app).get('/api/health').expect(503);
      expect(res.body.status).toBe('unhealthy');
      expect(res.body.mode).toBe('live');
    } finally {
      if (originalMode === undefined) delete process.env.ADAPTER_MODE;
      else process.env.ADAPTER_MODE = originalMode;
      if (originalAllow === undefined) delete process.env.ALLOW_LIVE_HARDWARE;
      else process.env.ALLOW_LIVE_HARDWARE = originalAllow;
    }
  });

  it('stays healthy when live is requested without ALLOW_LIVE_HARDWARE', async () => {
    const originalMode = process.env.ADAPTER_MODE;
    const originalAllow = process.env.ALLOW_LIVE_HARDWARE;
    process.env.ADAPTER_MODE = 'live';
    delete process.env.ALLOW_LIVE_HARDWARE;
    try {
      const res = await supertest(app).get('/api/health').expect(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.mode).toBe('mock');
    } finally {
      if (originalMode === undefined) delete process.env.ADAPTER_MODE;
      else process.env.ADAPTER_MODE = originalMode;
      if (originalAllow === undefined) delete process.env.ALLOW_LIVE_HARDWARE;
      else process.env.ALLOW_LIVE_HARDWARE = originalAllow;
    }
  });
});

describe('computeAdapterHealth', () => {
  it('treats mock mode as healthy regardless of adapter list', () => {
    const summary = computeAdapterHealth('mock', [
      { id: 'a', protocol: 'modbus-sunspec', status: 'failed' },
    ]);
    expect(summary.overall).toBe('healthy');
  });

  it('marks live mode with no adapters as unhealthy', () => {
    const summary = computeAdapterHealth('live', []);
    expect(summary.overall).toBe('unhealthy');
  });

  it('marks live mode as unhealthy when any adapter failed', () => {
    const summary = computeAdapterHealth('live', [
      { id: 'm1', protocol: 'modbus-sunspec', status: 'healthy' },
      { id: 'm2', protocol: 'modbus-sunspec', status: 'failed', error: 'Connection refused' },
    ]);
    expect(summary.overall).toBe('unhealthy');
  });

  it('marks live mode as degraded when adapters are starting', () => {
    const summary = computeAdapterHealth('live', [
      { id: 'm1', protocol: 'modbus-sunspec', status: 'healthy' },
      { id: 'm2', protocol: 'modbus-sunspec', status: 'starting' },
    ]);
    expect(summary.overall).toBe('degraded');
  });

  it('marks live mode as healthy when all adapters are healthy', () => {
    const summary = computeAdapterHealth('live', [
      { id: 'm1', protocol: 'modbus-sunspec', status: 'healthy' },
      { id: 'mqtt-1', protocol: 'victron-mqtt', status: 'healthy' },
    ]);
    expect(summary.overall).toBe('healthy');
  });
});
