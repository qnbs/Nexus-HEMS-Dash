import { memo } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  Sun,
  Zap,
  TrendingUp,
  BarChart3,
  Compass,
  Layers,
  CircleGauge,
  SunDim,
  Coins,
  ArrowUpFromLine,
  Info,
  ChevronRight,
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
import { PredictiveForecast } from '../components/PredictiveForecast';
import { Link } from 'react-router-dom';

// ─── Generate realistic 24h PV production curve ─────────────────────
function generateProductionHistory(currentPvPower: number, peakKWp: number) {
  const now = new Date();
  const points = [];
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 3600000);
    const h = hour.getHours();

    // Bell curve for solar production centered around solar noon (~13:00)
    const solarNoon = 13;
    const sigma = 3.5;
    const daylight = h >= 6 && h <= 20;
    const pvRaw = daylight
      ? peakKWp *
        1000 *
        Math.exp(-0.5 * ((h - solarNoon) / sigma) ** 2) *
        (0.7 + Math.random() * 0.3)
      : 0;
    const pvPower = Math.max(0, Math.round(pvRaw));

    // Consumption pattern
    const baseConsumption = 800 + Math.random() * 400;
    const consumption = Math.round(
      h >= 6 && h <= 9
        ? baseConsumption + 1200
        : h >= 17 && h <= 22
          ? baseConsumption + 1800
          : h >= 10 && h <= 16
            ? baseConsumption + 500
            : baseConsumption * 0.6,
    );

    points.push({
      time: `${h.toString().padStart(2, '0')}:00`,
      pv: pvPower,
      consumption,
      surplus: Math.max(0, pvPower - consumption),
    });
  }
  // Set current hour to actual values
  points[points.length - 1] = {
    time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
    pv: Math.round(currentPvPower),
    consumption: Math.round(points[points.length - 1].consumption),
    surplus: Math.max(0, Math.round(currentPvPower - points[points.length - 1].consumption)),
  };
  return points;
}

function ProductionPageComponent() {
  const { t } = useTranslation();
  const storeData = useAppStore((s) => s.energyData);
  const connected = useAppStore((s) => s.connected);
  const energyData = getDisplayData(storeData, connected);
  const isDemo = !connected && energyData !== storeData;
  const settings = useAppStore((s) => s.settings);
  const pvConfig = settings.systemConfig.pv;
  const inverterConfig = settings.systemConfig.inverter;
  const peakWp = pvConfig.peakPowerKWp * 1000;

  // ─── Derived metrics ───────────────────────────────────────────────
  const pvKW = energyData.pvPower / 1000;
  const utilizationPercent = peakWp > 0 ? (energyData.pvPower / peakWp) * 100 : 0;

  // Self-consumption: how much PV is consumed locally (house + battery charging)
  const batteryCharging = Math.max(0, -energyData.batteryPower);
  const pvToHouse = Math.min(energyData.pvPower, energyData.houseLoad);
  const pvToBattery = Math.min(Math.max(0, energyData.pvPower - pvToHouse), batteryCharging);
  const pvToGrid = Math.max(0, energyData.pvPower - pvToHouse - pvToBattery);
  const selfConsumptionRatio =
    energyData.pvPower > 0 ? ((pvToHouse + pvToBattery) / energyData.pvPower) * 100 : 0;

  // Specific yield: kWh per kWp today
  const specificYield =
    pvConfig.peakPowerKWp > 0 ? energyData.pvYieldToday / pvConfig.peakPowerKWp : 0;

  // Revenue estimate (feed-in: ~8.11 ct/kWh typical Germany 2026 + self-consumption savings)
  const feedInRate = 0.0811;
  const gridExport = Math.max(0, -energyData.gridPower);
  const feedInRevenueToday = (gridExport / 1000) * feedInRate * 8; // rough estimate across day
  const selfConsumptionSavings = (pvToHouse / 1000) * energyData.priceCurrent;
  const totalRevenueEstimate = feedInRevenueToday + selfConsumptionSavings * 8;

  // Simulated irradiance (W/m²) — deterministic from utilization
  const hour = new Date().getHours();
  const irradiance =
    hour >= 6 && hour <= 20
      ? Math.round(200 + (utilizationPercent / 100) * 800 + (energyData.pvPower % 50))
      : 0;

  // Performance ratio (simplified)
  const performanceRatio =
    irradiance > 50 && pvConfig.peakPowerKWp > 0
      ? Math.min(
          100,
          (energyData.pvPower / 1000 / (pvConfig.peakPowerKWp * (irradiance / 1000))) * 100,
        )
      : 0;

  // ─── PV power distribution for pie chart ────────────────────────────
  const distributionData = [
    { name: t('production.toHouse'), value: Math.round(pvToHouse), color: '#3b82f6' },
    { name: t('production.toBattery'), value: Math.round(pvToBattery), color: '#10b981' },
    { name: t('production.toGrid'), value: Math.round(pvToGrid), color: '#f97316' },
  ].filter((d) => d.value > 10);

  // ─── History data ──────────────────────────────────────────────────
  const historyData = generateProductionHistory(energyData.pvPower, pvConfig.peakPowerKWp);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.production', 'Production')}
        subtitle={t('production.subtitle')}
        icon={<Sun size={22} aria-hidden="true" />}
        actions={
          <div className="flex items-center gap-2">
            {isDemo && <DemoBadge />}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                energyData.pvPower > 500
                  ? 'bg-yellow-500/10 text-yellow-400'
                  : 'bg-slate-500/10 text-slate-400'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  energyData.pvPower > 500 ? 'energy-pulse bg-yellow-400' : 'bg-slate-400'
                }`}
              />
              {energyData.pvPower > 500 ? t('production.generating') : t('production.idle')}
            </span>
          </div>
        }
      />

      {/* ─── Hero: Solar Ring Gauge + KPI Grid ─────────────────────── */}
      <motion.section
        className="glass-panel-strong rounded-3xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-around">
          {/* Solar Ring Gauge */}
          <div className="relative flex flex-col items-center">
            <div className="relative h-52 w-52">
              <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" aria-hidden="true">
                {/* Background */}
                <circle
                  cx="100"
                  cy="100"
                  r="88"
                  fill="none"
                  stroke="var(--color-border)"
                  strokeWidth="10"
                  opacity="0.2"
                />
                {/* Output arc */}
                <motion.circle
                  cx="100"
                  cy="100"
                  r="88"
                  fill="none"
                  stroke="#facc15"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 88}
                  initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
                  animate={{
                    strokeDashoffset:
                      2 * Math.PI * 88 * (1 - Math.min(utilizationPercent, 100) / 100),
                  }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  style={{ filter: 'drop-shadow(0 0 8px #facc1560)' }}
                />
                {/* Self-consumption inner arc */}
                <motion.circle
                  cx="100"
                  cy="100"
                  r="74"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 74}
                  initial={{ strokeDashoffset: 2 * Math.PI * 74 }}
                  animate={{
                    strokeDashoffset:
                      2 * Math.PI * 74 * (1 - Math.min(selfConsumptionRatio, 100) / 100),
                  }}
                  transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
                  opacity="0.7"
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  className="text-3xl font-bold text-yellow-400"
                  key={energyData.pvPower}
                  initial={{ scale: 1.1, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  {pvKW.toFixed(2)}
                  <span className="ml-1 text-sm text-(--color-muted)">{t('units.kilowatt')}</span>
                </motion.span>
                <span className="mt-0.5 text-[11px] text-(--color-muted)">
                  {utilizationPercent.toFixed(0)}% {t('production.ofPeak')}
                </span>
                <span className="mt-1 text-[10px] text-emerald-400">
                  {selfConsumptionRatio.toFixed(0)}% {t('production.selfConsumed')}
                </span>
              </div>
            </div>

            {/* Irradiance indicator */}
            <motion.div
              className="mt-3 flex items-center gap-2 rounded-full border border-(--color-border) bg-white/5 px-3 py-1.5 text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <SunDim size={14} className="text-yellow-400" />
              <span className="text-(--color-muted)">
                {irradiance} W/m² · PR {performanceRatio.toFixed(0)}%
              </span>
            </motion.div>
          </div>

          {/* KPI Grid */}
          <div className="grid w-full max-w-md grid-cols-2 gap-3 sm:grid-cols-3">
            <KpiMini
              icon={<Sun size={16} className="text-yellow-400" />}
              label={t('production.currentPower')}
              value={`${pvKW.toFixed(2)} ${t('units.kilowatt')}`}
              sub={`${t('production.peak')}: ${pvConfig.peakPowerKWp} kWp`}
            />
            <KpiMini
              icon={<BarChart3 size={16} className="text-orange-400" />}
              label={t('production.todayYield')}
              value={`${energyData.pvYieldToday.toFixed(1)} ${t('units.kilowattHour')}`}
              sub={`${specificYield.toFixed(2)} ${t('units.kilowattHour')}/kWp`}
            />
            <KpiMini
              icon={<TrendingUp size={16} className="text-emerald-400" />}
              label={t('production.selfConsumption')}
              value={`${selfConsumptionRatio.toFixed(0)}%`}
              sub={`${(pvToHouse / 1000).toFixed(2)} ${t('units.kilowatt')} → ${t('production.house')}`}
            />
            <KpiMini
              icon={<ArrowUpFromLine size={16} className="text-cyan-400" />}
              label={t('production.feedIn')}
              value={`${(pvToGrid / 1000).toFixed(2)} ${t('units.kilowatt')}`}
              sub={`${feedInRate * 100} ct/${t('units.kilowattHour')}`}
            />
            <KpiMini
              icon={<Coins size={16} className="text-green-400" />}
              label={t('production.revenueToday')}
              value={`~${totalRevenueEstimate.toFixed(2)} €`}
              sub={t('production.feedInAndSavings')}
            />
            <KpiMini
              icon={<CircleGauge size={16} className="text-purple-400" />}
              label={t('production.performanceRatio')}
              value={`${performanceRatio.toFixed(0)}%`}
              sub={t('production.pr')}
            />
          </div>
        </div>
      </motion.section>

      {/* ─── Charts Row: Production Curve + Distribution ────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 24h Production Curve */}
        <motion.section
          className="glass-panel-strong hover-lift rounded-3xl p-6 lg:col-span-2"
          aria-labelledby="pv-chart-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2
              id="pv-chart-title"
              className="fluid-text-lg flex items-center gap-2 text-lg font-medium"
            >
              <BarChart3 size={20} className="text-(--color-secondary)" aria-hidden="true" />
              {t('production.productionCurve')}
            </h2>
            <span className="text-xs text-(--color-muted)">{t('storage.last24h')}</span>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#facc15" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#facc15" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="surplusGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
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
                  dataKey="pv"
                  stroke="#facc15"
                  strokeWidth={2}
                  fill="url(#pvGrad)"
                  name={t('production.pvOutput')}
                  dot={false}
                  activeDot={{ r: 4, fill: '#facc15', strokeWidth: 0 }}
                />
                <Area
                  type="monotone"
                  dataKey="consumption"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  fill="none"
                  strokeDasharray="4 4"
                  name={t('production.consumption')}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="surplus"
                  stroke="#10b981"
                  strokeWidth={1}
                  fill="url(#surplusGrad)"
                  name={t('production.surplus')}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        {/* PV Power Distribution Pie */}
        <motion.section
          className="glass-panel-strong hover-lift rounded-3xl p-6"
          aria-labelledby="pv-distribution-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <h2
            id="pv-distribution-title"
            className="fluid-text-lg mb-4 flex items-center gap-2 text-lg font-medium"
          >
            <Zap size={20} className="text-(--color-secondary)" aria-hidden="true" />
            {t('production.distribution')}
          </h2>
          {distributionData.length > 0 ? (
            <>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {distributionData.map((entry) => (
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
                {distributionData.map((d) => (
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
            <div className="flex h-[200px] items-center justify-center text-sm text-(--color-muted)">
              {t('production.noPvOutput')}
            </div>
          )}
        </motion.section>
      </div>

      {/* ─── PV System Status Bars ─────────────────────────────────── */}
      <motion.section
        className="glass-panel-strong hover-lift rounded-3xl p-6"
        aria-labelledby="pv-status-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2 id="pv-status-title" className="fluid-text-lg mb-5 text-lg font-medium">
          {t('production.status')}
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Power Output Bar */}
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-(--color-muted)">{t('production.output')}</span>
              <span className="font-medium text-yellow-400">
                {pvKW.toFixed(2)} / {pvConfig.peakPowerKWp.toFixed(1)} {t('units.kilowatt')}
              </span>
            </div>
            <div
              className="h-3 overflow-hidden rounded-full bg-(--color-surface)"
              role="progressbar"
              aria-valuenow={Math.round(utilizationPercent)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('production.output')}
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-500"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, utilizationPercent)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{ filter: 'drop-shadow(0 0 4px #facc1540)' }}
              />
            </div>
          </div>
          {/* Self-Consumption Bar */}
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-(--color-muted)">{t('production.selfConsumption')}</span>
              <span className="font-medium text-emerald-400">
                {selfConsumptionRatio.toFixed(0)}%
              </span>
            </div>
            <div
              className="h-3 overflow-hidden rounded-full bg-(--color-surface)"
              role="progressbar"
              aria-valuenow={Math.round(selfConsumptionRatio)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('production.selfConsumption')}
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, selfConsumptionRatio)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{ filter: 'drop-shadow(0 0 4px #10b98140)' }}
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* ─── System Specs + Forecast ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* PV System Specs */}
        <motion.section
          className="glass-panel-strong hover-lift rounded-3xl p-6"
          aria-labelledby="pv-specs-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <h2
            id="pv-specs-title"
            className="fluid-text-lg mb-4 flex items-center gap-2 text-lg font-medium"
          >
            <Info size={20} className="text-(--color-secondary)" aria-hidden="true" />
            {t('production.systemSpecs')}
          </h2>
          <dl className="space-y-2.5">
            <SpecRow
              icon={<Sun size={14} />}
              label={t('production.peakPower')}
              value={`${pvConfig.peakPowerKWp} kWp`}
            />
            <SpecRow
              icon={<Compass size={14} />}
              label={t('production.orientation')}
              value={`${t(`production.orient.${pvConfig.orientation}`)} · ${pvConfig.tiltDeg}°`}
            />
            <SpecRow
              icon={<Layers size={14} />}
              label={t('production.strings')}
              value={`${pvConfig.strings} ${t('production.stringsLabel')} · ${pvConfig.mpptCount} MPPT`}
            />
            <SpecRow
              icon={<Zap size={14} />}
              label={t('production.inverter')}
              value={`${inverterConfig.count}× ${(inverterConfig.ratedPowerW / 1000).toFixed(1)} kW`}
            />
            <SpecRow
              icon={<CircleGauge size={14} />}
              label={t('production.inverterMode')}
              value={t(`production.mode.${inverterConfig.mode}`)}
            />
          </dl>
          <Link
            to="/settings?tab=energy"
            className="focus-ring mt-4 inline-flex items-center gap-1 text-xs font-medium text-(--color-primary) hover:underline"
          >
            {t('storage.editConfig')}
            <ChevronRight size={12} />
          </Link>
        </motion.section>

        {/* Forecast */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <PredictiveForecast />
        </motion.div>
      </div>
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

export default memo(ProductionPageComponent);
