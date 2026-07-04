import type { EnergyData } from '@nexus-hems/shared-types';
import type { TFunction } from 'i18next';
import { Activity, Gauge, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { DataQualityRow } from './DataQualityRow';
import { EfficiencyMetricBar } from './EfficiencyMetricBar';

export interface AnalyticsEfficiencySectionProps {
  t: TFunction;
  energyData: EnergyData;
  selfRate: number;
  autarky: number;
  inverterEfficiency: number;
  batteryRoundTrip: number;
}

/** Inverter, battery, self-consumption, and data-quality metrics for Analytics. */
export const AnalyticsEfficiencySection = ({
  t,
  energyData,
  selfRate,
  autarky,
  inverterEfficiency,
  batteryRoundTrip,
}: AnalyticsEfficiencySectionProps) => {
  const efficiencyMetrics = [
    {
      label: t('analytics.inverterEfficiency'),
      value: inverterEfficiency,
      max: 100,
      suffix: '%',
      color: inverterEfficiency > 95 ? 'bg-emerald-500/70' : 'bg-yellow-500/70',
    },
    {
      label: t('analytics.batteryRoundTrip'),
      value: batteryRoundTrip,
      max: 100,
      suffix: '%',
      color: batteryRoundTrip > 90 ? 'bg-emerald-500/70' : 'bg-yellow-500/70',
    },
    {
      label: t('analytics.selfConsumptionRate'),
      value: selfRate,
      max: 100,
      suffix: '%',
      color:
        selfRate > 60 ? 'bg-emerald-500/70' : selfRate > 30 ? 'bg-yellow-500/70' : 'bg-red-500/70',
    },
    {
      label: t('analytics.autarky'),
      value: autarky,
      max: 100,
      suffix: '%',
      color:
        autarky > 70 ? 'bg-emerald-500/70' : autarky > 40 ? 'bg-yellow-500/70' : 'bg-red-500/70',
    },
  ];

  const dataQualityItems = [
    {
      label: t('analytics.dataCompleteness'),
      value: 98.7,
      desc: t('analytics.dataCompletenessDesc'),
      status: 'ok' as const,
    },
    {
      label: t('analytics.sensorAccuracy'),
      value: 99.2,
      desc: t('analytics.sensorAccuracyDesc'),
      status: 'ok' as const,
    },
    {
      label: t('analytics.updateFrequency'),
      value: 100,
      desc: t('analytics.updateFrequencyDesc'),
      status: 'ok' as const,
    },
    {
      label: t('analytics.dataRetention'),
      value: 85,
      desc: t('analytics.dataRetentionDesc'),
      status: 'warn' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <motion.section
        className="glass-panel-strong hover-lift cv-auto-sm p-6"
        aria-labelledby="efficiency-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.42 }}
      >
        <h2
          id="efficiency-title"
          className="fluid-text-lg mb-4 flex items-center gap-2 font-medium"
        >
          <Gauge size={20} className="text-(--color-secondary)" aria-hidden="true" />
          {t('analytics.efficiencyMetrics')}
        </h2>
        <div className="space-y-3">
          {efficiencyMetrics.map((metric) => (
            <EfficiencyMetricBar key={metric.label} {...metric} />
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-(--color-primary)/20 bg-(--color-primary)/5 p-3 text-(--color-muted) text-xs">
          <span className="font-medium text-(--color-primary)">💡 </span>
          {t('analytics.efficiencyTip')}
        </div>
      </motion.section>

      <motion.section
        className="glass-panel-strong hover-lift cv-auto-sm p-6"
        aria-labelledby="data-quality-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.44 }}
      >
        <h2
          id="data-quality-title"
          className="fluid-text-lg mb-4 flex items-center gap-2 font-medium"
        >
          <Shield size={20} className="text-(--color-secondary)" aria-hidden="true" />
          {t('analytics.dataQuality')}
        </h2>
        <div className="space-y-3">
          {dataQualityItems.map((item) => (
            <DataQualityRow key={item.label} {...item} />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-2.5 text-xs">
          <span className="flex items-center gap-1.5 text-(--color-muted)">
            <Activity size={12} className="energy-pulse text-emerald-400" aria-hidden="true" />
            {t('analytics.liveDataStream')}
          </span>
          <span className="truncate font-mono text-emerald-400">
            {energyData.gridVoltage.toFixed(0)}V · {energyData.priceCurrent.toFixed(4)} €/kWh
          </span>
        </div>
      </motion.section>
    </div>
  );
};
