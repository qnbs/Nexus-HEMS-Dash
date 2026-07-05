import { Search } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { HelpTab } from '../../lib/help-search-entries';

export interface HelpSearchResult {
  tab: HelpTab;
  title: string;
  body: string;
}

export interface HelpSearchBoxProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  normalizedQuery: string;
  searchResults: HelpSearchResult[];
  onSelectResult: (tab: HelpTab) => void;
}

/** Help page search combobox with listbox results and live region announcements. */
export const HelpSearchBox = ({
  searchQuery,
  onSearchQueryChange,
  normalizedQuery,
  searchResults,
  onSelectResult,
}: HelpSearchBoxProps) => {
  const { t } = useTranslation();
  const listboxId = useId();
  const statusId = useId();
  const isOpen = normalizedQuery.length >= 2;

  const statusMessage = !isOpen
    ? ''
    : searchResults.length === 0
      ? t('help.searchNoResults')
      : t('help.searchResultsCount', { count: searchResults.length });

  return (
    <div className="relative mb-6">
      <Search
        className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-(--color-muted)"
        aria-hidden="true"
      />
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        placeholder={t('help.searchPlaceholder')}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-describedby={statusId}
        className="w-full rounded-xl border border-(--color-border) bg-(--color-surface) py-3 pr-4 pl-11 text-(--color-text) text-sm transition-all placeholder:text-(--color-muted) focus:border-(--color-primary)/70 focus:outline-none focus:ring-(--color-primary)/20 focus:ring-2"
      />
      <p id={statusId} role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </p>
      {isOpen && (
        <div className="absolute top-full right-0 left-0 z-20 mt-2 rounded-xl border border-(--color-border) bg-(--color-surface-strong) p-3 shadow-lg">
          {searchResults.length === 0 ? (
            <p className="text-(--color-muted) text-xs" role="note">
              {t('help.searchNoResults')}
            </p>
          ) : (
            <div
              id={listboxId}
              role="listbox"
              aria-label={t('help.searchResultsLabel')}
              className="space-y-1"
            >
              {searchResults.map((hit) => (
                <div key={`${hit.tab}-${hit.title}`} role="presentation">
                  <button
                    type="button"
                    role="option"
                    onClick={() => onSelectResult(hit.tab)}
                    className="focus-ring w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/5"
                  >
                    <span className="block font-medium text-sm">{hit.title}</span>
                    <span className="line-clamp-1 text-(--color-muted) text-xs">{hit.body}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
