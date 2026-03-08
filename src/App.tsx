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
} from 'lucide-react';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { Help } from './pages/Help';
import { themeDefinitions } from './design-tokens';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { LanguageSwitcher } from './components/LanguageSwitcher';

export default function App() {
  const { t, i18n } = useTranslation();
  const { connected, energyData, theme, themeTransitionKey, locale } = useAppStore();

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

  return (
    <Router>
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
          <header className="glass-panel mb-8 overflow-hidden px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-white/6 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-secondary)]">
                  <Orbit className="h-4 w-4" />
                  HEMS Control Mesh
                </div>
                <h1 className="mt-4 flex items-center gap-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  <Zap className="h-8 w-8 text-[color:var(--color-primary)]" />
                  {t('common.appName')}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-[color:var(--color-muted)] sm:text-base">
                  {t('common.tagline')}
                </p>
              </div>

              <div className="flex flex-col gap-3 lg:items-end">
                <div className="flex flex-wrap items-center gap-2">
                  <LanguageSwitcher />
                  <ThemeSwitcher />
                  <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-3 py-1.5 text-sm">
                    <Wifi
                      className={`h-4 w-4 ${connected ? 'text-[color:var(--color-primary)]' : 'text-rose-400'}`}
                      aria-hidden="true"
                    />
                    <span>{connected ? t('common.connected') : t('common.disconnected')}</span>
                  </div>
                  <div className="price-pill">{energyData.priceCurrent.toFixed(3)} €/kWh</div>
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
          </header>

          <main>
            <Routes>
              <Route path="/" element={<Dashboard sendCommand={sendCommand} />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/help" element={<Help />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
