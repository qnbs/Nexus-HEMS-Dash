import { describe, expect, it } from 'vitest';
import {
  bumpSyncVersion,
  getSyncVersion,
  resetSyncVersionForTests,
} from '../data/sync-version-store.js';

describe('sync-version-store', () => {
  it('returns a strictly increasing version after consecutive bumps', () => {
    resetSyncVersionForTests(100);
    expect(getSyncVersion()).toBe(100);
    const first = bumpSyncVersion();
    const second = bumpSyncVersion();
    expect(first).toBeGreaterThan(100);
    expect(second).toBeGreaterThan(first);
    expect(getSyncVersion()).toBe(second);
  });
});
