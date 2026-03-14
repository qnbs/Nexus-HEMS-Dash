import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  Sun,
  Battery,
  Zap,
  Home,
  Flame,
  Car,
  ArrowDown,
  ArrowUp,
  Gauge,
  Leaf,
  TrendingUp,
  BarChart3,
  Info,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAppStore } from '../store';
import { getDisplayData } from '../lib/demo-data';
import { formatPower, formatPercent, calculateCo2Savings } from '../lib/format';
import { DemoBadge } from '../components/DemoBadge';
import { PageHeader } from '../components/layout/PageHeader';
import { SankeyDiagram } from '../components/SankeyDiagram';
import { LivePriceWidget } from '../components/LivePriceWidget';

// ─── 24h Power History Data (simulated) ───────────────────────────────
function generate24hHistory(energyData: {
  pvPower: number;
  houseLoad: number;
  gridPower: number;
  batteryPower: number;
}) {
  const now = new Date();
  const hours: {
    time: string;
    pv: number;
    load: number;
    grid: number;
    battery: number;
  }[] = [];
  for (let i = 23; i >= 0; i--) {
    const h = new Date(now.getTime() - i * 3600_000);
    const hour = h.getHours();
    const solarCurve = Math.max(0, Math.sin(((hour - 5) / 14) * Math.PI));
    const loadCurve = 0.4 + 0.3 * Math.sin(((hour - 3) / 24) * 2 * Math.PI) + 0.3 * solarCurve;
    hours.push({
      time: `${String(hour).padStart(2, '0')}:00`,
      pv: +((energyData.pvPower / 1000) * solarCurve * (0.8 + 0.4 * ((23 - i) / 23))).toFixed(2),
      load: +((energyData.houseLoad / 1000) * loadCurve).toFixed(2),
      grid: +(
        (energyData.gridPower / 1000) *
        (0.5 - solarCurve * 0.8) *
        (0.7 + 0.3 * ((23 - i) / 23))
      ).toFixed(2),
      battery: +(
        (energyData.batteryPower / 1000) *
        (solarCurve > 0.5 ? 0.4 : -0.3) *
        (0.6 + 0.4 * ((23 - i) / 23))
      ).toFixed(2),
    });
  }
  return hours;
}

// ─── Energy Distribution Data ─────────────────────────────────────────
function getDistributionData(ed: {
  houseLoad: number;
  batteryPower: number;
  heatPumpPower: number;
  evPower: number;
  gridPower: number;
}) {
  const batteryCharge = ed.batteryPower < 0 ? Math.abs(ed.batteryPower) : 0;
  const gridExport = ed.gridPower < 0 ? Math.abs(ed.gridPower) : 0;
  const house = Math.max(0, ed.houseLoad - ed.heatPumpPower - ed.evPower);
  return [
    { name: 'house', value: house, color: '#00f0ff' },
    { name: 'battery', value: batteryCharge, color: '#22ff88' },
    { name: 'heatPump', value: ed.heatPumpPower, color: '#ff8800' },
    { name: 'ev', value: ed.evPower, color: '#a78bfa' },
    { name: 'grid', value: gridExport, color: '#f87171' },
  ].filter((d) => d.value > 0);
}

function EnergyFlowPageComponent() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const storeData = useAppStore((s) => s.energyData);
  const connected = useAppStore((s) => s.connected);
  const energyData = getDisplayData(storeData, connected);
  const isDemo = !connected && energyData !== storeData;

  const [activeDetail, setActiveDetail] = useState<string | null>(null);

  // ─── Derived metrics ────────────────────────────────────────────
  const totalGeneration = energyData.pvPower;
  const selfConsumption = Math.min(energyData.pvPower, energyData.houseLoad);
  const selfSufficiency =
    energyData.houseLoad > 0 ? (selfConsumption / energyData.houseLoad) * 100 : 0;
  const selfConsumptionRate =
    energyData.pvPower > 0 ? (selfConsumption / energyData.pvPower) * 100 : 0;
  const co2Saved = calculateCo2Savings(energyData.pvYieldToday);
  const gridImport = energyData.gridPower > 0 ? energyData.gridPower : 0;
  const gridExport = energyData.gridPower < 0 ? Math.abs(energyData.gridPower) : 0;
  const batteryCharging = energyData.batteryPower < 0;
  const historyData = generate24hHistory(energyData);
  const distributionData = getDistributionData(energyData);

  // ─── Power Balance KPIs ─────────────────────────────────────────
  const kpis = [
    {
      key: 'pv',
      icon: <Sun size={18} />,
      label: t('metrics.pvGeneration'),
      value: formatPower(energyData.pvPower, locale),
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
      border: 'border-yellow-400/20',
      glow: energyData.pvPower > 0,
    },
    {
      key: 'battery',
      icon: <Battery size={18} />,
      label: t('metrics.battery'),
      value: `${formatPower(Math.abs(energyData.batteryPower), locale)}`,
      sub: `${energyData.batterySoC.toFixed(0)}% SoC`,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      border: 'border-emerald-400/20',
      status: batteryCharging
        ? t('metrics.batteryCharging')
        : energyData.batteryPower > 0
          ? t('metrics.batteryDischarging')
          : t('metrics.batteryIdle'),
    },
    {
      key: 'grid',
      icon: <Zap size={18} />,
      label: t('metrics.grid'),
      value: formatPower(Math.abs(energyData.gridPower), locale),
      color: energyData.gridPower > 0 ? 'text-red-400' : 'text-emerald-400',
      bg: energyData.gridPower > 0 ? 'bg-red-400/10' : 'bg-emerald-400/10',
      border: energyData.gridPower > 0 ? 'border-red-400/20' : 'border-emerald-400/20',
      status: energyData.gridPower > 0 ? t('metrics.import') : t('metrics.export'),
    },
    {
      key: 'house',
      icon: <Home size={18} />,
      label: t('metrics.houseLoad'),
      value: formatPower(energyData.houseLoad, locale),
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
      border: 'border-cyan-400/20',
    },
    {
      key: 'hp',
      icon: <Flame size={18} />,
      label: t('dashboard.heatPump'),
      value: formatPower(energyData.heatPumpPower, locale),
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
      border: 'border-orange-400/20',
    },
    {
      key: 'ev',
      icon: <Car size={18} />,
      label: t('dashboard.evCharging'),
      value: formatPower(energyData.evPower, locale),
      color: 'text-violet-400',
      bg: 'bg-violet-400/10',
      border: 'border-violet-400/20',
    },
  ];

  const distributionLabels: Record<string, string> = {
    house: t('dashboard.toHouse'),
    battery: t('dashboard.toBattery'),
    heatPump: t('dashboard.heatPump'),
    ev: t('dashboard.evCharging'),
    grid: t('dashboard.gridExportToday'),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.energyFlow', 'Energy Flow')}
        subtitle={t('dashboard.realtimeFlow')}
        icon={<Activity size={22} aria-hidden="true" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isDemo && <DemoBadge />}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${connected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${connected ? 'energy-pulse bg-emerald-400' : 'bg-rose-400'}`}
              />
              {connected ? t('common.live') : t('common.disconnected')}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-xs font-medium">
              <Gauge size={12} className="text-(--color-primary)" />
              {energyData.gridVoltage.toFixed(1)} V
            </span>
            <span className="price-pill">
              {energyData.priceCurrent.toFixed(3)} {t('units.euroPerKwh', '€/kWh')}
            </span>
          </div>
        }
      />

      {/* ─── Power Balance KPI Strip ──────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((kpi, i) => (
          <motion.button
            key={kpi.key}
            className={`group glass-panel hover-lift cursor-pointer rounded-2xl border p-4 text-left transition-all ${kpi.border} ${activeDetail === kpi.key ? `${kpi.bg} ring-1 ring-(--color-primary)/30` : ''}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            onClick={() => setActiveDetail(activeDetail === kpi.key ? null : kpi.key)}
            aria-expanded={activeDetail === kpi.key}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className={`${kpi.bg} rounded-lg p-1.5 ${kpi.color}`}>{kpi.icon}</span>
              {kpi.glow && (
                <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15]" />
              )}
            </div>
            <p className="truncate text-xs text-(--color-muted)">{kpi.label}</p>
            <p className={`mt-0.5 truncate text-lg font-semibold ${kpi.color}`}>{kpi.value}</p>
            {kpi.status && (
              <p className="mt-0.5 truncate text-[11px] text-(--color-muted)">{kpi.status}</p>
            )}
            {kpi.sub && (
              <p className="mt-0.5 truncate text-[11px] text-(--color-muted)">{kpi.sub}</p>
            )}
          </motion.button>
        ))}
      </div>

      {/* ─── Sankey Diagram (NEVER BREAK) ─────────────────────────── */}
      <motion.section
        className="glass-panel-strong hover-lift rounded-3xl p-6"
        aria-labelledby="flow-sankey-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="flow-sankey-title" className="flex items-center gap-2 text-base font-semibold">
            <BarChart3 size={18} className="text-(--color-primary)" />
            {t('dashboard.realtimeFlow')}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-(--color-muted)">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-yellow-400" />
              {t('metrics.pvGeneration')}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {t('metrics.battery')}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              {t('metrics.grid')}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              {t('metrics.houseLoad')}
            </span>
          </div>
        </div>
        <div className="min-h-[400px] sm:min-h-[500px]">
          <SankeyDiagram data={energyData} />
        </div>
      </motion.section>

      {/* ─── Autarky & Self-Consumption Gauges + Grid Exchange ─────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Self-Sufficiency Gauge */}
        <motion.section
          className="glass-panel-strong hover-lift rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          aria-label={t('energyFlow.selfSufficiency')}
        >
          <h3 className="mb-4 text-sm font-semibold text-(--color-muted)">
            {t('energyFlow.selfSufficiency')}
          </h3>
          <div className="flex items-center justify-center">
            <RadialGauge value={selfSufficiency} color="#22ff88" label={t('energyFlow.autarky')} />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-(--color-muted)">{t('energyFlow.selfConsumed')}</span>
              <span className="font-medium text-emerald-400">
                {formatPower(selfConsumption, locale)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-(--color-muted)">{t('energyFlow.fromGrid')}</span>
              <span className="font-medium text-red-400">{formatPower(gridImport, locale)}</span>
            </div>
          </div>
        </motion.section>

        {/* Self-Consumption Rate Gauge */}
        <motion.section
          className="glass-panel-strong hover-lift rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          aria-label={t('energyFlow.selfConsumptionRate')}
        >
          <h3 className="mb-4 text-sm font-semibold text-(--color-muted)">
            {t('energyFlow.selfConsumptionRate')}
          </h3>
          <div className="flex items-center justify-center">
            <RadialGauge
              value={selfConsumptionRate}
              color="#00f0ff"
              label={t('energyFlow.utilized')}
            />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-(--color-muted)">{t('energyFlow.totalGeneration')}</span>
              <span className="font-medium text-yellow-400">
                {formatPower(totalGeneration, locale)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-(--color-muted)">{t('dashboard.gridExportToday')}</span>
              <span className="font-medium text-cyan-400">{formatPower(gridExport, locale)}</span>
            </div>
          </div>
        </motion.section>

        {/* Grid Exchange Panel */}
        <motion.section
          className="glass-panel-strong hover-lift rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          aria-label={t('metrics.grid')}
        >
          <h3 className="mb-4 text-sm font-semibold text-(--color-muted)">{t('metrics.grid')}</h3>
          <div className="space-y-4">
            {/* Import */}
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
              <div className="flex items-center gap-2">
                <ArrowDown size={16} className="text-red-400" />
                <span className="text-xs font-medium text-red-400">{t('metrics.import')}</span>
              </div>
              <p className="mt-1 text-2xl font-semibold text-red-400">
                {formatPower(gridImport, locale)}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-red-500/10">
                <motion.div
                  className="h-full rounded-full bg-red-400"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(100, (gridImport / Math.max(energyData.houseLoad, 1)) * 100)}%`,
                  }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
            {/* Export */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2">
                <ArrowUp size={16} className="text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">{t('metrics.export')}</span>
              </div>
              <p className="mt-1 text-2xl font-semibold text-emerald-400">
                {formatPower(gridExport, locale)}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-emerald-500/10">
                <motion.div
                  className="h-full rounded-full bg-emerald-400"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(100, (gridExport / Math.max(energyData.pvPower, 1)) * 100)}%`,
                  }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
            {/* Voltage & Price */}
            <div className="flex items-center justify-between text-xs text-(--color-muted)">
              <span>
                {t('dashboard.gridVoltage')}: {energyData.gridVoltage.toFixed(1)} V
              </span>
              <span>
                {energyData.priceCurrent.toFixed(3)} {t('units.euroPerKwh')}
              </span>
            </div>
          </div>
        </motion.section>
      </div>

      {/* ─── 24h Power History Chart ──────────────────────────────── */}
      <motion.section
        className="glass-panel-strong hover-lift rounded-3xl p-6"
        aria-labelledby="flow-history-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 id="flow-history-title" className="flex items-center gap-2 text-base font-semibold">
            <TrendingUp size={18} className="text-(--color-primary)" />
            {t('energyFlow.powerHistory24h')}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-(--color-muted)">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-yellow-400" />
              {t('metrics.pvGeneration')}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              {t('metrics.houseLoad')}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              {t('metrics.grid')}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {t('metrics.battery')}
            </span>
          </div>
        </div>
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="flow-pv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#facc15" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="flow-load" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="flow-grid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="flow-batt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22ff88" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22ff88" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
              <XAxis
                dataKey="time"
                stroke="var(--color-muted)"
                tick={{ fontSize: 11 }}
                interval={3}
              />
              <YAxis
                stroke="var(--color-muted)"
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `${v} kW`}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: 'var(--color-surface-strong)',
                  borderColor: 'var(--color-border)',
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="pv"
                stroke="#facc15"
                fill="url(#flow-pv)"
                strokeWidth={2}
                name={t('metrics.pvGeneration')}
              />
              <Area
                type="monotone"
                dataKey="load"
                stroke="#22d3ee"
                fill="url(#flow-load)"
                strokeWidth={2}
                name={t('metrics.houseLoad')}
              />
              <Area
                type="monotone"
                dataKey="grid"
                stroke="#f87171"
                fill="url(#flow-grid)"
                strokeWidth={1.5}
                name={t('metrics.grid')}
              />
              <Area
                type="monotone"
                dataKey="battery"
                stroke="#22ff88"
                fill="url(#flow-batt)"
                strokeWidth={1.5}
                name={t('metrics.battery')}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      {/* ─── Energy Distribution + CO₂ + Live Price ───────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* PV Distribution Donut */}
        <motion.section
          className="glass-panel-strong hover-lift rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          aria-label={t('energyFlow.pvDistribution')}
        >
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-(--color-muted)">
            <Sun size={16} className="text-yellow-400" />
            {t('energyFlow.pvDistribution')}
          </h3>
          <div className="flex items-center justify-center">
            <div className="h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {distributionData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value) => formatPower(Number(value), locale)}
                    contentStyle={{
                      backgroundColor: 'var(--color-surface-strong)',
                      borderColor: 'var(--color-border)',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
            {distributionData.map((d) => (
              <span
                key={d.name}
                className="flex items-center gap-1 text-[11px] text-(--color-muted)"
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                {distributionLabels[d.name] || d.name}
              </span>
            ))}
          </div>
        </motion.section>

        {/* CO₂ & Environmental Impact */}
        <motion.section
          className="glass-panel-strong hover-lift rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          aria-label={t('dashboard.co2Saved')}
        >
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-(--color-muted)">
            <Leaf size={16} className="text-emerald-400" />
            {t('energyFlow.environmental')}
          </h3>
          <div className="flex flex-col items-center py-4">
            <motion.div
              className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-emerald-400/30 bg-emerald-400/5"
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Leaf size={36} className="text-emerald-400" />
            </motion.div>
            <p className="mt-4 text-3xl font-bold text-emerald-400">{co2Saved.toFixed(1)} kg</p>
            <p className="text-xs text-(--color-muted)">
              CO₂ {t('dashboard.co2Saved').toLowerCase()}
            </p>
          </div>
          <div className="space-y-2 border-t border-(--color-border) pt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-(--color-muted)">{t('dashboard.pvYieldToday')}</span>
              <span className="font-medium">{energyData.pvYieldToday.toFixed(1)} kWh</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-(--color-muted)">{t('dashboard.co2Equiv')}</span>
              <span className="font-medium">380 g/kWh</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-(--color-muted)">{t('energyFlow.treesEquiv')}</span>
              <span className="font-medium text-emerald-400">
                🌳 {(co2Saved / 21).toFixed(1)} {t('energyFlow.trees')}
              </span>
            </div>
          </div>
        </motion.section>

        {/* Live Price Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <LivePriceWidget />
        </motion.div>
      </div>

      {/* ─── Today Highlights Strip ───────────────────────────────── */}
      <motion.section
        className="glass-panel-strong rounded-3xl p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55 }}
        aria-label={t('dashboard.todayHighlights')}
      >
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Info size={16} className="text-(--color-primary)" />
          {t('dashboard.todayHighlights')}
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <HighlightCard
            label={t('dashboard.pvYieldToday')}
            value={`${energyData.pvYieldToday.toFixed(1)} kWh`}
            icon={<Sun size={16} />}
            color="text-yellow-400"
          />
          <HighlightCard
            label={t('energyFlow.selfSufficiency')}
            value={formatPercent(selfSufficiency, locale)}
            icon={<Gauge size={16} />}
            color="text-emerald-400"
          />
          <HighlightCard
            label={t('dashboard.co2Saved')}
            value={`${co2Saved.toFixed(1)} kg`}
            icon={<Leaf size={16} />}
            color="text-green-400"
          />
          <HighlightCard
            label={t('dashboard.savings')}
            value={`${(energyData.pvYieldToday * energyData.priceCurrent).toFixed(2)} €`}
            icon={<TrendingUp size={16} />}
            color="text-cyan-400"
          />
        </div>
      </motion.section>

      {/* ─── KPI Detail Expansion ─────────────────────────────────── */}
      <AnimatePresence>
        {activeDetail && (
          <motion.section
            className="glass-panel rounded-2xl p-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            aria-live="polite"
          >
            <p className="text-sm text-(--color-muted)">
              {t('energyFlow.detailFor')}{' '}
              <strong>{kpis.find((k) => k.key === activeDetail)?.label}</strong>
            </p>
            <p className="mt-1 text-xs text-(--color-muted)">{t('energyFlow.detailHint')}</p>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Radial Gauge Sub-Component ───────────────────────────────────────
function RadialGauge({ value, color, label }: { value: number; color: string; label: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  const circumference = 2 * Math.PI * 50;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative flex h-36 w-36 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="8"
          opacity={0.3}
        />
        <motion.circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold" style={{ color }}>
          {clamped.toFixed(0)}%
        </span>
        <span className="mt-0.5 text-[10px] text-(--color-muted)">{label}</span>
      </div>
    </div>
  );
}

// ─── Highlight Card Sub-Component ─────────────────────────────────────
function HighlightCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-(--color-border) bg-(--color-surface)/50 p-3">
      <div className="flex items-center gap-2">
        <span className={color}>{icon}</span>
        <span className="truncate text-xs text-(--color-muted)">{label}</span>
      </div>
      <p className={`mt-1 truncate text-lg font-semibold ${color}`}>{value}</p>
    </div>
  );
}

export default memo(EnergyFlowPageComponent);
