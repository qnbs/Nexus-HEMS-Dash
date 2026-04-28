import {
  BatteryMedium,
  Command,
  HelpCircle,
  Settings as SettingsIcon,
  Sun,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { themeDefinitions } from '../../design-tokens';
import { useAppStoreShallow } from '../../store';
import { CommandPalette, useCommandPalette } from '../ui/CommandPalette';
import { MobileNavigation } from '../ui/MobileNavigation';
import { Breadcrumbs } from './Breadcrumbs';
import { Sidebar } from './Sidebar';

/** Route → i18n label map for the mobile page title */
const headerRouteLabels: Record<string, string> = {
  '/': 'nav.home',
  '/energy-flow': 'nav.energyFlow',
  '/devices': 'nav.devicesOverview',
  '/optimization-ai': 'nav.aiOptimizer',
  '/tariffs': 'nav.tariffs',
  '/analytics': 'nav.analytics',
  '/monitoring': 'nav.monitoring',
  '/plugins': 'nav.plugins',
  '/settings': 'nav.settings',
  '/settings/ai': 'nav.aiKeys',
  '/help': 'nav.help',
};

/** Displays the current page name in the mobile header */
function MobilePageTitle() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const labelKey = headerRouteLabels[pathname] ?? 'nav.home';

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={pathname}
        className="min-w-0 truncate font-semibold text-(--color-text) text-sm lg:hidden"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15 }}
      >
        {t(labelKey)}
      </motion.span>
    </AnimatePresence>
  );
}

/** Tiny SVG ring showing self-sufficiency percentage */
function SelfSufficiencyRing({ percentage }: { percentage: number }) {
  const r = 5;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percentage / 100) * circumference;
  const color =
    percentage >= 80
      ? 'var(--color-neon-green)'
      : percentage >= 40
        ? 'var(--color-primary)'
        : 'var(--color-power-orange)';

  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0" aria-hidden="true">
      <circle cx="7" cy="7" r={r} fill="none" stroke="var(--color-border)" strokeWidth="2" />
      <circle
        cx="7"
        cy="7"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 7 7)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

interface AppShellProps {
  children: ReactNode;
  'aria-hidden'?: boolean | undefined;
  inert?: boolean | undefined;
}

export function AppShell({ children, ...rest }: AppShellProps) {
  const { t } = useTranslation();
  const { isOpen: isCommandPaletteOpen, setIsOpen: setCommandPaletteOpen } = useCommandPalette();

  const { priceCurrent, pvPower, batterySoC, gridPower, houseLoad, connected, theme } =
    useAppStoreShallow((s) => ({
      priceCurrent: s.energyData.priceCurrent,
      pvPower: s.energyData.pvPower,
      batterySoC: s.energyData.batterySoC,
      gridPower: s.energyData.gridPower,
      houseLoad: s.energyData.houseLoad,
      connected: s.connected,
      theme: s.theme,
    }));

  const themeDefinition = themeDefinitions[theme];

  return (
    <div
      className="theme-shell min-h-screen font-sans text-(--color-text) selection:bg-(--color-primary)/30"
      {...rest}
    >
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
        style={{
          background: `linear-gradient(145deg, ${themeDefinition.colors.background} 0%, ${themeDefinition.colors.background} 60%, ${themeDefinition.colors.glow} 100%)`,
        }}
      />

      {/* Skip to content link (WCAG 2.2 AA) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-xl focus:bg-(--color-primary) focus:px-4 focus:py-2 focus:text-(--color-on-primary) focus:shadow-lg"
      >
        {t('accessibility.skipToContent', 'Skip to main content')}
      </a>

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area (with sidebar offset on desktop) */}
      <div className="relative lg:ml-64">
        {/* Top Bar — sticky header (mobile + desktop) */}
        <motion.header
          className="glass-panel-strong header-accent-line sticky top-0 z-sticky overflow-hidden px-3 py-1.5 sm:px-6 sm:py-3"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Row 1: Logo + Page Title + Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Left: Logo + Connection Dot (mobile/tablet) */}
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
              {/* Connection status indicator */}
              <span
                className={`absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-(--color-surface-strong) border-2 ${
                  connected
                    ? 'bg-(--color-neon-green) shadow-[0_0_6px_var(--color-neon-green)]'
                    : 'bg-red-500 shadow-[0_0_6px_theme(colors.red.500)]'
                }`}
                aria-hidden="true"
              />
            </Link>

            {/* Page Title (mobile/tablet) — shows current route name */}
            <MobilePageTitle />

            {/* Right: action icons */}
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              {/* Electricity Price (tablet+) */}
              <motion.div
                className="price-pill hidden md:inline-flex"
                aria-label={t('dashboard.currentPrice', 'Current electricity price')}
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                {priceCurrent.toFixed(3)} €/kWh
              </motion.div>

              {/* Command Palette */}
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                className="focus-ring inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface-strong) p-2 text-sm transition-colors duration-200 hover:bg-(--color-primary)/10 sm:px-3"
                title={t('command.open', 'Open command palette')}
              >
                <Command className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only sm:hidden">{t('command.search', 'Search')}</span>
                <span className="hidden sm:inline">{t('command.search', 'Search')}</span>
                <kbd className="hidden rounded bg-(--color-surface-strong) px-1.5 py-0.5 text-xs lg:inline">
                  ⌘K
                </kbd>
              </button>

              {/* Help (desktop only — mobile accesses via More sheet) */}
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

              {/* Settings */}
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

          {/* Row 2: Live Energy Status Ticker (mobile/tablet only) */}
          <div
            className="scrollbar-hide mt-1.5 flex items-center gap-1 overflow-x-auto lg:hidden"
            role="status"
            aria-label={t('header.liveStatus', 'Live energy status')}
            aria-live="polite"
          >
            {/* PV Power */}
            <div
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-(--color-surface)/60 px-2 py-0.5 font-medium text-xs"
              title={t('header.pvPower', 'PV power')}
            >
              <Sun className="h-3 w-3 text-amber-400" aria-hidden="true" />
              <span className="text-(--color-text)">
                {pvPower >= 1000 ? `${(pvPower / 1000).toFixed(1)} kW` : `${Math.round(pvPower)} W`}
              </span>
            </div>

            {/* Battery SoC */}
            <div
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-(--color-surface)/60 px-2 py-0.5 font-medium text-xs"
              title={t('header.batterySoC', 'Battery charge')}
            >
              <BatteryMedium
                className={`h-3 w-3 ${
                  batterySoC > 50
                    ? 'text-(--color-neon-green)'
                    : batterySoC > 20
                      ? 'text-amber-400'
                      : 'text-red-400'
                }`}
                aria-hidden="true"
              />
              <span className="text-(--color-text)">{Math.round(batterySoC)}%</span>
            </div>

            {/* Grid Power (import/export) */}
            <div
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-(--color-surface)/60 px-2 py-0.5 font-medium text-xs"
              title={
                gridPower >= 0
                  ? t('header.gridImport', 'Grid import')
                  : t('header.gridExport', 'Grid export')
              }
            >
              <Zap
                className={`h-3 w-3 ${gridPower >= 0 ? 'text-red-400' : 'text-(--color-neon-green)'}`}
                aria-hidden="true"
              />
              <span className="text-(--color-text)">
                {Math.abs(gridPower) >= 1000
                  ? `${(Math.abs(gridPower) / 1000).toFixed(1)} kW`
                  : `${Math.round(Math.abs(gridPower))} W`}
              </span>
              <span
                className={`text-[10px] ${gridPower >= 0 ? 'text-red-400' : 'text-(--color-neon-green)'}`}
              >
                {gridPower >= 0 ? '↓' : '↑'}
              </span>
            </div>

            {/* Price Pill (mobile — compact) */}
            <div
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-(--color-surface)/60 px-2 py-0.5 font-medium text-xs md:hidden"
              title={t('dashboard.currentPrice', 'Current electricity price')}
            >
              <span className="text-(--color-primary)">{priceCurrent.toFixed(2)} ct</span>
            </div>

            {/* Self-sufficiency mini indicator */}
            <div
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-(--color-surface)/60 px-2 py-0.5 font-medium text-xs"
              title={t('header.selfSufficiency', 'Self-sufficiency')}
            >
              <SelfSufficiencyRing
                percentage={
                  houseLoad > 0
                    ? Math.min(
                        100,
                        Math.round(((houseLoad - Math.max(0, gridPower)) / houseLoad) * 100),
                      )
                    : 0
                }
              />
              <span className="text-(--color-text)">
                {houseLoad > 0
                  ? `${Math.min(100, Math.round(((houseLoad - Math.max(0, gridPower)) / houseLoad) * 100))}%`
                  : '0%'}
              </span>
            </div>
          </div>
        </motion.header>

        {/* Page Content */}
        <main
          id="main-content"
          tabIndex={-1}
          className="pattern-grid mx-auto max-w-7xl px-4 py-6 pb-[max(5rem,calc(5rem+env(safe-area-inset-bottom)))] outline-none sm:px-6 lg:px-8 lg:pb-6"
        >
          <Breadcrumbs />
          {children}
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOptimize={() => {
          const optimizer = document.getElementById('ai-optimizer');
          optimizer?.scrollIntoView({ behavior: 'smooth' });
        }}
        onExportReport={() => {
          const exportButton = document.querySelector('[data-export-report]') as HTMLButtonElement;
          exportButton?.click();
        }}
      />

      {/* Mobile Bottom Navigation */}
      <MobileNavigation />
    </div>
  );
}
