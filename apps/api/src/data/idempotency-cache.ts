/**
 * In-memory idempotency cache for hardware command replay deduplication.
 * Slice 1 of offline-sync (see docs/Offline-Sync-Design.md §3.2).
 *
 * TTL: 5 minutes — matches the design doc window for duplicate POST retries.
 * Process-local only (sufficient for single-instance mock/demo API; not a cluster store).
 */

const TTL_MS = 5 * 60 * 1000;

export interface IdempotencyRecord {
  statusCode: number;
  body: unknown;
  expiresAt: number;
}

const cache = new Map<string, IdempotencyRecord>();

function pruneExpired(): void {
  const now = Date.now();
  for (const [key, record] of cache) {
    if (record.expiresAt <= now) cache.delete(key);
  }
}

/** Returns a cached HTTP response for a prior successful command, if still valid. */
export function getIdempotencyRecord(key: string): IdempotencyRecord | undefined {
  pruneExpired();
  const record = cache.get(key);
  if (!record || record.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return record;
}

/** Stores a successful command response for duplicate replay within TTL. */
export function setIdempotencyRecord(key: string, statusCode: number, body: unknown): void {
  pruneExpired();
  cache.set(key, { statusCode, body, expiresAt: Date.now() + TTL_MS });
}

/** @internal Test helper — clears the process-local cache. */
export function clearIdempotencyCacheForTests(): void {
  cache.clear();
}

/** WS command dedupe: tracks accepted command keys to skip double mock mutation. */
const wsAcceptedKeys = new Map<string, number>();

/** Returns true when this WS idempotency key was already accepted within TTL. */
export function isWsIdempotencyReplay(key: string): boolean {
  pruneWsKeys();
  const expiresAt = wsAcceptedKeys.get(key);
  if (!expiresAt) return false;
  if (expiresAt <= Date.now()) {
    wsAcceptedKeys.delete(key);
    return false;
  }
  return true;
}

/** Mark a WS idempotency key as accepted. */
export function markWsIdempotencyAccepted(key: string): void {
  pruneWsKeys();
  wsAcceptedKeys.set(key, Date.now() + TTL_MS);
}

function pruneWsKeys(): void {
  const now = Date.now();
  for (const [key, expiresAt] of wsAcceptedKeys) {
    if (expiresAt <= now) wsAcceptedKeys.delete(key);
  }
}

/** @internal Test helper */
export function clearWsIdempotencyCacheForTests(): void {
  wsAcceptedKeys.clear();
}
