import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PageSkeleton } from './ui/Skeleton';

const CommandHubLayout = lazy(() =>
  import('./layout/SectionLayouts').then((m) => ({ default: m.CommandHubLayout })),
);
const LiveEnergyLayout = lazy(() =>
  import('./layout/SectionLayouts').then((m) => ({ default: m.LiveEnergyLayout })),
);
const DevicesLayout = lazy(() =>
  import('./layout/SectionLayouts').then((m) => ({ default: m.DevicesLayout })),
);
const OptimizationLayout = lazy(() =>
  import('./layout/SectionLayouts').then((m) => ({ default: m.OptimizationLayout })),
);
const AnalyticsLayout = lazy(() =>
  import('./layout/SectionLayouts').then((m) => ({ default: m.AnalyticsLayout })),
);
const MonitoringLayout = lazy(() =>
  import('./layout/SectionLayouts').then((m) => ({ default: m.MonitoringLayout })),
);
const SettingsLayout = lazy(() =>
  import('./layout/SectionLayouts').then((m) => ({ default: m.SettingsLayout })),
);

const CommandHub = lazy(() => import('../pages/CommandHub'));
const LiveEnergyFlow = lazy(() => import('../pages/LiveEnergyFlow'));
const DevicesAutomation = lazy(() => import('../pages/DevicesAutomation'));
const OptimizationAI = lazy(() => import('../pages/OptimizationAI'));
const TariffsPage = lazy(() => import('../pages/TariffsPage'));
const AnalyticsUnified = lazy(() => import('../pages/Analytics'));
const Help = lazy(() => import('../pages/Help').then((m) => ({ default: m.Help })));
const SettingsUnified = lazy(() => import('../pages/SettingsUnified'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const AISettingsPage = lazy(() => import('../pages/AISettingsPage'));
const MonitoringUnified = lazy(() => import('../pages/Monitoring'));
const PluginsPage = lazy(() => import('../pages/PluginsPage'));
const HardwareRegistryPage = lazy(() => import('../pages/HardwareRegistryPage'));

/** Primary SPA route table (7 sections + legacy redirects). */
export const AppRoutes = () => (
  // skipcq: JS-0415 — flat route table; depth is structural, not nested UI logic
  <Suspense fallback={<PageSkeleton />}>
    <Routes>
      <Route element={<CommandHubLayout />}>
        <Route path="/" element={<CommandHub />} />
      </Route>
      <Route element={<LiveEnergyLayout />}>
        <Route path="/energy-flow" element={<LiveEnergyFlow />} />
      </Route>
      <Route element={<DevicesLayout />}>
        <Route path="/devices" element={<DevicesAutomation />} />
      </Route>
      <Route element={<OptimizationLayout />}>
        <Route path="/optimization-ai" element={<OptimizationAI />} />
        <Route path="/tariffs" element={<TariffsPage />} />
      </Route>
      <Route element={<AnalyticsLayout />}>
        <Route path="/analytics" element={<AnalyticsUnified />} />
      </Route>
      <Route element={<MonitoringLayout />}>
        <Route path="/monitoring" element={<MonitoringUnified />} />
      </Route>
      <Route element={<SettingsLayout />}>
        <Route path="/settings" element={<SettingsUnified />} />
        <Route path="/settings/ai" element={<AISettingsPage />} />
        <Route path="/settings/hardware" element={<HardwareRegistryPage />} />
        <Route path="/plugins" element={<PluginsPage />} />
        <Route path="/help" element={<Help />} />
      </Route>
      <Route path="/production" element={<Navigate to="/energy-flow" replace />} />
      <Route path="/storage" element={<Navigate to="/energy-flow" replace />} />
      <Route path="/consumption" element={<Navigate to="/energy-flow" replace />} />
      <Route path="/ev" element={<Navigate to="/devices" replace />} />
      <Route path="/floorplan" element={<Navigate to="/devices" replace />} />
      <Route path="/controllers" element={<Navigate to="/settings" replace />} />
      <Route path="/hardware" element={<Navigate to="/settings/hardware" replace />} />
      <Route path="/historical-analytics" element={<Navigate to="/analytics" replace />} />
      <Route path="/ai-optimizer" element={<Navigate to="/optimization-ai" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Suspense>
);
