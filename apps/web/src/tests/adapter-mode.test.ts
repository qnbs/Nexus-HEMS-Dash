import { describe, expect, it } from 'vitest';
import {
  canConnectHardwareAdapter,
  isBuiltinAdapterEnabledByDefault,
  isLiveHardwareBuildAllowed,
  resolveFrontendAdapterMode,
} from '../lib/adapter-mode';

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
