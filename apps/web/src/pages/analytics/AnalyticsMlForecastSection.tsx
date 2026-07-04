import type { TFunction } from 'i18next';
import { BrainCircuit } from 'lucide-react';
import { motion } from 'motion/react';
import {
  Area,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChoiceCardGroup } from '../../components/ui/ChoiceCardGroup';
import type { ForecastResult } from '../../lib/ml-forecast';
import { getForecastableMetrics } from '../../lib/ml-forecast';

export interface AnalyticsMlForecastSectionProps {
  t: TFunction;
  selectedMetric: string;
  onSelectedMetricChange: (metric: string) => void;
  forecastResult: ForecastResult | null;
  forecastLoading: boolean;
  onRunForecast: () => void;
}

export const AnalyticsMlForecastSection = ({
  t,
  selectedMetric,
  onSelectedMetricChange,
  forecastResult,
  forecastLoading,
  onRunForecast,
}: AnalyticsMlForecastSectionProps) => (
  <motion.section
    className="glass-panel space-y-4 rounded-2xl p-5"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.44 }}
  >
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <BrainCircuit size={20} className="text-purple-400" aria-hidden="true" />
        <div>
          <h3 className="fluid-text-base font-semibold text-(--color-text)">
            {t('analytics.mlForecastTitle')}
          </h3>
          <p className="text-(--color-muted) text-xs">{t('analytics.mlForecastSubtitle')}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRunForecast}
        disabled={forecastLoading}
        className="focus-ring flex items-center gap-1.5 rounded-lg bg-purple-500/20 px-3 py-1.5 font-medium text-purple-300 text-xs transition hover:bg-purple-500/30 disabled:opacity-50"
      >
        <BrainCircuit size={14} aria-hidden="true" />
        {forecastLoading ? '…' : t('analytics.mlForecastRun')}
      </button>
    </div>

    <ChoiceCardGroup
      key={selectedMetric}
      name="ml-forecast-metric"
      value={selectedMetric}
      onChange={onSelectedMetricChange}
      aria-label={t('analytics.mlForecastSelectMetric')}
      layout="grid"
      size="compact"
      options={getForecastableMetrics().map((m) => ({
        value: m.key,
        label: m.label,
        meta: m.unit,
        tone: 'primary' as const,
      }))}
    />

    {forecastResult && (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-purple-500/15 px-2.5 py-1 font-medium text-[10px] text-purple-300">
            {t('analytics.mlForecastModel')}: {forecastResult.model}
          </span>
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 font-medium text-[10px] text-emerald-300">
            R² {(forecastResult.accuracy.r2 * 100).toFixed(1)}%
          </span>
          <span className="rounded-full bg-blue-400/15 px-2.5 py-1 font-medium text-[10px] text-blue-300">
            MAPE {forecastResult.accuracy.mape.toFixed(1)}%
          </span>
          <span className="rounded-full bg-yellow-400/15 px-2.5 py-1 font-medium text-[10px] text-yellow-300">
            RMSE {forecastResult.accuracy.rmse.toFixed(0)} {forecastResult.unit}
          </span>
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={forecastResult.points.map((p) => ({
                time: `${new Date(p.timestamp).getHours()}:00`,
                value: Math.round(p.value),
                lower: Math.round(p.lower),
                upper: Math.round(p.upper),
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  fontSize: 11,
                }}
              />
              <Area dataKey="upper" stroke="none" fill="rgba(168,85,247,0.1)" />
              <Area dataKey="lower" stroke="none" fill="rgba(168,85,247,0.0)" />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--chart-4)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="upper"
                stroke="rgba(168,85,247,0.3)"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="lower"
                stroke="rgba(168,85,247,0.3)"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-(--color-muted) text-[10px]">
          {t('analytics.mlForecastConfidence')} · {forecastResult.training.samplesUsed}{' '}
          {t('analytics.mlForecastDataPoints')}
        </p>
      </div>
    )}

    {!forecastResult && (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-(--color-muted)">
        <BrainCircuit size={32} className="opacity-30" aria-hidden="true" />
        <p className="text-xs">{t('analytics.mlForecastNoData')}</p>
      </div>
    )}
  </motion.section>
);
