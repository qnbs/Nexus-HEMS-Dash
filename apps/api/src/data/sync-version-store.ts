/**
 * In-memory monotonic sync version for offline reconciliation (slice 2).
 * Single-process API instances only; cluster-wide versioning needs Redis (future).
 */

const SERVER_BOOT_VERSION = Date.now();
let syncVersion = SERVER_BOOT_VERSION;

/** Current server sync version (milliseconds since epoch at last bump). */
export function getSyncVersion(): number {
  return syncVersion;
}

/** Bump after a server-side config mutation (settings, adapters, etc.). */
export function bumpSyncVersion(): number {
  syncVersion = Date.now();
  return syncVersion;
}

/** Test-only reset. */
export function resetSyncVersionForTests(value = SERVER_BOOT_VERSION): void {
  syncVersion = value;
}
