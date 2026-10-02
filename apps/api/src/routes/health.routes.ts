/**
 * Health check endpoint — reports server status and protocol adapter health.
 *
 * Returns 200 when the server is healthy (mock mode or all configured adapters
 * are healthy). Returns 503 when effective adapter mode is live and no adapters
 * are configured, or when any configured adapter failed to start.
 */

import { Router } from 'express';
import { resolveBuildMetadata } from '../config/build-info.js';
import { isReadOnlyMode } from '../config/read-only-mode.js';
import { getAdapterHealthSummary } from '../protocols/index.js';

/** Factory for unauthenticated `/api/health` routes. */
export function createHealthRoutes(): Router {
  const router = Router();

  router.get('/api/health', (_req, res) => {
    const health = getAdapterHealthSummary();
    const statusCode = health.overall === 'healthy' ? 200 : 503;

    const build = resolveBuildMetadata();
    res.status(statusCode).json({
      status: health.overall,
      mode: health.mode,
      readOnly: isReadOnlyMode(),
      timestamp: new Date().toISOString(),
      version: build.version,
      ...(build.gitSha ? { gitSha: build.gitSha } : {}),
      ...(build.buildTime ? { buildTime: build.buildTime } : {}),
      adapters: health.adapters,
    });
  });

  return router;
}
