/**
 * Offline sync metadata — version endpoint for client conflict detection.
 */

import { Router } from 'express';
import { getSyncVersion } from '../data/sync-version-store.js';
import { requireJWT } from '../middleware/auth.js';

/** Factory for `/api/sync/*` routes. */
export function createSyncRoutes(): Router {
  const router = Router();

  router.get('/api/sync/version', requireJWT, (_req, res) => {
    res.json({ version: getSyncVersion() });
  });

  return router;
}
