import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Must mock db before importing background-sync
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
    // Ensure navigator.onLine is true
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
  });

  afterEach(() => {
    backgroundSyncService.destroy();
    vi.useRealTimers();
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
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    const { getPendingActions } = await import('../lib/db');
    (getPendingActions as ReturnType<typeof vi.fn>).mockClear();
    await backgroundSyncService.syncPendingActions();
    expect(getPendingActions).not.toHaveBeenCalled();
  });
});
