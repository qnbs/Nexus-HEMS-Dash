import { useTranslation } from 'react-i18next';

/**
 * A small badge shown when the dashboard displays demo/mock data.
 */
export function DemoBadge() {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-medium text-amber-400 text-xs">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
      {t('common.demoMode', 'Demo')}
    </span>
  );
}
