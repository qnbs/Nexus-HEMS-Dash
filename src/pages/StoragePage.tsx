import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  Battery,
  BatteryCharging,
  Zap,
  Thermometer,
  Heart,
  Shield,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Settings,
  Activity,
  BarChart3,
  CircleGauge,
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
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { useAppStore } from '../store';
import { getDisplayData } from '../lib/demo-data';
import { DemoBadge } from '../components/DemoBadge';
import { useLegacySendCommand } from '../core/useLegacySendCommand';
import { PageHeader } from '../components/layout/PageHeader';
import { Link } from 'react-router-dom';
import { PageCrossLinks } from '../components/ui/PageCrossLinks';

// ─── Generate realistic 24h SoC + Power history ─────────────────────
function generateSoCHistory(currentSoC: number, currentPower: number) {
  const now = new Date();
  const points = [];
  let soc = Math.max(15, currentSoC - 30 + Math.random() * 10);

  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 3600000);
    const h = hour.getHours();
    // Realistic pattern: charge during day (PV), discharge evening
    const isDay = h >= 8 && h <= 17;
    const isEvening = h >= 18 && h <= 22;
    const delta = isDay
      ? 3 + Math.random() * 4
      : isEvening
        ? -(2 + Math.random() * 3)
        : -(0.5 + Math.random());
    soc = Math.max(8, Math.min(97, soc + delta));
    const power = isDay
      ? -(1500 + Math.random() * 2500)
      : isEvening
        ? 800 + Math.random() * 2000
        : -200 + Math.random() * 400;
    points.push({
      time: `${h.toString().padStart(2, '0')}:00`,
      soc: Math.round(soc * 10) / 10,
      power: Math.round(power),
    });
  }
  // Current point
  points[points.length - 1] = {
    time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
    soc: Math.round(currentSoC * 10) / 10,
    power: Math.round(currentPower),
  };
  return points;
}

type StrategyMode = 'self-consumption' | 'force-charge' | 'time-of-use' | 'auto';

const STRATEGY_ICONS: Record<StrategyMode, typeof Battery> = {
  'self-consumption': TrendingUp,
  'force-charge': BatteryCharging,
  'time-of-use': Clock,
  auto: Settings,
};

function StoragePageComponent() {
  const { t } = useTranslation();
  const storeData = useAppStore((s) => s.energyData);
  const connected = useAppStore((s) => s.connected);
  const energyData = getDisplayData(storeData, connected);
  const isDemo = !connected && energyData !== storeData;
  const settings = useAppStore((s) => s.settings);
  const { sendCommand } = useLegacySendCommand();
  const batteryConfig = settings.systemConfig.battery;

  const [activeStrategy, setActiveStrategy] = useState<StrategyMode>(batteryConfig.strategy);

  const batteryStatus =
    energyData.batteryPower < -50
      ? 'charging'
      : energyData.batteryPower > 50
        ? 'discharging'
        : 'idle';

  // Derived metrics
  const powerKW = Math.abs(energyData.batteryPower) / 1000;
  const cRate = batteryConfig.capacityKWh > 0 ? powerKW / batteryConfig.capacityKWh : 0;
  const energyStored = (energyData.batterySoC / 100) * batteryConfig.capacityKWh;
  const energyRemaining = energyStored;
  const estimatedHours =
    batteryStatus === 'discharging' && powerKW > 0.05 ? energyRemaining / powerKW : 0;
  const estimatedChargeHours =
    batteryStatus === 'charging' && powerKW > 0.05
      ? ((batteryConfig.maxSoCPercent / 100 - energyData.batterySoC / 100) *
          batteryConfig.capacityKWh) /
        powerKW
      : 0;

  // Simulated health metrics
  const batteryHealth = 96.2;
  const cycleCount = 847;
  const batteryTemp = 28.5 + (powerKW > 2 ? powerKW * 1.2 : 0);
  const cellBalanceDelta = 0.012;

  // SoC history
  const socHistory = generateSoCHistory(energyData.batterySoC, energyData.batteryPower);

  const handleStrategyChange = (mode: StrategyMode) => {
    setActiveStrategy(mode);
    const power = mode === 'force-charge' ? -(batteryConfig.maxChargeRateKW * 1000) : 0;
    sendCommand('SET_BATTERY_POWER', power);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.storage', 'Storage')}
        subtitle={t('storage.subtitle', 'Battery management & strategy')}
        icon={<Battery size={22} aria-hidden="true" />}
        actions={
          <div className="flex items-center gap-2">
            {isDemo && <DemoBadge />}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                batteryStatus === 'charging'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : batteryStatus === 'discharging'
                    ? 'bg-orange-500/10 text-orange-400'
                    : 'bg-blue-500/10 text-blue-400'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  batteryStatus === 'charging'
                    ? 'energy-pulse bg-emerald-400'
                    : batteryStatus === 'discharging'
                      ? 'energy-pulse bg-orange-400'
                      : 'bg-blue-400'
                }`}
              />
              {batteryStatus === 'charging'
                ? t('metrics.batteryCharging')
                : batteryStatus === 'discharging'
                  ? t('metrics.batteryDischarging')
                  : t('metrics.batteryIdle')}
            </span>
          </div>
        }
      />

      {/* ─── Hero: Battery Visual + Live Stats ─────────────────────── */}
      <motion.section
        className="glass-panel-strong rounded-3xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-around">
          {/* Battery Visual with ring gauge */}
          <div className="relative flex flex-col items-center">
            {/* Outer ring gauge */}
            <div className="relative h-56 w-56">
              <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" aria-hidden="true">
                {/* Background ring */}
                <circle
                  cx="100"
                  cy="100"
                  r="88"
                  fill="none"
                  stroke="var(--color-border)"
                  strokeWidth="8"
                  opacity="0.3"
                />
                {/* SoC ring */}
                <motion.circle
                  cx="100"
                  cy="100"
                  r="88"
                  fill="none"
                  stroke={
                    batteryStatus === 'charging'
                      ? '#10b981'
                      : batteryStatus === 'discharging'
                        ? '#f97316'
                        : '#3b82f6'
                  }
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 88}
                  initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
                  animate={{
                    strokeDashoffset: 2 * Math.PI * 88 * (1 - energyData.batterySoC / 100),
                  }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  style={{
                    filter: `drop-shadow(0 0 8px ${
                      batteryStatus === 'charging'
                        ? '#10b98160'
                        : batteryStatus === 'discharging'
                          ? '#f9731660'
                          : '#3b82f660'
                    })`,
                  }}
                />
                {/* Min SoC marker */}
                <circle
                  cx="100"
                  cy="100"
                  r="88"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray={`${(batteryConfig.minSoCPercent / 100) * 2 * Math.PI * 88} ${2 * Math.PI * 88}`}
                  opacity="0.4"
                />
              </svg>
              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  className="text-4xl font-bold text-(--color-text)"
                  key={energyData.batterySoC}
                  initial={{ scale: 1.1, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {energyData.batterySoC.toFixed(0)}
                  <span className="text-lg text-(--color-muted)">%</span>
                </motion.span>
                <span className="mt-1 text-sm text-(--color-muted)">
                  {energyStored.toFixed(1)} / {batteryConfig.capacityKWh} {t('units.kilowattHour')}
                </span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={batteryStatus}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className={`mt-2 flex items-center gap-1 text-xs font-medium ${
                      batteryStatus === 'charging'
                        ? 'text-emerald-400'
                        : batteryStatus === 'discharging'
                          ? 'text-orange-400'
                          : 'text-blue-400'
                    }`}
                  >
                    {batteryStatus === 'charging' ? (
                      <TrendingDown size={12} />
                    ) : batteryStatus === 'discharging' ? (
                      <TrendingUp size={12} />
                    ) : (
                      <ArrowUpDown size={12} />
                    )}
                    {powerKW.toFixed(2)} {t('units.kilowatt')}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>

            {/* Time estimate */}
            {(estimatedHours > 0 || estimatedChargeHours > 0) && (
              <motion.div
                className="mt-3 flex items-center gap-1.5 rounded-full border border-(--color-border) bg-white/5 px-3 py-1.5 text-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Clock size={12} className="text-(--color-muted)" />
                <span className="text-(--color-muted)">
                  {batteryStatus === 'discharging'
                    ? t('storage.emptyIn', { hours: estimatedHours.toFixed(1) })
                    : t('storage.fullIn', { hours: estimatedChargeHours.toFixed(1) })}
                </span>
              </motion.div>
            )}
          </div>

          {/* Live Stats Grid */}
          <div className="grid w-full max-w-md grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard
              icon={<Zap size={16} className="text-yellow-400" />}
              label={t('storage.power')}
              value={`${powerKW.toFixed(2)} ${t('units.kilowatt')}`}
              sub={
                batteryStatus === 'charging'
                  ? t('metrics.batteryCharging')
                  : batteryStatus === 'discharging'
                    ? t('metrics.batteryDischarging')
                    : t('metrics.batteryIdle')
              }
            />
            <StatCard
              icon={<Activity size={16} className="text-purple-400" />}
              label={t('storage.voltage')}
              value={`${energyData.batteryVoltage.toFixed(1)} V`}
              sub={`${t('storage.nominal')}: ${batteryConfig.nominalVoltageV} V`}
            />
            <StatCard
              icon={<CircleGauge size={16} className="text-cyan-400" />}
              label={t('storage.cRate')}
              value={`${cRate.toFixed(2)}C`}
              sub={`${t('storage.maxRate')}: ${batteryConfig.maxChargeRateKW} ${t('units.kilowatt')}`}
            />
            <StatCard
              icon={<Thermometer size={16} className="text-red-400" />}
              label={t('storage.temperature')}
              value={`${batteryTemp.toFixed(1)}°C`}
              sub={batteryTemp > 40 ? t('storage.tempWarn') : t('storage.tempOk')}
              warn={batteryTemp > 40}
            />
            <StatCard
              icon={<Heart size={16} className="text-pink-400" />}
              label={t('storage.health')}
              value={`${batteryHealth.toFixed(1)}%`}
              sub={`${t('storage.soh')}`}
            />
            <StatCard
              icon={<BarChart3 size={16} className="text-indigo-400" />}
              label={t('storage.cycles')}
              value={`${cycleCount}`}
              sub={t('storage.totalCycles')}
            />
          </div>
        </div>
      </motion.section>

      {/* ─── SoC History Chart ─────────────────────────────────────── */}
      <motion.section
        className="glass-panel-strong hover-lift rounded-3xl p-6"
        aria-labelledby="soc-chart-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="soc-chart-title"
            className="fluid-text-lg flex items-center gap-2 text-lg font-medium"
          >
            <TrendingUp size={20} className="text-(--color-secondary)" aria-hidden="true" />
            {t('storage.socHistory')}
          </h2>
          <span className="text-xs text-(--color-muted)">{t('storage.last24h')}</span>
        </div>
        <div className="h-[260px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={socHistory} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="socGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
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
                domain={[0, 100]}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface-strong)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: 'var(--color-text)',
                }}
                formatter={(value) => [`${value}%`, 'SoC']}
              />
              {/* Min SoC limit zone */}
              <ReferenceArea
                y1={0}
                y2={batteryConfig.minSoCPercent}
                fill="#ef4444"
                fillOpacity={0.06}
              />
              {/* Max SoC limit */}
              <ReferenceLine
                y={batteryConfig.maxSoCPercent}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
                label={{
                  value: `${t('storage.maxSoC')} ${batteryConfig.maxSoCPercent}%`,
                  position: 'insideTopRight',
                  fill: '#f59e0b',
                  fontSize: 10,
                }}
              />
              {/* Min SoC limit */}
              <ReferenceLine
                y={batteryConfig.minSoCPercent}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
                label={{
                  value: `${t('storage.minSoC')} ${batteryConfig.minSoCPercent}%`,
                  position: 'insideBottomRight',
                  fill: '#ef4444',
                  fontSize: 10,
                }}
              />
              <Area
                type="monotone"
                dataKey="soc"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#socGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      {/* ─── Strategy Selector ─────────────────────────────────────── */}
      <motion.section
        className="glass-panel-strong hover-lift rounded-3xl p-6"
        aria-labelledby="battery-strategy-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2
          id="battery-strategy-title"
          className="fluid-text-lg mb-5 flex items-center gap-2 text-lg font-medium"
        >
          <Settings size={20} className="text-(--color-secondary)" aria-hidden="true" />
          {t('control.batteryTitle')}
        </h2>
        <div
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
          role="radiogroup"
          aria-label={t('control.batteryTitle')}
        >
          {(['self-consumption', 'force-charge', 'time-of-use', 'auto'] as StrategyMode[]).map(
            (mode) => {
              const Icon = STRATEGY_ICONS[mode];
              const isActive = activeStrategy === mode;
              return (
                <motion.button
                  key={mode}
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => handleStrategyChange(mode)}
                  className={`focus-ring relative flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all ${
                    isActive
                      ? 'border-(--color-primary) bg-(--color-primary)/12 shadow-(--color-primary)/10 shadow-lg'
                      : 'border-(--color-border) bg-(--color-surface) hover:border-(--color-primary)/40 hover:bg-(--color-surface-strong)'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isActive && (
                    <motion.div
                      className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-(--color-primary)"
                      layoutId="strategy-indicator"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <Icon
                      size={18}
                      className={isActive ? 'text-(--color-primary)' : 'text-(--color-muted)'}
                    />
                    <span
                      className={`text-sm font-semibold ${isActive ? 'text-(--color-primary)' : 'text-(--color-text)'}`}
                    >
                      {t(`storage.strategy.${mode}`)}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-(--color-muted)">
                    {t(`storage.strategy.${mode}Desc`)}
                  </p>
                </motion.button>
              );
            },
          )}
        </div>
      </motion.section>

      {/* ─── Battery System Specs + Safety Limits ──────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* System Specifications */}
        <motion.section
          className="glass-panel-strong hover-lift rounded-3xl p-6"
          aria-labelledby="battery-specs-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2
            id="battery-specs-title"
            className="fluid-text-lg mb-4 flex items-center gap-2 text-lg font-medium"
          >
            <Info size={20} className="text-(--color-secondary)" aria-hidden="true" />
            {t('storage.systemSpecs')}
          </h2>
          <dl className="space-y-3">
            <SpecRow label={t('storage.model')} value={batteryConfig.model} />
            <SpecRow
              label={t('storage.capacity')}
              value={`${batteryConfig.capacityKWh} ${t('units.kilowattHour')}`}
            />
            <SpecRow label={t('storage.modules')} value={`${batteryConfig.modules}`} />
            <SpecRow
              label={t('storage.maxCharge')}
              value={`${batteryConfig.maxChargeRateKW} ${t('units.kilowatt')}`}
            />
            <SpecRow
              label={t('storage.maxDischarge')}
              value={`${batteryConfig.maxDischargeRateKW} ${t('units.kilowatt')}`}
            />
            <SpecRow
              label={t('storage.nominalVoltage')}
              value={`${batteryConfig.nominalVoltageV} V`}
            />
            <SpecRow
              label={t('storage.cellBalance')}
              value={`Δ ${(cellBalanceDelta * 1000).toFixed(0)} mV`}
            />
          </dl>
        </motion.section>

        {/* Safety & Limits */}
        <motion.section
          className="glass-panel-strong hover-lift rounded-3xl p-6"
          aria-labelledby="battery-safety-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
        >
          <h2
            id="battery-safety-title"
            className="fluid-text-lg mb-4 flex items-center gap-2 text-lg font-medium"
          >
            <Shield size={20} className="text-(--color-secondary)" aria-hidden="true" />
            {t('storage.safetyLimits')}
          </h2>
          <div className="space-y-5">
            {/* SoC range bar */}
            <div>
              <div className="mb-2 flex justify-between text-xs text-(--color-muted)">
                <span>{t('storage.socRange')}</span>
                <span>
                  {batteryConfig.minSoCPercent}% – {batteryConfig.maxSoCPercent}%
                </span>
              </div>
              <div className="relative h-3 overflow-hidden rounded-full bg-(--color-border)">
                {/* Usable range */}
                <div
                  className="absolute top-0 h-full rounded-full bg-emerald-500/25"
                  style={{
                    left: `${batteryConfig.minSoCPercent}%`,
                    width: `${batteryConfig.maxSoCPercent - batteryConfig.minSoCPercent}%`,
                  }}
                />
                {/* Current SoC marker */}
                <motion.div
                  className="absolute top-0 h-full w-1 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]"
                  animate={{ left: `${energyData.batterySoC}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
                {/* Min marker */}
                <div
                  className="absolute top-0 h-full w-0.5 bg-red-400/60"
                  style={{ left: `${batteryConfig.minSoCPercent}%` }}
                />
                {/* Max marker */}
                <div
                  className="absolute top-0 h-full w-0.5 bg-yellow-400/60"
                  style={{ left: `${batteryConfig.maxSoCPercent}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-(--color-muted)">
                <span>0%</span>
                <span className="text-red-400">
                  {t('storage.minSoC')} {batteryConfig.minSoCPercent}%
                </span>
                <span className="text-yellow-400">
                  {t('storage.maxSoC')} {batteryConfig.maxSoCPercent}%
                </span>
                <span>100%</span>
              </div>
            </div>

            {/* Power limits */}
            <div>
              <p className="mb-2 text-xs text-(--color-muted)">{t('storage.powerLimits')}</p>
              <div className="relative h-6 overflow-hidden rounded-full bg-(--color-border)">
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-(--color-muted)">
                  {(energyData.batteryPower / 1000).toFixed(2)} {t('units.kilowatt')}
                </div>
                {/* Power bar */}
                <motion.div
                  className={`absolute top-0 h-full ${
                    batteryStatus === 'charging'
                      ? 'rounded-r-full bg-emerald-500/40'
                      : batteryStatus === 'discharging'
                        ? 'rounded-l-full bg-orange-500/40'
                        : ''
                  }`}
                  animate={{
                    left:
                      batteryStatus === 'charging'
                        ? '50%'
                        : `${50 - (powerKW / batteryConfig.maxDischargeRateKW) * 50}%`,
                    width:
                      batteryStatus === 'charging'
                        ? `${(powerKW / batteryConfig.maxChargeRateKW) * 50}%`
                        : batteryStatus === 'discharging'
                          ? `${(powerKW / batteryConfig.maxDischargeRateKW) * 50}%`
                          : '0%',
                  }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
                {/* Center line */}
                <div className="absolute top-0 left-1/2 h-full w-0.5 bg-(--color-text)/20" />
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-(--color-muted)">
                <span>
                  -{batteryConfig.maxDischargeRateKW} {t('units.kilowatt')}
                </span>
                <span>0</span>
                <span>
                  +{batteryConfig.maxChargeRateKW} {t('units.kilowatt')}
                </span>
              </div>
            </div>

            {/* Health indicators */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-(--color-border) bg-white/5 p-3">
                <p className="text-[10px] tracking-wider text-(--color-muted) uppercase">
                  {t('storage.health')}
                </p>
                <p
                  className={`mt-1 text-lg font-semibold ${batteryHealth > 90 ? 'text-emerald-400' : batteryHealth > 70 ? 'text-yellow-400' : 'text-red-400'}`}
                >
                  {batteryHealth.toFixed(1)}%
                </p>
              </div>
              <div className="rounded-xl border border-(--color-border) bg-white/5 p-3">
                <p className="text-[10px] tracking-wider text-(--color-muted) uppercase">
                  {t('storage.temperature')}
                </p>
                <p
                  className={`mt-1 text-lg font-semibold ${batteryTemp < 35 ? 'text-emerald-400' : batteryTemp < 45 ? 'text-yellow-400' : 'text-red-400'}`}
                >
                  {batteryTemp.toFixed(1)}°C
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      {/* ─── Quick Actions Footer ──────────────────────────────────── */}
      <motion.section
        className="glass-panel rounded-3xl p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-(--color-muted)">
            {t('storage.configuredAs', {
              model: batteryConfig.model,
              capacity: batteryConfig.capacityKWh,
            })}
          </div>
          <Link
            to="/settings?tab=energy"
            className="focus-ring inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-(--color-primary) transition-colors hover:bg-(--color-primary)/10"
          >
            {t('storage.editConfig')}
            <ChevronRight size={14} />
          </Link>
        </div>
      </motion.section>

      {/* ─── Cross-Links & Navigation ─────────────────────────── */}
      <PageCrossLinks />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

const StatCard = memo(function StatCard({
  icon,
  label,
  value,
  sub,
  warn,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  warn?: boolean;
}) {
  return (
    <div className={`glass-panel rounded-2xl p-3.5 ${warn ? 'border-red-400/30' : ''}`}>
      <div className="mb-1.5 flex items-center gap-1.5">
        {icon}
        <p className="truncate text-[11px] text-(--color-muted)">{label}</p>
      </div>
      <p
        className={`text-lg font-light tracking-tight ${warn ? 'text-red-400' : 'text-(--color-text)'}`}
      >
        {value}
      </p>
      <p className="mt-0.5 truncate text-[10px] text-(--color-muted)">{sub}</p>
    </div>
  );
});

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-(--color-border)/30 pb-2.5 last:border-0">
      <dt className="text-sm text-(--color-muted)">{label}</dt>
      <dd className="text-sm font-medium text-(--color-text)">{value}</dd>
    </div>
  );
}

export default memo(StoragePageComponent);
