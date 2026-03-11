import { memo } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Home, Zap } from 'lucide-react';
import { useAppStore } from '../store';
import { PageHeader } from '../components/layout/PageHeader';

function ConsumptionPageComponent() {
  const { t } = useTranslation();
  const energyData = useAppStore((s) => s.energyData);

  const consumers = [
    {
      key: 'houseLoad',
      label: t('metrics.houseLoad'),
      power: energyData.houseLoad,
      color: 'from-blue-500 to-cyan-500',
      textColor: 'text-blue-400',
    },
    {
      key: 'heatPump',
      label: t('devices.heatPump'),
      power: energyData.heatPumpPower,
      color: 'from-red-500 to-orange-500',
      textColor: 'text-red-400',
    },
    {
      key: 'evCharging',
      label: t('devices.wallbox'),
      power: energyData.evPower,
      color: 'from-green-500 to-emerald-500',
      textColor: 'text-green-400',
    },
  ];

  const totalConsumption = consumers.reduce((sum, c) => sum + c.power, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.consumption', 'Consumption')}
        subtitle={t('consumption.subtitle', 'House load & consumer analysis')}
        icon={<Home size={22} aria-hidden="true" />}
      />

      {/* Total Consumption */}
      <motion.div
        className="glass-panel-strong rounded-3xl p-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <p className="text-sm text-(--color-muted)">
          {t('consumption.total', 'Total Consumption')}
        </p>
        <p className="mt-2 text-4xl font-light tracking-tight text-blue-400">
          {(totalConsumption / 1000).toFixed(2)}{' '}
          <span className="text-lg text-(--color-muted)">kW</span>
        </p>
      </motion.div>

      {/* Consumer Breakdown */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {consumers.map((consumer, i) => (
          <motion.div
            key={consumer.key}
            className="metric-card rounded-3xl hover-lift"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 + i * 0.05 }}
          >
            <p className="text-xs text-(--color-muted)">{consumer.label}</p>
            <p className={`mt-1 text-2xl font-light ${consumer.textColor}`}>
              {(consumer.power / 1000).toFixed(2)}{' '}
              <span className="text-sm text-(--color-muted)">kW</span>
            </p>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-(--color-surface)"
              role="progressbar"
              aria-valuenow={
                totalConsumption > 0 ? Math.round((consumer.power / totalConsumption) * 100) : 0
              }
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={consumer.label}
            >
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${consumer.color}`}
                initial={{ width: 0 }}
                animate={{
                  width: `${totalConsumption > 0 ? (consumer.power / totalConsumption) * 100 : 0}%`,
                }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 + i * 0.1 }}
              />
            </div>
            <p className="mt-1 text-right text-xs text-(--color-muted)">
              {totalConsumption > 0 ? ((consumer.power / totalConsumption) * 100).toFixed(0) : 0}%
            </p>
          </motion.div>
        ))}
      </div>

      {/* Grid Exchange */}
      <motion.section
        className="glass-panel-strong rounded-3xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
      >
        <h2 className="mb-4 flex items-center gap-2 text-lg font-medium">
          <Zap
            size={20}
            className={energyData.gridPower > 0 ? 'text-red-400' : 'text-emerald-400'}
            aria-hidden="true"
          />
          {t('metrics.grid')}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-(--color-border) p-4">
            <p className="text-xs text-(--color-muted)">{t('metrics.import')}</p>
            <p className="mt-1 text-xl font-light text-red-400">
              {(Math.max(0, energyData.gridPower) / 1000).toFixed(2)} kW
            </p>
          </div>
          <div className="rounded-2xl border border-(--color-border) p-4">
            <p className="text-xs text-(--color-muted)">{t('metrics.export')}</p>
            <p className="mt-1 text-xl font-light text-emerald-400">
              {(Math.max(0, -energyData.gridPower) / 1000).toFixed(2)} kW
            </p>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

export default memo(ConsumptionPageComponent);
