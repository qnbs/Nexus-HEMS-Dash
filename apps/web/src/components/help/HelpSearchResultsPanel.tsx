import { useTranslation } from 'react-i18next';
import type { HelpSearchResult } from './HelpSearchBox';

export const HelpSearchResultsPanel = ({
  listboxId,
  searchResults,
  onSelectResult,
}: {
  listboxId: string;
  searchResults: HelpSearchResult[];
  onSelectResult: (tab: HelpSearchResult['tab']) => void;
}) => {
  const { t } = useTranslation();

  if (searchResults.length === 0) {
    return (
      <p id={listboxId} className="text-(--color-muted) text-xs" role="note">
        {t('help.searchNoResults')}
      </p>
    );
  }

  return (
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
  );
};
