import { describe, expect, it } from 'vitest';
import { canonicalBodyFingerprint } from '../lib/http-idempotency-scope.js';

describe('canonicalBodyFingerprint', () => {
  it('matches equivalent objects regardless of key insertion order', () => {
    const a = canonicalBodyFingerprint({ b: 1, a: 2 });
    const b = canonicalBodyFingerprint({ a: 2, b: 1 });
    expect(a).toBe(b);
  });
});
