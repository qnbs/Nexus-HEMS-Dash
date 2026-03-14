/**
 * PWA Update Notification Component
 * Auto-updates service worker and shows informational toasts.
 * Uses registerType: 'autoUpdate' — the SW activates immediately via
 * skipWaiting + clientsClaim, then the page auto-reloads.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, AlertCircle, WifiOff, CheckCircle2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function PWAUpdateNotification() {
  const { t } = useTranslation();
  const [showOfflineReady, setShowOfflineReady] = useState(false);
  const [showUpdating, setShowUpdating] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (import.meta.env.DEV) console.log('[PWA] Service Worker registered:', swUrl);

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
      if (import.meta.env.DEV) console.log('[PWA] App ready to work offline');
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
          className="z-notification fixed top-4 right-4 left-4 md:right-4 md:left-auto md:max-w-sm"
          role="alert"
        >
          <div className="relative flex items-center gap-3 rounded-2xl border border-(--color-primary)/30 bg-(--color-primary)/10 p-4 shadow-2xl backdrop-blur-xl">
            <RefreshCw className="h-5 w-5 shrink-0 text-(--color-primary)" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-(--color-primary)">
                {t('pwa.updateReady', 'Update ready')}
              </p>
              <p className="text-xs text-(--color-muted)">
                {t('pwa.updateReadyDesc', 'A new version has been installed. Restart to apply.')}
              </p>
            </div>
            <button
              onClick={() => {
                setIsRestarting(true);
                setTimeout(() => window.location.reload(), 500);
              }}
              disabled={isRestarting}
              className="focus-ring shrink-0 rounded-lg bg-(--color-primary) px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isRestarting ? (
                <RefreshCw className="h-3 w-3 animate-spin" aria-hidden="true" />
              ) : (
                t('pwa.restart', 'Restart')
              )}
            </button>
            <button
              onClick={() => setShowUpdating(false)}
              className="absolute -top-2 -right-2 rounded-full border border-(--color-border) bg-(--color-surface) p-1 text-(--color-muted) shadow-md transition-colors hover:text-(--color-text)"
              aria-label={t('common.close', 'Close')}
            >
              <X className="h-3 w-3" />
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
          className="z-notification fixed top-4 right-4 left-4 md:right-4 md:left-auto md:max-w-sm"
        >
          <div
            className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-2xl backdrop-blur-xl"
            role="status"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-400">
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
          className="z-notification fixed top-4 right-4 left-4 md:right-4 md:left-auto md:max-w-md"
        >
          <div
            className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 backdrop-blur-3xl"
            role="alert"
          >
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
