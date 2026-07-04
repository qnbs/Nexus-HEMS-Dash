import {
  Activity,
  BarChart3,
  CalendarDays,
  Clock,
  Gauge,
  PieChart as PieIcon,
  Shield,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ExportAndSharing } from '../components/ExportAndSharing';
import { PageHeader } from '../components/layout/PageHeader';
import { PredictiveForecast } from '../components/PredictiveForecast';
import { PageCrossLinks } from '../components/ui/PageCrossLinks';
import { useAppStoreShallow } from '../store';
import { AnalyticsKpiGrid } from './AnalyticsKpiGrid';
import {
  AnalyticsCo2ReportSection,
  AnalyticsHeaderActions,
  AnalyticsMlForecastSection,
} from './AnalyticsPageSections';
import { buildKpiCards } from './analytics-page.kpi-cards';
import {
  buildAnnualSummary,
  buildCostAllocation,
  computeBalanceNetKwh,
  computeEfficiencyMetrics,
  computeEnergyMetrics,
  computeMonthlyCo2,
  getTimeIndicators,
  getUbaFactorForYear,
} from './analytics-page.selectors';

// ─── Deterministic data generators (module-level, pure per call) ──────

function generateEnergyBalance(pvPower: number, houseLoad: number) {
  const now = new Date();
  const currentHour = now.getHours();
  return Array.from({ length: 24 }, (_, i) => {
    const h = i;
    const sunFactor = h >= 6 && h <= 20 ? Math.sin(((h - 6) / 14) * Math.PI) : 0;
    const pv = Math.round(pvPower * sunFactor * (0.7 + (h % 5) * 0.06));
    const base = Math.round(houseLoad * (0.6 + (h % 7) * 0.06));
    const consumption = Math.round(
      base + (h >= 7 && h <= 9 ? 400 : 0) + (h >= 17 && h <= 21 ? 600 : 0),
    );
    const surplus = Math.max(0, pv - consumption);
    const deficit = Math.max(0, consumption - pv);
    return {
      hour: `${String(h).padStart(2, '0')}:00`,
      pv,
      consumption,
      surplus,
      deficit,
      isFuture: h > currentHour,
    };
  });
}

function generateMonthlyComparison(pvYieldToday: number) {
  const months = [
    'Jan',
    'Feb',
    'Mär',
    'Apr',
    'Mai',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Okt',
    'Nov',
    'Dez',
  ];
  const seasonCurve = [0.3, 0.4, 0.6, 0.8, 0.95, 1.0, 1.0, 0.9, 0.75, 0.55, 0.35, 0.25];
  const baseDailyKwh = pvYieldToday > 0 ? pvYieldToday : 18;
  return months.map((m, i) => {
    const prod = Math.round(baseDailyKwh * seasonCurve[i] * 30);
    const cons = Math.round(280 + (i < 3 || i > 9 ? 120 : -40) + (i % 3) * 15);
    return { month: m, production: prod, consumption: cons, savings: Math.round(prod * 0.28) };
  });
}

function efficiencyBarColor(value: number, good: number, warn: number): string {
  if (value > good) return 'bg-emerald-500/70';
  if (value > warn) return 'bg-yellow-500/70';
  return 'bg-red-500/70';
}

/**
 * @param embedded When rendered inside the unified Analytics wrapper (as a tab
 *   panel), the wrapper already supplies the page header and cross-links footer,
 *   so this page suppresses its own to avoid a duplicate <h1> and duplicate
 *   "related sections" panels. Defaults to false for standalone use.
 */
function AnalyticsPageComponent({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation();
  const energyData = useAppStoreShallow((s) => s.energyData);

  const currentYear = new Date().getFullYear();
  const ubaFactor = getUbaFactorForYear(currentYear);
  const metrics = computeEnergyMetrics(energyData);
  const efficiency = computeEfficiencyMetrics(energyData, metrics.selfConsumed, metrics.gridExport);
  const { isPeakHour, isSolarPeak } = getTimeIndicators();
  const costAllocation = buildCostAllocation(t, metrics, energyData.priceCurrent);
  const balanceData = generateEnergyBalance(energyData.pvPower, energyData.houseLoad);
  const monthlyData = generateMonthlyComparison(energyData.pvYieldToday);
  const monthlyCo2 = computeMonthlyCo2(energyData, metrics.selfRate, metrics.gridImport, ubaFactor);
  const kpiCards = buildKpiCards(t, metrics, efficiency, energyData.priceCurrent);
  const annualSummary = buildAnnualSummary(monthlyData, t);
  const balanceNetKwh = computeBalanceNetKwh(balanceData);

  const efficiencyRows = [
    {
      label: t('analytics.inverterEfficiency'),
      value: efficiency.inverterEfficiency,
      color: efficiency.inverterEfficiency > 95 ? 'bg-emerald-500/70' : 'bg-yellow-500/70',
    },
    {
      label: t('analytics.batteryRoundTrip'),
      value: efficiency.batteryRoundTrip,
      color: efficiency.batteryRoundTrip > 90 ? 'bg-emerald-500/70' : 'bg-yellow-500/70',
    },
    {
      label: t('analytics.selfConsumptionRate'),
      value: metrics.selfRate,
      color: efficiencyBarColor(metrics.selfRate, 60, 30),
    },
    {
      label: t('analytics.autarky'),
      value: metrics.autarky,
      color: efficiencyBarColor(metrics.autarky, 70, 40),
    },
  ];

  return (
    <div className="space-y-6">
      {!embedded && (
        <PageHeader
          title={t('nav.analytics', 'Analytics')}
          subtitle={t('analytics.subtitle')}
          icon={<BarChart3 size={22} aria-hidden="true" />}
          actions={<AnalyticsHeaderActions isPeakHour={isPeakHour} isSolarPeak={isSolarPeak} />}
        />
      )}

      <AnalyticsKpiGrid cards={kpiCards} />

      {/* ─── Energy Balance + Cost Allocation ─────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.section
          className="glass-panel-strong hover-lift p-6 lg:col-span-2"
          aria-labelledby="balance-chart-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2
              id="balance-chart-title"
              className="fluid-text-lg flex items-center gap-2 font-medium"
            >
              <Clock size={20} className="text-(--color-secondary)" aria-hidden="true" />
              {t('analytics.energyBalance24h')}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-400" />
                {t('analytics.pvProduction')}
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-400" />
                {t('analytics.consumptionLabel')}
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
                {t('analytics.surplus')}
              </span>
            </div>
          </div>
          <div className="h-[260px]" role="img" aria-label={t('analytics.balanceChartAria')}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={balanceData}>
                <defs>
                  <linearGradient id="gradPv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-7)" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="var(--chart-7)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradCons" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradSurplus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
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
                  label={{
                    value: 'W',
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
                  formatter={(value) => [`${value} W`]}
                />
                <Area
                  type="monotone"
                  dataKey="pv"
                  stroke="var(--chart-7)"
                  fill="url(#gradPv)"
                  strokeWidth={2}
                  name="PV"
                />
                <Area
                  type="monotone"
                  dataKey="consumption"
                  stroke="var(--chart-2)"
                  fill="url(#gradCons)"
                  strokeWidth={2}
                  name={t('analytics.consumptionLabel')}
                />
                <Area
                  type="monotone"
                  dataKey="surplus"
                  stroke="var(--chart-1)"
                  fill="url(#gradSurplus)"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  name={t('analytics.surplus')}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/5 p-2.5 text-center">
              <p className="text-(--color-muted) text-[10px]">{t('analytics.totalProduction')}</p>
              <p className="font-medium text-sm text-yellow-400">
                {(balanceData.reduce((a, d) => a + d.pv, 0) / 1000).toFixed(1)} kWh
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-2.5 text-center">
              <p className="text-(--color-muted) text-[10px]">{t('analytics.totalConsumption')}</p>
              <p className="font-medium text-blue-400 text-sm">
                {(balanceData.reduce((a, d) => a + d.consumption, 0) / 1000).toFixed(1)} kWh
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-2.5 text-center">
              <p className="text-(--color-muted) text-[10px]">{t('analytics.netBalance')}</p>
              <p
                className={`font-medium text-sm ${balanceNetKwh >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {balanceNetKwh >= 0 ? '+' : ''}
                {balanceNetKwh.toFixed(1)} kWh
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="glass-panel-strong hover-lift p-6"
          aria-labelledby="cost-donut-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.38 }}
        >
          <h2
            id="cost-donut-title"
            className="fluid-text-lg mb-4 flex items-center gap-2 font-medium"
          >
            <PieIcon size={20} className="text-(--color-secondary)" aria-hidden="true" />
            {t('analytics.costAllocation')}
          </h2>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={costAllocation}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {costAllocation.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} opacity={0.85} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface-strong)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: 'var(--color-text)',
                  }}
                  formatter={(value) => [`€${(Number(value) / 100).toFixed(2)}`]}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '10px', color: 'var(--color-muted)' }}
                />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 rounded-xl bg-white/5 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-(--color-muted)">{t('analytics.netCostToday')}</span>
              <span
                className={`font-medium ${metrics.netCost <= 0 ? 'text-emerald-400' : 'text-orange-400'}`}
              >
                {metrics.netCost <= 0 ? '–' : ''}€{Math.abs(metrics.netCost).toFixed(2)}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-1 text-(--color-muted) text-[10px]">
              <span className="truncate">
                {t('analytics.gridCostLabel')}: €{metrics.gridCost.toFixed(2)}
              </span>
              <span className="truncate">
                {t('analytics.feedInRevenue')}: €{metrics.feedInRevenue.toFixed(2)}
              </span>
            </div>
          </div>
        </motion.section>
      </div>

      <motion.section
        className="glass-panel-strong hover-lift cv-auto p-6"
        aria-labelledby="monthly-chart-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2
            id="monthly-chart-title"
            className="fluid-text-lg flex items-center gap-2 font-medium"
          >
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
            {efficiencyRows.map((metric) => (
              <div key={metric.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-(--color-muted)">{metric.label}</span>
                  <span className="font-medium text-(--color-text)">
                    {metric.value.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-(--color-surface)">
                  <motion.div
                    className={`h-full rounded-full ${metric.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, metric.value)}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
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
            {[
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
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5"
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-xs ${
                    item.status === 'ok'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {item.value.toFixed(0)}%
                </span>
                <div className="flex-1">
                  <p className="font-medium text-(--color-text) text-xs">{item.label}</p>
                  <p className="text-(--color-muted) text-[10px]">{item.desc}</p>
                </div>
                <span
                  className={`h-2 w-2 rounded-full ${
                    item.status === 'ok' ? 'bg-emerald-400' : 'energy-pulse bg-yellow-400'
                  }`}
                />
              </div>
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

      <AnalyticsMlForecastSection energyData={energyData} />

      <AnalyticsCo2ReportSection
        monthlyCo2={monthlyCo2}
        currentYear={currentYear}
        ubaFactor={ubaFactor}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.46 }}
      >
        <PredictiveForecast />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.48 }}
      >
        <ExportAndSharing />
      </motion.div>

      {!embedded && <PageCrossLinks />}
    </div>
  );
}

export default AnalyticsPageComponent;
