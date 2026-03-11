import { memo } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Sun } from 'lucide-react';
import { useAppStore } from '../store';
import { PageHeader } from '../components/layout/PageHeader';
import { PredictiveForecast } from '../components/PredictiveForecast';

function ProductionPageComponent() {
  const { t } = useTranslation();
  const energyData = useAppStore((s) => s.energyData);

  const selfConsumptionRatio =
    energyData.pvPower > 0
      ? Math.min(
          100,
          ((energyData.houseLoad + Math.abs(Math.min(0, energyData.batteryPower))) /
            energyData.pvPower) *
            100,
        )
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.production', 'Production')}
        subtitle={t('production.subtitle', 'Solar PV generation & forecast')}
        icon={<Sun size={22} aria-hidden="true" />}
      />

      {/* PV Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t('production.currentPower', 'Current Power')}
          value={`${(energyData.pvPower / 1000).toFixed(2)}`}
          unit="kW"
          color="text-yellow-400"
          delay={0.1}
        />
        <StatCard
          label={t('production.todayYield', "Today's Yield")}
          value={`${energyData.pvYieldToday.toFixed(1)}`}
          unit="kWh"
          color="text-orange-400"
          delay={0.15}
        />
        <StatCard
          label={t('production.selfConsumption', 'Self-Consumption')}
          value={`${selfConsumptionRatio.toFixed(0)}`}
          unit="%"
          color="text-emerald-400"
          delay={0.2}
        />
        <StatCard
          label={t('production.feedIn', 'Feed-In')}
          value={`${(Math.max(0, -energyData.gridPower) / 1000).toFixed(2)}`}
          unit="kW"
          color="text-cyan-400"
          delay={0.25}
        />
      </div>

      {/* PV Status Visual */}
      <motion.section
        className="glass-panel-strong rounded-3xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2 className="mb-4 text-lg font-medium fluid-text-lg">
          {t('production.status', 'PV System Status')}
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Power Output Bar */}
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-(--color-muted)">{t('production.output', 'Output')}</span>
              <span className="font-medium text-yellow-400">
                {(energyData.pvPower / 1000).toFixed(2)} {t('units.kilowatt')} / 10.0{' '}
                {t('units.kilowatt')}
              </span>
            </div>
            <div
              className="h-3 overflow-hidden rounded-full bg-(--color-surface)"
              role="progressbar"
              aria-valuenow={Math.min(100, Math.round((energyData.pvPower / 10000) * 100))}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('production.output')}
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-500"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (energyData.pvPower / 10000) * 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
          {/* Self-Consumption Bar */}
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-(--color-muted)">
                {t('production.selfConsumption', 'Self-Consumption')}
              </span>
              <span className="font-medium text-emerald-400">
                {selfConsumptionRatio.toFixed(0)}%
              </span>
            </div>
            <div
              className="h-3 overflow-hidden rounded-full bg-(--color-surface)"
              role="progressbar"
              aria-valuenow={Math.round(selfConsumptionRatio)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('production.selfConsumption')}
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                initial={{ width: 0 }}
                animate={{ width: `${selfConsumptionRatio}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* Forecast */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <PredictiveForecast />
      </motion.div>
    </div>
  );
}

const StatCard = memo(function StatCard({
  label,
  value,
  unit,
  color,
  delay,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      className="metric-card rounded-3xl hover-lift"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
    >
      <p className="text-xs text-(--color-muted)">{label}</p>
      <p className={`mt-1 text-2xl font-light ${color}`}>
        {value} <span className="text-sm text-(--color-muted)">{unit}</span>
      </p>
    </motion.div>
  );
});

export default memo(ProductionPageComponent);
