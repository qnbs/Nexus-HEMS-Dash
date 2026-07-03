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

export type BackendAdapterMode = 'mock' | 'live' | 'unknown';

/**
 * Fetch the effective backend hardware mode from `GET /api/health`.
 *
 * Parses the `mode` field regardless of HTTP status — a live backend with no
 * adapters configured returns 503 but is still `live`. Network/parse failures
 * (e.g. static deploys with no backend) resolve to `unknown`.
 */
export async function fetchBackendAdapterMode(signal?: AbortSignal): Promise<BackendAdapterMode> {
  try {
    const res = await fetch('/api/health', {
      signal: signal ?? null,
      headers: { Accept: 'application/json' },
    });
    const data = (await res.json().catch(() => null)) as { mode?: unknown } | null;
    if (data?.mode === 'live') return 'live';
    if (data?.mode === 'mock') return 'mock';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Whether the global safety indicator should treat the system as driving LIVE
 * hardware. True when the backend reports `live` OR the frontend build itself
 * permits hardware connections. Everything else (mock / unknown) is simulation.
 */
export function isLiveSafetyMode(backendMode: BackendAdapterMode): boolean {
  return backendMode === 'live' || isLiveHardwareBuildAllowed();
}

/**
 * Check if read-only mode is active (blocks all control commands).
 * Mirrors backend READ_ONLY_MODE environment variable.
 */
export function isReadOnlyModeActive(): boolean {
  return import.meta.env.VITE_READ_ONLY_MODE?.trim().toLowerCase() === LIVE_HARDWARE_ACK;
}

/**
 * Whether the browser should open a WebSocket to the HEMS backend to consume
 * server-pushed `ENERGY_UPDATE` broadcasts (HIGH-17 / ADR-018 live path).
 *
 * Default OFF: the GitHub Pages static demo and standard PWA builds run the
 * protocol adapters client-side (see `useAdapterBridge`) and never open this
 * socket. Full-stack deployments where the Express API is reachable set
 * `VITE_BACKEND_WS=true` to consume the backend
 * EventBus → LiveEnergyAggregator broadcast instead.
 */
export function isBackendWsEnabled(): boolean {
  return import.meta.env.VITE_BACKEND_WS?.trim().toLowerCase() === LIVE_HARDWARE_ACK;
}

/**
 * Whether the browser should offload Modbus SunSpec REST polling to the
 * adapter Web Worker (MED-12). Requires live hardware acknowledgement — same
 * safety gate as `canConnectHardwareAdapter`.
 */
export function isAdapterWorkerEnabled(): boolean {
  if (!isLiveHardwareBuildAllowed()) return false;
  return import.meta.env.VITE_ADAPTER_WORKER?.trim().toLowerCase() === LIVE_HARDWARE_ACK;
}
