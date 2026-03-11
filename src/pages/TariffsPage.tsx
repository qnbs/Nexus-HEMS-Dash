import { memo } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { TrendingUp } from 'lucide-react';
import { useAppStore } from '../store';
import { PageHeader } from '../components/layout/PageHeader';
import { LivePriceWidget } from '../components/LivePriceWidget';
import { PredictiveForecast } from '../components/PredictiveForecast';

function TariffsPageComponent() {
  const { t } = useTranslation();
  const energyData = useAppStore((s) => s.energyData);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.tariffs', 'Dynamic Tariffs')}
        subtitle={t('tariffs.subtitle', 'Tibber, aWATTar & price optimization')}
        icon={<TrendingUp size={22} aria-hidden="true" />}
        actions={
          <span className="price-pill text-lg">
            {energyData.priceCurrent.toFixed(3)} {t('units.euroPerKwh', '€/kWh')}
          </span>
        }
      />

      {/* Live Price Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <LivePriceWidget />
      </motion.div>

      {/* Predictive Forecast */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <PredictiveForecast />
      </motion.div>

      {/* Charging Windows */}
      <motion.section
        className="glass-panel-strong rounded-3xl p-6 hover-lift"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2 className="mb-4 text-lg font-medium fluid-text-lg">{t('forecast.lowPriceWindow')}</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            {
              time: '02:00 – 05:00',
              price: `0.08 ${t('units.euroPerKwh', '€/kWh')}`,
              status: t('common.recommended'),
            },
            {
              time: '12:00 – 14:00',
              price: `0.12 ${t('units.euroPerKwh', '€/kWh')}`,
              status: t('ai.surplus'),
            },
            {
              time: '23:00 – 01:00',
              price: `0.09 ${t('units.euroPerKwh', '€/kWh')}`,
              status: t('common.recommended'),
            },
          ].map((window, i) => (
            <div key={i} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-sm font-medium text-emerald-400">{window.time}</p>
              <p className="mt-1 text-lg font-light text-(--color-text)">{window.price}</p>
              <p className="mt-0.5 text-xs text-(--color-muted)">{window.status}</p>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}

export default memo(TariffsPageComponent);
