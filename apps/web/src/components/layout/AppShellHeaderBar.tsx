import {
  AlertTriangle,
  Command,
  FlaskConical,
  HelpCircle,
  Lock,
  Settings as SettingsIcon,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router-dom';
import { MobilePageTitle } from './MobilePageTitle';

/** Primary header row: logo, page title, safety badges, and quick actions. */
// skipcq: JS-0067 — colocated layout helper in ESM module
export function AppShellHeaderBar({
  isLive,
  isReadOnly,
  connected,
  hasDegradedAdapter,
  priceCurrent,
  onOpenCommandPalette,
}: {
  isLive: boolean;
  isReadOnly: boolean;
  connected: boolean;
  hasDegradedAdapter: boolean;
  priceCurrent: number;
  onOpenCommandPalette: () => void;
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

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          to="/"
          className="focus-ring relative shrink-0 rounded-lg lg:hidden"
          aria-label={t('nav.home')}
        >
          <motion.img
            src={`${import.meta.env.BASE_URL}icon.svg`}
            alt=""
            className="h-7 w-7 rounded-lg"
            aria-hidden="true"
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          />
          <span
            className={`absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-(--color-surface-strong) border-2 ${
              connected
                ? 'bg-(--color-neon-green) shadow-[0_0_6px_var(--color-neon-green)]'
                : 'bg-(--state-danger-bg) shadow-[0_0_6px_var(--state-danger-bg)]'
            }`}
            aria-hidden="true"
          />
        </Link>

        <MobilePageTitle />

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {!isLive && (
            <span
              role="status"
              className="inline-flex items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-surface-strong) px-2.5 py-1 font-semibold text-(--color-muted) text-[10px] uppercase tracking-wider"
              title={t('mode.simulationTitle')}
            >
              <FlaskConical size={12} aria-hidden="true" />
              <span className="hidden sm:inline">{t('mode.simulationBadge')}</span>
            </span>
          )}

          {hasDegradedAdapter && (
            <NavLink
              to="/monitoring"
              className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-(--state-warning-border) bg-(--state-warning-bg)/15 px-2.5 py-1 font-semibold text-(--state-warning-fg) text-[10px] uppercase tracking-wider transition-colors hover:bg-(--state-warning-bg)/25"
              title={t('header.degradedAdaptersTitle')}
              aria-label={t('header.degradedAdapters')}
            >
              <AlertTriangle size={12} aria-hidden="true" />
              <span className="hidden sm:inline">{t('header.degradedAdapters')}</span>
            </NavLink>
          )}

          <motion.div
            className="price-pill hidden md:inline-flex"
            aria-label={t('dashboard.currentPrice')}
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            {priceCurrent.toFixed(3)} €/kWh
          </motion.div>

          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface-strong) p-2 text-sm transition-colors duration-200 hover:bg-(--color-primary)/10 sm:px-3"
            title={t('command.open')}
          >
            <Command className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only sm:hidden">{t('command.search')}</span>
            <span className="hidden sm:inline">{t('command.search')}</span>
            <kbd className="hidden rounded bg-(--color-surface-strong) px-1.5 py-0.5 text-xs lg:inline">
              ⌘K
            </kbd>
          </button>

          <NavLink
            to="/help"
            className={({ isActive }) =>
              `focus-ring hidden items-center justify-center rounded-full border p-2 transition-colors duration-200 lg:inline-flex ${
                isActive
                  ? 'border-(--color-primary)/40 bg-(--color-primary)/15 text-(--color-primary)'
                  : 'border-(--color-border) bg-(--color-surface-strong) text-(--color-muted) hover:bg-(--color-primary)/10 hover:text-(--color-primary)'
              }`
            }
            aria-label={t('nav.help')}
            title={t('nav.help')}
          >
            <HelpCircle className="h-4 w-4" />
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `focus-ring inline-flex items-center justify-center rounded-full border p-2 transition-colors duration-200 ${
                isActive
                  ? 'border-(--color-primary)/40 bg-(--color-primary)/15 text-(--color-primary)'
                  : 'border-(--color-border) bg-(--color-surface-strong) text-(--color-muted) hover:bg-(--color-primary)/10 hover:text-(--color-primary)'
              }`
            }
            aria-label={t('nav.settings')}
            title={t('nav.settings')}
          >
            <SettingsIcon className="h-4 w-4" />
          </NavLink>
        </div>
      </div>
    </>
  );
}
