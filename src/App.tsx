import { useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdapterBridge } from './core/useEnergyStore';
import { useAppStore } from './store';
import { Zap, Wifi, Command, Orbit } from 'lucide-react';
import { themeDefinitions } from './design-tokens';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { LanguageSwitcher } from './components/LanguageSwitcher';
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

function PageLoadingFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="cyber-shimmer h-8 w-8 rounded-full border-2 border-[color:var(--color-primary)] border-t-transparent animate-spin" />
        <span className="text-sm text-[color:var(--color-muted)]">Loading...</span>
      </div>
    </div>
  );
}

export default function App() {
  const { t, i18n } = useTranslation();
  const { connected, energyData, theme, themeTransitionKey, locale, setTheme, themePreference } =
    useAppStore();
  const { isOpen: isCommandPaletteOpen, setIsOpen: setCommandPaletteOpen } = useCommandPalette();

  // Adapter bridge replaces the old useWebSocket hook
  useAdapterBridge();
  const themeDefinition = themeDefinitions[theme];

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = locale;
    document.documentElement.style.colorScheme = theme === 'solar-light' ? 'light' : 'dark';
  }, [locale, theme]);

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
    console.log('[PWA] Background sync service initialized');

    return () => {
      backgroundSyncService.destroy();
    };
  }, []);

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        logError(error, errorInfo.componentStack, 'high').catch(console.error);
      }}
    >
      <Router basename={import.meta.env.BASE_URL}>
        <OfflineBanner />
        <PWAInstallPrompt />
        <PWAUpdateNotification />
        <div className="theme-shell min-h-screen font-sans text-[color:var(--color-text)] selection:bg-[color:var(--color-primary)]/30">
          <AnimatePresence>
            <motion.div
              key={themeTransitionKey}
              className="pointer-events-none fixed inset-0 z-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
              style={{
                background: `radial-gradient(circle at 20% 20%, ${themeDefinition.colors.glow} 0%, transparent 28%), radial-gradient(circle at 80% 10%, ${themeDefinition.colors.secondary}33 0%, transparent 25%), radial-gradient(circle at 60% 80%, ${themeDefinition.colors.accent}22 0%, transparent 22%), linear-gradient(145deg, ${themeDefinition.colors.background} 0%, #030712 100%)`,
              }}
            />
          </AnimatePresence>

          <div className="pattern-grid fixed inset-0 z-0 opacity-40" />

          {/* Skip to content link (WCAG 2.2 AA) */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-[color:var(--color-primary)] focus:px-4 focus:py-2 focus:text-white focus:shadow-lg"
          >
            {t('accessibility.skipToContent', 'Skip to main content')}
          </a>

          {/* Desktop Sidebar */}
          <Sidebar />

          {/* Main Content Area (with sidebar offset on desktop) */}
          <div className="relative z-10 lg:ml-64">
            {/* Top Bar (mobile + desktop header) */}
            <motion.header
              className="glass-panel-strong sticky top-0 z-20 overflow-hidden px-4 py-3 sm:px-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              role="banner"
            >
              <div className="flex items-center justify-between gap-4">
                {/* Mobile Logo */}
                <div className="flex items-center gap-2 lg:hidden">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Zap className="h-6 w-6 text-[color:var(--color-primary)] drop-shadow-[0_0_12px_var(--color-primary)]" />
                  </motion.div>
                  <span className="text-lg font-semibold tracking-tight">
                    {t('common.appName')}
                  </span>
                </div>

                {/* Desktop: Eyebrow Badge */}
                <div className="hidden lg:block">
                  <motion.div
                    className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-white/6 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-secondary)]"
                    whileHover={{ scale: 1.03, x: 2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <Orbit
                      className="h-3.5 w-3.5 animate-spin"
                      style={{ animationDuration: '8s' }}
                    />
                    HEMS Control Mesh
                  </motion.div>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-2">
                  <LanguageSwitcher />
                  <ThemeSwitcher />

                  {/* Command Palette Trigger */}
                  <motion.button
                    onClick={() => setCommandPaletteOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-3 py-2 text-sm transition-all duration-300 hover:bg-[color:var(--color-primary)]/10 hover:scale-[1.02] focus-ring"
                    aria-label={t('command.open', 'Open command palette')}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Command className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">{t('command.search', 'Search')}</span>
                    <kbd className="hidden rounded bg-slate-800/50 px-1.5 py-0.5 text-xs lg:inline">
                      ⌘K
                    </kbd>
                  </motion.button>

                  {/* Connection Status */}
                  <motion.div
                    className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-3 py-2 text-sm"
                    animate={connected ? { scale: [1, 1.02, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Wifi
                      className={`h-4 w-4 transition-colors duration-300 ${connected ? 'text-[color:var(--color-primary)]' : 'text-rose-400'}`}
                      aria-hidden="true"
                    />
                    <span className="hidden sm:inline">
                      {connected ? t('common.connected') : t('common.disconnected')}
                    </span>
                  </motion.div>

                  <motion.div
                    className="price-pill hidden sm:inline-flex"
                    whileHover={{ scale: 1.05, rotate: 2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    {energyData.priceCurrent.toFixed(3)} €/kWh
                  </motion.div>
                </div>
              </div>
            </motion.header>

            {/* Page Content */}
            <main
              id="main-content"
              className="mx-auto max-w-7xl px-4 py-6 pb-20 sm:px-6 lg:pb-6"
              role="main"
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
