/**
 * PWA Update Notification Component
 * Detects and notifies users of new app versions
 * Features: periodic update checks, offline-ready notification, update progress
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, AlertCircle, Wifi, WifiOff, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function PWAUpdateNotification() {
  const { t } = useTranslation();
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [showOfflineReady, setShowOfflineReady] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.log('[PWA] Service Worker registered:', swUrl);

      // Check for updates every 30 minutes
      if (registration) {
        const intervalId = setInterval(
          () => {
            registration.update().catch((error) => {
              console.error('[PWA] Update check failed:', error);
            });
          },
          30 * 60 * 1000,
        );
        (
          registration as unknown as { _updateInterval?: ReturnType<typeof setInterval> }
        )._updateInterval = intervalId;
      }
    },
    onRegisterError(error) {
      console.error('[PWA] Service Worker registration failed:', error);
      setUpdateError(t('pwa.registrationError', 'Failed to register Service Worker'));
    },
    onNeedRefresh() {
      setShowUpdatePrompt(true);
    },
    onOfflineReady() {
      console.log('[PWA] App ready to work offline');
      setShowOfflineReady(true);
      // Auto-dismiss offline-ready notification after 5 seconds
      setTimeout(() => setShowOfflineReady(false), 5000);
    },
  });

  useEffect(() => {
    setShowUpdatePrompt(needRefresh);
  }, [needRefresh]);

  useEffect(() => {
    if (offlineReady && !showOfflineReady) {
      // Already dismissed
    }
  }, [offlineReady, showOfflineReady]);

  const handleUpdate = useCallback(async () => {
    setIsUpdating(true);
    try {
      await updateServiceWorker(true);
      setShowUpdatePrompt(false);
      setNeedRefresh(false);
    } catch (error) {
      console.error('[PWA] Update failed:', error);
      setUpdateError(t('pwa.updateError', 'Failed to update app'));
    } finally {
      setIsUpdating(false);
    }
  }, [updateServiceWorker, setNeedRefresh, t]);

  const handleDismiss = useCallback(() => {
    setShowUpdatePrompt(false);
    setNeedRefresh(false);
  }, [setNeedRefresh]);

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
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl p-4 shadow-2xl flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-sm text-emerald-400">{t('pwa.offlineReady', 'Offline Ready')}</p>
              <p className="text-xs text-[color:var(--color-muted)]">{t('pwa.offlineReadyDesc', 'App cached — works without internet')}</p>
            </div>
            <WifiOff className="h-4 w-4 text-emerald-400/60" />
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

  if (!showUpdatePrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed left-4 right-4 top-4 z-50 md:left-auto md:right-4 md:max-w-md"
        role="alert"
        aria-live="assertive"
      >
        <div className="glass-panel rounded-2xl border-2 border-[color:var(--color-primary)]/30 p-5 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-primary)]/20">
              <RefreshCw className={`h-5 w-5 text-[color:var(--color-primary)] ${isUpdating ? 'animate-spin' : ''}`} aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[color:var(--color-text)]">
                {t('pwa.updateAvailable', 'Update Available')}
              </h3>
              <p className="mt-1 text-sm text-[color:var(--color-muted)]">
                {t('pwa.updateDescription', 'A new version of Nexus HEMS is available with improvements and fixes.')}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-[color:var(--color-muted)]">
                <Wifi className="h-3 w-3 text-emerald-400" />
                <span>{t('pwa.updateSize', 'Quick update — no data loss')}</span>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={handleUpdate} disabled={isUpdating} className="btn-primary focus-ring px-4 py-2 text-sm disabled:opacity-50">
                  {isUpdating ? t('pwa.updating', 'Updating…') : t('pwa.updateNow', 'Update Now')}
                </button>
                <button onClick={handleDismiss} disabled={isUpdating} className="btn-secondary focus-ring px-4 py-2 text-sm disabled:opacity-50">
                  {t('common.later', 'Later')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
