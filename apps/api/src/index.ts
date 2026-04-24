import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import { initKeys } from './jwt-utils.js';
import {
  configureCors,
  configureHelmet,
  configureRateLimiting,
  configureRequestTracking,
} from './middleware/security.js';
import { createAuthRoutes } from './routes/auth.routes.js';
import { createEebusRoutes } from './routes/eebus.routes.js';
import { createGrafanaRoutes } from './routes/grafana.routes.js';
import { createMetricsRoutes } from './routes/metrics.routes.js';
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

  // ─── WebSocket Handler ────────────────────────────────────────────
  setupWebSocket(wss);

  // ─── Static serving for production ───────────────────────────────
  // In dev: `turbo dev` runs apps/web (Vite, port 5173) and apps/api (Express, port 3000)
  // concurrently. Vite proxies /api/* → http://localhost:3000.
  // In prod: Express serves the pre-built web bundle.
  if (!isDev) {
    app.use(express.static(process.env.WEB_DIST_PATH ?? '../web/dist'));
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
