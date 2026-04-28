import { readFileSync } from 'node:fs';
import path from 'node:path';
import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import { eventBus } from './core/EventBus.js';
import { logger } from './core/logger.js';
import { initKeys } from './jwt-utils.js';
import {
  configureCors,
  configureHelmet,
  configureRateLimiting,
  configureRequestTracking,
} from './middleware/security.js';
import { startProtocolAdapters, stopProtocolAdapters } from './protocols/index.js';
import { createAuthRoutes } from './routes/auth.routes.js';
import { createEebusRoutes } from './routes/eebus.routes.js';
import { createGrafanaRoutes } from './routes/grafana.routes.js';
import { createHistoryRoutes } from './routes/history.routes.js';
import { createMetricsRoutes } from './routes/metrics.routes.js';
import { createOpenADRRoutes } from './routes/openadr.routes.js';
import { EnergyRouterService } from './services/EnergyRouterService.js';
import { TimeseriesService } from './services/TimeseriesService.js';
import { setupWebSocket } from './ws/energy.ws.js';

export async function startServer(): Promise<void> {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isDev = process.env.NODE_ENV !== 'production';

  // ─── JWT Key Initialization ───────────────────────────────────────
  initKeys();

  // ─── Security Middleware ──────────────────────────────────────────
  configureCors(app);
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  configureRequestTracking(app);

  // Extract build-time nonce baked into the production index.html so the
  // HTTP CSP header can include it and allow Vite's inline theme-loader /
  // SPA-redirect / recovery-UI scripts (HTTP header overrides meta CSP).
  let buildNonce: string | undefined;
  if (!isDev) {
    try {
      const webDist = path.resolve(process.env.WEB_DIST_PATH ?? '../web/dist');
      const html = readFileSync(path.join(webDist, 'index.html'), 'utf8');
      buildNonce = html.match(/'nonce-([^']+)'/)?.[1];
    } catch {
      // Built HTML not available yet — inline scripts will be blocked until
      // the web package is built and WEB_DIST_PATH is set correctly.
    }
  }

  configureHelmet(app, isDev, buildNonce);
  configureRateLimiting(app, isDev);

  // Parse JSON for POST routes
  app.use(express.json({ limit: '10kb' }));

  // ─── HTTP Server + WebSocket ──────────────────────────────────────
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, maxPayload: 64 * 1024 });

  // ─── Routes ───────────────────────────────────────────────────────
  app.use(createAuthRoutes());
  app.use(createEebusRoutes());
  app.use(createOpenADRRoutes());
  app.use(createMetricsRoutes(wss));
  app.use(createGrafanaRoutes());
  app.use('/api/v1', createHistoryRoutes());

  // ─── WebSocket Handler ────────────────────────────────────────────
  setupWebSocket(wss);

  // ─── Time-Series Service (InfluxDB + WAL) ─────────────────────────
  const timeseriesService = new TimeseriesService();
  eventBus.subscribe('timeseries', timeseriesService);
  await timeseriesService.recoverWAL().catch((err: unknown) => {
    logger.warn('WAL recovery failed', { error: err instanceof Error ? err.message : String(err) });
  });

  // ─── Energy Router (Day-Ahead LP optimizer) ───────────────────────
  const energyRouter = new EnergyRouterService(eventBus);
  await energyRouter.start().catch((err: unknown) => {
    logger.warn('EnergyRouterService start failed', {
      error: err instanceof Error ? err.message : String(err),
    });
  });

  // ─── Protocol Adapters ────────────────────────────────────────────
  await startProtocolAdapters(eventBus).catch((err: unknown) => {
    logger.warn('Protocol adapter startup error', {
      error: err instanceof Error ? err.message : String(err),
    });
  });

  // ─── Static serving for production ───────────────────────────────
  if (!isDev) {
    app.use(express.static(process.env.WEB_DIST_PATH ?? '../web/dist'));
  }

  server.listen(PORT, '0.0.0.0', () => {
    logger.info('Server running', { port: PORT });
  });

  // ─── Graceful Shutdown ────────────────────────────────────────────
  const shutdown = async (): Promise<void> => {
    logger.info('Server shutting down');
    energyRouter.stop();
    await stopProtocolAdapters();
    await timeseriesService.destroy();
    eventBus.destroy();
    server.close();
  };

  process.once('SIGTERM', () => void shutdown());
  process.once('SIGINT', () => void shutdown());
}
