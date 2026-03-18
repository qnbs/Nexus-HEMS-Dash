import { useEffect, useRef, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdapterBridge } from './core/useEnergyStore';
import { useAppStoreShallow } from './store';
import { themeDefinitions } from './design-tokens';
import { EnergyProvider } from './core/EnergyContext';
const Onboarding = lazy(() =>
  import('./components/Onboarding').then((m) => ({ default: m.Onboarding })),
);
import { AppShell } from './components/layout/AppShell';
import { OfflineBanner } from './components/OfflineBanner';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { PWAUpdateNotification } from './components/PWAUpdateNotification';
import { TauriAutoUpdater } from './components/TauriAutoUpdater';
import { ErrorBoundary } from './components/ErrorBoundary';
import { watchSystemTheme, resolveTheme } from './lib/theme';
import { backgroundSyncService } from './lib/background-sync';
import { useNotifications } from './lib/useNotifications';
import { logError } from './lib/db';

// ─── Lazy-loaded section layouts (7 groups) ──────────────────────────
const CommandHubLayout = lazy(() =>
  import('./components/layout/SectionLayouts').then((m) => ({ default: m.CommandHubLayout })),
);
const LiveEnergyLayout = lazy(() =>
  import('./components/layout/SectionLayouts').then((m) => ({ default: m.LiveEnergyLayout })),
);
const DevicesLayout = lazy(() =>
  import('./components/layout/SectionLayouts').then((m) => ({ default: m.DevicesLayout })),
);
const OptimizationLayout = lazy(() =>
  import('./components/layout/SectionLayouts').then((m) => ({ default: m.OptimizationLayout })),
);
const AnalyticsLayout = lazy(() =>
  import('./components/layout/SectionLayouts').then((m) => ({ default: m.AnalyticsLayout })),
);
const MonitoringLayout = lazy(() =>
  import('./components/layout/SectionLayouts').then((m) => ({ default: m.MonitoringLayout })),
);
const SettingsLayout = lazy(() =>
  import('./components/layout/SectionLayouts').then((m) => ({ default: m.SettingsLayout })),
);

// ─── Lazy-loaded pages ───────────────────────────────────────────────
const CommandHub = lazy(() => import('./pages/CommandHub'));
const LiveEnergyFlow = lazy(() => import('./pages/LiveEnergyFlow'));

const DevicesAutomation = lazy(() => import('./pages/DevicesAutomation'));

const OptimizationAI = lazy(() => import('./pages/OptimizationAI'));
const TariffsPage = lazy(() => import('./pages/TariffsPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const HistoricalAnalyticsPage = lazy(() => import('./pages/HistoricalAnalyticsPage'));
const AnalyticsUnified = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const Help = lazy(() => import('./pages/Help').then((m) => ({ default: m.Help })));
const SettingsUnified = lazy(() => import('./pages/SettingsUnified'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AISettingsPage = lazy(() => import('./pages/AISettingsPage'));
const MonitoringPage = lazy(() => import('./pages/MonitoringPage'));
const MonitoringUnified = lazy(() => import('./pages/Monitoring'));
const PluginsPage = lazy(() => import('./pages/PluginsPage'));

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
    const main = document.getElementById('main-content');
    if (main) {
      main.focus({ preventScroll: true });
    }
  }, [pathname]);
  return null;
}

export default function App() {
  const { i18n } = useTranslation();
  const {
    theme,
    locale,
    setTheme,
    themePreference,
    fontScale,
    reducedMotion,
    highContrast,
    compactMode,
    glowEffects,
    animations,
    onboardingCompleted,
  } = useAppStoreShallow((s) => ({
    theme: s.theme,
    locale: s.locale,
    setTheme: s.setTheme,
    themePreference: s.themePreference,
    fontScale: s.settings.fontScale,
    reducedMotion: s.settings.reducedMotion,
    highContrast: s.settings.highContrast,
    compactMode: s.settings.compactMode,
    glowEffects: s.settings.glowEffects,
    animations: s.settings.animations,
    onboardingCompleted: s.onboardingCompleted,
  }));

  // Adapter bridge replaces the old useWebSocket hook
  useAdapterBridge();

  // Push notifications for energy events (EV ready, tariff spike, battery low, etc.)
  useNotifications();

  const themeDefinition = themeDefinitions[theme];

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = locale;
    document.documentElement.style.colorScheme = themeDefinitions[theme].isDark ? 'dark' : 'light';
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeDefinition.colors.background);
    }
  }, [locale, theme, themeDefinition.colors.background]);

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
  const themeInitRef = useRef(false);
  useEffect(() => {
    if (themeInitRef.current) return;
    themeInitRef.current = true;
    if (themePreference === 'system') {
      const resolvedTheme = resolveTheme('system');
      setTheme(resolvedTheme);
    }
  }, [themePreference, setTheme]);

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
        <PWAUpdateNotification />
        <TauriAutoUpdater />

        {/* Onboarding: render fullscreen, hide entire app shell behind it */}
        {!onboardingCompleted ? (
          <Suspense fallback={null}>
            <Onboarding />
          </Suspense>
        ) : (
          <>
            <OfflineBanner />
            <PWAInstallPrompt />
          </>
        )}

        <EnergyProvider>
          <AppShell
            aria-hidden={!onboardingCompleted || undefined}
            inert={!onboardingCompleted || undefined}
          >
            <ErrorBoundary>
              <Suspense fallback={<PageLoadingFallback />}>
                <Routes>
                  {/* ── Section 1: Command Hub ── */}
                  <Route element={<CommandHubLayout />}>
                    <Route path="/" element={<CommandHub />} />
                  </Route>

                  {/* ── Section 2: Live Energy ── */}
                  <Route element={<LiveEnergyLayout />}>
                    <Route path="/energy-flow" element={<LiveEnergyFlow />} />
                    {/* Legacy redirects — remove after 2025-08-15 */}
                    <Route
                      path="/energy-flow-classic"
                      element={<Navigate to="/energy-flow" replace />}
                    />
                    <Route path="/production" element={<Navigate to="/energy-flow" replace />} />
                    <Route path="/storage" element={<Navigate to="/energy-flow" replace />} />
                    <Route path="/consumption" element={<Navigate to="/energy-flow" replace />} />
                  </Route>

                  {/* ── Section 3: Devices & Automation ── */}
                  <Route element={<DevicesLayout />}>
                    <Route path="/devices" element={<DevicesAutomation />} />
                    {/* Legacy redirects — remove after 2025-08-15 */}
                    <Route path="/ev" element={<Navigate to="/devices" replace />} />
                    <Route path="/floorplan" element={<Navigate to="/devices" replace />} />
                    <Route path="/controllers" element={<Navigate to="/devices" replace />} />
                    <Route path="/hardware" element={<Navigate to="/devices" replace />} />
                  </Route>

                  {/* ── Section 4: Optimization & AI ── */}
                  <Route element={<OptimizationLayout />}>
                    <Route path="/optimization-ai" element={<OptimizationAI />} />
                    <Route path="/tariffs" element={<TariffsPage />} />
                    {/* Legacy redirect — remove after 2025-08-15 */}
                    <Route
                      path="/ai-optimizer"
                      element={<Navigate to="/optimization-ai" replace />}
                    />
                  </Route>

                  {/* ── Section 5: Analytics & Reports ── */}
                  <Route element={<AnalyticsLayout />}>
                    <Route path="/analytics" element={<AnalyticsUnified />} />
                    <Route path="/analytics/realtime" element={<AnalyticsPage />} />
                    <Route path="/analytics/historical" element={<HistoricalAnalyticsPage />} />
                    {/* Legacy redirect */}
                    <Route
                      path="/historical-analytics"
                      element={<Navigate to="/analytics" replace />}
                    />
                  </Route>

                  {/* ── Section 6: Monitoring & Health ── */}
                  <Route element={<MonitoringLayout />}>
                    <Route path="/monitoring" element={<MonitoringUnified />} />
                    <Route path="/monitoring/full" element={<MonitoringPage />} />
                  </Route>

                  {/* ── Section 7: Settings & Plugins ── */}
                  <Route element={<SettingsLayout />}>
                    <Route path="/settings" element={<SettingsUnified />} />
                    <Route path="/settings/ai" element={<AISettingsPage />} />
                    <Route path="/settings/config" element={<Settings />} />
                    <Route path="/plugins" element={<PluginsPage />} />
                    <Route path="/help" element={<Help />} />
                  </Route>

                  {/* Catch-all */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </AppShell>
        </EnergyProvider>
      </Router>
    </ErrorBoundary>
  );
}
