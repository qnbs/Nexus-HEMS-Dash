import { describe, expect, it } from 'vitest';
import {
  buildHelpSearchActiveOptionId,
  resolveHelpSearchActiveIndex,
} from '../lib/help-search-keyboard';

describe('help-search-keyboard', () => {
  it('resets the active index when the query changes', () => {
    expect(
      resolveHelpSearchActiveIndex([{ tab: 'lexicon', title: 'EEBUS', body: 'desc' }], 'eebus', {
        normalizedQuery: 'knx',
        activeIndex: 2,
      }),
    ).toBe(0);
  });

  it('clamps the active index to the current result count', () => {
    expect(
      resolveHelpSearchActiveIndex([{ tab: 'lexicon', title: 'EEBUS', body: 'desc' }], 'eebus', {
        normalizedQuery: 'eebus',
        activeIndex: 4,
      }),
    ).toBe(0);
  });

  it('builds the active option id only when a result is highlighted', () => {
    expect(buildHelpSearchActiveOptionId('help-search', 1, 2)).toBe('help-search-option-1');
    expect(buildHelpSearchActiveOptionId('help-search', -1, 2)).toBeUndefined();
    expect(buildHelpSearchActiveOptionId('help-search', 0, 0)).toBeUndefined();
  });
});
