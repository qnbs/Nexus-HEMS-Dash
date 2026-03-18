import { Outlet } from 'react-router-dom';

/** Command Hub section layout — wraps the Dashboard/Home page */
export function CommandHubLayout() {
  return <Outlet />;
}

/** Live Energy section layout — wraps energy-flow, production, storage, consumption */
export function LiveEnergyLayout() {
  return <Outlet />;
}

/** Devices & Automation section layout — wraps EV, floorplan, controllers, hardware */
export function DevicesLayout() {
  return <Outlet />;
}

/** Optimization & AI section layout — wraps AI optimizer, tariffs */
export function OptimizationLayout() {
  return <Outlet />;
}

/** Analytics & Reports section layout — wraps analytics, historical-analytics */
export function AnalyticsLayout() {
  return <Outlet />;
}

/** Monitoring & Health section layout — wraps monitoring */
export function MonitoringLayout() {
  return <Outlet />;
}

/** Settings & Plugins section layout — wraps settings, ai-settings, plugins, help */
export function SettingsLayout() {
  return <Outlet />;
}
