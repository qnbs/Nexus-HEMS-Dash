import { describe, expect, it } from 'vitest';
import { isPresentationDemoMode } from '../lib/demo-presentation';

describe('isPresentationDemoMode', () => {
  it('is true for disconnected mock/static demo', () => {
    expect(isPresentationDemoMode(false, 'mock')).toBe(true);
    expect(isPresentationDemoMode(false, 'unknown')).toBe(true);
  });

  it('is false when adapters are connected', () => {
    expect(isPresentationDemoMode(true, 'mock')).toBe(false);
    expect(isPresentationDemoMode(true, 'live')).toBe(false);
  });

  it('is false when live safety mode is active but disconnected', () => {
    expect(isPresentationDemoMode(false, 'live')).toBe(false);
  });
});
