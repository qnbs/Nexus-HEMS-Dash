/**
 * Hardware command replay for offline sync queue (ADR-030).
 * Replaces phantom /api/ev|battery|heatpump/control routes.
 */

import type { WSCommandType } from '@nexus-hems/shared-types';
import { OfflineReplayEnvelopeSchema } from '@nexus-hems/shared-types';
import { type NextFunction, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { getEffectiveAdapterMode } from '../config/adapter-mode.js';
import { isReadOnlyMode } from '../config/read-only-mode.js';
import {
  applyMockCommandMutation,
  extractOfflineCommandWatts,
  OFFLINE_ACTION_WS_TYPE,
} from '../data/mock-command-mutation.js';
import { mockData } from '../data/mock-data.js';
import { validateOfflineReplayEnvelope } from '../lib/offline-replay-policy.js';
import { requireJWT, requireScope } from '../middleware/auth.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import { requireNotReadOnly } from '../middleware/require-not-read-only.js';
import { dispatchProtocolCommand } from '../protocols/ProtocolCommandRouter.js';

const ReplayBodySchema = z.object({
  type: z.enum(['ev-control', 'hp-control', 'battery-control']),
  payload: z.record(z.string(), z.unknown()).default({}),
  envelope: OfflineReplayEnvelopeSchema,
});

type ReplayBody = z.infer<typeof ReplayBodySchema>;

function validateReplayRequest(req: Request, res: Response, next: NextFunction): void {
  const parsed = ReplayBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid replay body', details: parsed.error.flatten() });
    return;
  }

  const headerKey = req.header('x-idempotency-key')?.trim();
  const { envelope } = parsed.data;
  if (headerKey && headerKey !== envelope.idempotencyKey) {
    res.status(400).json({
      error: 'X-Idempotency-Key must match envelope.idempotencyKey when both are present',
    });
    return;
  }

  const freshness = validateOfflineReplayEnvelope(envelope);
  if (!freshness.ok) {
    res.status(freshness.status).json({ error: freshness.error });
    return;
  }

  (req as Request & { replayBody: ReplayBody }).replayBody = parsed.data;
  next();
}

/** Factory for `/api/commands/replay`. */
export function createCommandsRoutes(): Router {
  const router = Router();

  router.post(
    '/api/commands/replay',
    requireJWT,
    requireScope('readwrite'),
    requireNotReadOnly,
    validateReplayRequest,
    idempotencyMiddleware,
    async (req, res) => {
      const parsed = (req as Request & { replayBody: ReplayBody }).replayBody;

      if (isReadOnlyMode()) {
        res
          .status(403)
          .json({ error: 'System is in read-only mode — control commands are disabled' });
        return;
      }

      const { type, payload, envelope } = parsed;
      const wsType = OFFLINE_ACTION_WS_TYPE[type];
      const watts = extractOfflineCommandWatts(payload);

      if (watts === undefined) {
        res.status(400).json({ error: `Cannot derive power value from payload for ${type}` });
        return;
      }

      const mode = getEffectiveAdapterMode();
      if (mode === 'live') {
        const result = await dispatchProtocolCommand({
          type: wsType as WSCommandType,
          value: watts,
        });
        if (!result.handled || !result.success) {
          res.status(result.handled ? 502 : 501).json({
            error: result.error ?? 'Live command dispatch failed',
          });
          return;
        }
        res.json({ ok: true, mode: 'live', type, value: watts, commandId: envelope.commandId });
        return;
      }

      applyMockCommandMutation({ type: wsType, value: watts });
      mockData.gridPower =
        mockData.houseLoad +
        mockData.batteryPower +
        mockData.evPower +
        mockData.heatPumpPower -
        mockData.pvPower;

      res.json({ ok: true, mode: 'mock', type, value: watts, commandId: envelope.commandId });
    },
  );

  return router;
}
