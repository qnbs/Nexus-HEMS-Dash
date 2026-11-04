import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  NEXUS_DEPLOYABLE_PAGES_BUILD_ENV,
  resolveBuildInfoFieldsFromEnv,
} from '../../vite.build-info-plugin';

describe('resolveBuildInfoFieldsFromEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('allows empty gitSha when not a deployable Pages build', () => {
    vi.stubEnv(NEXUS_DEPLOYABLE_PAGES_BUILD_ENV, '');
    vi.stubEnv('VITE_BUILD_SHA', '');
    vi.stubEnv('GIT_SHA', '');
    vi.stubEnv('GITHUB_SHA', '');
    expect(resolveBuildInfoFieldsFromEnv().gitSha).toBe('');
  });

  it('uses GITHUB_SHA when VITE_BUILD_SHA is unset', () => {
    const sha = 'a'.repeat(40);
    vi.stubEnv('GITHUB_SHA', sha);
    expect(resolveBuildInfoFieldsFromEnv().gitSha).toBe(sha);
  });

  it('requires full SHA when deployable Pages build', () => {
    vi.stubEnv(NEXUS_DEPLOYABLE_PAGES_BUILD_ENV, 'true');
    vi.stubEnv('VITE_BUILD_SHA', 'short');
    expect(() => resolveBuildInfoFieldsFromEnv()).toThrow(/full 40-character git SHA/);
  });

  it('accepts deployable Pages build with VITE_BUILD_SHA', () => {
    const sha = 'b'.repeat(40);
    vi.stubEnv(NEXUS_DEPLOYABLE_PAGES_BUILD_ENV, 'true');
    vi.stubEnv('VITE_BUILD_SHA', sha);
    expect(resolveBuildInfoFieldsFromEnv().gitSha).toBe(sha);
  });
});
