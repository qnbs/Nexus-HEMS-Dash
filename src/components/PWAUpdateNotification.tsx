/**
 * PWA Update Notification Component
 * Auto-updates service worker and shows informational toasts.
 * Uses registerType: 'autoUpdate' — the SW activates immediately via
 * skipWaiting + clientsClaim, then the page auto-reloads.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, AlertCircle, WifiOff, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function PWAUpdateNotification() {
  const { t } = useTranslation();
  const [showOfflineReady, setShowOfflineReady] = useState(false);
  const [showUpdating, setShowUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.log('[PWA] Service Worker registered:', swUrl);

      // Check for updates every 30 minutes
      if (registration) {
        setInterval(
          () => {
            registration.update().catch((error: unknown) => {
              console.error('[PWA] Update check failed:', error);
            });
          },
          30 * 60 * 1000,
        );
      }
    },
    onRegisterError(error) {
      console.error('[PWA] Service Worker registration failed:', error);
      setUpdateError(t('pwa.registrationError', 'Failed to register Service Worker'));
    },
    onNeedRefresh() {
      // Show "update ready" notification with manual restart option
      setShowUpdating(true);
    },
    onOfflineReady() {
      console.log('[PWA] App ready to work offline');
      setShowOfflineReady(true);
      setTimeout(() => setShowOfflineReady(false), 5000);
    },
  });

  // "Update ready — restart to apply" toast
  if (showUpdating) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed left-4 right-4 top-4 z-50 md:left-auto md:right-4 md:max-w-sm"
          role="alert"
        >
          <div className="rounded-2xl border border-(--color-primary)/30 bg-(--color-primary)/10 backdrop-blur-xl p-4 shadow-2xl flex items-center gap-3">
            <RefreshCw
              className="h-5 w-5 text-(--color-primary) shrink-0"
              aria-hidden="true"
            />
            <div className="flex-1">
              <p className="font-semibold text-sm text-(--color-primary)">
                {t('pwa.updateReady', 'Update ready')}
              </p>
              <p className="text-xs text-(--color-muted)">
                {t('pwa.updateReadyDesc', 'A new version has been installed. Restart to apply.')}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="shrink-0 rounded-lg bg-(--color-primary) px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity focus-ring"
            >
              {t('pwa.restart', 'Restart')}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Offline-ready toast
  if (showOfflineReady) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed left-4 right-4 top-4 z-50 md:left-auto md:right-4 md:max-w-sm"
        >
          <div
            className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl p-4 shadow-2xl flex items-center gap-3"
            role="status"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-semibold text-sm text-emerald-400">
                {t('pwa.offlineReady', 'Offline Ready')}
              </p>
              <p className="text-xs text-(--color-muted)">
                {t('pwa.offlineReadyDesc', 'App cached — works without internet')}
              </p>
            </div>
            <WifiOff className="h-4 w-4 text-emerald-400/60" aria-hidden="true" />
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Error notification
  if (updateError) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed left-4 right-4 top-4 z-50 md:left-auto md:right-4 md:max-w-md"
        >
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 backdrop-blur-3xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-400">{updateError}</p>
                <button
                  onClick={() => setUpdateError(null)}
                  className="mt-2 text-xs text-red-300 underline hover:text-red-200"
                >
                  {t('common.dismiss', 'Dismiss')}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
}
