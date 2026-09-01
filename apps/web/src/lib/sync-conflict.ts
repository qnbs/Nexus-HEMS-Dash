import { getSyncState, nexusDb, type SyncState, updateSyncState } from './db';
import { fetchServerSyncVersion, recordServerSyncVersion } from './sync-client';

/** Dispatched when a new sync conflict is persisted in Dexie `syncState`. */
export const SYNC_CONFLICT_EVENT = 'nexus-hems-sync-conflict';

export type SyncConflictResolution = 'local' | 'server';

/** Rows in `syncState` that still require user resolution. */
export async function getConflictedSyncStates(): Promise<SyncState[]> {
  const rows = await nexusDb.syncState.toArray();
  return rows.filter((row) => row.hasConflict);
}

export function dispatchSyncConflictEvent(domain: string): void {
  window.dispatchEvent(new CustomEvent(SYNC_CONFLICT_EVENT, { detail: { domain } }));
}

/** Mark a domain as conflicted and notify UI listeners (idempotent per domain). */
export async function markSyncConflict(domain = 'settings'): Promise<void> {
  const state = await getSyncState(domain);
  if (state.hasConflict) return;

  const remote = await fetchServerSyncVersion();
  const version = remote !== null ? String(remote) : state.serverVersion || '0';
  await updateSyncState(domain, version, true);
  dispatchSyncConflictEvent(domain);
}

/**
 * Resolve a sync conflict after explicit user choice.
 * Server-wins clears the flag; local-wins clears the flag then replays the offline queue.
 */
export async function resolveSyncConflict(
  domain: string,
  resolution: SyncConflictResolution,
): Promise<void> {
  const remote = await fetchServerSyncVersion();
  if (remote !== null) {
    await recordServerSyncVersion(remote, domain, false);
  } else {
    const state = await getSyncState(domain);
    await updateSyncState(domain, state.serverVersion, false);
  }

  if (resolution === 'local') {
    const { backgroundSyncService } = await import('./background-sync');
    await backgroundSyncService.syncPendingActions();
  }
}
