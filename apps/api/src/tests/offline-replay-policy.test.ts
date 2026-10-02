import { describe, expect, it } from 'vitest';
import {
  OFFLINE_REPLAY_MAX_AGE_MS,
  validateOfflineReplayEnvelope,
} from '../lib/offline-replay-policy.js';

describe('validateOfflineReplayEnvelope', () => {
  const base = {
    commandId: '11111111-1111-4111-8111-111111111111',
    idempotencyKey: 'k-1',
    createdAt: 1_000_000,
    expiresAt: 1_000_000 + OFFLINE_REPLAY_MAX_AGE_MS,
  };

  it('accepts a fresh envelope', () => {
    expect(validateOfflineReplayEnvelope(base, base.createdAt + 1000).ok).toBe(true);
  });

  it('rejects expired envelopes', () => {
    const result = validateOfflineReplayEnvelope(base, base.expiresAt + 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(410);
  });

  it('rejects envelopes at exact expiresAt boundary', () => {
    const result = validateOfflineReplayEnvelope(base, base.expiresAt);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(410);
  });

  it('rejects createdAt too far in the future', () => {
    const result = validateOfflineReplayEnvelope(base, base.createdAt - 120_000);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.error).toMatch(/future/i);
    }
  });
});
