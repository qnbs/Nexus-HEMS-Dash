/**
 * Versioned settings change log for offline reconciliation (slice 4).
 * Process-local only; cluster-wide diff needs Redis (future).
 */

import type { SettingsSyncCategory } from './settings-sync-keys.js';
import { bumpSyncVersion, getSyncVersion } from './sync-version-store.js';

export interface SyncDiffEntry {
  key: string;
  value: unknown;
  updatedAt: number;
  category: SettingsSyncCategory;
  version: number;
}

const changeLog: SyncDiffEntry[] = [];

/** Record a settings mutation and return the new server sync version. */
export function recordSyncDiffEntry(
  key: string,
  value: unknown,
  category: SettingsSyncCategory,
  updatedAt = Date.now(),
): number {
  const version = bumpSyncVersion();
  changeLog.push({ key, value, updatedAt, category, version });
  return version;
}

/** Changes with version strictly greater than `since` (monotonic server counter). */
export function getSyncDiffSince(since: number): { version: number; changes: SyncDiffEntry[] } {
  const version = getSyncVersion();
  const normalizedSince = Number.isFinite(since) ? since : 0;
  const changes = changeLog.filter((entry) => entry.version > normalizedSince);
  return { version, changes };
}

/** @internal Test helper — clears the in-memory change log. */
export function resetSyncDiffForTests(): void {
  changeLog.length = 0;
}
