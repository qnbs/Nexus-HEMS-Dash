import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock @sentry/react before importing sentry.ts
vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  browserTracingIntegration: vi.fn(() => ({})),
  replayIntegration: vi.fn(() => ({})),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

describe('Sentry Module', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should export sentryEnabled as false in test/dev environment', async () => {
    const mod = await import('../lib/sentry');
    // In tests (not production, no DSN), sentryEnabled should be false
    expect(mod.sentryEnabled).toBe(false);
  });

  it('should export initSentry function', async () => {
    const mod = await import('../lib/sentry');
    expect(typeof mod.initSentry).toBe('function');
  });

  it('should export Sentry namespace', async () => {
    const mod = await import('../lib/sentry');
    expect(mod.Sentry).toBeDefined();
    expect(typeof mod.Sentry.init).toBe('function');
  });

  it('should no-op initSentry when not in production', async () => {
    const { initSentry } = await import('../lib/sentry');
    const sentry = await import('@sentry/react');
    // Should not throw and should not call Sentry.init (not prod)
    expect(() => initSentry()).not.toThrow();
    expect(sentry.init).not.toHaveBeenCalled();
  });
});
