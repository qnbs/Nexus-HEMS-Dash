/**
 * PWA Install Prompt Component
 * Displays install banner when PWA is installable
 * Features: deferred prompt, smart timing, platform-aware messaging
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Smartphone, Monitor, Zap, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
}

export function PWAInstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (isStandalone()) return;

    let promptTimer: ReturnType<typeof setTimeout> | null = null;

    // Check if dismissed in last 7 days
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const daysSinceDismissal = (Date.now() - parseInt(dismissed, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissal < 7) return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt after 20 seconds of engagement
      promptTimer = setTimeout(() => {
        setShowPrompt(true);
      }, 20000);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-installed', 'true');
      // Show success briefly
      setTimeout(() => setInstalled(false), 4000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Show iOS install hint if applicable
    if (isIOS() && !localStorage.getItem('pwa-installed')) {
      promptTimer = setTimeout(() => {
        setShowIOSHint(true);
      }, 15000);
    }

    return () => {
      if (promptTimer) clearTimeout(promptTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted installation');
      }
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('[PWA] Installation error:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSHint(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Installation success toast
  if (installed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
      >
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl p-4 shadow-2xl flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
          <div>
            <p className="font-semibold text-sm text-emerald-400">{t('pwa.installed', 'Successfully installed!')}</p>
            <p className="text-xs text-[color:var(--color-muted)]">{t('pwa.installedDesc', 'Nexus HEMS is now available on your home screen')}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // iOS install hint
  if (showIOSHint) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md"
        >
          <div className="glass-panel rounded-2xl border-2 border-[color:var(--color-primary)]/30 p-6 shadow-2xl">
            <button onClick={handleDismiss} className="absolute top-3 right-3 p-1 rounded-lg text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]" aria-label={t('common.close', 'Close')}>
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-primary)]/20">
                <Smartphone className="h-6 w-6 text-[color:var(--color-primary)]" />
              </div>
              <div>
                <h3 className="font-semibold text-[color:var(--color-text)]">{t('pwa.installTitle')}</h3>
                <p className="mt-1 text-sm text-[color:var(--color-muted)]">{t('pwa.iosInstallHint', 'To install on iOS: tap the Share button in Safari, then select "Add to Home Screen".')}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md"
      >
        <div className="glass-panel rounded-2xl border-2 border-[color:var(--color-primary)]/30 p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-primary)]/20">
                <Download className="h-6 w-6 text-[color:var(--color-primary)]" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[color:var(--color-text)]">{t('pwa.installTitle')}</h3>
                <p className="mt-1 text-sm text-[color:var(--color-muted)]">{t('pwa.installDescription')}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-[color:var(--color-muted)]">
                  <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--color-border)] px-2 py-0.5">
                    <Zap className="h-3 w-3 text-[color:var(--color-primary)]" /> {t('pwa.featureFast', 'Faster loading')}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--color-border)] px-2 py-0.5">
                    <Monitor className="h-3 w-3 text-blue-400" /> {t('pwa.featureOffline', 'Offline mode')}
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={handleInstallClick} className="btn-primary focus-ring px-4 py-2 text-sm">{t('pwa.install')}</button>
                  <button onClick={handleDismiss} className="btn-secondary focus-ring px-4 py-2 text-sm">{t('common.later', 'Later')}</button>
                </div>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="focus-ring rounded-lg p-1 text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"
              aria-label={t('common.close', 'Close')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
