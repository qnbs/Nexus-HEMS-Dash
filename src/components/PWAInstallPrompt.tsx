/**
 * PWA Install Prompt Component
 * Displays install banner when PWA is installable
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(() => {
    // Check if already installed (standalone mode)
    return !window.matchMedia('(display-mode: standalone)').matches;
  });
  const [showPrompt, setShowPrompt] = useState(() => {
    // Don't show if dismissed in last 7 days
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const daysSinceDismissal = (Date.now() - parseInt(dismissed, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissal < 7) {
        return false;
      }
    }
    return false;
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);

      // Show prompt after 30 seconds
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 30000);

      return () => clearTimeout(timer);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setShowPrompt(false);
      setDeferredPrompt(null);
      console.log('[PWA] App installed successfully');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
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
      } else {
        console.log('[PWA] User dismissed installation');
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('[PWA] Installation error:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store dismissal in localStorage to not annoy users
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!isInstallable || !showPrompt) return null;

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
                <Download
                  className="h-6 w-6 text-[color:var(--color-primary)]"
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[color:var(--color-text)]">
                  {t('pwa.installTitle', 'Install Nexus HEMS')}
                </h3>
                <p className="mt-1 text-sm text-[color:var(--color-muted)]">
                  {t(
                    'pwa.installDescription',
                    'Install this app on your device for faster access and offline capabilities.',
                  )}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleInstallClick}
                    className="btn-primary focus-ring px-4 py-2 text-sm"
                  >
                    {t('pwa.install', 'Install')}
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
