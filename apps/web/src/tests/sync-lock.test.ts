import { afterEach, describe, expect, it, vi } from 'vitest';
import { OFFLINE_SYNC_LOCK_NAME, withOfflineSyncLock } from '../lib/sync-lock';

describe('withOfflineSyncLock', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('runs the callback when Navigator Locks are unavailable', async () => {
    vi.stubGlobal('navigator', {});
    const value = await withOfflineSyncLock(async () => 'ok');
    expect(value).toBe('ok');
  });

  it('requests an exclusive lock when navigator.locks is present', async () => {
    const request = vi.fn(
      async (
        name: string,
        options: { mode: string },
        fn: () => Promise<string>,
      ): Promise<string> => {
        expect(name).toBe(OFFLINE_SYNC_LOCK_NAME);
        expect(options).toEqual({ mode: 'exclusive' });
        return fn();
      },
    );
    vi.stubGlobal('navigator', { locks: { request } });

    const value = await withOfflineSyncLock(async () => 'locked');
    expect(value).toBe('locked');
    expect(request).toHaveBeenCalledOnce();
  });
});
