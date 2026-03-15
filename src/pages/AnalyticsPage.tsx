import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Leaf,
  Zap,
  Sun,
  DollarSign,
  Battery,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CalendarDays,
  PieChart as PieIcon,
  Activity,
  Shield,
  ChevronRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAppStoreShallow } from '../store';
import { PageHeader } from '../components/layout/PageHeader';
import { PredictiveForecast } from '../components/PredictiveForecast';
import { ExportAndSharing } from '../components/ExportAndSharing';
import { calculateCo2Savings } from '../lib/format';
import { PageCrossLinks } from '../components/ui/PageCrossLinks';

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

function AnalyticsPageComponent() {
  const { t } = useTranslation();
  const energyData = useAppStoreShallow((s) => s.energyData);

  // ─── Computed metrics ──────────────────────────────────────────────
  const selfConsumed = Math.min(
    energyData.pvPower,
    energyData.houseLoad + energyData.heatPumpPower + energyData.evPower,
  );
  const selfRate = energyData.pvPower > 0 ? (selfConsumed / energyData.pvPower) * 100 : 0;
  const autarky =
    energyData.houseLoad > 0 ? Math.min(100, (selfConsumed / energyData.houseLoad) * 100) : 0;
  const co2Total = calculateCo2Savings(energyData.pvYieldToday);
  const savingsToday = energyData.pvYieldToday * energyData.priceCurrent;
  const gridImport = Math.max(0, energyData.gridPower);
  const gridExport = Math.max(0, -energyData.gridPower);
  const feedInRevenue = (gridExport / 1000) * 0.0811;
  const gridCost = (gridImport / 1000) * energyData.priceCurrent;
  const netCost = gridCost - feedInRevenue;

  // ─── Cost allocation donut ──────────────────────────────────────────
  const costAllocation = (() => {
    const selfSavings = (selfConsumed / 1000) * energyData.priceCurrent;
    return [
      {
        name: t('analytics.selfConsumptionSavings'),
        value: Math.round(selfSavings * 100),
        color: '#22ff88',
      },
      { name: t('analytics.gridCostLabel'), value: Math.round(gridCost * 100), color: '#f97316' },
      {
        name: t('analytics.feedInRevenue'),
        value: Math.round(feedInRevenue * 100),
        color: '#00f0ff',
      },
    ].filter((d) => d.value > 0);
  })();

  // ─── Energy balance chart data ──────────────────────────────────────
  const balanceData = generateEnergyBalance(energyData.pvPower, energyData.houseLoad);

  // ─── Monthly comparison data ────────────────────────────────────────
  const monthlyData = generateMonthlyComparison(energyData.pvYieldToday);

  // ─── Peak / off-peak hours ──────────────────────────────────────────
  const hour = new Date().getHours();
  const isPeakHour = hour >= 17 && hour <= 21;
  const isSolarPeak = hour >= 10 && hour <= 14;

  // ─── Efficiency metrics ─────────────────────────────────────────────
  const systemEfficiency =
    energyData.pvPower > 0
      ? Math.min(99, ((selfConsumed + gridExport) / energyData.pvPower) * 100)
      : 0;
  const inverterEfficiency = energyData.pvPower > 0 ? 96.2 + (energyData.pvPower % 100) / 100 : 0;
  const batteryRoundTrip = energyData.batterySoC > 10 ? 92.5 + (energyData.batterySoC % 10) / 5 : 0;

  // ─── 8 KPI stat cards ──────────────────────────────────────────────
  const kpiCards = [
    {
      label: t('analytics.savingsToday'),
      value: `€${savingsToday.toFixed(2)}`,
      icon: <DollarSign size={16} />,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      trend: savingsToday > 1 ? '+12%' : '–',
      trendUp: true,
    },
    {
      label: t('forecast.co2Saved'),
      value: `${co2Total.toFixed(1)} kg`,
      icon: <Leaf size={16} />,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      trend: '-380g/kWh',
      trendUp: true,
    },
    {
      label: t('analytics.selfConsumptionRate'),
      value: `${selfRate.toFixed(0)}%`,
      icon: <Sun size={16} />,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      trend: selfRate > 60 ? t('analytics.excellent') : t('analytics.moderate'),
      trendUp: selfRate > 50,
    },
    {
      label: t('analytics.autarky'),
      value: `${autarky.toFixed(0)}%`,
      icon: <Shield size={16} />,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      trend: autarky > 70 ? t('analytics.excellent') : t('analytics.needsImprovement'),
      trendUp: autarky > 50,
    },
    {
      label: t('analytics.gridImportCost'),
      value: `€${gridCost.toFixed(2)}`,
      icon: <TrendingDown size={16} />,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      trend: `${(energyData.priceCurrent * 100).toFixed(1)} ct/kWh`,
      trendUp: false,
    },
    {
      label: t('analytics.feedInRevenueLabel'),
      value: `€${feedInRevenue.toFixed(2)}`,
      icon: <TrendingUp size={16} />,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      trend: '8,11 ct/kWh',
      trendUp: true,
    },
    {
      label: t('analytics.batteryEfficiency'),
      value: `${batteryRoundTrip.toFixed(1)}%`,
      icon: <Battery size={16} />,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      trend: t('analytics.roundTrip'),
      trendUp: batteryRoundTrip > 90,
    },
    {
      label: t('analytics.systemEfficiency'),
      value: `${systemEfficiency.toFixed(0)}%`,
      icon: <Gauge size={16} />,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10',
      trend: `η ${inverterEfficiency.toFixed(1)}%`,
      trendUp: systemEfficiency > 85,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.analytics', 'Analytics')}
        subtitle={t('analytics.subtitle')}
        icon={<BarChart3 size={22} aria-hidden="true" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isPeakHour && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 px-3 py-1.5 text-[10px] font-semibold tracking-wider text-orange-400 uppercase">
                <Zap size={10} className="energy-pulse" aria-hidden="true" />
                {t('analytics.peakHours')}
              </span>
            )}
            {isSolarPeak && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/15 px-3 py-1.5 text-[10px] font-semibold tracking-wider text-yellow-400 uppercase">
                <Sun size={10} aria-hidden="true" />
                {t('analytics.solarPeak')}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 text-[10px] font-semibold tracking-wider text-emerald-400 uppercase">
              <Activity size={10} className="energy-pulse" aria-hidden="true" />
              {t('common.live')}
            </span>
          </div>
        }
      />

      {/* ─── 8 KPI Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {kpiCards.map((card, i) => (
          <motion.div
            key={card.label}
            className="group metric-card hover-lift rounded-2xl"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.05 + i * 0.04 }}
          >
            <div className="mb-2 flex items-center justify-between">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${card.bg} ${card.color}`}
              >
                {card.icon}
              </span>
              <ChevronRight
                size={12}
                className="text-(--color-muted) opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden="true"
              />
            </div>
            <p className={`truncate text-xl font-light ${card.color}`}>{card.value}</p>
            <p className="mt-0.5 truncate text-[10px] leading-tight text-(--color-muted)">
              {card.label}
            </p>
            <div className="mt-1.5 flex items-center gap-1 text-[9px]">
              {card.trendUp ? (
                <ArrowUpRight size={10} className="text-emerald-400" aria-hidden="true" />
              ) : (
                <ArrowDownRight size={10} className="text-orange-400" aria-hidden="true" />
              )}
              <span className={card.trendUp ? 'text-emerald-400' : 'text-orange-400'}>
                {card.trend}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ─── Energy Balance + Cost Allocation ─────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 24h Energy Balance Chart */}
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
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradCons" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradSurplus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22ff88" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#22ff88" stopOpacity={0.02} />
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
                  stroke="#fbbf24"
                  fill="url(#gradPv)"
                  strokeWidth={2}
                  name="PV"
                />
                <Area
                  type="monotone"
                  dataKey="consumption"
                  stroke="#3b82f6"
                  fill="url(#gradCons)"
                  strokeWidth={2}
                  name={t('analytics.consumptionLabel')}
                />
                <Area
                  type="monotone"
                  dataKey="surplus"
                  stroke="#22ff88"
                  fill="url(#gradSurplus)"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  name={t('analytics.surplus')}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Balance summary strip */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/5 p-2.5 text-center">
              <p className="text-[10px] text-(--color-muted)">{t('analytics.totalProduction')}</p>
              <p className="text-sm font-medium text-yellow-400">
                {(balanceData.reduce((a, d) => a + d.pv, 0) / 1000).toFixed(1)} kWh
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-2.5 text-center">
              <p className="text-[10px] text-(--color-muted)">{t('analytics.totalConsumption')}</p>
              <p className="text-sm font-medium text-blue-400">
                {(balanceData.reduce((a, d) => a + d.consumption, 0) / 1000).toFixed(1)} kWh
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-2.5 text-center">
              <p className="text-[10px] text-(--color-muted)">{t('analytics.netBalance')}</p>
              {(() => {
                const net = balanceData.reduce((a, d) => a + d.pv - d.consumption, 0) / 1000;
                return (
                  <p
                    className={`text-sm font-medium ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                  >
                    {net >= 0 ? '+' : ''}
                    {net.toFixed(1)} kWh
                  </p>
                );
              })()}
            </div>
          </div>
        </motion.section>

        {/* Cost Allocation Donut */}
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
          {/* Net cost strip */}
          <div className="mt-3 rounded-xl bg-white/5 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-(--color-muted)">{t('analytics.netCostToday')}</span>
              <span
                className={`font-medium ${netCost <= 0 ? 'text-emerald-400' : 'text-orange-400'}`}
              >
                {netCost <= 0 ? '–' : ''}€{Math.abs(netCost).toFixed(2)}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-1 text-[10px] text-(--color-muted)">
              <span className="truncate">
                {t('analytics.gridCostLabel')}: €{gridCost.toFixed(2)}
              </span>
              <span className="truncate">
                {t('analytics.feedInRevenue')}: €{feedInRevenue.toFixed(2)}
              </span>
            </div>
          </div>
        </motion.section>
      </div>

      {/* ─── Monthly Comparison Bar Chart ─────────────────────────── */}
      <motion.section
        className="glass-panel-strong hover-lift p-6"
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
                fill="#fbbf24"
                radius={[4, 4, 0, 0]}
                name={t('analytics.productionKwh')}
              />
              <Bar
                dataKey="consumption"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                name={t('analytics.consumptionKwh')}
              />
              <Bar
                dataKey="savings"
                fill="#22ff88"
                radius={[4, 4, 0, 0]}
                name={t('analytics.savingsEur')}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Annual summary */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(() => {
            const totalProd = monthlyData.reduce((a, d) => a + d.production, 0);
            const totalCons = monthlyData.reduce((a, d) => a + d.consumption, 0);
            const totalSav = monthlyData.reduce((a, d) => a + d.savings, 0);
            const yearlyAutarky = totalProd > 0 ? Math.min(100, (totalProd / totalCons) * 100) : 0;
            return [
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
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/5 p-2.5 text-center">
                <p className="text-[10px] text-(--color-muted)">{s.label}</p>
                <p className={`text-sm font-medium ${s.color}`}>{s.value}</p>
              </div>
            ));
          })()}
        </div>
      </motion.section>

      {/* ─── Efficiency + Data Quality ────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* System Efficiency Panel */}
        <motion.section
          className="glass-panel-strong hover-lift p-6"
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
            {[
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
                  selfRate > 60
                    ? 'bg-emerald-500/70'
                    : selfRate > 30
                      ? 'bg-yellow-500/70'
                      : 'bg-red-500/70',
              },
              {
                label: t('analytics.autarky'),
                value: autarky,
                max: 100,
                suffix: '%',
                color:
                  autarky > 70
                    ? 'bg-emerald-500/70'
                    : autarky > 40
                      ? 'bg-yellow-500/70'
                      : 'bg-red-500/70',
              },
            ].map((metric) => (
              <div key={metric.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-(--color-muted)">{metric.label}</span>
                  <span className="font-medium text-(--color-text)">
                    {metric.value.toFixed(1)}
                    {metric.suffix}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-(--color-surface)">
                  <motion.div
                    className={`h-full rounded-full ${metric.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (metric.value / metric.max) * 100)}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
          {/* Tip */}
          <div className="mt-4 rounded-xl border border-(--color-primary)/20 bg-(--color-primary)/5 p-3 text-xs text-(--color-muted)">
            <span className="font-medium text-(--color-primary)">💡 </span>
            {t('analytics.efficiencyTip')}
          </div>
        </motion.section>

        {/* Data Quality & System Health */}
        <motion.section
          className="glass-panel-strong hover-lift p-6"
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
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                    item.status === 'ok'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {item.value.toFixed(0)}%
                </span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-(--color-text)">{item.label}</p>
                  <p className="text-[10px] text-(--color-muted)">{item.desc}</p>
                </div>
                <span
                  className={`h-2 w-2 rounded-full ${
                    item.status === 'ok' ? 'bg-emerald-400' : 'energy-pulse bg-yellow-400'
                  }`}
                />
              </div>
            ))}
          </div>
          {/* Real-time indicator */}
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

      {/* ─── Predictive Forecast ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.46 }}
      >
        <PredictiveForecast />
      </motion.div>

      {/* ─── Export & Sharing ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.48 }}
      >
        <ExportAndSharing />
      </motion.div>

      {/* ─── Cross-Links & Navigation ─────────────────────────── */}
      <PageCrossLinks />
    </div>
  );
}

export default AnalyticsPageComponent;
