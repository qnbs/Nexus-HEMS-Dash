/**
 * In-memory server settings store for offline sync (slice 4).
 * Single-process mock/demo API; production multi-instance needs shared storage.
 */

import { classifySettingsKey } from './settings-sync-keys.js';
import { recordSyncDiffEntry } from './sync-diff-store.js';
import { getSyncVersion } from './sync-version-store.js';

const settings = new Map<string, unknown>();

/** Snapshot of all known server settings keys. */
export function getServerSettings(): Record<string, unknown> {
  return Object.fromEntries(settings);
}

/**
 * Merge a partial settings patch from a client replay or API write.
 * Returns the new sync version after recording per-key diffs.
 */
export function applySettingsPatch(
  patch: Record<string, unknown>,
  clientUpdatedAt?: number,
): { version: number; applied: string[] } {
  const updatedAt = clientUpdatedAt ?? Date.now();
  const applied: string[] = [];

  for (const [key, value] of Object.entries(patch)) {
    settings.set(key, value);
    recordSyncDiffEntry(key, value, classifySettingsKey(key), updatedAt);
    applied.push(key);
  }

  return { version: getSyncVersion(), applied };
}

/** @internal Test helper — clears settings and relies on diff reset separately. */
export function resetServerSettingsForTests(): void {
  settings.clear();
}
