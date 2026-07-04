import { Activity, BrainCircuit, Car, Plane, Sun, TreePine, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { ChoiceCardGroup } from '../components/ui/ChoiceCardGroup';
import type { ForecastResult } from '../lib/ml-forecast';
import { getForecastableMetrics, runForecast } from '../lib/ml-forecast';
import type { EnergyData } from '../types';
import type { MonthlyCo2Balance } from './analytics-page.selectors';
import { generateForecastSnapshots } from './analytics-page.selectors';

export function AnalyticsHeaderActions({
  isPeakHour,
  isSolarPeak,
}: {
  isPeakHour: boolean;
  isSolarPeak: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isPeakHour && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 px-3 py-1.5 font-semibold text-[10px] text-orange-400 uppercase tracking-wider">
          <Zap size={10} className="energy-pulse" aria-hidden="true" />
          {t('analytics.peakHours')}
        </span>
      )}
      {isSolarPeak && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/15 px-3 py-1.5 font-semibold text-[10px] text-yellow-400 uppercase tracking-wider">
          <Sun size={10} aria-hidden="true" />
          {t('analytics.solarPeak')}
        </span>
      )}
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 font-semibold text-[10px] text-emerald-400 uppercase tracking-wider">
        <Activity size={10} className="energy-pulse" aria-hidden="true" />
        {t('common.live')}
      </span>
    </div>
  );
}

export function AnalyticsMlForecastSection({ energyData }: { energyData: EnergyData }) {
  const { t } = useTranslation();
  const [selectedMetric, setSelectedMetric] = useState<string>('pvPower');
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  const handleRunForecast = () => {
    setForecastLoading(true);
    const syntheticSnapshots = generateForecastSnapshots(energyData);
    const result = runForecast(syntheticSnapshots, selectedMetric as keyof typeof energyData, 24);
    setForecastResult(result);
    setForecastLoading(false);
  };

  return (
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
          onClick={handleRunForecast}
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
        onChange={setSelectedMetric}
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

      {forecastResult ? (
        <MlForecastResult forecastResult={forecastResult} />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-(--color-muted)">
          <BrainCircuit size={32} className="opacity-30" aria-hidden="true" />
          <p className="text-xs">{t('analytics.mlForecastNoData')}</p>
        </div>
      )}
    </motion.section>
  );
}

function MlForecastResult({ forecastResult }: { forecastResult: ForecastResult }) {
  const { t } = useTranslation();

  return (
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
  );
}

export function AnalyticsCo2ReportSection({
  monthlyCo2,
  currentYear,
  ubaFactor,
}: {
  monthlyCo2: MonthlyCo2Balance;
  currentYear: number;
  ubaFactor: number;
}) {
  const { t } = useTranslation();

  const co2Items = [
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
        {co2Items.map((item) => (
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
}
