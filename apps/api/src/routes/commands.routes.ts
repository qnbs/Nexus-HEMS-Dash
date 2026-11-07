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
import { resolveProtocolDispatchOutcome } from '../protocols/protocol-command.js';
import {
  beginPhysicalCommandReplay,
  completePhysicalCommandReplay,
  isPhysicalCommandLedgerCommitted,
  markPhysicalCommandUnknown,
  type PhysicalCommandLedgerTransitionResult,
} from '../services/physical-command-ledger.js';

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

function respondLedgerTransitionRejected(
  res: Response,
  transition: PhysicalCommandLedgerTransitionResult,
  commandId: string,
): void {
  res.status(503).json({
    error: 'Physical command ledger transition rejected',
    ledgerTransition: transition,
    commandId,
  });
}

async function dispatchLiveCommandReplay(
  res: Response,
  params: {
    type: ReplayBody['type'];
    wsType: WSCommandType;
    watts: number;
    commandId: string;
    idempotencyKey: string;
  },
): Promise<void> {
  const { type, wsType, watts, commandId, idempotencyKey } = params;
  try {
    const result = await dispatchProtocolCommand({ type: wsType, value: watts });
    const dispatchOutcome = resolveProtocolDispatchOutcome(result);
    if (dispatchOutcome === 'unknown') {
      const unknownBody = {
        ok: false,
        outcome: 'unknown',
        mode: 'live',
        type,
        commandId,
        error: result.error ?? 'Hardware outcome unknown after dispatch',
      };
      const unknownLedger = await markPhysicalCommandUnknown(
        commandId,
        idempotencyKey,
        409,
        unknownBody,
      );
      if (!isPhysicalCommandLedgerCommitted(unknownLedger)) {
        respondLedgerTransitionRejected(res, unknownLedger, commandId);
        return;
      }
      res.status(409).json(unknownBody);
      return;
    }
    if (!result.handled || !result.success) {
      const status = result.handled ? 502 : 501;
      const failBody = {
        ok: false,
        outcome: 'failed',
        error: result.error ?? 'Live command dispatch failed',
        commandId,
      };
      const failLedger = await completePhysicalCommandReplay(
        commandId,
        idempotencyKey,
        'failed',
        status,
        failBody,
      );
      if (!isPhysicalCommandLedgerCommitted(failLedger)) {
        respondLedgerTransitionRejected(res, failLedger, commandId);
        return;
      }
      res.status(status).json(failBody);
      return;
    }
    const successBody = {
      ok: true,
      outcome: 'succeeded',
      mode: 'live',
      type,
      value: watts,
      commandId,
    };
    const okLedger = await completePhysicalCommandReplay(
      commandId,
      idempotencyKey,
      'succeeded',
      200,
      successBody,
    );
    if (!isPhysicalCommandLedgerCommitted(okLedger)) {
      respondLedgerTransitionRejected(res, okLedger, commandId);
      return;
    }
    res.json(successBody);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Hardware dispatch failed unexpectedly';
    const unknownBody = {
      ok: false,
      outcome: 'unknown',
      mode: 'live',
      type,
      commandId,
      error: message,
    };
    const unknownLedger = await markPhysicalCommandUnknown(
      commandId,
      idempotencyKey,
      409,
      unknownBody,
    );
    if (!isPhysicalCommandLedgerCommitted(unknownLedger)) {
      respondLedgerTransitionRejected(res, unknownLedger, commandId);
      return;
    }
    res.status(409).json(unknownBody);
  }
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

      const physicalBegin = await beginPhysicalCommandReplay({
        commandId: envelope.commandId,
        idempotencyKey: envelope.idempotencyKey,
      });
      if (physicalBegin.kind === 'replay') {
        res.status(physicalBegin.statusCode).json(physicalBegin.body);
        return;
      }
      if (physicalBegin.kind === 'unknown') {
        res.status(physicalBegin.statusCode).json(physicalBegin.body);
        return;
      }
      if (physicalBegin.kind === 'in_flight') {
        res.status(409).json({ error: 'Physical command dispatch in progress' });
        return;
      }

      const mode = getEffectiveAdapterMode();
      if (mode === 'live') {
        await dispatchLiveCommandReplay(res, {
          type,
          wsType: wsType as WSCommandType,
          watts,
          commandId: envelope.commandId,
          idempotencyKey: envelope.idempotencyKey,
        });
        return;
      }

      applyMockCommandMutation({ type: wsType, value: watts });
      mockData.gridPower =
        mockData.houseLoad +
        mockData.batteryPower +
        mockData.evPower +
        mockData.heatPumpPower -
        mockData.pvPower;

      const successBody = {
        ok: true,
        outcome: 'succeeded',
        mode: 'mock',
        type,
        value: watts,
        commandId: envelope.commandId,
      };
      const mockLedger = await completePhysicalCommandReplay(
        envelope.commandId,
        envelope.idempotencyKey,
        'succeeded',
        200,
        successBody,
      );
      if (!isPhysicalCommandLedgerCommitted(mockLedger)) {
        respondLedgerTransitionRejected(res, mockLedger, envelope.commandId);
        return;
      }
      res.json(successBody);
    },
  );

  return router;
}
