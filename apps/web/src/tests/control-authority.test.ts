import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveControlAuthority } from '../core/control-authority';
import {
  getBrowserControlAuthority,
  isBrowserDirectControlAllowed,
  setRuntimeBackendAdapterMode,
  setRuntimeBackendReadOnly,
} from '../lib/adapter-mode';

describe('resolveControlAuthority', () => {
  it('denies browser control while backend health is unresolved on live-capable builds', () => {
    const snapshot = resolveControlAuthority({
      backendMode: 'unknown',
      readOnly: false,
      buildAllowsLive: true,
      backendWsEnabled: false,
    });
    expect(snapshot.browserDirectControlAllowed).toBe(false);
    expect(snapshot.denyReason).toBe('backend_unresolved');
  });

  it('denies browser control when backend is live', () => {
    const snapshot = resolveControlAuthority({
      backendMode: 'live',
      readOnly: false,
      buildAllowsLive: true,
      backendWsEnabled: false,
    });
    expect(snapshot.browserDirectControlAllowed).toBe(false);
    expect(snapshot.denyReason).toBe('backend_live');
  });

  it('denies browser control when backend WS mode is enabled', () => {
    const snapshot = resolveControlAuthority({
      backendMode: 'mock',
      readOnly: false,
      buildAllowsLive: true,
      backendWsEnabled: true,
    });
    expect(snapshot.browserDirectControlAllowed).toBe(false);
    expect(snapshot.denyReason).toBe('backend_ws');
  });

  it('allows browser control only with live build acknowledgement and mock backend', () => {
    const snapshot = resolveControlAuthority({
      backendMode: 'mock',
      readOnly: false,
      buildAllowsLive: true,
      backendWsEnabled: false,
    });
    expect(snapshot).toEqual({
      source: 'browser-adapters',
      browserDirectControlAllowed: true,
    });
  });

  it('allows mock deployments to command simulated adapters', () => {
    const snapshot = resolveControlAuthority({
      backendMode: 'mock',
      readOnly: false,
      buildAllowsLive: false,
      backendWsEnabled: false,
    });
    expect(snapshot.browserDirectControlAllowed).toBe(true);
  });
});

describe('getBrowserControlAuthority runtime wiring', () => {
  afterEach(() => {
    setRuntimeBackendReadOnly(false);
    setRuntimeBackendAdapterMode('unknown');
    vi.unstubAllEnvs();
  });

  it('blocks commands when health poll reports live backend', () => {
    vi.stubEnv('VITE_ADAPTER_MODE', 'live');
    vi.stubEnv('VITE_ALLOW_LIVE_HARDWARE', 'true');
    setRuntimeBackendAdapterMode('live');
    expect(isBrowserDirectControlAllowed()).toBe(false);
    expect(getBrowserControlAuthority().denyReason).toBe('backend_live');
  });
});
