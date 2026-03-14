import { memo, useMemo } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  Car,
  TrendingDown,
  TrendingUp,
  Zap,
  Leaf,
  PlugZap,
  Clock,
  Coins,
  Gauge,
  ShieldCheck,
  Info,
  BatteryCharging,
  Sun,
  Cable,
  ChevronRight,
  CalendarClock,
  Activity,
  Target,
  BarChart3,
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
  ReferenceLine,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAppStore } from '../store';
import { getDisplayData } from '../lib/demo-data';
import { DemoBadge } from '../components/DemoBadge';
import { useLegacySendCommand } from '../core/useLegacySendCommand';
import { PageHeader } from '../components/layout/PageHeader';
import { ControlPanel } from '../components/ControlPanel';
import { Link } from 'react-router-dom';

// ─── Generate 24h charging history ──────────────────────────────────
function generateChargingHistory(currentEvPower: number, maxPowerKW: number) {
  const now = new Date();
  const points = [];
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 3600000);
    const h = hour.getHours();

    // Simulate charging patterns: night charging (0-6), midday solar (10-15), evening (18-22)
    const isNightCharge = h >= 0 && h <= 5;
    const isSolarCharge = h >= 10 && h <= 15;
    const isEveningCharge = h >= 18 && h <= 21;

    let evPower = 0;
    let pvShare = 0;
    if (isNightCharge) {
      evPower = maxPowerKW * 1000 * (0.4 + Math.random() * 0.3);
      pvShare = 0;
    } else if (isSolarCharge) {
      evPower = maxPowerKW * 1000 * (0.3 + Math.random() * 0.5);
      pvShare = evPower * (0.6 + Math.random() * 0.3);
    } else if (isEveningCharge) {
      evPower = maxPowerKW * 1000 * (0.2 + Math.random() * 0.4);
      pvShare = 0;
    } else {
      evPower = Math.random() > 0.7 ? maxPowerKW * 1000 * Math.random() * 0.15 : 0;
      pvShare = 0;
    }

    const gridShare = Math.max(0, evPower - pvShare);

    points.push({
      time: `${h.toString().padStart(2, '0')}:00`,
      total: Math.round(evPower),
      pvShare: Math.round(pvShare),
      gridShare: Math.round(gridShare),
      price: 0.1 + Math.random() * 0.2,
    });
  }
  // Current hour = actual
  const curPvSurplus = points[points.length - 1].pvShare;
  points[points.length - 1] = {
    time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
    total: Math.round(currentEvPower),
    pvShare: Math.round(Math.min(curPvSurplus, currentEvPower)),
    gridShare: Math.round(Math.max(0, currentEvPower - curPvSurplus)),
    price: 0.128,
  };
  return points;
}

// ─── Generate upcoming price windows for charge planner ──────────────
function generatePriceWindows() {
  const now = new Date();
  const windows = [];
  for (let i = 0; i < 12; i++) {
    const hour = new Date(now.getTime() + i * 3600000);
    const h = hour.getHours();
    // Price pattern: cheap at night, expensive morning/evening, moderate midday
    const base =
      h >= 0 && h <= 5
        ? 0.08
        : h >= 6 && h <= 9
          ? 0.22
          : h >= 10 && h <= 14
            ? 0.12
            : h >= 15 && h <= 17
              ? 0.18
              : h >= 18 && h <= 21
                ? 0.28
                : 0.1;
    const price = base + (Math.random() - 0.5) * 0.04;
    windows.push({
      time: `${h.toString().padStart(2, '0')}:00`,
      price: Math.round(price * 1000) / 1000,
      recommended: price < 0.14,
    });
  }
  return windows;
}

function EVPageComponent() {
  const { t } = useTranslation();
  const storeData = useAppStore((s) => s.energyData);
  const connected = useAppStore((s) => s.connected);
  const energyData = getDisplayData(storeData, connected);
  const isDemo = !connected && energyData !== storeData;
  const { sendCommand } = useLegacySendCommand();
  const settings = useAppStore((s) => s.settings);
  const evConfig = settings.systemConfig.evCharger;
  const maxPowerW = evConfig.maxPowerKW * 1000;

  // ─── Derived metrics ──────────────────────────────────────────────
  const evKW = energyData.evPower / 1000;
  const utilizationPercent = maxPowerW > 0 ? (energyData.evPower / maxPowerW) * 100 : 0;
  const isCharging = energyData.evPower > 100;

  // Simulated SoC (demo: increases based on charging power)
  const evSoC = 62; // Simulated current SoC
  const targetSoC = 80;
  const batteryCapacityKWh = 77; // Typical EV battery (e.g., ID.4/Model 3 LR)

  // Time remaining calculation
  const remainingKWh = ((targetSoC - evSoC) / 100) * batteryCapacityKWh;
  const hoursRemaining = isCharging && evKW > 0.5 ? remainingKWh / evKW : 0;
  const minutesRemaining = Math.round(hoursRemaining * 60);

  // Session energy (simulated)
  const sessionEnergyKWh = 14.8;
  const sessionCost = sessionEnergyKWh * energyData.priceCurrent;

  // PV surplus available for EV
  const pvSurplus = Math.max(
    0,
    energyData.pvPower - energyData.houseLoad - energyData.heatPumpPower,
  );
  const pvSharePercent =
    isCharging && energyData.evPower > 0
      ? Math.min(100, (pvSurplus / energyData.evPower) * 100)
      : 0;

  // CO2 savings (German grid: ~380g/kWh, PV: ~0g/kWh)
  const co2SavedKg = ((sessionEnergyKWh * pvSharePercent) / 100) * 0.38;

  // Charge source breakdown (for donut chart)
  const pvToEv = Math.min(pvSurplus, energyData.evPower);
  const gridToEv = Math.max(0, energyData.evPower - pvToEv);
  const chargeSourceData = [
    { name: t('ev.pvCharge'), value: Math.round(pvToEv), color: '#22c55e' },
    { name: t('ev.gridCharge'), value: Math.round(gridToEv), color: '#8b5cf6' },
  ].filter((d) => d.value > 10);

  // Charging efficiency (AC→DC typical 88-94%) — deterministic from power
  const chargingEfficiency = isCharging ? 89 + (energyData.evPower % 50) / 10 : 0;
  const cableLossW = isCharging
    ? Math.round(energyData.evPower * (1 - chargingEfficiency / 100))
    : 0;

  // Weekly summary (simulated rolling 7-day statistics)
  const weeklyStats = {
    totalEnergy: 87.4,
    totalCost: 12.38,
    avgPvShare: 43,
    co2Saved: 14.2,
    sessions: 5,
    avgEfficiency: 91.2,
    cheapestSession: 0.087,
  };

  // Strategy computation
  const chargeStrategy = useMemo(() => {
    const price = energyData.priceCurrent;
    const threshold = settings.chargeThreshold;
    const hasPvSurplus = pvSurplus > 1400;

    if (hasPvSurplus) {
      return {
        mode: 'pv-surplus' as const,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        icon: Leaf,
        surplus: pvSurplus,
      };
    }
    if (price <= threshold) {
      return {
        mode: 'low-price' as const,
        color: 'text-cyan-400',
        bg: 'bg-cyan-500/10 border-cyan-500/30',
        icon: TrendingDown,
        surplus: 0,
      };
    }
    if (price > threshold * 1.5) {
      return {
        mode: 'expensive' as const,
        color: 'text-red-400',
        bg: 'bg-red-500/10 border-red-500/30',
        icon: TrendingUp,
        surplus: 0,
      };
    }
    return {
      mode: 'normal' as const,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10 border-orange-500/30',
      icon: Zap,
      surplus: 0,
    };
  }, [energyData, settings.chargeThreshold, pvSurplus]);

  const historyData = generateChargingHistory(energyData.evPower, evConfig.maxPowerKW);
  const priceWindows = useMemo(() => generatePriceWindows(), []);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.ev')}
        subtitle={t('ev.subtitle')}
        icon={<Car size={22} aria-hidden="true" />}
        actions={
          <div className="flex items-center gap-2">
            {isDemo && <DemoBadge />}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                isCharging ? 'bg-green-500/10 text-green-400' : 'bg-slate-500/10 text-slate-400'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isCharging ? 'energy-pulse bg-green-400' : 'bg-slate-400'
                }`}
              />
              {isCharging ? t('ev.charging') : t('ev.idle')}
            </span>
          </div>
        }
      />

      {/* ─── Hero: EV SoC Ring + KPI Grid ────────────────────────── */}
      <motion.section
        className="glass-panel-strong rounded-3xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-around">
          {/* EV SoC Ring Gauge */}
          <div className="relative flex flex-col items-center">
            <div className="relative h-52 w-52">
              <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" aria-hidden="true">
                {/* Background ring */}
                <circle
                  cx="100"
                  cy="100"
                  r="88"
                  fill="none"
                  stroke="var(--color-border)"
                  strokeWidth="10"
                  opacity="0.2"
                />
                {/* SoC arc */}
                <motion.circle
                  cx="100"
                  cy="100"
                  r="88"
                  fill="none"
                  stroke={evSoC > 20 ? '#22c55e' : '#ef4444'}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 88}
                  initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
                  animate={{
                    strokeDashoffset: 2 * Math.PI * 88 * (1 - evSoC / 100),
                  }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  style={{
                    filter: `drop-shadow(0 0 8px ${evSoC > 20 ? '#22c55e60' : '#ef444460'})`,
                  }}
                />
                {/* Target SoC marker */}
                <circle
                  cx="100"
                  cy="100"
                  r="88"
                  fill="none"
                  stroke="var(--color-muted)"
                  strokeWidth="2"
                  strokeDasharray={`${(2 * Math.PI * 88 * targetSoC) / 100} ${2 * Math.PI * 88}`}
                  opacity="0.3"
                />
                {/* Charging power inner ring */}
                <motion.circle
                  cx="100"
                  cy="100"
                  r="74"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 74}
                  initial={{ strokeDashoffset: 2 * Math.PI * 74 }}
                  animate={{
                    strokeDashoffset:
                      2 * Math.PI * 74 * (1 - Math.min(utilizationPercent, 100) / 100),
                  }}
                  transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
                  opacity="0.7"
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  className="text-3xl font-bold text-green-400"
                  key={evSoC}
                  initial={{ scale: 1.1, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  {evSoC}
                  <span className="ml-0.5 text-sm text-(--color-muted)">%</span>
                </motion.span>
                <span className="mt-0.5 text-[11px] text-(--color-muted)">
                  {t('ev.target')}: {targetSoC}%
                </span>
                {isCharging && (
                  <span className="mt-1 text-[10px] text-purple-400">
                    {evKW.toFixed(1)} {t('units.kilowatt')} · {pvSharePercent.toFixed(0)}% PV
                  </span>
                )}
              </div>
            </div>

            {/* Status indicator below gauge */}
            <motion.div
              className="mt-3 flex items-center gap-2 rounded-full border border-(--color-border) bg-white/5 px-3 py-1.5 text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {isCharging ? (
                <>
                  <BatteryCharging size={14} className="text-green-400" />
                  <span className="text-(--color-muted)">
                    ~
                    {minutesRemaining > 60
                      ? `${Math.floor(minutesRemaining / 60)}h ${minutesRemaining % 60}min`
                      : `${minutesRemaining}min`}{' '}
                    {t('ev.remaining')}
                  </span>
                </>
              ) : (
                <>
                  <PlugZap size={14} className="text-(--color-muted)" />
                  <span className="text-(--color-muted)">{t('ev.readyToCharge')}</span>
                </>
              )}
            </motion.div>
          </div>

          {/* KPI Grid */}
          <div className="grid w-full max-w-md grid-cols-2 gap-3 sm:grid-cols-3">
            <KpiMini
              icon={<Zap size={16} className="text-green-400" />}
              label={t('ev.chargingPower')}
              value={`${evKW.toFixed(2)} ${t('units.kilowatt')}`}
              sub={`${utilizationPercent.toFixed(0)}% ${t('ev.ofMax')}`}
            />
            <KpiMini
              icon={<BatteryCharging size={16} className="text-purple-400" />}
              label={t('ev.sessionEnergy')}
              value={`${sessionEnergyKWh.toFixed(1)} ${t('units.kilowattHour')}`}
              sub={`${t('ev.session')}`}
            />
            <KpiMini
              icon={<Clock size={16} className="text-cyan-400" />}
              label={t('ev.timeRemaining')}
              value={
                isCharging
                  ? minutesRemaining > 60
                    ? `${Math.floor(minutesRemaining / 60)}h ${minutesRemaining % 60}m`
                    : `${minutesRemaining}min`
                  : '—'
              }
              sub={`→ ${targetSoC}% SoC`}
            />
            <KpiMini
              icon={<Coins size={16} className="text-orange-400" />}
              label={t('ev.sessionCost')}
              value={`${sessionCost.toFixed(2)} €`}
              sub={`${energyData.priceCurrent.toFixed(3)} ${t('units.euroPerKwh')}`}
            />
            <KpiMini
              icon={<Sun size={16} className="text-yellow-400" />}
              label={t('ev.pvShare')}
              value={`${pvSharePercent.toFixed(0)}%`}
              sub={`${(pvSurplus / 1000).toFixed(1)} ${t('units.kilowatt')} ${t('ev.available')}`}
            />
            <KpiMini
              icon={<Leaf size={16} className="text-emerald-400" />}
              label={t('ev.co2Saved')}
              value={`${co2SavedKg.toFixed(1)} kg`}
              sub={t('ev.co2Sub')}
            />
          </div>
        </div>
      </motion.section>

      {/* ─── Dynamic Pricing Strategy ────────────────────────────── */}
      <motion.div
        className={`rounded-2xl border p-5 ${chargeStrategy.bg}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/5">
            <chargeStrategy.icon className={`h-5 w-5 ${chargeStrategy.color}`} />
          </div>
          <div className="flex-1">
            <p className={`font-medium ${chargeStrategy.color}`}>
              {t(`ev.strategy.${chargeStrategy.mode}`)}
            </p>
            <p className="mt-0.5 text-xs text-(--color-muted)">
              {t(`ev.strategy.${chargeStrategy.mode}Desc`, {
                price: energyData.priceCurrent.toFixed(3),
                threshold: settings.chargeThreshold.toFixed(3),
                surplus: (chargeStrategy.surplus / 1000).toFixed(1),
              })}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-xl font-semibold tabular-nums ${chargeStrategy.color}`}>
              {energyData.priceCurrent.toFixed(3)}
            </p>
            <p className="text-xs text-(--color-muted)">{t('units.euroPerKwh')}</p>
          </div>
        </div>
      </motion.div>

      {/* ─── Charts Row: Charging History + Price Windows ────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 24h Charging History */}
        <motion.section
          className="glass-panel-strong hover-lift rounded-3xl p-6 lg:col-span-2"
          aria-labelledby="ev-history-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2
              id="ev-history-title"
              className="fluid-text-lg flex items-center gap-2 text-lg font-medium"
            >
              <Gauge size={20} className="text-(--color-secondary)" aria-hidden="true" />
              {t('ev.chargingHistory')}
            </h2>
            <span className="text-xs text-(--color-muted)">{t('storage.last24h')}</span>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="evPvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="evGridGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
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
                  dataKey="pvShare"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#evPvGrad)"
                  name={t('ev.pvCharge')}
                  dot={false}
                  activeDot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }}
                  stackId="1"
                />
                <Area
                  type="monotone"
                  dataKey="gridShare"
                  stroke="#8b5cf6"
                  strokeWidth={1.5}
                  fill="url(#evGridGrad)"
                  name={t('ev.gridCharge')}
                  dot={false}
                  stackId="1"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        {/* Price Windows / Charge Planner */}
        <motion.section
          className="glass-panel-strong hover-lift rounded-3xl p-6"
          aria-labelledby="ev-planner-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <h2
            id="ev-planner-title"
            className="fluid-text-lg mb-4 flex items-center gap-2 text-lg font-medium"
          >
            <Clock size={20} className="text-(--color-secondary)" aria-hidden="true" />
            {t('ev.chargePlanner')}
          </h2>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceWindows} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                <XAxis dataKey="time" stroke="var(--color-muted)" fontSize={10} tickLine={false} />
                <YAxis
                  stroke="var(--color-muted)"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}`}
                  unit=" ct"
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface-strong)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: 'var(--color-text)',
                  }}
                  formatter={(value) => [`${((value as number) * 100).toFixed(1)} ct/kWh`]}
                />
                <ReferenceLine
                  y={settings.chargeThreshold}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{
                    value: t('ev.threshold'),
                    position: 'right',
                    fontSize: 10,
                    fill: '#ef4444',
                  }}
                />
                <Bar dataKey="price" radius={[4, 4, 0, 0]} name={t('ev.priceLabel')}>
                  {priceWindows.map((entry, index) => (
                    <rect
                      key={index}
                      fill={entry.recommended ? '#22c55e' : '#64748b'}
                      opacity={0.7}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-(--color-muted)">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            {t('ev.recommendedWindows')}
          </div>
        </motion.section>
      </div>

      {/* ─── Charge Source + Weekly Summary ──────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Charge Source Donut */}
        <motion.section
          className="glass-panel-strong hover-lift rounded-3xl p-6"
          aria-labelledby="ev-source-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.27 }}
        >
          <h2
            id="ev-source-title"
            className="fluid-text-lg mb-4 flex items-center gap-2 text-lg font-medium"
          >
            <Activity size={20} className="text-(--color-secondary)" aria-hidden="true" />
            {t('ev.chargeSource')}
          </h2>
          {chargeSourceData.length > 0 ? (
            <>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={chargeSourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {chargeSourceData.map((entry) => (
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
              <div className="mt-2 space-y-1.5">
                {chargeSourceData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                      <span className="text-(--color-muted)">{d.name}</span>
                    </span>
                    <span className="font-medium text-(--color-text)">
                      {(d.value / 1000).toFixed(2)} {t('units.kilowatt')}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-[180px] items-center justify-center text-sm text-(--color-muted)">
              {t('ev.noCharging')}
            </div>
          )}
        </motion.section>

        {/* Weekly Summary + Efficiency */}
        <motion.section
          className="glass-panel-strong hover-lift rounded-3xl p-6 lg:col-span-2"
          aria-labelledby="ev-weekly-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28 }}
        >
          <h2
            id="ev-weekly-title"
            className="fluid-text-lg mb-4 flex items-center gap-2 text-lg font-medium"
          >
            <BarChart3 size={20} className="text-(--color-secondary)" aria-hidden="true" />
            {t('ev.weeklySummary')}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <WeeklyStat
              label={t('ev.weeklyEnergy')}
              value={`${weeklyStats.totalEnergy} ${t('units.kilowattHour')}`}
              sub={`${weeklyStats.sessions} ${t('ev.sessions')}`}
              color="text-green-400"
            />
            <WeeklyStat
              label={t('ev.weeklyCost')}
              value={`${weeklyStats.totalCost.toFixed(2)} €`}
              sub={`${t('ev.cheapest')}: ${(weeklyStats.cheapestSession * 100).toFixed(1)} ct/${t('units.kilowattHour')}`}
              color="text-orange-400"
            />
            <WeeklyStat
              label={t('ev.weeklyPvShare')}
              value={`${weeklyStats.avgPvShare}%`}
              sub={`Ø ${t('ev.pvShare')}`}
              color="text-yellow-400"
            />
            <WeeklyStat
              label={t('ev.weeklyCo2')}
              value={`${weeklyStats.co2Saved} kg`}
              sub={t('ev.co2Sub')}
              color="text-emerald-400"
            />
          </div>

          {/* Charging Efficiency */}
          <div className="mt-5 rounded-2xl border border-(--color-border)/30 bg-white/5 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Gauge size={16} className="text-cyan-400" />
              <h3 className="text-sm font-medium text-(--color-text)">{t('ev.efficiency')}</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-(--color-muted)">{t('ev.acDcEfficiency')}</p>
                <p className="mt-0.5 text-lg font-light text-cyan-400">
                  {isCharging ? `${chargingEfficiency.toFixed(1)}%` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-(--color-muted)">{t('ev.cableLoss')}</p>
                <p className="mt-0.5 text-lg font-light text-(--color-text)">
                  {isCharging ? `${cableLossW} W` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-(--color-muted)">{t('ev.weeklyAvgEfficiency')}</p>
                <p className="mt-0.5 text-lg font-light text-green-400">
                  {weeklyStats.avgEfficiency}%
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      {/* ─── Power Utilization Bars ──────────────────────────────── */}
      <motion.section
        className="glass-panel-strong hover-lift rounded-3xl p-6"
        aria-labelledby="ev-power-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2 id="ev-power-title" className="fluid-text-lg mb-5 text-lg font-medium">
          {t('ev.powerStatus')}
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Charging Power Bar */}
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-(--color-muted)">{t('ev.chargingPower')}</span>
              <span className="font-medium text-green-400">
                {evKW.toFixed(2)} / {evConfig.maxPowerKW.toFixed(1)} {t('units.kilowatt')}
              </span>
            </div>
            <div
              className="h-3 overflow-hidden rounded-full bg-(--color-surface)"
              role="progressbar"
              aria-valuenow={Math.round(utilizationPercent)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('ev.chargingPower')}
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, utilizationPercent)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{ filter: 'drop-shadow(0 0 4px #22c55e40)' }}
              />
            </div>
          </div>
          {/* EV SoC Bar */}
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-(--color-muted)">{t('ev.batterySoC')}</span>
              <span className="font-medium text-purple-400">
                {evSoC}% → {targetSoC}%
              </span>
            </div>
            <div
              className="h-3 overflow-hidden rounded-full bg-(--color-surface)"
              role="progressbar"
              aria-valuenow={evSoC}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('ev.batterySoC')}
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-400"
                initial={{ width: 0 }}
                animate={{ width: `${evSoC}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{ filter: 'drop-shadow(0 0 4px #8b5cf640)' }}
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* ─── Controls + Specs + OCPP/ISO Row ─────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Charging Strategy Controls */}
        <motion.section
          className="glass-panel-strong hover-lift rounded-3xl p-6 lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <h2 className="fluid-text-lg mb-4 text-lg font-medium">{t('control.evTitle')}</h2>
          <ControlPanel sendCommand={sendCommand} data={energyData} />
        </motion.section>

        {/* Wallbox Specs */}
        <motion.section
          className="glass-panel-strong hover-lift rounded-3xl p-6"
          aria-labelledby="ev-specs-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <h2
            id="ev-specs-title"
            className="fluid-text-lg mb-4 flex items-center gap-2 text-lg font-medium"
          >
            <Info size={20} className="text-(--color-secondary)" aria-hidden="true" />
            {t('ev.wallboxSpecs')}
          </h2>
          <dl className="space-y-2.5">
            <SpecRow
              icon={<PlugZap size={14} />}
              label={t('ev.model')}
              value={evConfig.model || '—'}
            />
            <SpecRow
              icon={<Zap size={14} />}
              label={t('ev.maxPower')}
              value={`${evConfig.maxPowerKW} kW`}
            />
            <SpecRow
              icon={<Cable size={14} />}
              label={t('ev.phases')}
              value={`${evConfig.phases}${t('ev.phaseLabel')}`}
            />
            <SpecRow
              icon={<ShieldCheck size={14} />}
              label="OCPP 2.1"
              value={evConfig.ocppEnabled ? t('ev.enabled') : t('ev.disabled')}
            />
          </dl>
          <Link
            to="/settings"
            className="focus-ring mt-4 inline-flex items-center gap-1 text-xs font-medium text-(--color-primary) hover:underline"
          >
            {t('storage.editConfig')}
            <ChevronRight size={12} />
          </Link>
        </motion.section>
      </div>

      {/* ─── OCPP 2.1 / ISO 15118 / V2X + §14a ─────────────────── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Protocol Status */}
        <motion.section
          className="glass-panel-strong hover-lift rounded-3xl p-6"
          aria-labelledby="ev-protocol-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2
            id="ev-protocol-title"
            className="fluid-text-lg mb-4 flex items-center gap-2 text-lg font-medium"
          >
            <ShieldCheck size={20} className="text-(--color-secondary)" aria-hidden="true" />
            {t('ev.protocolStatus')}
          </h2>
          <div className="space-y-3">
            <ProtocolRow
              label="OCPP 2.1"
              status={evConfig.ocppEnabled}
              description={t('ev.ocppDesc')}
            />
            <ProtocolRow
              label="ISO 15118"
              status={evConfig.ocppEnabled}
              description={t('ev.iso15118Desc')}
            />
            <ProtocolRow label="V2X / V2H" status={false} description={t('ev.v2xDesc')} />
            <ProtocolRow label="EEBUS SPINE" status={false} description={t('ev.eebusDesc')} />
          </div>
        </motion.section>

        {/* §14a EnWG Section */}
        <motion.section
          className="glass-panel-strong hover-lift rounded-3xl p-6"
          aria-labelledby="ev-enwg-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2
            id="ev-enwg-title"
            className="fluid-text-lg mb-4 flex items-center gap-2 text-lg font-medium"
          >
            <div
              className="flex h-5 w-5 items-center justify-center rounded text-xs font-bold text-orange-400"
              aria-hidden="true"
            >
              §
            </div>
            {t('ev.enwgTitle')}
          </h2>
          <div className="space-y-3">
            <div className="rounded-xl border border-(--color-border)/30 bg-white/5 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-(--color-text)">{t('ev.enwgStatus')}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  {t('ev.compliant')}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-(--color-muted)">{t('ev.enwgComplianceDesc')}</p>
            </div>
            <div className="rounded-xl border border-(--color-border)/30 bg-white/5 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-(--color-text)">{t('ev.dimming')}</span>
                <span className="text-sm font-medium text-(--color-text)">4.2 kW</span>
              </div>
              <p className="mt-1.5 text-xs text-(--color-muted)">{t('ev.dimmingDesc')}</p>
            </div>
            <div className="rounded-xl border border-(--color-border)/30 bg-white/5 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-(--color-text)">{t('ev.reducedFee')}</span>
                <span className="text-sm font-medium text-emerald-400">~160 €/a</span>
              </div>
              <p className="mt-1.5 text-xs text-(--color-muted)">{t('ev.reducedFeeDesc')}</p>
            </div>
          </div>
        </motion.section>
      </div>

      {/* ─── Departure Planner ───────────────────────────────────── */}
      <motion.section
        className="glass-panel-strong hover-lift rounded-3xl p-6"
        aria-labelledby="ev-departure-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
      >
        <h2
          id="ev-departure-title"
          className="fluid-text-lg mb-4 flex items-center gap-2 text-lg font-medium"
        >
          <CalendarClock size={20} className="text-(--color-secondary)" aria-hidden="true" />
          {t('ev.departurePlanner')}
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Settings */}
          <div className="space-y-4">
            <div className="rounded-xl border border-(--color-border)/30 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-cyan-400" />
                  <span className="text-sm text-(--color-text)">{t('ev.targetSoC')}</span>
                </div>
                <span className="text-lg font-medium text-cyan-400">{targetSoC}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-(--color-surface)">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-500/60 to-cyan-500/60"
                  style={{ width: `${targetSoC}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-(--color-muted)">
                {remainingKWh.toFixed(1)} {t('units.kilowattHour')} {t('ev.needed')}
              </p>
            </div>
            <div className="rounded-xl border border-(--color-border)/30 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-orange-400" />
                  <span className="text-sm text-(--color-text)">{t('ev.departureTime')}</span>
                </div>
                <span className="text-lg font-medium text-orange-400">07:00</span>
              </div>
              <p className="mt-1.5 text-[11px] text-(--color-muted)">{t('ev.departureDesc')}</p>
            </div>
          </div>

          {/* Charge Schedule Visual */}
          <div className="rounded-xl border border-(--color-border)/30 bg-white/5 p-4">
            <p className="mb-3 text-sm font-medium text-(--color-text)">{t('ev.chargeSchedule')}</p>
            <div className="space-y-2">
              {[
                {
                  time: '22:00–01:00',
                  type: 'cheap',
                  label: t('ev.scheduleNight'),
                  price: '8.2 ct',
                  active: false,
                },
                {
                  time: '01:00–04:00',
                  type: 'cheap',
                  label: t('ev.scheduleCheap'),
                  price: '6.8 ct',
                  active: true,
                },
                {
                  time: '04:00–06:00',
                  type: 'pause',
                  label: t('ev.schedulePause'),
                  price: '—',
                  active: false,
                },
                {
                  time: '06:00–07:00',
                  type: 'top-up',
                  label: t('ev.scheduleTopUp'),
                  price: '12.1 ct',
                  active: false,
                },
              ].map((slot) => (
                <div
                  key={slot.time}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${
                    slot.active ? 'border border-green-500/30 bg-green-500/10' : 'bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        slot.type === 'cheap'
                          ? 'bg-green-400'
                          : slot.type === 'top-up'
                            ? 'bg-orange-400'
                            : 'bg-slate-500'
                      }`}
                    />
                    <span className="font-medium text-(--color-text)">{slot.time}</span>
                    <span className="text-(--color-muted)">{slot.label}</span>
                  </div>
                  <span
                    className={`tabular-nums ${slot.active ? 'text-green-400' : 'text-(--color-muted)'}`}
                  >
                    {slot.price}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-(--color-muted)">{t('ev.scheduleNote')}</p>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

const KpiMini = memo(function KpiMini({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="glass-panel rounded-2xl p-3.5">
      <div className="mb-1.5 flex items-center gap-1.5">
        {icon}
        <p className="truncate text-[11px] text-(--color-muted)">{label}</p>
      </div>
      <p className="text-lg font-light tracking-tight text-(--color-text)">{value}</p>
      <p className="mt-0.5 truncate text-[10px] text-(--color-muted)">{sub}</p>
    </div>
  );
});

function SpecRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-(--color-border)/30 pb-2 last:border-0">
      <dt className="flex items-center gap-1.5 text-sm text-(--color-muted)">
        <span className="text-(--color-muted)/60">{icon}</span>
        {label}
      </dt>
      <dd className="text-sm font-medium text-(--color-text)">{value}</dd>
    </div>
  );
}

function ProtocolRow({
  label,
  status,
  description,
}: {
  label: string;
  status: boolean;
  description: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-(--color-border)/30 bg-white/5 p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-(--color-text)">{label}</span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
            status ? 'bg-green-500/10 text-green-400' : 'bg-slate-500/10 text-slate-400'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${status ? 'bg-green-400' : 'bg-slate-400'}`}
          />
          {status ? t('ev.enabled') : t('ev.disabled')}
        </span>
      </div>
      <p className="mt-1 text-xs text-(--color-muted)">{description}</p>
    </div>
  );
}

function WeeklyStat({
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
    <div className="rounded-xl border border-(--color-border)/30 bg-white/5 p-3">
      <p className="text-[11px] text-(--color-muted)">{label}</p>
      <p className={`mt-1 text-lg font-light tracking-tight ${color}`}>{value}</p>
      <p className="mt-0.5 truncate text-[10px] text-(--color-muted)">{sub}</p>
    </div>
  );
}

export default memo(EVPageComponent);
