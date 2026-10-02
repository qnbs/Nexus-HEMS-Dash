import { describe, expect, it } from 'vitest';
import { resolveInboundOcppAuthorize } from '../config/ocpp-authorize-policy.js';

describe('resolveInboundOcppAuthorize', () => {
  it('accepts all tokens in mock effective mode', () => {
    const decision = resolveInboundOcppAuthorize(
      { idToken: { idToken: 'any', type: 'Central' } },
      { ADAPTER_MODE: 'mock' },
    );
    expect(decision).toBe('Accepted');
  });

  it('blocks unknown tokens in live mode without allowlist', () => {
    const decision = resolveInboundOcppAuthorize(
      { idToken: { idToken: 'secret-tag', type: 'Central' } },
      { ADAPTER_MODE: 'live', ALLOW_LIVE_HARDWARE: 'true', OCPP_AUTHORIZE_ID_TOKENS: '' },
    );
    expect(decision).toBe('Blocked');
  });

  it('accepts allowlisted tokens in live mode', () => {
    const decision = resolveInboundOcppAuthorize(
      { idToken: 'fleet-b' },
      {
        ADAPTER_MODE: 'live',
        ALLOW_LIVE_HARDWARE: 'true',
        OCPP_AUTHORIZE_ID_TOKENS: 'fleet-a,fleet-b',
      },
    );
    expect(decision).toBe('Accepted');
  });
});
