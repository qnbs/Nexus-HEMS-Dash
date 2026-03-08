import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWebSocket } from './useWebSocket';
import { useAppStore } from './store';
import {
  Zap,
  LayoutDashboard,
  Settings as SettingsIcon,
  HelpCircle,
  Orbit,
  Wifi,
  Command,
} from 'lucide-react';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { Help } from './pages/Help';
import { themeDefinitions } from './design-tokens';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { CommandPalette, useCommandPalette } from './components/ui/CommandPalette';
import { MobileNavigation } from './components/ui/MobileNavigation';
import { OfflineBanner } from './components/OfflineBanner';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { PWAUpdateNotification } from './components/PWAUpdateNotification';
import { ErrorBoundary } from './components/ErrorBoundary';
import { watchSystemTheme, resolveTheme } from './lib/theme';
import { cacheEnergySnapshot } from './lib/offline-cache';
import { backgroundSyncService } from './lib/background-sync';
import { logError } from './lib/db';

export default function App() {
  const { t, i18n } = useTranslation();
  const { connected, energyData, theme, themeTransitionKey, locale, setTheme, themePreference } = useAppStore();
  const { isOpen: isCommandPaletteOpen, setIsOpen: setCommandPaletteOpen } = useCommandPalette();

  const { sendCommand } = useWebSocket();
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

  // Cache energy data for offline mode
  useEffect(() => {
    if (connected && energyData) {
      void cacheEnergySnapshot(energyData);
    }
  }, [connected, energyData]);

  // Initialize background sync service
  useEffect(() => {
    backgroundSyncService.init();
    console.log('[PWA] Background sync service initialized');

    return () => {
      backgroundSyncService.destroy();
    };
  }, []);

  return (
    <ErrorBoundary onError={(error, errorInfo) => {
      logError(error, errorInfo.componentStack, 'high').catch(console.error);
    }}>
      <Router>
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

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <motion.header 
            className="glass-panel-strong mb-8 overflow-hidden px-5 py-5 sm:px-6 hover-lift"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-4">
                <motion.div 
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-white/6 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-secondary)]"
                  whileHover={{ scale: 1.03, x: 2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Orbit className="h-4 w-4 animate-spin" style={{ animationDuration: '8s' }} />
                  HEMS Control Mesh
                </motion.div>
                <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight sm:text-4xl fluid-text-4xl">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Zap className="h-8 w-8 text-[color:var(--color-primary)] drop-shadow-[0_0_12px_var(--color-primary)]" />
                  </motion.div>
                  {t('common.appName')}
                </h1>
                <p className="max-w-2xl text-sm text-[color:var(--color-muted)] sm:text-base fluid-text-base">
                  {t('common.tagline')}
                </p>
              </div>

              <div className="flex flex-col gap-3 lg:items-end space-md">
                <div className="flex flex-wrap items-center gap-2">
                  <LanguageSwitcher />
                  <ThemeSwitcher />
                  
                  {/* Command Palette Trigger */}
                  <motion.button
                    onClick={() => setCommandPaletteOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-3 py-2 text-sm transition-all duration-300 hover:bg-[color:var(--color-primary)]/10 hover:scale-[1.02]"
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

                  <motion.div 
                    className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-3 py-2 text-sm"
                    animate={connected ? { scale: [1, 1.02, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Wifi
                      className={`h-4 w-4 transition-colors duration-300 ${connected ? 'text-[color:var(--color-primary)]' : 'text-rose-400'}`}
                      aria-hidden="true"
                    />
                    <span>{connected ? t('common.connected') : t('common.disconnected')}</span>
                  </motion.div>
                  <motion.div 
                    className="price-pill"
                    whileHover={{ scale: 1.05, rotate: 2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    {energyData.priceCurrent.toFixed(3)} €/kWh
                  </motion.div>
                </div>

                <nav className="flex items-center gap-2 overflow-x-auto rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] p-1.5">
                  <NavLink
                    to="/"
                    className={({ isActive }) => `nav-pill ${isActive ? 'nav-pill-active' : ''}`}
                  >
                    <LayoutDashboard size={18} />
                    {t('nav.dashboard')}
                  </NavLink>
                  <NavLink
                    to="/settings"
                    className={({ isActive }) => `nav-pill ${isActive ? 'nav-pill-active' : ''}`}
                  >
                    <SettingsIcon size={18} />
                    {t('nav.settings')}
                  </NavLink>
                  <NavLink
                    to="/help"
                    className={({ isActive }) => `nav-pill ${isActive ? 'nav-pill-active' : ''}`}
                  >
                    <HelpCircle size={18} />
                    {t('nav.help')}
                  </NavLink>
                </nav>
              </div>
            </div>
          </motion.header>

          <main className="pb-20 lg:pb-0">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/help" element={<Help />} />
            </Routes>
          </main>
        </div>

        {/* Command Palette */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          onOptimize={() => {
            // Scroll to AI Optimizer
            const optimizer = document.getElementById('ai-optimizer');
            optimizer?.scrollIntoView({ behavior: 'smooth' });
          }}
          onExportReport={() => {
            // Trigger PDF export
            const exportButton = document.querySelector('[data-export-report]') as HTMLButtonElement;
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
