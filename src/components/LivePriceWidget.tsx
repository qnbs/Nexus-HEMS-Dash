import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '../store';
import type { TariffForecast } from '../lib/predictive-ai';

export function LivePriceWidget() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'de' ? 'de-DE' : 'en-US';
  const priceCurrent = useAppStore((s) => s.energyData.priceCurrent);
  const tariffProvider = useAppStore((s) => s.settings.tariffProvider);
  const chargeThreshold = useAppStore((s) => s.settings.chargeThreshold);
  const [forecast, setForecast] = useState<TariffForecast[]>([]);
  const [nextBestSlot, setNextBestSlot] = useState<TariffForecast | null>(null);

  useEffect(() => {
    const loadForecast = () => {
      // Simulate fetching forecast
      const simulatedForecast: TariffForecast[] = Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(Date.now() + i * 3600000),
        pricePerKwh: 0.15 + Math.sin(i / 4) * 0.08,
        renewable: 40 + Math.sin(i / 6) * 20,
        co2Intensity: 200 + Math.sin(i / 8) * 80,
      }));

      setForecast(simulatedForecast);

      // Find next best price slot
      const sorted = [...simulatedForecast].sort((a, b) => a.pricePerKwh - b.pricePerKwh);
      setNextBestSlot(sorted[0]);
    };

    loadForecast();
  }, []);

  const currentPrice = priceCurrent;
  const isGoodPrice = currentPrice < chargeThreshold;
  const trend = nextBestSlot && currentPrice > nextBestSlot.pricePerKwh ? 'down' : 'up';

  const chartSlice = forecast.slice(0, 12);
  const { maxPrice, minPrice } = (() => {
    if (chartSlice.length === 0) return { maxPrice: 1, minPrice: 0 };
    const prices = chartSlice.map((s) => s.pricePerKwh);
    return { maxPrice: Math.max(...prices), minPrice: Math.min(...prices) };
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-5"
    >
      <div
        className="flex items-center justify-between gap-4"
        aria-live="polite"
        aria-atomic="true"
      >
        <div>
          <p className="eyebrow mb-2">
            <Zap className="inline h-4 w-4" aria-hidden="true" />
            {tariffProvider === 'tibber'
              ? t('settings.tibber')
              : tariffProvider === 'awattar'
                ? t('settings.awattar')
                : t('settings.none')}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-(--color-text) tabular-nums">
              {currentPrice.toFixed(3)}
            </span>
            <span className="text-sm text-(--color-muted)">{t('units.euroPerKwh')}</span>
          </div>
        </div>

        <div
          className={`flex h-16 w-16 items-center justify-center rounded-full ${
            isGoodPrice ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'
          }`}
        >
          {trend === 'down' ? (
            <TrendingDown className="h-8 w-8" aria-hidden="true" />
          ) : (
            <TrendingUp className="h-8 w-8" aria-hidden="true" />
          )}
        </div>
      </div>

      {nextBestSlot && (
        <div className="mt-4 border-t border-(--color-border) pt-4">
          <p className="text-xs text-(--color-muted)">
            {t('ai.nextBestAction')}:{' '}
            <span className="font-semibold text-(--color-primary)">
              {nextBestSlot.timestamp.toLocaleTimeString(dateLocale, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>{' '}
            ({nextBestSlot.pricePerKwh.toFixed(3)} {t('units.euroPerKwh')})
          </p>
        </div>
      )}

      {/* Mini Chart */}
      <div
        className="mt-4 flex h-12 items-end gap-0.5"
        role="img"
        aria-label={t('chart.priceAriaLabel', 'Price forecast chart for the next 12 hours')}
      >
        {chartSlice.map((slot, i) => {
          const range = maxPrice - minPrice || 1;
          const height = ((slot.pricePerKwh - minPrice) / range) * 100;

          return (
            <div
              key={i}
              className="flex-1 rounded-t-sm bg-(--color-primary)/40 transition-all hover:bg-(--color-primary)"
              style={{ height: `${height}%` }}
              title={`${slot.timestamp.toLocaleTimeString(dateLocale, { hour: '2-digit' })}: ${slot.pricePerKwh.toFixed(3)} ${t('units.euroPerKwh')}`}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
