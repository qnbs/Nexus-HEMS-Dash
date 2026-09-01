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

describe('sync-client', () => {
  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('window', { location: { origin: 'http://localhost:3000' } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetchServerSyncVersion returns null without auth', async () => {
    const { fetchServerSyncVersion } = await import('../lib/sync-client');
    await expect(fetchServerSyncVersion()).resolves.toBeNull();
  });

  it('fetchServerSyncVersion returns the server version when authenticated', async () => {
    const { setAuthToken } = await import('../lib/auth-token');
    setAuthToken('jwt');
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ version: 99 }), { status: 200 }),
    );

    const { fetchServerSyncVersion } = await import('../lib/sync-client');
    await expect(fetchServerSyncVersion()).resolves.toBe(99);
  });

  it('detectSyncConflict returns true when server version is newer', async () => {
    const { setAuthToken } = await import('../lib/auth-token');
    const { updateSyncState } = await import('../lib/db');
    setAuthToken('jwt');
    await updateSyncState('settings', '10', false);
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ version: 42 }), { status: 200 }),
    );

    const { detectSyncConflict } = await import('../lib/sync-client');
    await expect(detectSyncConflict('settings')).resolves.toBe(true);
  });
});
