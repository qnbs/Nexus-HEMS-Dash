import { describe, expect, it } from 'vitest';
import { buildHelpSearchEntries, filterHelpSearchResults } from '../lib/help-search-entries';

describe('help-search-entries', () => {
  it('filters entries by normalized query', () => {
    const entries = buildHelpSearchEntries(((key: string) => key) as never);
    const results = filterHelpSearchResults(entries, 'faq');
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every(
        (r) => r.title.toLowerCase().includes('faq') || r.body.toLowerCase().includes('faq'),
      ),
    ).toBe(true);
  });

  it('returns empty list for short queries', () => {
    expect(
      filterHelpSearchResults(buildHelpSearchEntries(((key: string) => key) as never), 'a'),
    ).toEqual([]);
  });
});
