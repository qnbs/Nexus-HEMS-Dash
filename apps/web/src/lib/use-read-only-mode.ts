import { useAppStore } from '../store';

const LIVE_HARDWARE_ACK = 'true';

/**
 * React hook — re-renders when the backend health poll updates read-only state.
 *
 * Prefer this in components; use {@link isReadOnlyModeActive} in non-React code paths.
 */
export function useReadOnlyModeActive(): boolean {
  const backendReadOnly = useAppStore((s) => s.backendReadOnly);
  if (import.meta.env.VITE_READ_ONLY_MODE?.trim().toLowerCase() === LIVE_HARDWARE_ACK) {
    return true;
  }
  return backendReadOnly;
}
