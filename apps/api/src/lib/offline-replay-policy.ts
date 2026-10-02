import type { OfflineReplayEnvelope } from '@nexus-hems/shared-types';

/** Maximum age for offline hardware replay (matches client queue TTL). */
export const OFFLINE_REPLAY_MAX_AGE_MS = 5 * 60 * 1000;

/** Allowed client clock skew vs server when validating createdAt. */
export const OFFLINE_REPLAY_MAX_CLOCK_SKEW_MS = 60 * 1000;

export type OfflineReplayValidationResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

/**
 * Server-authoritative validation of offline replay envelope (audit wave 2).
 */
export function validateOfflineReplayEnvelope(
  envelope: OfflineReplayEnvelope,
  nowMs: number = Date.now(),
): OfflineReplayValidationResult {
  const { createdAt, expiresAt } = envelope;

  if (expiresAt <= createdAt) {
    return { ok: false, status: 400, error: 'Replay envelope expiresAt must be after createdAt' };
  }

  const maxExpires = createdAt + OFFLINE_REPLAY_MAX_AGE_MS;
  if (expiresAt > maxExpires) {
    return {
      ok: false,
      status: 400,
      error: 'Replay envelope expiry exceeds maximum allowed replay window',
    };
  }

  if (nowMs >= expiresAt) {
    return { ok: false, status: 410, error: 'Offline command expired — replay rejected' };
  }

  if (nowMs + OFFLINE_REPLAY_MAX_CLOCK_SKEW_MS < createdAt) {
    return { ok: false, status: 400, error: 'Replay envelope createdAt is too far in the future' };
  }

  if (nowMs - createdAt > OFFLINE_REPLAY_MAX_AGE_MS) {
    return { ok: false, status: 410, error: 'Offline command too old — replay rejected' };
  }

  return { ok: true };
}
