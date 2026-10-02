/**
 * Server settings store for offline sync (slice 4, ADR-030).
 */

import { validateSettingsSyncPatch } from '@nexus-hems/shared-types';
import {
  applySettingsBatch,
  getServerSettingsSnapshot,
  resetSyncPersistenceForTests,
} from '../services/sync-persistence.js';
import { classifySettingsKey } from './settings-sync-keys.js';

/** Snapshot of all known server settings keys. */
export async function getServerSettings(): Promise<Record<string, unknown>> {
  return getServerSettingsSnapshot();
}

/**
 * Merge a partial settings patch from a client replay or API write.
 * Returns the new sync version after recording per-key diffs (single atomic bump).
 */
export async function applySettingsPatch(
  patch: Record<string, unknown>,
  clientUpdatedAt?: number,
): Promise<{ version: number; applied: string[] }> {
  const validated = validateSettingsSyncPatch(patch);
  if (!validated.ok) {
    throw new Error(validated.error);
  }

  const updatedAt = clientUpdatedAt ?? Date.now();
  const entries = Object.entries(validated.patch).map(([key, value]) => ({
    key,
    value,
    category: classifySettingsKey(key),
    updatedAt,
  }));

  const version = await applySettingsBatch(entries);
  return { version, applied: entries.map((e) => e.key) };
}

/** @internal Test helper */
export function resetServerSettingsForTests(): void {
  resetSyncPersistenceForTests();
}
