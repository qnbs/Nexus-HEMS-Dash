import { useEffect, lazy, Suspense } from 'react';
import { motion } from 'motion/react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdapterBridge } from './core/useEnergyStore';
import { useAppStore } from './store';
import { Wifi, Command, Settings as SettingsIcon, HelpCircle } from 'lucide-react';
import { themeDefinitions } from './design-tokens';
const Onboarding = lazy(() =>
  import('./components/Onboarding').then((m) => ({ default: m.Onboarding })),
);
import { CommandPalette, useCommandPalette } from './components/ui/CommandPalette';
import { MobileNavigation } from './components/ui/MobileNavigation';
import { Sidebar } from './components/layout/Sidebar';
import { Breadcrumbs } from './components/layout/Breadcrumbs';
import { OfflineBanner } from './components/OfflineBanner';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { PWAUpdateNotification } from './components/PWAUpdateNotification';
import { ErrorBoundary } from './components/ErrorBoundary';
import { watchSystemTheme, resolveTheme } from './lib/theme';
import { backgroundSyncService } from './lib/background-sync';
import { logError } from './lib/db';

// Lazy-loaded pages
const HomePage = lazy(() => import('./pages/HomePage'));
const EnergyFlowPage = lazy(() => import('./pages/EnergyFlowPage'));
const ProductionPage = lazy(() => import('./pages/ProductionPage'));
const StoragePage = lazy(() => import('./pages/StoragePage'));
const ConsumptionPage = lazy(() => import('./pages/ConsumptionPage'));
const EVPage = lazy(() => import('./pages/EVPage'));
const FloorplanPage = lazy(() => import('./pages/FloorplanPage'));
const AIOptimizerPage = lazy(() => import('./pages/AIOptimizerPage'));
const TariffsPage = lazy(() => import('./pages/TariffsPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const Help = lazy(() => import('./pages/Help').then((m) => ({ default: m.Help })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AISettingsPage = lazy(() => import('./pages/AISettingsPage'));
const MonitoringPage = lazy(() => import('./pages/MonitoringPage'));

function PageLoadingFallback() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[40vh] items-center justify-center" role="status">
      <div className="flex flex-col items-center gap-3">
        <div
          className="cyber-shimmer h-8 w-8 animate-spin rounded-full border-2 border-(--color-primary) border-t-transparent"
          aria-hidden="true"
        />
        <span className="text-sm text-(--color-muted)">{t('loading.page')}</span>
      </div>
    </div>
  );
}

/** Scrolls to the top and moves focus to main content on every route change */
function ScrollToTop(): null {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    // Move focus to main content area for screen reader users
    const main = document.getElementById('main-content');
    if (main) {
      main.focus({ preventScroll: true });
    }
  }, [pathname]);
  return null;
}

export default function App() {
  const { t, i18n } = useTranslation();
  // Granular selectors to prevent full tree re-renders
  const connected = useAppStore((s) => s.connected);
  const priceCurrent = useAppStore((s) => s.energyData.priceCurrent);
  const theme = useAppStore((s) => s.theme);
  const locale = useAppStore((s) => s.locale);
  const setTheme = useAppStore((s) => s.setTheme);
  const themePreference = useAppStore((s) => s.themePreference);
  const fontScale = useAppStore((s) => s.settings.fontScale);
  const reducedMotion = useAppStore((s) => s.settings.reducedMotion);
  const highContrast = useAppStore((s) => s.settings.highContrast);
  const compactMode = useAppStore((s) => s.settings.compactMode);
  const glowEffects = useAppStore((s) => s.settings.glowEffects);
  const animations = useAppStore((s) => s.settings.animations);
  const { isOpen: isCommandPaletteOpen, setIsOpen: setCommandPaletteOpen } = useCommandPalette();
  const onboardingCompleted = useAppStore((s) => s.onboardingCompleted);

  // Adapter bridge replaces the old useWebSocket hook
  useAdapterBridge();
  const themeDefinition = themeDefinitions[theme];

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = locale;
    document.documentElement.style.colorScheme = themeDefinitions[theme].isDark ? 'dark' : 'light';
    // Update PWA title bar color to match theme background
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeDefinition.colors.background);
    }
  }, [locale, theme, themeDefinition.colors.background]);

  // Apply accessibility settings to the DOM
  useEffect(() => {
    const scale = fontScale ?? 1.0;
    document.documentElement.style.fontSize = `${scale * 100}%`;
  }, [fontScale]);

  useEffect(() => {
    document.documentElement.classList.toggle('reduced-motion', reducedMotion ?? false);
  }, [reducedMotion]);

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast ?? false);
  }, [highContrast]);

  // Apply display settings to the DOM
  useEffect(() => {
    document.documentElement.classList.toggle('compact-mode', compactMode ?? false);
  }, [compactMode]);

  useEffect(() => {
    document.documentElement.classList.toggle('no-glow', !(glowEffects ?? true));
  }, [glowEffects]);

  useEffect(() => {
    document.documentElement.classList.toggle('no-animations', !(animations ?? true));
  }, [animations]);

  useEffect(() => {
    if (i18n.resolvedLanguage !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [i18n, locale]);

  // Initialize theme from preference on mount
  useEffect(() => {
    if (themePreference === 'system') {
      const resolvedTheme = resolveTheme('system');
      setTheme(resolvedTheme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Watch system theme preference
  useEffect(() => {
    if (themePreference !== 'system') return;

    const unwatch = watchSystemTheme(() => {
      const resolvedTheme = resolveTheme('system');
      setTheme(resolvedTheme);
    });

    return unwatch;
  }, [themePreference, setTheme]);

  // Initialize background sync service
  useEffect(() => {
    backgroundSyncService.init();

    return () => {
      backgroundSyncService.destroy();
    };
  }, []);

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        logError(error, errorInfo.componentStack ?? undefined, 'high').catch(console.error);
      }}
    >
      <Router basename={import.meta.env.BASE_URL}>
        <ScrollToTop />
        <OfflineBanner />
        <PWAInstallPrompt />
        <PWAUpdateNotification />
        {!onboardingCompleted && (
          <Suspense fallback={null}>
            <Onboarding />
          </Suspense>
        )}
        <div className="theme-shell min-h-screen font-sans text-(--color-text) selection:bg-(--color-primary)/30">
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
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-xl focus:bg-(--color-primary) focus:px-4 focus:py-2 focus:text-white focus:shadow-lg"
          >
            {t('accessibility.skipToContent', 'Skip to main content')}
          </a>

          {/* Desktop Sidebar */}
          <Sidebar />

          {/* Main Content Area (with sidebar offset on desktop) */}
          <div className="relative lg:ml-64">
            {/* Top Bar (mobile + desktop header) */}
            <motion.header
              className="glass-panel-strong header-accent-line z-sticky sticky top-0 overflow-hidden px-4 py-2 sm:px-6 sm:py-3"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center justify-between gap-4">
                {/* Mobile Logo */}
                <div
                  className="flex flex-col items-center lg:hidden"
                  aria-label={t('common.appName')}
                >
                  <motion.img
                    src={`${import.meta.env.BASE_URL}icon.svg`}
                    alt=""
                    className="h-7 w-7 rounded-lg"
                    aria-hidden="true"
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  />
                  <span className="text-[0.55rem] leading-tight font-bold tracking-widest text-(--color-primary) uppercase">
                    HEMS
                  </span>
                </div>

                {/* Desktop: Breadcrumb area placeholder */}
                <div className="hidden lg:block" />

                {/* Right Side Actions */}
                <div className="flex items-center gap-2">
                  {/* Settings Link */}
                  <Link
                    to="/settings"
                    className="focus-ring inline-flex items-center justify-center rounded-full border border-(--color-border) bg-(--color-surface-strong) p-2 text-(--color-muted) transition-all duration-300 hover:bg-(--color-primary)/10 hover:text-(--color-primary)"
                    aria-label={t('nav.settings')}
                    title={t('nav.settings')}
                  >
                    <SettingsIcon className="h-4 w-4" />
                  </Link>

                  {/* Help Link (hidden on mobile — accessible via sidebar/bottom nav) */}
                  <Link
                    to="/help"
                    className="focus-ring hidden items-center justify-center rounded-full border border-(--color-border) bg-(--color-surface-strong) p-2 text-(--color-muted) transition-all duration-300 hover:bg-(--color-primary)/10 hover:text-(--color-primary) sm:inline-flex"
                    aria-label={t('nav.help')}
                    title={t('nav.help')}
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Link>

                  {/* Command Palette Trigger */}
                  <button
                    onClick={() => setCommandPaletteOpen(true)}
                    className="focus-ring inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface-strong) px-3 py-2 text-sm transition-colors duration-200 hover:bg-(--color-primary)/10"
                    aria-label={t('command.open', 'Open command palette')}
                  >
                    <Command className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">{t('command.search', 'Search')}</span>
                    <kbd
                      className="hidden rounded bg-(--color-surface-strong) px-1.5 py-0.5 text-xs lg:inline"
                      aria-hidden="true"
                    >
                      ⌘K
                    </kbd>
                  </button>

                  {/* Connection Status */}
                  <div
                    className="inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface-strong) px-3 py-2 text-sm transition-all duration-300"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                    aria-label={connected ? t('common.connected') : t('common.disconnected')}
                  >
                    <motion.div
                      animate={connected ? { scale: [1, 1.15, 1] } : undefined}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Wifi
                        className={`h-4 w-4 transition-colors duration-300 ${connected ? 'text-(--color-primary)' : 'text-rose-400'}`}
                        aria-hidden="true"
                      />
                    </motion.div>
                    <span className="hidden sm:inline">
                      {connected ? t('common.connected') : t('common.disconnected')}
                    </span>
                  </div>

                  <motion.div
                    className="price-pill hidden sm:inline-flex"
                    aria-label={t('dashboard.currentPrice', 'Current electricity price')}
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    {priceCurrent.toFixed(3)} €/kWh
                  </motion.div>
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
              <ErrorBoundary>
                <Suspense fallback={<PageLoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/energy-flow" element={<EnergyFlowPage />} />
                    <Route path="/production" element={<ProductionPage />} />
                    <Route path="/storage" element={<StoragePage />} />
                    <Route path="/consumption" element={<ConsumptionPage />} />
                    <Route path="/ev" element={<EVPage />} />
                    <Route path="/floorplan" element={<FloorplanPage />} />
                    <Route path="/ai-optimizer" element={<AIOptimizerPage />} />
                    <Route path="/tariffs" element={<TariffsPage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/settings/ai" element={<AISettingsPage />} />
                    <Route path="/monitoring" element={<MonitoringPage />} />
                    <Route path="/help" element={<Help />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
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
              const exportButton = document.querySelector(
                '[data-export-report]',
              ) as HTMLButtonElement;
              exportButton?.click();
            }}
          />

          {/* Mobile Bottom Navigation */}
          <MobileNavigation />
        </div>
      </Router>
    </ErrorBoundary>
  );
}
