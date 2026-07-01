import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getAuthHeader } = vi.hoisted(() => ({
  getAuthHeader: vi.fn<() => Record<string, string> | null>(),
}));

vi.mock('../lib/auth-token', () => ({
  getAuthHeader,
}));

vi.mock('../lib/db', () => ({
  getPendingActions: vi.fn().mockResolvedValue([]),
  updateActionStatus: vi.fn().mockResolvedValue(undefined),
  cleanupCompletedActions: vi.fn().mockResolvedValue(undefined),
  persistSettings: vi.fn(),
}));

import { backgroundSyncService } from '../lib/background-sync';

describe('BackgroundSyncService', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
    getAuthHeader.mockReset();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })));
    vi.stubGlobal('window', {
      location: { origin: 'http://localhost:5173' },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      setInterval: vi.fn(),
      clearInterval: vi.fn(),
    });
  });

  afterEach(() => {
    backgroundSyncService.destroy();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('should initialize without throwing', () => {
    expect(() => backgroundSyncService.init()).not.toThrow();
  });

  it('should be safely destroyable', () => {
    backgroundSyncService.init();
    expect(() => backgroundSyncService.destroy()).not.toThrow();
  });

  it('should sync pending actions when online', async () => {
    const { getPendingActions } = await import('../lib/db');
    backgroundSyncService.init();
    await backgroundSyncService.syncPendingActions();
    expect(getPendingActions).toHaveBeenCalled();
  });

  it('should skip sync when offline', async () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    });
    const { getPendingActions } = await import('../lib/db');
    (getPendingActions as ReturnType<typeof vi.fn>).mockClear();
    await backgroundSyncService.syncPendingActions();
    expect(getPendingActions).not.toHaveBeenCalled();
  });

  it('attaches Authorization header when auth token is present', async () => {
    getAuthHeader.mockReturnValue({ Authorization: 'Bearer sync-jwt' });
    const { getPendingActions, updateActionStatus } = await import('../lib/db');
    (getPendingActions as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: 1,
        type: 'battery-control',
        payload: { powerW: 2000 },
        timestamp: Date.now(),
        retries: 0,
        status: 'pending',
        idempotencyKey: 'battery-1',
      },
    ]);

    await backgroundSyncService.syncPendingActions();

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5173/api/battery/control',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sync-jwt',
          'X-Idempotency-Key': 'battery-1',
        }),
      }),
    );
    expect(updateActionStatus).toHaveBeenCalledWith(1, 'completed');
  });

  it('marks action failed when no auth token is available', async () => {
    getAuthHeader.mockReturnValue(null);
    const { getPendingActions, updateActionStatus } = await import('../lib/db');
    (getPendingActions as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: 2,
        type: 'ev-control',
        payload: { currentA: 16 },
        timestamp: Date.now(),
        retries: 0,
        status: 'pending',
      },
    ]);

    await backgroundSyncService.syncPendingActions();

    expect(fetch).not.toHaveBeenCalled();
    expect(updateActionStatus).toHaveBeenCalledWith(
      2,
      'failed',
      expect.stringMatching(/No auth token available/i),
    );
  });
});
