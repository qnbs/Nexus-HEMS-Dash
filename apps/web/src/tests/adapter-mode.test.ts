import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  canConnectHardwareAdapter,
  fetchBackendAdapterMode,
  fetchBackendHealthStatus,
  isBuiltinAdapterEnabledByDefault,
  isLiveHardwareBuildAllowed,
  isLiveSafetyMode,
  isReadOnlyModeActive,
  resolveFrontendAdapterMode,
} from '../lib/adapter-mode';
import { useAppStore } from '../store';

describe('adapter-mode (frontend)', () => {
  it('defaults to mock when VITE_ADAPTER_MODE is unset', () => {
    expect(resolveFrontendAdapterMode()).toBe('mock');
    expect(isBuiltinAdapterEnabledByDefault()).toBe(false);
    expect(isLiveHardwareBuildAllowed()).toBe(false);
  });

  it('does not connect hardware without live build acknowledgement', () => {
    expect(canConnectHardwareAdapter(true)).toBe(false);
    expect(canConnectHardwareAdapter(false)).toBe(false);
  });
});

describe('isLiveSafetyMode', () => {
  // Build flag is unset in tests, so only an explicit backend 'live' is live.
  it('treats only an explicit backend live mode as live', () => {
    expect(isLiveSafetyMode('live')).toBe(true);
    expect(isLiveSafetyMode('mock')).toBe(false);
    expect(isLiveSafetyMode('unknown')).toBe(false);
  });
});

describe('fetchBackendHealthStatus', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    useAppStore.getState().setBackendReadOnly(false);
  });

  function mockFetch(value: { ok: boolean; body: unknown } | Error): void {
    if (value instanceof Error) {
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.reject(value)),
      );
      return;
    }
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: value.ok,
          json: () => Promise.resolve(value.body),
        } as Response),
      ),
    );
  }

  it('returns readOnly when the backend reports it', async () => {
    mockFetch({ ok: true, body: { mode: 'mock', readOnly: true } });
    await expect(fetchBackendHealthStatus()).resolves.toEqual({ mode: 'mock', readOnly: true });
  });

  it('defaults readOnly to false on network failure', async () => {
    mockFetch(new Error('offline'));
    await expect(fetchBackendHealthStatus()).resolves.toEqual({
      mode: 'unknown',
      readOnly: false,
    });
  });
});

describe('fetchBackendAdapterMode', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockFetch(value: { ok: boolean; body: unknown } | Error): void {
    if (value instanceof Error) {
      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.reject(value)),
      );
      return;
    }
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: value.ok,
          json: () => Promise.resolve(value.body),
        } as Response),
      ),
    );
  }

  it('returns the backend mock mode', async () => {
    mockFetch({ ok: true, body: { mode: 'mock' } });
    expect(await fetchBackendAdapterMode()).toBe('mock');
  });

  it('returns live even on a 503 degraded response (parses body, not status)', async () => {
    mockFetch({ ok: false, body: { mode: 'live' } });
    expect(await fetchBackendAdapterMode()).toBe('live');
  });

  it('returns unknown on a network error', async () => {
    mockFetch(new Error('network down'));
    expect(await fetchBackendAdapterMode()).toBe('unknown');
  });

  it('returns unknown when the body has no recognised mode', async () => {
    mockFetch({ ok: true, body: { status: 'healthy' } });
    expect(await fetchBackendAdapterMode()).toBe('unknown');
  });
});

describe('isReadOnlyModeActive', () => {
  afterEach(() => {
    useAppStore.getState().setBackendReadOnly(false);
  });

  it('returns false in test environment (VITE_READ_ONLY_MODE not set)', () => {
    expect(isReadOnlyModeActive()).toBe(false);
  });

  it('returns true when backend health reports readOnly', () => {
    useAppStore.getState().setBackendReadOnly(true);
    expect(isReadOnlyModeActive()).toBe(true);
  });
});
