import { Search } from 'lucide-react';
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

/** Help page search input with dropdown result list. */
export const HelpSearchBox = ({
  searchQuery,
  onSearchQueryChange,
  normalizedQuery,
  searchResults,
  onSelectResult,
}: HelpSearchBoxProps) => {
  const { t } = useTranslation();

  return (
    <div className="relative mb-6">
      <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-(--color-muted)" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        placeholder={t('help.searchPlaceholder')}
        aria-label={t('help.searchPlaceholder')}
        className="w-full rounded-xl border border-(--color-border) bg-(--color-surface) py-3 pr-4 pl-11 text-(--color-text) text-sm transition-all placeholder:text-(--color-muted) focus:border-(--color-primary)/70 focus:outline-none focus:ring-(--color-primary)/20 focus:ring-2"
      />
      {normalizedQuery.length >= 2 && (
        <div className="absolute top-full right-0 left-0 z-20 mt-2 rounded-xl border border-(--color-border) bg-(--color-surface-strong) p-3 shadow-lg">
          {searchResults.length === 0 ? (
            <p className="text-(--color-muted) text-xs">{t('help.searchNoResults')}</p>
          ) : (
            <ul className="space-y-1">
              {searchResults.map((hit) => (
                <li key={`${hit.tab}-${hit.title}`}>
                  <button
                    type="button"
                    onClick={() => onSelectResult(hit.tab)}
                    className="focus-ring w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/5"
                  >
                    <span className="block font-medium text-sm">{hit.title}</span>
                    <span className="line-clamp-1 text-(--color-muted) text-xs">{hit.body}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
