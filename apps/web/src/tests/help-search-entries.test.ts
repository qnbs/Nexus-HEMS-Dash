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
    expect(tabs.has('lexicon')).toBe(true);
  });

  it('indexes glossary terms for lexicon search', () => {
    const entries = buildHelpSearchEntries(((key: string) => key) as never);
    const eebus = entries.find((e) => e.title === 'help.glossEebus');
    expect(eebus?.tab).toBe('lexicon');
    expect(eebus?.body).toBe('help.glossEebusDesc');
  });

  it('interpolates app version in FAQ search entry', () => {
    const entries = buildHelpSearchEntries(((key: string, opts?: { version?: string }) =>
      opts?.version ? `v${opts.version}` : key) as never);
    const faq = entries.find((e) => e.title === 'help.faqWhatIs');
    expect(faq?.body).toMatch(/^v\d+\.\d+\.\d+$/);
  });

  it('interpolates app version in about search entry', () => {
    const entries = buildHelpSearchEntries(((key: string, opts?: { version?: string }) =>
      opts?.version ? `v${opts.version}` : key) as never);
    const about = entries.find((e) => e.title === 'help.aboutTitle');
    expect(about?.body).toMatch(/^v\d+\.\d+\.\d+$/);
  });

  it('indexes Victron glossary terms for lexicon search', () => {
    const entries = buildHelpSearchEntries(((key: string) => key) as never);
    expect(entries.some((e) => e.title === 'help.glossCerboGx')).toBe(true);
    expect(entries.some((e) => e.title === 'help.glossV2x')).toBe(true);
  });
});
