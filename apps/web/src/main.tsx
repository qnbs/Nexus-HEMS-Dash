import { MotionConfig } from 'motion/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { startDownsamplingService } from './lib/downsampling-service';
import { QueryProvider } from './lib/query-client.tsx';
import { initSentry } from './lib/sentry';
import './i18n';
import './index.css';

// Initialize Sentry before React renders (no-op without VITE_SENTRY_DSN)
initSentry();

// Handle service worker controller change (auto-reload on SW update)
// Disabled during E2E testing to prevent mid-test reloads caused by SW installation.
if ('serviceWorker' in navigator && !import.meta.env.VITE_E2E_TESTING) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      {/* Under E2E, skip all framer-motion animations so values snap to their final
          state instantly. Entrance opacity/spring fades otherwise race the axe scan
          and trip transient color-contrast violations (spring animations are JS-driven
          and invisible to `document.getAnimations()`, so the test-side settle can't
          catch them). `skipAnimations` is framer's documented E2E switch; gated on
          VITE_E2E_TESTING → zero production impact. */}
      <MotionConfig skipAnimations={import.meta.env.VITE_E2E_TESTING === 'true'}>
        <App />
      </MotionConfig>
    </QueryProvider>
  </StrictMode>,
);

// Start the background Dexie downsampling service after React mounts.
// 90 s startup delay avoids contending with initial data loading.
// Disabled during E2E testing to eliminate background IndexedDB work and
// timers that can keep the Playwright process alive.
if (import.meta.env.VITE_E2E_TESTING !== 'true') {
  startDownsamplingService();
}
