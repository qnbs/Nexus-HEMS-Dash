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
      <App />
    </QueryProvider>
  </StrictMode>,
);

// Start the background Dexie downsampling service after React mounts.
// 90 s startup delay avoids contending with initial data loading.
startDownsamplingService();
