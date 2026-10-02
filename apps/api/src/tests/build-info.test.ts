import { describe, expect, it } from 'vitest';
import { API_APP_VERSION, resolveBuildMetadata } from '../config/build-info.js';

describe('resolveBuildMetadata', () => {
  it('always includes package version', () => {
    expect(resolveBuildMetadata({}).version).toBe(API_APP_VERSION);
  });

  it('includes gitSha from GIT_SHA or GITHUB_SHA', () => {
    const fromGit = resolveBuildMetadata({ GIT_SHA: 'abcdef1234567890' });
    expect(fromGit.gitSha).toBe('abcdef123456');

    const fromGithub = resolveBuildMetadata({ GITHUB_SHA: 'fedcba0987654321' });
    expect(fromGithub.gitSha).toBe('fedcba098765');
  });

  it('includes buildTime when BUILD_TIME_ISO is set', () => {
    const meta = resolveBuildMetadata({ BUILD_TIME_ISO: '2026-10-02T00:00:00Z' });
    expect(meta.buildTime).toBe('2026-10-02T00:00:00Z');
  });
});
