import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import { eventBus } from './core/EventBus.js';
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
  configureHelmet(app, isDev);
  configureRateLimiting(app, isDev);

  // Parse JSON for POST routes
  app.use(express.json({ limit: '10kb' }));

  // ─── HTTP Server + WebSocket ──────────────────────────────────────
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, maxPayload: 64 * 1024 });

  // ─── Routes ───────────────────────────────────────────────────────
  app.use(createAuthRoutes());
  app.use(createEebusRoutes());
  app.use(createMetricsRoutes(wss));
  app.use(createGrafanaRoutes());
  app.use('/api/v1', createHistoryRoutes());

  // ─── WebSocket Handler ────────────────────────────────────────────
  setupWebSocket(wss);

  // ─── Time-Series Service (InfluxDB + WAL) ─────────────────────────
  const timeseriesService = new TimeseriesService();
  eventBus.subscribe('timeseries', timeseriesService);
  await timeseriesService.recoverWAL().catch((err: unknown) => {
    console.warn('[Server] WAL recovery failed:', err);
  });

  // ─── Energy Router (Day-Ahead LP optimizer) ───────────────────────
  const energyRouter = new EnergyRouterService(eventBus);
  await energyRouter.start().catch((err: unknown) => {
    console.warn('[Server] EnergyRouterService start failed:', err);
  });

  // ─── Protocol Adapters ────────────────────────────────────────────
  await startProtocolAdapters(eventBus).catch((err: unknown) => {
    console.warn('[Server] Protocol adapter startup error:', err);
  });

  // ─── Static serving for production ───────────────────────────────
  if (!isDev) {
    app.use(express.static(process.env.WEB_DIST_PATH ?? '../web/dist'));
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // ─── Graceful Shutdown ────────────────────────────────────────────
  const shutdown = async (): Promise<void> => {
    console.log('[Server] Shutting down…');
    energyRouter.stop();
    await stopProtocolAdapters();
    await timeseriesService.destroy();
    eventBus.destroy();
    server.close();
  };

  process.once('SIGTERM', () => void shutdown());
  process.once('SIGINT', () => void shutdown());
}
