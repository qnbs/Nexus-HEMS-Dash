import { Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { generateSystemLoadHistory } from './utils';

export function LoadChartSection({
  loadHistory,
}: {
  loadHistory: ReturnType<typeof generateSystemLoadHistory>;
}) {
  const { t } = useTranslation();
  return (
    <motion.section
      className="glass-panel-strong hover-lift p-6 lg:col-span-2"
      aria-labelledby="load-chart-title"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="load-chart-title" className="fluid-text-lg flex items-center gap-2 font-medium">
          <Activity size={20} className="text-(--color-secondary)" aria-hidden="true" />
          {t('monitoring.systemLoad24h')}
        </h2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-cyan-400" />
            {t('monitoring.houseLoad')}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-purple-400" />
            {t('monitoring.cpuPercent')}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-400" />
            {t('monitoring.ramPercent')}
          </span>
        </div>
      </div>
      <div className="h-[240px]" role="img" aria-label={t('monitoring.systemLoad24h')}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={loadHistory}>
            <defs>
              <linearGradient id="gradLoad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-6)" stopOpacity={0.6} />
                <stop offset="95%" stopColor="var(--chart-6)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradCpu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={0.5} />
                <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradMem" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
            <XAxis
              dataKey="hour"
              stroke="var(--color-muted)"
              tick={{ fill: 'var(--color-muted)', fontSize: 10 }}
              interval={2}
            />
            <YAxis
              stroke="var(--color-muted)"
              tick={{ fill: 'var(--color-muted)', fontSize: 10 }}
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
            <Area
              type="monotone"
              dataKey="load"
              stroke="var(--chart-6)"
              fill="url(#gradLoad)"
              strokeWidth={2}
              name="Load (W)"
            />
            <Area
              type="monotone"
              dataKey="cpu"
              stroke="var(--chart-4)"
              fill="url(#gradCpu)"
              strokeWidth={1.5}
              name={t('monitoring.cpuPercent')}
            />
            <Area
              type="monotone"
              dataKey="memory"
              stroke="var(--chart-2)"
              fill="url(#gradMem)"
              strokeWidth={1.5}
              name={t('monitoring.ramPercent')}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  );
}
