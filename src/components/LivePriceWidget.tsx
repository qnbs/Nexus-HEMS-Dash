import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '../store';
import type { TariffForecast } from '../lib/predictive-ai';

export function LivePriceWidget() {
  const { t } = useTranslation();
  const { energyData, settings } = useAppStore();
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

  const currentPrice = energyData.priceCurrent;
  const isGoodPrice = currentPrice < settings.chargeThreshold;
  const trend = nextBestSlot && currentPrice > nextBestSlot.pricePerKwh ? 'down' : 'up';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-3xl p-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow mb-2">
            <Zap className="inline h-4 w-4" aria-hidden="true" />
            {settings.tariffProvider === 'tibber'
              ? 'Tibber'
              : settings.tariffProvider === 'awattar'
                ? 'aWATTar'
                : t('settings.none')}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums text-[color:var(--color-text)]">
              {currentPrice.toFixed(3)}
            </span>
            <span className="text-sm text-[color:var(--color-muted)]">{t('units.euroPerKwh')}</span>
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
        <div className="mt-4 border-t border-[color:var(--color-border)] pt-4">
          <p className="text-xs text-[color:var(--color-muted)]">
            {t('ai.nextBestAction')}:{' '}
            <span className="font-semibold text-[color:var(--color-primary)]">
              {nextBestSlot.timestamp.toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>{' '}
            ({nextBestSlot.pricePerKwh.toFixed(3)} €/kWh)
          </p>
        </div>
      )}

      {/* Mini Chart */}
      <div className="mt-4 flex h-12 items-end gap-0.5">
        {forecast.slice(0, 12).map((slot, i) => {
          const maxPrice = Math.max(...forecast.slice(0, 12).map((s) => s.pricePerKwh));
          const minPrice = Math.min(...forecast.slice(0, 12).map((s) => s.pricePerKwh));
          const height = ((slot.pricePerKwh - minPrice) / (maxPrice - minPrice)) * 100;

          return (
            <div
              key={i}
              className="flex-1 rounded-t-sm bg-[color:var(--color-primary)]/40 transition-all hover:bg-[color:var(--color-primary)]"
              style={{ height: `${height}%` }}
              title={`${slot.timestamp.toLocaleTimeString('de-DE', { hour: '2-digit' })}: ${slot.pricePerKwh.toFixed(3)} €/kWh`}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
