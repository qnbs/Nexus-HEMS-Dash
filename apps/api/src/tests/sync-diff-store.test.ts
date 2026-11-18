import { afterEach, describe, expect, it } from 'vitest';
import { resetServerSettingsForTests } from '../data/settings-store.js';
import {
  getSyncDiffSince,
  recordSyncDiffEntry,
  resetSyncDiffForTests,
} from '../data/sync-diff-store.js';
import { getSyncVersion, resetSyncVersionForTests } from '../data/sync-version-store.js';
import { resetSyncPersistenceForTests } from '../services/sync-persistence.js';

describe('sync-diff-store', () => {
  afterEach(() => {
    resetSyncDiffForTests();
    resetServerSettingsForTests();
    resetSyncVersionForTests(100);
  });

  it('records changes with monotonically increasing versions', async () => {
    resetSyncVersionForTests(100);
    const v1 = await recordSyncDiffEntry('theme', 'dark', 'userPreferences', 1000);
    const v2 = await recordSyncDiffEntry('victronIp', '10.0.0.1', 'deviceSettings', 1001);

    expect(v2).toBeGreaterThan(v1);
    expect(await getSyncVersion()).toBe(v2);
  });

  it('requires full resync when diff history is empty but server version is ahead of since', async () => {
    resetSyncPersistenceForTests(20);

    const diff = await getSyncDiffSince(10);
    expect(diff.version).toBe(20);
    expect(diff.changes).toHaveLength(0);
    expect(diff.fullResyncRequired).toBe(true);
  });

  it('requires full resync for since=0 when oldest retained diff starts after version 1', async () => {
    resetSyncPersistenceForTests(50);
    await recordSyncDiffEntry('theme', 'dark', 'userPreferences');

    const diff = await getSyncDiffSince(0);
    expect(diff.fullResyncRequired).toBe(true);
    expect(diff.changes).toHaveLength(0);
  });

  it('returns only entries newer than since', async () => {
    resetSyncVersionForTests(50);
    await recordSyncDiffEntry('animations', true, 'userPreferences');
    const mid = await getSyncVersion();
    await recordSyncDiffEntry('knxIp', '192.168.1.2', 'deviceSettings');

    const diff = await getSyncDiffSince(mid);
    expect(diff.changes).toHaveLength(1);
    expect(diff.changes[0]?.key).toBe('knxIp');
    expect(diff.version).toBe(await getSyncVersion());
  });
});
