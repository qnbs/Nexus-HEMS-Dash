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

  it('matches body text and caps results at eight entries', () => {
    const entries = buildHelpSearchEntries(((key: string) => key) as never);
    const results = filterHelpSearchResults(entries, 'help.');
    expect(results.length).toBeLessThanOrEqual(8);
    expect(results.length).toBeGreaterThan(0);
  });

  it('builds entries for every searchable help tab', () => {
    const entries = buildHelpSearchEntries(((key: string) => key) as never);
    const tabs = new Set(entries.map((entry) => entry.tab));
    expect(tabs.has('integration')).toBe(true);
    expect(tabs.has('about')).toBe(true);
  });
});
