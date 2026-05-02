/**
 * Lightweight timing for useEnergyStore merge flush — dev/regression only.
 * Does not send data to the server (no PII / no extra HTTP surface).
 */

const WARN_MS = 50;
const DEBUG_PREFIX = '[perf] merge flush';

let lastWarnAt = 0;
const WARN_THROTTLE_MS = 5000;

export function recordMergeFlushDurationMs(durationMs: number): void {
  if (import.meta.env.MODE === 'test') return;
  if (durationMs > WARN_MS) {
    const now = Date.now();
    if (now - lastWarnAt > WARN_THROTTLE_MS) {
      lastWarnAt = now;
      console.debug(`${DEBUG_PREFIX} took ${durationMs.toFixed(1)}ms (>${WARN_MS}ms budget)`);
    }
  }
}

/** Exposed for Vitest — measures one deep-merge + ring-buffer update without throttle. */
export function measureMergeFlushWorkMs(
  fn: () => void,
  now: () => number = () => performance.now(),
): number {
  const t0 = now();
  fn();
  return now() - t0;
}
