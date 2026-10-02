/**
 * Express middleware: deduplicate mutating requests via `X-Idempotency-Key`.
 * Scope: principal + method + route + client key + body fingerprint (audit wave 2).
 */

import type { NextFunction, Request, Response } from 'express';
import {
  claimHttpIdempotency,
  completeHttpIdempotency,
  getIdempotencyRecord,
} from '../data/idempotency-cache.js';
import {
  buildHttpIdempotencyScope,
  canonicalBodyFingerprint,
  isMutatingIdempotencyMethod,
} from '../lib/http-idempotency-scope.js';

const HEADER = 'x-idempotency-key';
const IN_FLIGHT_POLL_MS = 50;
const IN_FLIGHT_MAX_WAIT_MS = 5_000;

async function waitForCompletedReplay(
  scopeKey: string,
  fingerprint: string,
): Promise<{ statusCode: number; body: unknown } | undefined> {
  const deadline = Date.now() + IN_FLIGHT_MAX_WAIT_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, IN_FLIGHT_POLL_MS));
    const record = await getIdempotencyRecord(scopeKey);
    if (!record) continue;
    if (record.state === 'pending') continue;
    if (record.fingerprint !== fingerprint) return undefined;
    return { statusCode: record.statusCode, body: record.body };
  }
  return undefined;
}

/**
 * When `X-Idempotency-Key` is present, replay cached success responses or wrap
 * `res.json` to store the first 2xx body for later retries.
 */
export async function idempotencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const rawKey = req.header(HEADER);
  if (!rawKey || !isMutatingIdempotencyMethod(req.method)) {
    next();
    return;
  }

  const clientKey = rawKey.trim();
  if (clientKey.length === 0 || clientKey.length > 128) {
    res.status(400).json({ error: 'Invalid X-Idempotency-Key header' });
    return;
  }

  const fingerprint = canonicalBodyFingerprint(req.body);
  const scopeKey = buildHttpIdempotencyScope(req, clientKey);

  const claim = await claimHttpIdempotency(scopeKey, fingerprint);
  if (claim.kind === 'in_flight') {
    const replay = await waitForCompletedReplay(scopeKey, fingerprint);
    if (replay) {
      res.status(replay.statusCode).json(replay.body);
      return;
    }
    res.status(409).json({ error: 'Idempotent request still in progress' });
    return;
  }
  if (claim.kind === 'replay') {
    res.status(claim.statusCode).json(claim.body);
    return;
  }
  if (claim.kind === 'conflict') {
    res.status(409).json({ error: claim.reason });
    return;
  }

  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      void completeHttpIdempotency(scopeKey, fingerprint, res.statusCode, body);
    }
    return originalJson(body);
  };

  next();
}
