import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Zap,
  Sun,
  Thermometer,
  Car,
  Plug,
  TrendingDown,
  CircleGauge,
  Lightbulb,
  ArrowDownToLine,
  ArrowUpFromLine,
  PieChart,
  BarChart3,
  Clock,
  Coins,
} from 'lucide-react';
import {
  AreaChart,
  Area,
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
import { useAppStore } from '../store';
import { getDisplayData } from '../lib/demo-data';
import { DemoBadge } from '../components/DemoBadge';
import { PageHeader } from '../components/layout/PageHeader';
import { PageCrossLinks } from '../components/ui/PageCrossLinks';

// ─── Generate realistic 24h consumption history ─────────────────────
function generateConsumptionHistory() {
  const now = new Date();
  const points = [];
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 3600000);
    const h = hour.getHours();
    // Realistic daily consumption pattern
    const baseLoad = 300 + Math.random() * 200; // 300-500W base
    const isMorning = h >= 6 && h <= 9;
    const isMidday = h >= 11 && h <= 14;
    const isEvening = h >= 17 && h <= 22;
    const isNight = h >= 23 || h <= 5;

    const houseLoad = isNight
      ? baseLoad
      : isMorning
        ? baseLoad + 800 + Math.random() * 600
        : isMidday
          ? baseLoad + 400 + Math.random() * 400
          : isEvening
            ? baseLoad + 1200 + Math.random() * 800
            : baseLoad + 300 + Math.random() * 300;

    const heatPump = h >= 6 && h <= 20 ? 600 + Math.random() * 500 : 200 + Math.random() * 200;
    const ev =
      h >= 10 && h <= 15 ? 2000 + Math.random() * 2000 : h >= 22 ? 3000 + Math.random() * 2000 : 0;
    const pvPower =
      h >= 7 && h <= 19 ? Math.sin(((h - 7) / 12) * Math.PI) * (6000 + Math.random() * 2000) : 0;

    points.push({
      time: `${h.toString().padStart(2, '0')}:00`,
      houseLoad: Math.round(houseLoad),
      heatPump: Math.round(heatPump),
      ev: Math.round(ev),
      total: Math.round(houseLoad + heatPump + ev),
      pvPower: Math.round(pvPower),
    });
  }
  return points;
}

// ─── Consumer colors ─────────────────────────────────────────────────
const CONSUMER_COLORS = {
  houseBase: '#3b82f6',
  heatPump: '#f97316',
  ev: '#8b5cf6',
  lighting: '#facc15',
  appliances: '#06b6d4',
};

function ConsumptionPageComponent() {
  const { t } = useTranslation();
  const storeData = useAppStore((s) => s.energyData);
  const connected = useAppStore((s) => s.connected);
  const energyData = getDisplayData(storeData, connected);
  const isDemo = !connected && energyData !== storeData;

  // ─── Consumer breakdown ────────────────────────────────────────────
  // Split houseLoad into sub-components for analysis
  const baseLoadEstimate = Math.max(
    0,
    energyData.houseLoad - energyData.heatPumpPower - energyData.evPower,
  );

  const consumers = [
    {
      key: 'houseBase',
      label: t('consumption.baseLoad'),
      power: baseLoadEstimate,
      icon: <Home size={18} className="text-blue-400" aria-hidden="true" />,
      color: CONSUMER_COLORS.houseBase,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      key: 'heatPump',
      label: t('devices.heatPump'),
      power: energyData.heatPumpPower,
      icon: <Thermometer size={18} className="text-orange-400" aria-hidden="true" />,
      color: CONSUMER_COLORS.heatPump,
      gradient: 'from-orange-500 to-red-500',
    },
    {
      key: 'ev',
      label: t('devices.wallbox'),
      power: energyData.evPower,
      icon: <Car size={18} className="text-purple-400" aria-hidden="true" />,
      color: CONSUMER_COLORS.ev,
      gradient: 'from-purple-500 to-violet-500',
    },
  ];

  const totalConsumption = energyData.houseLoad + energyData.heatPumpPower + energyData.evPower;

  // ─── Energy source breakdown ───────────────────────────────────────
  const pvDirect = Math.min(energyData.pvPower, totalConsumption);
  const batteryDirect = Math.max(0, energyData.batteryPower); // positive = discharging
  const renewableCoverage = Math.min(pvDirect + batteryDirect, totalConsumption);
  const gridCoverage = Math.max(0, totalConsumption - renewableCoverage);
  const selfSufficiency = totalConsumption > 0 ? (renewableCoverage / totalConsumption) * 100 : 0;

  const sourceData = [
    { name: t('consumption.fromPV'), value: Math.round(pvDirect), color: '#facc15' },
    {
      name: t('consumption.fromBattery'),
      value: Math.round(Math.min(batteryDirect, totalConsumption - pvDirect)),
      color: '#10b981',
    },
    { name: t('consumption.fromGrid'), value: Math.round(gridCoverage), color: '#ef4444' },
  ].filter((s) => s.value > 0);

  // ─── Cost estimation ──────────────────────────────────────────────
  const currentPrice = energyData.priceCurrent;
  const hourlyCost = (totalConsumption / 1000) * currentPrice;
  const dailyCostEstimate = hourlyCost * 8; // rough average hours at this load
  const monthlyCostEstimate = dailyCostEstimate * 30;
  const pvSavings = (pvDirect / 1000) * currentPrice;

  // ─── History data ──────────────────────────────────────────────────
  const historyData = generateConsumptionHistory();

  // ─── Load shifting recommendations ─────────────────────────────────
  const recommendations = [];
  if (energyData.pvPower > 2000 && energyData.evPower < 1000) {
    recommendations.push({ key: 'evShift', severity: 'positive' as const });
  }
  if (currentPrice > 0.25) {
    recommendations.push({ key: 'highPrice', severity: 'warning' as const });
  }
  if (energyData.heatPumpPower > 0 && energyData.pvPower < 1000 && currentPrice > 0.2) {
    recommendations.push({ key: 'hpShift', severity: 'warning' as const });
  }
  if (selfSufficiency > 80) {
    recommendations.push({ key: 'highAutarky', severity: 'positive' as const });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.consumption', 'Consumption')}
        subtitle={t('consumption.subtitle')}
        icon={<Home size={22} aria-hidden="true" />}
        actions={
          <div className="flex items-center gap-2">
            {isDemo && <DemoBadge />}
            <span className="price-pill">
              {currentPrice.toFixed(3)} {t('units.euroPerKwh', '€/kWh')}
            </span>
          </div>
        }
      />

      {/* ─── Hero: Total Consumption + Self-Sufficiency ────────────── */}
      <motion.section
        className="glass-panel-strong p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-around">
          {/* Total power ring */}
          <div className="relative flex flex-col items-center">
            <div className="relative h-48 w-48">
              <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle
                  cx="100"
                  cy="100"
                  r="85"
                  fill="none"
                  stroke="var(--color-border)"
                  strokeWidth="10"
                  opacity="0.2"
                />
                {/* Self-sufficiency arc */}
                <motion.circle
                  cx="100"
                  cy="100"
                  r="85"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 85}
                  initial={{ strokeDashoffset: 2 * Math.PI * 85 }}
                  animate={{
                    strokeDashoffset: 2 * Math.PI * 85 * (1 - selfSufficiency / 100),
                  }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  style={{ filter: 'drop-shadow(0 0 6px #10b98150)' }}
                />
                {/* Grid portion arc */}
                <motion.circle
                  cx="100"
                  cy="100"
                  r="72"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 72}
                  initial={{ strokeDashoffset: 2 * Math.PI * 72 }}
                  animate={{
                    strokeDashoffset: 2 * Math.PI * 72 * (1 - (100 - selfSufficiency) / 100),
                  }}
                  transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
                  opacity="0.5"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  className="text-3xl font-bold text-(--color-text)"
                  key={totalConsumption}
                  initial={{ scale: 1.1, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  {(totalConsumption / 1000).toFixed(2)}
                  <span className="ml-1 text-sm text-(--color-muted)">{t('units.kilowatt')}</span>
                </motion.span>
                <span className="mt-1 text-xs text-(--color-muted)">{t('consumption.total')}</span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1 text-emerald-400">
                <Sun size={12} />
                {selfSufficiency.toFixed(0)}% {t('consumption.selfCovered')}
              </span>
              <span className="flex items-center gap-1 text-red-400">
                <Zap size={12} />
                {(100 - selfSufficiency).toFixed(0)}% {t('consumption.gridCovered')}
              </span>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid w-full max-w-sm grid-cols-2 gap-3">
            <KpiMini
              icon={<CircleGauge size={16} className="text-blue-400" />}
              label={t('consumption.currentLoad')}
              value={`${(totalConsumption / 1000).toFixed(2)} ${t('units.kilowatt')}`}
            />
            <KpiMini
              icon={<Coins size={16} className="text-yellow-400" />}
              label={t('consumption.costPerHour')}
              value={`${(hourlyCost * 100).toFixed(1)} ct`}
            />
            <KpiMini
              icon={<TrendingDown size={16} className="text-emerald-400" />}
              label={t('consumption.pvSavings')}
              value={`${(pvSavings * 100).toFixed(1)} ct/h`}
            />
            <KpiMini
              icon={<Clock size={16} className="text-purple-400" />}
              label={t('consumption.dailyEstimate')}
              value={`~${dailyCostEstimate.toFixed(2)} €`}
            />
          </div>
        </div>
      </motion.section>

      {/* ─── Consumer Breakdown Cards ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {consumers.map((consumer, i) => (
          <motion.article
            key={consumer.key}
            className="glass-panel-strong hover-lift p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 + i * 0.06 }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {consumer.icon}
                <span className="text-sm font-medium text-(--color-text)">{consumer.label}</span>
              </div>
              <span className="rounded-full border border-(--color-border) bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-(--color-muted)">
                {totalConsumption > 0 ? ((consumer.power / totalConsumption) * 100).toFixed(0) : 0}%
              </span>
            </div>
            <p className="text-2xl font-light tracking-tight" style={{ color: consumer.color }}>
              {(consumer.power / 1000).toFixed(2)}{' '}
              <span className="text-sm text-(--color-muted)">{t('units.kilowatt')}</span>
            </p>
            <div
              className="mt-3 h-2.5 overflow-hidden rounded-full bg-(--color-surface)"
              role="progressbar"
              aria-valuenow={
                totalConsumption > 0 ? Math.round((consumer.power / totalConsumption) * 100) : 0
              }
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={consumer.label}
            >
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${consumer.gradient}`}
                initial={{ width: 0 }}
                animate={{
                  width: `${totalConsumption > 0 ? (consumer.power / totalConsumption) * 100 : 0}%`,
                }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 + i * 0.1 }}
              />
            </div>
            <p className="mt-2 text-xs text-(--color-muted)">
              ~{((consumer.power / 1000) * currentPrice * 100).toFixed(1)} ct/h
            </p>
          </motion.article>
        ))}
      </div>

      {/* ─── Charts Row: Consumption History + Source Breakdown ─────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 24h Consumption History */}
        <motion.section
          className="glass-panel-strong hover-lift p-6 lg:col-span-2"
          aria-labelledby="consumption-chart-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2
              id="consumption-chart-title"
              className="fluid-text-lg flex items-center gap-2 font-medium"
            >
              <BarChart3 size={20} className="text-(--color-secondary)" aria-hidden="true" />
              {t('consumption.history')}
            </h2>
            <span className="text-xs text-(--color-muted)">{t('storage.last24h')}</span>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradHouse" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CONSUMER_COLORS.houseBase} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={CONSUMER_COLORS.houseBase} stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradHeatPump" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CONSUMER_COLORS.heatPump} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={CONSUMER_COLORS.heatPump} stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradEV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CONSUMER_COLORS.ev} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={CONSUMER_COLORS.ev} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                <XAxis
                  dataKey="time"
                  stroke="var(--color-muted)"
                  fontSize={11}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="var(--color-muted)"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(1)}`}
                  unit=" kW"
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface-strong)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: 'var(--color-text)',
                  }}
                  formatter={(value) => [`${((value as number) / 1000).toFixed(2)} kW`]}
                />
                <Area
                  type="monotone"
                  dataKey="houseLoad"
                  stackId="1"
                  stroke={CONSUMER_COLORS.houseBase}
                  strokeWidth={1.5}
                  fill="url(#gradHouse)"
                  name={t('consumption.baseLoad')}
                />
                <Area
                  type="monotone"
                  dataKey="heatPump"
                  stackId="1"
                  stroke={CONSUMER_COLORS.heatPump}
                  strokeWidth={1.5}
                  fill="url(#gradHeatPump)"
                  name={t('devices.heatPump')}
                />
                <Area
                  type="monotone"
                  dataKey="ev"
                  stackId="1"
                  stroke={CONSUMER_COLORS.ev}
                  strokeWidth={1.5}
                  fill="url(#gradEV)"
                  name={t('devices.wallbox')}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        {/* Energy Source Pie Chart */}
        <motion.section
          className="glass-panel-strong hover-lift p-6"
          aria-labelledby="source-chart-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <h2
            id="source-chart-title"
            className="fluid-text-lg mb-4 flex items-center gap-2 font-medium"
          >
            <PieChart size={20} className="text-(--color-secondary)" aria-hidden="true" />
            {t('consumption.energySources')}
          </h2>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {sourceData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} opacity={0.85} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface-strong)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: 'var(--color-text)',
                  }}
                  formatter={(value) => [`${((value as number) / 1000).toFixed(2)} kW`]}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', color: 'var(--color-muted)' }}
                />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-center text-xs text-(--color-muted)">
            {t('consumption.renewableShare', { percent: selfSufficiency.toFixed(0) })}
          </div>
        </motion.section>
      </div>

      {/* ─── Grid Exchange ─────────────────────────────────────────── */}
      <motion.section
        className="glass-panel-strong hover-lift p-6"
        aria-labelledby="grid-exchange-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2
          id="grid-exchange-title"
          className="fluid-text-lg mb-4 flex items-center gap-2 font-medium"
        >
          <Zap
            size={20}
            className={energyData.gridPower > 0 ? 'text-red-400' : 'text-emerald-400'}
            aria-hidden="true"
          />
          {t('metrics.grid')}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="glass-panel rounded-2xl p-4">
            <div className="mb-1.5 flex items-center gap-1.5">
              <ArrowDownToLine size={14} className="text-red-400" />
              <p className="text-xs text-(--color-muted)">{t('metrics.import')}</p>
            </div>
            <p className="text-xl font-light text-red-400">
              {(Math.max(0, energyData.gridPower) / 1000).toFixed(2)}{' '}
              <span className="text-sm text-(--color-muted)">{t('units.kilowatt')}</span>
            </p>
            <p className="mt-1 text-[10px] text-(--color-muted)">
              ~{(Math.max(0, energyData.gridPower / 1000) * currentPrice * 100).toFixed(1)} ct/h
            </p>
          </div>
          <div className="glass-panel rounded-2xl p-4">
            <div className="mb-1.5 flex items-center gap-1.5">
              <ArrowUpFromLine size={14} className="text-emerald-400" />
              <p className="text-xs text-(--color-muted)">{t('metrics.export')}</p>
            </div>
            <p className="text-xl font-light text-emerald-400">
              {(Math.max(0, -energyData.gridPower) / 1000).toFixed(2)}{' '}
              <span className="text-sm text-(--color-muted)">{t('units.kilowatt')}</span>
            </p>
            <p className="mt-1 text-[10px] text-(--color-muted)">
              {t('consumption.feedInRate')}: 8.11 ct/{t('units.kilowattHour')}
            </p>
          </div>
          <div className="glass-panel rounded-2xl p-4">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Plug size={14} className="text-blue-400" />
              <p className="text-xs text-(--color-muted)">{t('consumption.gridVoltage')}</p>
            </div>
            <p className="text-xl font-light text-(--color-text)">
              {energyData.gridVoltage.toFixed(1)}{' '}
              <span className="text-sm text-(--color-muted)">V</span>
            </p>
            <p className="mt-1 text-[10px] text-(--color-muted)">
              {energyData.gridVoltage >= 220 && energyData.gridVoltage <= 240
                ? t('consumption.voltageOk')
                : t('consumption.voltageWarn')}
            </p>
          </div>
        </div>

        {/* Grid power bar */}
        <div className="mt-5">
          <div className="mb-1.5 flex justify-between text-[10px] text-(--color-muted)">
            <span>{t('metrics.export')}</span>
            <span>{t('metrics.import')}</span>
          </div>
          <div className="relative h-4 overflow-hidden rounded-full bg-(--color-border)">
            <div className="absolute top-0 left-1/2 h-full w-0.5 bg-(--color-text)/20" />
            <motion.div
              className={`absolute top-0 h-full ${
                energyData.gridPower > 0
                  ? 'rounded-r-full bg-red-500/40'
                  : 'rounded-l-full bg-emerald-500/40'
              }`}
              animate={{
                left:
                  energyData.gridPower > 0
                    ? '50%'
                    : `${50 - Math.min(50, (Math.abs(energyData.gridPower) / 10000) * 50)}%`,
                width: `${Math.min(50, (Math.abs(energyData.gridPower) / 10000) * 50)}%`,
              }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className="mt-1.5 text-center text-xs text-(--color-muted)">
            {energyData.gridPower > 0
              ? `${t('metrics.import')}: ${(energyData.gridPower / 1000).toFixed(2)} ${t('units.kilowatt')}`
              : `${t('metrics.export')}: ${(Math.abs(energyData.gridPower) / 1000).toFixed(2)} ${t('units.kilowatt')}`}
          </p>
        </div>
      </motion.section>

      {/* ─── Cost & Savings Summary ───────────────────────────────── */}
      <motion.section
        className="glass-panel-strong hover-lift p-6"
        aria-labelledby="cost-summary-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
      >
        <h2
          id="cost-summary-title"
          className="fluid-text-lg mb-4 flex items-center gap-2 font-medium"
        >
          <Coins size={20} className="text-(--color-secondary)" aria-hidden="true" />
          {t('consumption.costSummary')}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <CostCard
            label={t('consumption.currentPrice')}
            value={`${(currentPrice * 100).toFixed(1)} ct`}
            sub={`/${t('units.kilowattHour')}`}
            color={
              currentPrice > 0.25
                ? 'text-red-400'
                : currentPrice < 0.15
                  ? 'text-emerald-400'
                  : 'text-yellow-400'
            }
          />
          <CostCard
            label={t('consumption.hourlyGrid')}
            value={`${(Math.max(0, energyData.gridPower / 1000) * currentPrice * 100).toFixed(1)} ct`}
            sub={t('consumption.perHour')}
            color="text-red-400"
          />
          <CostCard
            label={t('consumption.pvSavings')}
            value={`${(pvSavings * 100).toFixed(1)} ct`}
            sub={t('consumption.perHour')}
            color="text-emerald-400"
          />
          <CostCard
            label={t('consumption.monthlyEstimate')}
            value={`~${monthlyCostEstimate.toFixed(0)} €`}
            sub={t('consumption.estimate')}
            color="text-(--color-text)"
          />
        </div>
      </motion.section>

      {/* ─── Load Shifting Recommendations ─────────────────────────── */}
      {recommendations.length > 0 && (
        <motion.section
          className="glass-panel p-5"
          aria-labelledby="recommendations-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h2
            id="recommendations-title"
            className="fluid-text-base mb-3 flex items-center gap-2 font-medium"
          >
            <Lightbulb size={18} className="text-yellow-400" aria-hidden="true" />
            {t('consumption.recommendations')}
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {recommendations.map((rec) => (
              <div
                key={rec.key}
                className={`rounded-2xl border p-3 text-sm ${
                  rec.severity === 'positive'
                    ? 'border-emerald-400/30 bg-emerald-400/8 text-emerald-100'
                    : 'border-orange-400/30 bg-orange-400/8 text-orange-100'
                }`}
              >
                <p className="text-[10px] font-semibold tracking-wider uppercase opacity-70">
                  {rec.severity === 'positive'
                    ? t('consumption.tipPositive')
                    : t('consumption.tipWarning')}
                </p>
                <p className="mt-1 text-sm font-medium">{t(`consumption.tip.${rec.key}`)}</p>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ─── Cross-Links & Navigation ─────────────────────────── */}
      <PageCrossLinks />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function KpiMini({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass-panel rounded-2xl p-3">
      <div className="mb-1 flex items-center gap-1.5">
        {icon}
        <p className="truncate text-[11px] text-(--color-muted)">{label}</p>
      </div>
      <p className="text-lg font-light tracking-tight text-(--color-text)">{value}</p>
    </div>
  );
}

function CostCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-(--color-border) bg-white/5 p-3">
      <p className="truncate text-[10px] tracking-wider text-(--color-muted) uppercase">{label}</p>
      <p className={`mt-1 truncate text-lg font-semibold ${color}`}>{value}</p>
      <p className="truncate text-[10px] text-(--color-muted)">{sub}</p>
    </div>
  );
}

export default ConsumptionPageComponent;
