/**
 * Tauri Desktop Auto-Update Component
 *
 * Checks for updates via Tauri's updater plugin on app launch and periodically.
 * Downloads + installs updates with user confirmation.
 * Only renders in Tauri desktop environment (window.__TAURI__).
 */

import { CheckCircle2, Download, RefreshCw, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** Check interval: every 30 minutes */
const CHECK_INTERVAL_MS = 30 * 60 * 1000;

// Tauri plugin module paths — kept as variables so Rollup/Vite
// does not attempt to resolve the optional native dependencies.
const TAURI_UPDATER_MODULE = '@tauri-apps/plugin-updater';
const TAURI_PROCESS_MODULE = '@tauri-apps/plugin-process';

interface UpdateInfo {
  version: string;
  body: string;
}

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

export function TauriAutoUpdater() {
  const { t } = useTranslation();
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateReady, setUpdateReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isTauri()) return;

    const checkForUpdate = async () => {
      try {
        const { check } = await import(/* @vite-ignore */ TAURI_UPDATER_MODULE);
        const update = await check();

        if (update) {
          setUpdateAvailable({
            version: update.version,
            body: update.body ?? '',
          });
        }
      } catch (err) {
        console.error('[Tauri Updater] Check failed:', err);
      }
    };

    // Check on mount
    checkForUpdate();

    // Periodic check
    intervalRef.current = setInterval(checkForUpdate, CHECK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleDownloadAndInstall = async () => {
    if (!isTauri()) return;

    setIsDownloading(true);
    setError(null);

    try {
      const { check } = await import(/* @vite-ignore */ TAURI_UPDATER_MODULE);
      const update = await check();

      if (!update) return;

      let totalLength = 0;
      let downloaded = 0;

      await update.downloadAndInstall((event: { event: string; data: Record<string, number> }) => {
        if (event.event === 'Started' && event.data.contentLength) {
          totalLength = event.data.contentLength;
        } else if (event.event === 'Progress') {
          downloaded += event.data.chunkLength;
          if (totalLength > 0) {
            setDownloadProgress(Math.round((downloaded / totalLength) * 100));
          }
        } else if (event.event === 'Finished') {
          setUpdateReady(true);
          setIsDownloading(false);
        }
      });

      // Restart the app
      const { relaunch } = await import(/* @vite-ignore */ TAURI_PROCESS_MODULE);
      await relaunch();
    } catch (err) {
      console.error('[Tauri Updater] Install failed:', err);
      setError(t('updater.installFailed', 'Update installation failed'));
      setIsDownloading(false);
    }
  };

  if (!isTauri()) return null;

  // Update downloaded — restart prompt
  if (updateReady) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 left-4 z-notification md:right-4 md:left-auto md:max-w-sm"
          role="alert"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-2xl backdrop-blur-xl">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-semibold text-emerald-400 text-sm">
                {t('updater.ready', 'Update installed')}
              </p>
              <p className="text-(--color-muted) text-xs">
                {t('updater.restartHint', 'Restart to apply the new version.')}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Update available — download prompt
  if (updateAvailable && !isDownloading) {
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
            <Download className="h-5 w-5 shrink-0 text-(--color-primary)" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-semibold text-(--color-primary) text-sm">
                {t('updater.available', 'Update available')} — v{updateAvailable.version}
              </p>
              {updateAvailable.body && (
                <p className="mt-0.5 text-(--color-muted) text-xs">
                  {updateAvailable.body.slice(0, 100)}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleDownloadAndInstall}
              className="focus-ring shrink-0 rounded-lg bg-(--color-primary) px-3 py-1.5 font-medium text-white text-xs transition-opacity hover:opacity-90"
            >
              {t('updater.install', 'Install')}
            </button>
            <button
              type="button"
              onClick={() => setUpdateAvailable(null)}
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

  // Downloading progress
  if (isDownloading) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 left-4 z-notification md:right-4 md:left-auto md:max-w-sm"
          role="status"
        >
          <div className="rounded-2xl border border-(--color-primary)/30 bg-(--color-primary)/10 p-4 shadow-2xl backdrop-blur-xl">
            <div className="mb-2 flex items-center gap-3">
              <RefreshCw
                className="h-5 w-5 animate-spin text-(--color-primary)"
                aria-hidden="true"
              />
              <p className="font-semibold text-(--color-primary) text-sm">
                {t('updater.downloading', 'Downloading update…')} {downloadProgress}%
              </p>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-(--color-primary)/20">
              <div
                className="h-full rounded-full bg-(--color-primary) transition-all"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Error
  if (error) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 left-4 z-notification md:right-4 md:left-auto md:max-w-sm"
          role="alert"
        >
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 backdrop-blur-xl">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="mt-1 text-red-300 text-xs underline hover:text-red-200"
            >
              {t('common.dismiss', 'Dismiss')}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
}
