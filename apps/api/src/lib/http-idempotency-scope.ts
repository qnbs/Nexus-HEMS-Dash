import { createHash } from 'node:crypto';
import type { Request } from 'express';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH']);

/** Stable JSON serialization for request-body fingerprinting. */
export function canonicalBodyFingerprint(body: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(body ?? null))
    .digest('hex');
}

/** Composite idempotency scope: principal + HTTP surface + client key. */
export function buildHttpIdempotencyScope(req: Request, clientKey: string): string {
  const payload = req.res?.locals?.jwtPayload as { sub?: string } | undefined;
  const principal = payload?.sub?.trim() || 'anonymous';
  const method = req.method.toUpperCase();
  const route = `${req.baseUrl || ''}${req.path || req.url || ''}`.replace(/\/+/g, '/');
  const material = [principal, method, route, clientKey].join('\0');
  return createHash('sha256').update(material).digest('hex');
}

export function isMutatingIdempotencyMethod(method: string): boolean {
  return MUTATING_METHODS.has(method.toUpperCase());
}
