/**
 * Frontend adapter mode — mirrors backend safety defaults.
 *
 * VITE_ADAPTER_MODE defaults to `mock`. Hardware adapters do not auto-connect
 * unless the user explicitly enables them AND live mode is acknowledged.
 *
 * Build-time: VITE_ADAPTER_MODE=live + VITE_ALLOW_LIVE_HARDWARE=true
 * Runtime: user enables adapter in Settings (enableAdapter).
 */

export type FrontendAdapterMode = 'mock' | 'live';

const LIVE_HARDWARE_ACK = 'true';

function normalizeMode(value: string | undefined): string {
  return (value ?? 'mock').trim().toLowerCase();
}

/** Resolved build-time adapter mode (defaults to mock). */
export function resolveFrontendAdapterMode(): FrontendAdapterMode {
  const raw = normalizeMode(import.meta.env.VITE_ADAPTER_MODE);
  if (raw === 'live') return 'live';
  if (raw !== 'mock' && import.meta.env.DEV) {
    console.warn(`[Adapters] Invalid VITE_ADAPTER_MODE="${raw}" — using "mock".`);
  }
  return 'mock';
}

/** Whether the build explicitly allows hardware adapter connections. */
export function isLiveHardwareBuildAllowed(): boolean {
  if (resolveFrontendAdapterMode() !== 'live') return false;
  return import.meta.env.VITE_ALLOW_LIVE_HARDWARE?.trim().toLowerCase() === LIVE_HARDWARE_ACK;
}

/**
 * Default enabled state for built-in adapters on first load.
 * All adapters start disabled — demo data is served via EnergyContext.
 */
export function isBuiltinAdapterEnabledByDefault(): boolean {
  return false;
}

/**
 * Whether an enabled adapter may attempt a hardware connection.
 * Requires live build acknowledgement; user must still enable the adapter.
 */
export function canConnectHardwareAdapter(adapterEnabled: boolean): boolean {
  if (!adapterEnabled) return false;
  return isLiveHardwareBuildAllowed();
}
