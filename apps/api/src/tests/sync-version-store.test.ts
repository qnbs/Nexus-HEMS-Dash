import { describe, expect, it } from 'vitest';
import {
  bumpSyncVersion,
  getSyncVersion,
  resetSyncVersionForTests,
} from '../data/sync-version-store.js';

describe('sync-version-store', () => {
  it('returns a monotonic version after bump', () => {
    resetSyncVersionForTests(100);
    expect(getSyncVersion()).toBe(100);
    const bumped = bumpSyncVersion();
    expect(bumped).toBeGreaterThanOrEqual(100);
    expect(getSyncVersion()).toBe(bumped);
  });
});
