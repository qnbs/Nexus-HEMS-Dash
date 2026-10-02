/**
 * Offline sync metadata — version, diff, and settings replay endpoints.
 */

import { type NextFunction, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { SettingsPatchError } from '../data/settings-patch-error.js';
import { applySettingsPatch } from '../data/settings-store.js';
import { getSyncDiffSince } from '../data/sync-diff-store.js';
import { getSyncVersion } from '../data/sync-version-store.js';
import { requireJWT, requireScope } from '../middleware/auth.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';

const SinceQuerySchema = z.object({
  since: z.coerce.number().finite().nonnegative().optional().default(0),
});

function parseSettingsBody(body: unknown): {
  patch: Record<string, unknown>;
  clientUpdatedAt?: number;
} {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('invalid_body');
  }
  const record = body as Record<string, unknown>;
  const updatedAtRaw = record.updatedAt;
  const { updatedAt, ...rest } = record;
  const patch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined) patch[key] = value;
  }
  if (Object.keys(patch).length === 0) {
    throw new Error('empty_patch');
  }
  if (
    updatedAtRaw !== undefined &&
    (typeof updatedAtRaw !== 'number' || !Number.isFinite(updatedAtRaw) || updatedAtRaw < 0)
  ) {
    throw new Error('invalid_updatedAt');
  }
  const clientUpdatedAt =
    typeof updatedAtRaw === 'number' && Number.isFinite(updatedAtRaw) && updatedAtRaw >= 0
      ? updatedAtRaw
      : undefined;
  return {
    patch,
    ...(clientUpdatedAt !== undefined ? { clientUpdatedAt } : {}),
  };
}

/** Factory for `/api/sync/*` and `/api/settings` routes. */
export function createSyncRoutes(): Router {
  const router = Router();

  router.get('/api/sync/version', requireJWT, async (_req, res) => {
    res.json({ version: await getSyncVersion() });
  });

  router.get('/api/sync/diff', requireJWT, async (req, res) => {
    const parsed = SinceQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid since query parameter' });
      return;
    }
    res.json(await getSyncDiffSince(parsed.data.since));
  });

  router.put(
    '/api/settings',
    requireJWT,
    requireScope('readwrite'),
    idempotencyMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { patch, clientUpdatedAt } = parseSettingsBody(req.body);
        const result = await applySettingsPatch(patch, clientUpdatedAt);
        res.json({ ok: true, ...result });
      } catch (error) {
        if (error instanceof SettingsPatchError) {
          res.status(error.statusCode).json({ error: error.message });
          return;
        }
        if (error instanceof Error) {
          if (
            error.message === 'invalid_body' ||
            error.message === 'empty_patch' ||
            error.message === 'invalid_updatedAt'
          ) {
            res.status(400).json({ error: 'Invalid settings body' });
            return;
          }
        }
        next(error);
      }
    },
  );

  return router;
}
