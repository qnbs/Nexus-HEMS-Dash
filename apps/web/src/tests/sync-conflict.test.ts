import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import 'fake-indexeddb/auto';

const storage = new Map<string, string>();

vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storage.set(key, value);
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
});

vi.mock('../lib/auth-token', () => ({
  getApiBaseUrl: vi.fn(() => 'http://localhost:3000'),
  getAuthHeader: vi.fn(() => ({ Authorization: 'Bearer test' })),
}));

vi.mock('../lib/background-sync', () => ({
  backgroundSyncService: {
    syncPendingActions: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('../lib/sync-reconcile', () => ({
  reconcileServerSettings: vi.fn().mockResolvedValue(77),
}));

import {
  getPendingActions,
  getSyncState,
  nexusDb,
  queueOfflineAction,
  updateSyncState,
} from '../lib/db';
import {
  dispatchSyncConflictEvent,
  getConflictedSyncStates,
  markSyncConflict,
  resolveSyncConflict,
  SYNC_CONFLICT_EVENT,
} from '../lib/sync-conflict';

describe('sync-conflict', () => {
  beforeEach(async () => {
    storage.clear();
    vi.stubGlobal('fetch', vi.fn());
    const { nexusDb } = await import('../lib/db');
    await nexusDb.syncState.clear();
    await nexusDb.offlineActions.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('markSyncConflict sets hasConflict and dispatches event', async () => {
    await updateSyncState('settings', '10', false);
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ version: 50 }), { status: 200 }),
    );

    const handler = vi.fn();
    window.addEventListener(SYNC_CONFLICT_EVENT, handler);

    await markSyncConflict('settings');

    const state = await getSyncState('settings');
    expect(state.hasConflict).toBe(true);
    expect(state.serverVersion).toBe('10');
    expect(handler).toHaveBeenCalledTimes(1);

    window.removeEventListener(SYNC_CONFLICT_EVENT, handler);
  });

  it('markSyncConflict is idempotent for the same domain', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ version: 50 }), { status: 200 }),
    );

    const handler = vi.fn();
    window.addEventListener(SYNC_CONFLICT_EVENT, handler);

    await markSyncConflict('settings');
    await markSyncConflict('settings');

    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(SYNC_CONFLICT_EVENT, handler);
  });

  it('getConflictedSyncStates returns only conflicted rows', async () => {
    await updateSyncState('settings', '10', true);
    await updateSyncState('preferences', '20', false);

    const conflicts = await getConflictedSyncStates();
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.key).toBe('settings');
  });

  it('resolveSyncConflict clears flag and replays queue on local choice', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ version: 99 }), { status: 200 }),
    );
    await updateSyncState('settings', '10', true);

    const { backgroundSyncService } = await import('../lib/background-sync');
    await resolveSyncConflict('settings', 'local');

    const state = await getSyncState('settings');
    expect(state.hasConflict).toBe(false);
    expect(state.serverVersion).toBe('99');
    expect(backgroundSyncService.syncPendingActions).toHaveBeenCalled();
  });

  it('resolveSyncConflict server-wins keeps conflict when server settings cannot be applied', async () => {
    const { reconcileServerSettings } = await import('../lib/sync-reconcile');
    vi.mocked(reconcileServerSettings).mockResolvedValueOnce(null);
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 503 }));

    await updateSyncState('settings', '10', true);
    await expect(resolveSyncConflict('settings', 'server')).rejects.toThrow(
      'Cannot apply server settings',
    );

    const state = await getSyncState('settings');
    expect(state.hasConflict).toBe(true);
    expect(state.serverVersion).toBe('10');
  });

  it('resolveSyncConflict server-wins does not clear conflict when diff fails but version endpoint responds', async () => {
    const { reconcileServerSettings } = await import('../lib/sync-reconcile');
    vi.mocked(reconcileServerSettings).mockResolvedValueOnce(null);
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ version: 99 }), { status: 200 }),
    );

    await updateSyncState('settings', '10', true);
    await expect(resolveSyncConflict('settings', 'server')).rejects.toThrow(
      'Cannot apply server settings',
    );

    const state = await getSyncState('settings');
    expect(state.hasConflict).toBe(true);
    expect(state.serverVersion).toBe('10');
  });

  it('resolveSyncConflict local-wins keeps conflict when post-replay version fetch fails', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 503 }));
    await updateSyncState('settings', '10', true);

    await expect(resolveSyncConflict('settings', 'local')).rejects.toThrow(
      'Cannot verify server sync version after local replay',
    );

    const state = await getSyncState('settings');
    expect(state.hasConflict).toBe(true);
  });

  it('resolveSyncConflict clears flag without replay on server choice', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ version: 77 }), { status: 200 }),
    );
    await updateSyncState('settings', '10', true);

    const { backgroundSyncService } = await import('../lib/background-sync');
    const { reconcileServerSettings } = await import('../lib/sync-reconcile');
    vi.mocked(backgroundSyncService.syncPendingActions).mockClear();

    await resolveSyncConflict('settings', 'server');

    const state = await getSyncState('settings');
    expect(state.hasConflict).toBe(false);
    expect(state.serverVersion).toBe('77');
    expect(backgroundSyncService.syncPendingActions).not.toHaveBeenCalled();
    expect(reconcileServerSettings).toHaveBeenCalledWith(10);
  });

  it.each([
    0, 1, 2,
  ] as const)('resolveSyncConflict server-wins marks settings action discarded (retries=%i), not replayable', async (retries) => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ version: 77 }), { status: 200 }),
    );
    await updateSyncState('settings', '10', true);

    const actionId = await queueOfflineAction('settings', { theme: 'ocean-dark' });
    await nexusDb.offlineActions.update(actionId, { status: 'failed', retries });

    const { backgroundSyncService } = await import('../lib/background-sync');
    vi.mocked(backgroundSyncService.syncPendingActions).mockClear();
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockClear();

    await resolveSyncConflict('settings', 'server');

    const row = await nexusDb.offlineActions.get(actionId);
    expect(row?.status).toBe('discarded');
    expect(await getPendingActions()).toHaveLength(0);
    expect(backgroundSyncService.syncPendingActions).not.toHaveBeenCalled();
    expect(
      fetchMock.mock.calls.some(
        ([url, init]) =>
          String(url).includes('/api/settings') &&
          (init as RequestInit | undefined)?.method === 'PUT',
      ),
    ).toBe(false);
  });

  it('dispatchSyncConflictEvent emits a custom event', () => {
    const handler = vi.fn();
    window.addEventListener(SYNC_CONFLICT_EVENT, handler);
    dispatchSyncConflictEvent('settings');
    expect(handler).toHaveBeenCalled();
    window.removeEventListener(SYNC_CONFLICT_EVENT, handler);
  });
});
