import express from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer } from 'ws';
import { initKeys } from '../../jwt-utils.js';
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

  // ─── Vite middleware for development / Static serving for prod ────
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
