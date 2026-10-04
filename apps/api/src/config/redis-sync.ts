/**
 * Redis-backed offline sync coordination (ADR-030 follow-up FUP-REDIS-01).
 */

/** When true, sync version/settings/diff must use Redis; startup/readiness may fail if unavailable. */
export function isRedisRequiredForSync(): boolean {
  return process.env.REDIS_REQUIRED === 'true';
}

/** Authoritative sync state lives in Redis without TTL expiry (not a silent 30-day cache). */
export function isRedisSyncAuthoritative(): boolean {
  return Boolean(process.env.REDIS_URL?.trim());
}
