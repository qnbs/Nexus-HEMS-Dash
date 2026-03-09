/**
 * PWA Update Notification Component
 * Detects and notifies users of new app versions
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function PWAUpdateNotification() {
  const { t } = useTranslation();
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.log('[PWA] Service Worker registered:', swUrl);

      // Check for updates every hour
      if (registration) {
        const intervalId = setInterval(
          () => {
            registration.update().catch((error) => {
              console.error('[PWA] Update check failed:', error);
            });
          },
          60 * 60 * 1000,
        );
        // Store interval ref for possible cleanup
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
    },
  });

  useEffect(() => {
    // Update prompt state when needRefresh changes
    setShowUpdatePrompt(needRefresh);
  }, [needRefresh]);

  const handleUpdate = async () => {
    try {
      await updateServiceWorker(true);
      setShowUpdatePrompt(false);
      setNeedRefresh(false);
    } catch (error) {
      console.error('[PWA] Update failed:', error);
      setUpdateError(t('pwa.updateError', 'Failed to update app'));
    }
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
    setNeedRefresh(false);
  };

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
              <RefreshCw className="h-5 w-5 text-[color:var(--color-primary)]" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[color:var(--color-text)]">
                {t('pwa.updateAvailable', 'Update Available')}
              </h3>
              <p className="mt-1 text-sm text-[color:var(--color-muted)]">
                {t(
                  'pwa.updateDescription',
                  'A new version of Nexus HEMS is available. Update now for the latest features and improvements.',
                )}
              </p>
              <div className="mt-4 flex gap-2">
                <button onClick={handleUpdate} className="btn-primary focus-ring px-4 py-2 text-sm">
                  {t('pwa.updateNow', 'Update Now')}
                </button>
                <button
                  onClick={handleDismiss}
                  className="btn-secondary focus-ring px-4 py-2 text-sm"
                >
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
