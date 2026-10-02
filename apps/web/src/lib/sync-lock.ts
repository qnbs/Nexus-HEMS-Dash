/** Cross-tab lock for offline queue replay (Wave 7 — PWA resilience). */
export const OFFLINE_SYNC_LOCK_NAME = 'nexus-hems-offline-sync';

/**
 * Runs `fn` under an exclusive Navigator Lock when available so foreground tabs
 * and service-worker–triggered sync do not replay the queue concurrently.
 */
export async function withOfflineSyncLock<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks?.request) {
    return navigator.locks.request(OFFLINE_SYNC_LOCK_NAME, { mode: 'exclusive' }, fn);
  }
  return fn();
}
