import type { BackendAdapterMode } from './adapter-mode';
import { isLiveSafetyMode } from './adapter-mode';

/**
 * True when the shell should present intentional mock/simulation chrome
 * (GitHub Pages static demo, mock dev) rather than a live link-loss alarm.
 */
export function isPresentationDemoMode(
  connected: boolean,
  backendAdapterMode: BackendAdapterMode,
): boolean {
  return !connected && !isLiveSafetyMode(backendAdapterMode);
}
