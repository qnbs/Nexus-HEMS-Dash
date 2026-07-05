import { describe, expect, it } from 'vitest';
import { shouldVirtualizeCommandList } from './command-palette-list-utils';

describe('shouldVirtualizeCommandList', () => {
  it('skips virtualization in Vitest/jsdom', () => {
    expect(shouldVirtualizeCommandList(50)).toBe(false);
  });

  it('skips virtualization for short lists', () => {
    expect(shouldVirtualizeCommandList(10)).toBe(false);
  });
});
