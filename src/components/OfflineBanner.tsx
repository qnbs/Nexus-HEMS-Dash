import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getLatestEnergySnapshot } from '../lib/offline-cache';

export function OfflineBanner() {
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastUpdate, setLastUpdate] = useState<{ timestamp: number; ageMinutes: number } | null>(
    null,
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = async () => {
      setIsOffline(true);
      const snapshot = await getLatestEnergySnapshot();
      if (snapshot) {
        setLastUpdate({ timestamp: snapshot.timestamp, ageMinutes: snapshot.ageMinutes });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      void handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50 bg-orange-500/90 backdrop-blur-lg text-white px-4 py-3 shadow-lg"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <WifiOff className="h-5 w-5 animate-pulse" aria-hidden="true" />
              <div>
                <p className="font-semibold">{t('offline.title')}</p>
                {lastUpdate && (
                  <p className="text-sm text-white/90">
                    {t('offline.lastUpdate', `Letzter Stand: vor ${lastUpdate.ageMinutes} Min.`, {
                      minutes: lastUpdate.ageMinutes,
                    })}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
              aria-label={t('offline.retry')}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span className="text-sm font-medium hidden sm:inline">{t('offline.retry')}</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
