import { afterEach, describe, expect, it, vi } from 'vitest';
import { getBuildSha, getBuildTimeIso } from '../lib/build-provenance';

describe('build-provenance', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns undefined for missing or dev SHA', () => {
    vi.stubEnv('VITE_BUILD_SHA', '');
    expect(getBuildSha()).toBeUndefined();
    vi.stubEnv('VITE_BUILD_SHA', 'dev');
    expect(getBuildSha()).toBeUndefined();
  });

  it('truncates long SHAs to 12 characters', () => {
    vi.stubEnv('VITE_BUILD_SHA', 'abcdef1234567890abcdef');
    expect(getBuildSha()).toBe('abcdef123456');
  });

  it('returns build time when set', () => {
    vi.stubEnv('VITE_BUILD_TIME', '2026-10-02T12:00:00Z');
    expect(getBuildTimeIso()).toBe('2026-10-02T12:00:00Z');
  });
});
