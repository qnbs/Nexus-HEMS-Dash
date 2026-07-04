import type { TFunction } from 'i18next';
import { CalendarDays } from 'lucide-react';
import { motion } from 'motion/react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { generateMonthlyComparison } from '../../lib/analytics-chart-data';

type MonthlyDataPoint = ReturnType<typeof generateMonthlyComparison>[number];

export interface AnalyticsMonthlyComparisonSectionProps {
  t: TFunction;
  monthlyData: MonthlyDataPoint[];
}

export const AnalyticsMonthlyComparisonSection = ({
  t,
  monthlyData,
}: AnalyticsMonthlyComparisonSectionProps) => {
  const totalProd = monthlyData.reduce((a, d) => a + d.production, 0);
  const totalCons = monthlyData.reduce((a, d) => a + d.consumption, 0);
  const totalSav = monthlyData.reduce((a, d) => a + d.savings, 0);
  const yearlyAutarky = totalProd > 0 ? Math.min(100, (totalProd / totalCons) * 100) : 0;

  const annualSummary = [
    {
      label: t('analytics.yearlyProduction'),
      value: `${(totalProd / 1000).toFixed(1)} MWh`,
      color: 'text-yellow-400',
    },
    {
      label: t('analytics.yearlyConsumption'),
      value: `${(totalCons / 1000).toFixed(1)} MWh`,
      color: 'text-blue-400',
    },
    {
      label: t('analytics.yearlySavings'),
      value: `€${totalSav.toFixed(0)}`,
      color: 'text-emerald-400',
    },
    {
      label: t('analytics.yearlyAutarky'),
      value: `${yearlyAutarky.toFixed(0)}%`,
      color: 'text-purple-400',
    },
  ];

  return (
    <motion.section
      className="glass-panel-strong hover-lift cv-auto p-6"
      aria-labelledby="monthly-chart-title"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="monthly-chart-title" className="fluid-text-lg flex items-center gap-2 font-medium">
          <CalendarDays size={20} className="text-(--color-secondary)" aria-hidden="true" />
          {t('analytics.monthlyComparison')}
        </h2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded bg-yellow-400" />
            {t('analytics.productionKwh')}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded bg-blue-400" />
            {t('analytics.consumptionKwh')}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded bg-emerald-400" />
            {t('analytics.savingsEur')}
          </span>
        </div>
      </div>
      <div className="h-[240px]" role="img" aria-label={t('analytics.monthlyChartAria')}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyData} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
            <XAxis
              dataKey="month"
              stroke="var(--color-muted)"
              tick={{ fill: 'var(--color-muted)', fontSize: 10 }}
            />
            <YAxis
              stroke="var(--color-muted)"
              tick={{ fill: 'var(--color-muted)', fontSize: 10 }}
              label={{
                value: 'kWh',
                angle: -90,
                position: 'insideLeft',
                fill: 'var(--color-muted)',
                fontSize: 10,
              }}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface-strong)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                fontSize: '11px',
                color: 'var(--color-text)',
              }}
            />
            <Bar
              dataKey="production"
              fill="var(--chart-7)"
              radius={[4, 4, 0, 0]}
              name={t('analytics.productionKwh')}
            />
            <Bar
              dataKey="consumption"
              fill="var(--chart-2)"
              radius={[4, 4, 0, 0]}
              name={t('analytics.consumptionKwh')}
            />
            <Bar
              dataKey="savings"
              fill="var(--chart-1)"
              radius={[4, 4, 0, 0]}
              name={t('analytics.savingsEur')}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {annualSummary.map((s) => (
          <div key={s.label} className="rounded-xl bg-white/5 p-2.5 text-center">
            <p className="text-(--color-muted) text-[10px]">{s.label}</p>
            <p className={`font-medium text-sm ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
};
