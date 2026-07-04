import { AlertTriangle, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Live-hardware and read-only safety banners shown above the header row.
 *
 * @param props.isLive - Whether live adapter mode is active.
 * @param props.isReadOnly - Whether the backend enforces read-only mode.
 */
export function AppShellHeaderSafetyBanners({
  isLive,
  isReadOnly,
}: {
  isLive: boolean;
  isReadOnly: boolean;
}) {
  const { t } = useTranslation();

  return (
    <>
      {isLive && (
        <div
          role="alert"
          className="-mx-3 -mt-1.5 mb-2 flex items-center justify-center gap-2 bg-(--state-live-bg) px-3 py-1 text-center font-bold text-(--state-live-on) text-xs uppercase tracking-wider sm:-mx-6 sm:-mt-3 sm:mb-3"
        >
          <AlertTriangle size={14} aria-hidden="true" />
          {t('mode.liveBannerWarning')}
        </div>
      )}

      {isReadOnly && (
        <div
          role="status"
          className="-mx-3 -mt-1.5 mb-2 flex items-center justify-center gap-2 border-(--state-warning-border) border-b bg-(--state-warning-bg)/20 px-3 py-1 text-center font-semibold text-(--state-warning-fg) text-xs uppercase tracking-wider sm:-mx-6 sm:-mt-3 sm:mb-3"
        >
          <Lock size={14} aria-hidden="true" />
          {t('mode.readOnlyBannerWarning')}
        </div>
      )}
    </>
  );
}
