import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { HelpSearchBox } from '../components/help/HelpSearchBox';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { count?: number }) => {
      if (key === 'help.searchResultsCount' && opts?.count !== undefined) {
        return `${opts.count} matching topics`;
      }
      return key;
    },
  }),
}));

describe('HelpSearchBox', () => {
  it('exposes combobox semantics when the query is long enough', () => {
    render(
      <HelpSearchBox
        searchQuery="eebus"
        onSearchQueryChange={vi.fn()}
        normalizedQuery="eebus"
        searchResults={[
          { tab: 'lexicon', title: 'EEBUS', body: 'European energy interface' },
          { tab: 'integration', title: 'EEBUS setup', body: 'Certificate pairing' },
        ]}
        onSelectResult={vi.fn()}
      />,
    );

    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('2 matching topics');
  });

  it('collapses the listbox for short queries', () => {
    render(
      <HelpSearchBox
        searchQuery="e"
        onSearchQueryChange={vi.fn()}
        normalizedQuery="e"
        searchResults={[]}
        onSelectResult={vi.fn()}
      />,
    );

    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('selects a result from the listbox', async () => {
    const user = userEvent.setup();
    const onSelectResult = vi.fn();

    render(
      <HelpSearchBox
        searchQuery="eebus"
        onSearchQueryChange={vi.fn()}
        normalizedQuery="eebus"
        searchResults={[{ tab: 'lexicon', title: 'EEBUS', body: 'European energy interface' }]}
        onSelectResult={onSelectResult}
      />,
    );

    await user.click(screen.getByRole('option'));
    expect(onSelectResult).toHaveBeenCalledWith('lexicon');
  });

  it('announces no results via the live region', () => {
    render(
      <HelpSearchBox
        searchQuery="xyz"
        onSearchQueryChange={vi.fn()}
        normalizedQuery="xyz"
        searchResults={[]}
        onSelectResult={vi.fn()}
      />,
    );

    const combobox = screen.getByRole('combobox');
    const noResults = screen.getByRole('note');
    expect(screen.getByRole('status')).toHaveTextContent('help.searchNoResults');
    expect(combobox).toHaveAttribute('aria-controls', noResults.id);
  });
});
