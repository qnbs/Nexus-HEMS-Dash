/**
 * PWA Update Notification Component
 *
 * Uses registerType: 'autoUpdate' — the SW activates immediately via
 * skipWaiting + clientsClaim. Shows informational toasts for update-ready,
 * offline-ready, and error states.
 *
 * Update check strategy:
 * - On visibility change (tab re-focus) with 10-minute cooldown
 * - Periodic check every 15 minutes while the page is active
 * - Immediate check on online event (reconnecting after offline)
 */

import { useRegisterSW } from 'virtual:pwa-register/react';
import { AlertCircle, CheckCircle2, RefreshCw, WifiOff, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** Minimum time between consecutive update checks (10 min) */
const UPDATE_CHECK_COOLDOWN_MS = 10 * 60 * 1000;
/** Periodic update check interval (15 min) */
const UPDATE_CHECK_INTERVAL_MS = 15 * 60 * 1000;

export function PWAUpdateNotification() {
  const { t } = useTranslation();
  const [showOfflineReady, setShowOfflineReady] = useState(false);
  const [showUpdating, setShowUpdating] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const lastCheckRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  /** Throttled SW update check — stable identity needed for useEffect dep array */
  const checkForUpdate = useCallback(() => {
    const now = Date.now();
    if (now - lastCheckRef.current < UPDATE_CHECK_COOLDOWN_MS) return;
    lastCheckRef.current = now;
    registrationRef.current?.update().catch((error: unknown) => {
      console.error('[PWA] Update check failed:', error);
    });
  }, []);

  const { updateServiceWorker } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (import.meta.env.DEV) console.log('[PWA] Service Worker registered:', swUrl);

      if (registration) {
        registrationRef.current = registration;

        // Periodic update check
        intervalRef.current = setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);

        // Immediately check once on registration
        registration.update().catch(() => {});
      }
    },
    onRegisterError(error) {
      console.error('[PWA] Service Worker registration failed:', error);
      setUpdateError(t('pwa.registrationError', 'Failed to register Service Worker'));
    },
    onNeedRefresh() {
      setShowUpdating(true);
    },
    onOfflineReady() {
      if (import.meta.env.DEV) console.log('[PWA] App ready to work offline');
      setShowOfflineReady(true);
      setTimeout(() => setShowOfflineReady(false), 5000);
    },
  });

  // Check for updates when the tab becomes visible or when coming back online
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkForUpdate();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('online', checkForUpdate);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('online', checkForUpdate);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkForUpdate]);

  const handleUpdate = () => {
    setIsRestarting(true);
    updateServiceWorker(true).catch(() => {
      // Fallback: force reload if SW update fails
      setTimeout(() => window.location.reload(), 500);
    });
  };

  // "Update ready — restart to apply" toast
  if (showUpdating) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 left-4 z-notification md:right-4 md:left-auto md:max-w-sm"
          role="alert"
        >
          <div className="relative flex items-center gap-3 rounded-2xl border border-(--color-primary)/30 bg-(--color-primary)/10 p-4 shadow-2xl backdrop-blur-xl">
            <RefreshCw className="h-5 w-5 shrink-0 text-(--color-primary)" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-semibold text-(--color-primary) text-sm">
                {t('pwa.updateReady', 'Update ready')}
              </p>
              <p className="text-(--color-muted) text-xs">
                {t('pwa.updateReadyDesc', 'A new version has been installed. Restart to apply.')}
              </p>
            </div>
            <button
              type="button"
              onClick={handleUpdate}
              disabled={isRestarting}
              className="focus-ring shrink-0 rounded-lg bg-(--color-primary) px-3 py-1.5 font-medium text-white text-xs transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isRestarting ? (
                <RefreshCw className="h-3 w-3 animate-spin" aria-hidden="true" />
              ) : (
                t('pwa.restart', 'Restart')
              )}
            </button>
            <button
              type="button"
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
          className="fixed top-4 right-4 left-4 z-notification md:right-4 md:left-auto md:max-w-sm"
        >
          <div
            className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-2xl backdrop-blur-xl"
            role="status"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-semibold text-emerald-400 text-sm">
                {t('pwa.offlineReady', 'Offline Ready')}
              </p>
              <p className="text-(--color-muted) text-xs">
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
          className="fixed top-4 right-4 left-4 z-notification md:right-4 md:left-auto md:max-w-md"
        >
          <div
            className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 backdrop-blur-3xl"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-medium text-red-400 text-sm">{updateError}</p>
                <button
                  type="button"
                  onClick={() => setUpdateError(null)}
                  className="mt-2 text-red-300 text-xs underline hover:text-red-200"
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
