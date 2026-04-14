import { Router } from 'express';
import { requireJWT } from '../middleware/auth.js';
import { renderPrometheusText, getServerMetrics, serverStartTime } from '../middleware/metrics.js';
import type { WebSocketServer } from 'ws';

export function createMetricsRoutes(wss: WebSocketServer): Router {
  const router = Router();

  // Prometheus scrape endpoint — requires JWT in production
  router.get('/metrics', requireJWT, (_req, res) => {
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(renderPrometheusText());
  });

  // JSON metrics endpoint for in-app dashboard — requires JWT in production
  router.get('/api/metrics/json', requireJWT, (_req, res) => {
    const serverMetrics = getServerMetrics();
    const families: Array<{
      name: string;
      help: string;
      type: string;
      samples: Array<{ labels: Record<string, string>; value: number; timestamp: number }>;
    }> = [];
    for (const [name, samples] of serverMetrics) {
      if (samples.length === 0) continue;
      families.push({
        name,
        help: samples[0].help,
        type: samples[0].type,
        samples: samples.map((s) => ({ labels: s.labels, value: s.value, timestamp: s.timestamp })),
      });
    }
    res.json({
      families,
      health: { uptime: (Date.now() - serverStartTime) / 1000, connections: wss.clients.size },
    });
  });

  return router;
}
