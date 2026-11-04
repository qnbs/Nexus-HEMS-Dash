import { afterEach, describe, expect, it, vi } from 'vitest';
import { dispatchHardwareCommand } from '../core/hardware-command-dispatch';
import { sendAdapterCommand } from '../core/useEnergyStore';
import { setRuntimeBackendAdapterMode, setRuntimeBackendReadOnly } from '../lib/adapter-mode';

vi.mock('../core/useEnergyStore', () => ({
  sendAdapterCommand: vi.fn().mockResolvedValue(true),
}));

describe('dispatchHardwareCommand (FUP-CTRL-01 / #394)', () => {
  afterEach(() => {
    setRuntimeBackendReadOnly(false);
    setRuntimeBackendAdapterMode('unknown');
    vi.mocked(sendAdapterCommand).mockClear();
    vi.unstubAllEnvs();
  });

  it('returns false without calling adapters when backend is live', async () => {
    vi.stubEnv('VITE_ADAPTER_MODE', 'live');
    vi.stubEnv('VITE_ALLOW_LIVE_HARDWARE', 'true');
    setRuntimeBackendAdapterMode('live');

    const ok = await dispatchHardwareCommand({ type: 'SET_EV_POWER', value: 1000 });
    expect(ok).toBe(false);
    expect(sendAdapterCommand).not.toHaveBeenCalled();
  });

  it('returns false when read-only mode is active', async () => {
    setRuntimeBackendReadOnly(true);
    setRuntimeBackendAdapterMode('mock');

    const ok = await dispatchHardwareCommand({ type: 'START_CHARGING', value: true });
    expect(ok).toBe(false);
    expect(sendAdapterCommand).not.toHaveBeenCalled();
  });

  it('dispatches when mock backend owns browser adapters', async () => {
    setRuntimeBackendAdapterMode('mock');

    const ok = await dispatchHardwareCommand({ type: 'SET_EV_POWER', value: 500 });
    expect(ok).toBe(true);
    expect(sendAdapterCommand).toHaveBeenCalledWith({ type: 'SET_EV_POWER', value: 500 });
  });
});
