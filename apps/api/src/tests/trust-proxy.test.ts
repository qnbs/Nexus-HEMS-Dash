import { afterEach, describe, expect, it } from 'vitest';
import { resolveTrustProxy } from '../config/trust-proxy.js';

describe('resolveTrustProxy', () => {
  const originalTrustProxy = process.env.TRUST_PROXY;

  afterEach(() => {
    if (originalTrustProxy === undefined) delete process.env.TRUST_PROXY;
    else process.env.TRUST_PROXY = originalTrustProxy;
  });

  it('defaults to 1 when unset', () => {
    delete process.env.TRUST_PROXY;
    expect(resolveTrustProxy()).toBe(1);
  });

  it('parses numeric hops', () => {
    process.env.TRUST_PROXY = '2';
    expect(resolveTrustProxy()).toBe(2);
  });

  it('parses boolean strings', () => {
    process.env.TRUST_PROXY = 'true';
    expect(resolveTrustProxy()).toBe(true);
    process.env.TRUST_PROXY = 'false';
    expect(resolveTrustProxy()).toBe(false);
  });

  it('parses comma-separated subnet list', () => {
    process.env.TRUST_PROXY = 'loopback,10.0.0.0/8';
    expect(resolveTrustProxy()).toEqual(['loopback', '10.0.0.0/8']);
  });
});
