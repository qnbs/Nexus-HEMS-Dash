import type { TFunction } from 'i18next';
import { Car, Plane, TreePine } from 'lucide-react';
import { motion } from 'motion/react';
import type { AnalyticsDashboardMetrics } from '../../lib/analytics-derived-metrics';

export interface AnalyticsCo2ReportSectionProps {
  t: TFunction;
  currentYear: number;
  ubaFactor: number;
  monthlyCo2: AnalyticsDashboardMetrics['monthlyCo2'];
}

export const AnalyticsCo2ReportSection = ({
  t,
  currentYear,
  ubaFactor,
  monthlyCo2,
}: AnalyticsCo2ReportSectionProps) => {
  const co2KpiCards = [
    {
      label: t('analytics.co2GridEmissions'),
      value: monthlyCo2.gridEmissions,
      color: 'text-red-400',
      icon: '⚡',
    },
    {
      label: t('analytics.co2SelfSavings'),
      value: monthlyCo2.selfSavings,
      color: 'text-emerald-400',
      icon: '☀',
    },
    {
      label: t('analytics.co2FeedInSavings'),
      value: monthlyCo2.feedInSavings,
      color: 'text-blue-400',
      icon: '🔌',
    },
    {
      label: t('analytics.co2NetBalance'),
      value: monthlyCo2.netBalance,
      color: monthlyCo2.netBalance <= 0 ? 'text-emerald-400' : 'text-red-400',
      icon: monthlyCo2.netBalance <= 0 ? '✅' : '⚠',
    },
  ];

  return (
    <motion.section
      className="glass-panel space-y-4 rounded-2xl p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.45 }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TreePine size={20} className="text-emerald-400" aria-hidden="true" />
          <div>
            <h3 className="fluid-text-base font-semibold text-(--color-text)">
              {t('analytics.co2ReportTitle')}
            </h3>
            <p className="text-(--color-muted) text-xs">{t('analytics.co2ReportSubtitle')}</p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-500/15 px-3 py-1 font-medium text-emerald-300 text-xs">
          UBA {currentYear}: {ubaFactor} g CO₂/kWh
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {co2KpiCards.map((item) => (
          <div key={item.label} className="rounded-xl bg-white/5 p-3 text-center">
            <span className="text-lg">{item.icon}</span>
            <p className={`fluid-text-lg font-bold ${item.color}`}>
              {Math.abs(item.value).toFixed(1)} kg
            </p>
            <p className="text-(--color-muted) text-[10px]">{item.label}</p>
          </div>
        ))}
      </div>

      {monthlyCo2.totalSaved > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-4 rounded-xl bg-emerald-500/5 px-4 py-3">
          <div className="flex items-center gap-1.5">
            <TreePine size={16} className="text-emerald-400" aria-hidden="true" />
            <span className="text-(--color-text) text-xs">
              <strong>{monthlyCo2.treesEquiv.toFixed(1)}</strong> {t('analytics.co2Trees')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Car size={16} className="text-blue-400" aria-hidden="true" />
            <span className="text-(--color-text) text-xs">
              <strong>{monthlyCo2.carKmEquiv.toFixed(0)}</strong> {t('analytics.co2CarKm')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Plane size={16} className="text-yellow-400" aria-hidden="true" />
            <span className="text-(--color-text) text-xs">
              <strong>{monthlyCo2.flightsEquiv.toFixed(2)}</strong> {t('analytics.co2Flights')}
            </span>
          </div>
        </div>
      )}

      <p className="text-center text-(--color-muted) text-[10px]">
        {monthlyCo2.netBalance <= 0 ? t('analytics.co2NetSaver') : t('analytics.co2NetEmitter')} ·{' '}
        {t('analytics.co2ReportMonthly')}
      </p>
    </motion.section>
  );
};
