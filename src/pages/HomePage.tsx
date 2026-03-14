import { memo } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  Sun,
  Battery,
  Home,
  Zap,
  Activity,
  TrendingUp,
  Leaf,
  Thermometer,
  Car,
  BarChart3,
  Coins,
  CloudSun,
  Gauge,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '../store';
import { getDisplayData } from '../lib/demo-data';
import { DemoBadge } from '../components/DemoBadge';
import { useLegacySendCommand } from '../core/useLegacySendCommand';
import { PageHeader } from '../components/layout/PageHeader';
import { SankeyDiagram } from '../components/SankeyDiagram';
import { AIOptimizerPanel } from '../components/AIOptimizerPanel';
import { ControlPanel } from '../components/ControlPanel';
import { Link } from 'react-router-dom';
import { PageCrossLinks } from '../components/ui/PageCrossLinks';

function HomePageComponent() {
  const { t } = useTranslation();
  const storeData = useAppStore((s) => s.energyData);
  const connected = useAppStore((s) => s.connected);
  const energyData = getDisplayData(storeData, connected);
  const isDemo = !connected && energyData !== storeData;
  const { sendCommand } = useLegacySendCommand();
  const settings = useAppStore((s) => s.settings);

  // ─── Derived metrics ──────────────────────────────────────────────
  const pvKW = energyData.pvPower / 1000;
  const houseKW = energyData.houseLoad / 1000;
  const gridKW = energyData.gridPower / 1000;
  const battKW = energyData.batteryPower / 1000;

  // Self-sufficiency
  const pvContribution = Math.min(energyData.pvPower, energyData.houseLoad);
  const batteryContribution = Math.max(0, energyData.batteryPower);
  const selfSupplied = Math.min(pvContribution + batteryContribution, energyData.houseLoad);
  const selfSufficiency =
    energyData.houseLoad > 0 ? (selfSupplied / energyData.houseLoad) * 100 : 0;

  // Energy balance: where PV power goes
  const pvToHouse = Math.min(energyData.pvPower, energyData.houseLoad);
  const pvToBattery = Math.min(
    Math.max(0, energyData.pvPower - pvToHouse),
    Math.max(0, -energyData.batteryPower),
  );
  const pvToGrid = Math.max(0, energyData.pvPower - pvToHouse - pvToBattery);
  const totalPvOut = pvToHouse + pvToBattery + pvToGrid;
  const balanceHouse = totalPvOut > 0 ? (pvToHouse / totalPvOut) * 100 : 0;
  const balanceBattery = totalPvOut > 0 ? (pvToBattery / totalPvOut) * 100 : 0;
  const balanceGrid = totalPvOut > 0 ? (pvToGrid / totalPvOut) * 100 : 0;

  // Load breakdown
  const hpKW = energyData.heatPumpPower / 1000;
  const evKW = energyData.evPower / 1000;
  const baseLoad =
    Math.max(0, energyData.houseLoad - energyData.heatPumpPower - energyData.evPower) / 1000;

  // Cost estimate today
  const avgPrice = energyData.priceCurrent;

  const selfConsumptionSavings = (pvToHouse / 1000) * avgPrice * 6;
  const co2SavedToday = energyData.pvYieldToday * 0.38;

  // Peak PV estimate
  const peakKWp = settings.systemConfig.pv.peakPowerKWp;
  const utilizationPercent = peakKWp > 0 ? (pvKW / peakKWp) * 100 : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.home', 'Overview')}
        subtitle={t('common.tagline')}
        icon={<Home size={22} aria-hidden="true" />}
        actions={
          <div className="flex items-center gap-2">
            {isDemo && <DemoBadge />}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase ${
                connected ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  connected ? 'energy-pulse bg-emerald-400' : 'bg-rose-400'
                }`}
              />
              {connected ? t('common.live') : t('common.demoMode')}
            </span>
          </div>
        }
      />

      {/* ─── System Health Banner ──────────────────────────────── */}
      <motion.section
        className="glass-panel rounded-2xl px-5 py-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        aria-label={t('dashboard.systemHealth')}
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <HealthPill
            icon={<Gauge size={13} className="text-cyan-400" />}
            label={t('dashboard.gridVoltage')}
            value={`${energyData.gridVoltage.toFixed(0)} V`}
            ok={energyData.gridVoltage >= 220 && energyData.gridVoltage <= 250}
          />
          <HealthPill
            icon={<Coins size={13} className="text-orange-400" />}
            label={t('dashboard.tariff')}
            value={`${(avgPrice * 100).toFixed(1)} ct/${t('units.kilowattHour')}`}
            ok={avgPrice < 0.2}
          />
          <HealthPill
            icon={<CloudSun size={13} className="text-yellow-400" />}
            label={t('dashboard.pvUtilization')}
            value={`${utilizationPercent.toFixed(0)}%`}
            ok={utilizationPercent > 30}
          />
          <HealthPill
            icon={<Battery size={13} className="text-emerald-400" />}
            label="SoC"
            value={`${energyData.batterySoC.toFixed(0)}%`}
            ok={energyData.batterySoC > 20}
          />
          <HealthPill
            icon={<Activity size={13} className="text-purple-400" />}
            label={t('dashboard.inverterStatus')}
            value={t('dashboard.online')}
            ok
          />
        </div>
      </motion.section>

      {/* ─── KPI Grid ─────────────────────────────────────────── */}
      <section
        aria-label={t('metrics.overview', 'Key metrics')}
        aria-live="polite"
        aria-atomic="false"
      >
        <motion.div
          className="grid grid-cols-2 gap-4 lg:grid-cols-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <KpiCard
            icon={<Sun className="text-yellow-400" aria-hidden="true" />}
            label={t('metrics.pvGeneration')}
            value={`${pvKW.toFixed(2)} ${t('units.kilowatt')}`}
            sub={`${energyData.pvYieldToday.toFixed(1)} ${t('units.kilowattHour')} ${t('common.today')}`}
            link="/production"
            accent="yellow"
          />
          <KpiCard
            icon={
              <Battery
                className={energyData.batterySoC > 20 ? 'text-emerald-400' : 'text-red-400'}
                aria-hidden="true"
              />
            }
            label={t('metrics.battery')}
            value={`${energyData.batterySoC.toFixed(1)}${t('units.percent')}`}
            sub={`${battKW.toFixed(2)} ${t('units.kilowatt')} · ${
              energyData.batteryPower < -50
                ? t('metrics.batteryCharging')
                : energyData.batteryPower > 50
                  ? t('metrics.batteryDischarging')
                  : t('metrics.batteryIdle')
            }`}
            link="/storage"
            accent="emerald"
            className={
              energyData.batteryPower < -50
                ? 'battery-charging'
                : energyData.batteryPower > 50
                  ? 'battery-discharging'
                  : ''
            }
          />
          <KpiCard
            icon={<Home className="text-blue-400" aria-hidden="true" />}
            label={t('metrics.houseLoad')}
            value={`${houseKW.toFixed(2)} ${t('units.kilowatt')}`}
            sub={t('metrics.baseLoad')}
            link="/consumption"
            accent="blue"
          />
          <KpiCard
            icon={
              <Zap
                className={energyData.gridPower > 0 ? 'text-red-400' : 'text-emerald-400'}
                aria-hidden="true"
              />
            }
            label={t('metrics.grid')}
            value={`${Math.abs(gridKW).toFixed(2)} ${t('units.kilowatt')}`}
            sub={energyData.gridPower > 0 ? t('metrics.import') : t('metrics.export')}
            link="/energy-flow"
            accent={energyData.gridPower > 0 ? 'red' : 'emerald'}
          />
          <KpiCard
            icon={<Leaf className="text-emerald-400" aria-hidden="true" />}
            label={t('metrics.autonomy')}
            value={`${selfSufficiency.toFixed(0)}${t('units.percent')}`}
            sub={t('dashboard.selfSufficiencyHint')}
            link="/analytics"
            accent="emerald"
          />
        </motion.div>
      </section>

      {/* ─── Energy Balance Strip ──────────────────────────────── */}
      {totalPvOut > 100 && (
        <motion.section
          className="glass-panel-strong rounded-2xl p-5"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          aria-label={t('dashboard.energyBalance')}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-medium text-(--color-text)">
              <Sun size={16} className="text-yellow-400" />
              {t('dashboard.energyBalance')}
              <span className="text-xs font-normal text-(--color-muted)">
                {pvKW.toFixed(2)} {t('units.kilowatt')} →
              </span>
            </h2>
          </div>
          <div
            className="flex h-4 overflow-hidden rounded-full bg-(--color-surface)"
            role="img"
            aria-label={t('dashboard.energyBalance')}
          >
            <motion.div
              className="flex items-center justify-center bg-blue-500/80 text-[9px] font-medium text-white"
              initial={{ width: 0 }}
              animate={{ width: `${balanceHouse}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              title={`${t('dashboard.toHouse')}: ${(pvToHouse / 1000).toFixed(2)} kW`}
            >
              {balanceHouse > 12 && `${balanceHouse.toFixed(0)}%`}
            </motion.div>
            <motion.div
              className="flex items-center justify-center bg-emerald-500/80 text-[9px] font-medium text-white"
              initial={{ width: 0 }}
              animate={{ width: `${balanceBattery}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
              title={`${t('dashboard.toBattery')}: ${(pvToBattery / 1000).toFixed(2)} kW`}
            >
              {balanceBattery > 12 && `${balanceBattery.toFixed(0)}%`}
            </motion.div>
            <motion.div
              className="flex items-center justify-center bg-orange-500/80 text-[9px] font-medium text-white"
              initial={{ width: 0 }}
              animate={{ width: `${balanceGrid}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
              title={`${t('dashboard.toGridExport')}: ${(pvToGrid / 1000).toFixed(2)} kW`}
            >
              {balanceGrid > 12 && `${balanceGrid.toFixed(0)}%`}
            </motion.div>
          </div>
          <div className="mt-2 flex gap-4 text-[10px] text-(--color-muted)">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500/80" /> {t('dashboard.toHouse')}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500/80" /> {t('dashboard.toBattery')}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-orange-500/80" />{' '}
              {t('dashboard.toGridExport')}
            </span>
          </div>
        </motion.section>
      )}

      {/* ─── Sankey + Controls Row ─────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Compact Sankey */}
        <motion.section
          className="glass-panel-strong hover-lift rounded-3xl p-6 lg:col-span-2"
          aria-labelledby="home-flow-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="relative z-10 mb-3 flex items-center justify-between">
            <h2
              id="home-flow-title"
              className="fluid-text-lg flex items-center gap-2 text-lg font-medium"
            >
              <Activity size={20} className="text-(--color-secondary)" aria-hidden="true" />
              {t('dashboard.realtimeFlow')}
            </h2>
            <Link
              to="/energy-flow"
              className="focus-ring inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-(--color-primary) transition-colors hover:bg-(--color-primary)/10"
            >
              {t('nav.viewAll', 'Details')}
              <ChevronRight size={14} />
            </Link>
          </div>
          <div className="relative min-h-[280px] sm:min-h-[340px]">
            <SankeyDiagram data={energyData} />
          </div>
        </motion.section>

        {/* Quick Controls */}
        <motion.section
          className="glass-panel-strong hover-lift rounded-3xl p-6"
          aria-labelledby="home-controls-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <h2
            id="home-controls-title"
            className="fluid-text-lg mb-4 flex items-center gap-2 text-lg font-medium"
          >
            <TrendingUp size={20} className="text-(--color-secondary)" aria-hidden="true" />
            {t('dashboard.control')}
          </h2>
          <ControlPanel sendCommand={sendCommand} data={energyData} />
        </motion.section>
      </div>

      {/* ─── Today's Highlights + Load Breakdown ─────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Today's Highlights */}
        <motion.section
          className="glass-panel-strong hover-lift rounded-3xl p-6 lg:col-span-2"
          aria-labelledby="home-highlights-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2
            id="home-highlights-title"
            className="fluid-text-lg mb-4 flex items-center gap-2 text-lg font-medium"
          >
            <BarChart3 size={20} className="text-(--color-secondary)" aria-hidden="true" />
            {t('dashboard.todayHighlights')}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <HighlightCard
              icon={<Sun size={16} className="text-yellow-400" />}
              label={t('dashboard.pvYieldToday')}
              value={`${energyData.pvYieldToday.toFixed(1)} ${t('units.kilowattHour')}`}
              sub={`${peakKWp} kWp · ${(energyData.pvYieldToday / peakKWp).toFixed(2)} ${t('units.kilowattHour')}/kWp`}
            />
            <HighlightCard
              icon={<Leaf size={16} className="text-emerald-400" />}
              label={t('dashboard.co2Saved')}
              value={`${co2SavedToday.toFixed(1)} kg`}
              sub={t('dashboard.co2Equiv')}
            />
            <HighlightCard
              icon={<Coins size={16} className="text-orange-400" />}
              label={t('dashboard.savings')}
              value={`~${selfConsumptionSavings.toFixed(2)} €`}
              sub={t('dashboard.selfConsumptionSavings')}
            />
            <HighlightCard
              icon={<Zap size={16} className="text-cyan-400" />}
              label={t('dashboard.gridExportToday')}
              value={`${(pvToGrid / 1000).toFixed(2)} ${t('units.kilowatt')}`}
              sub={t('dashboard.currentFeedIn')}
            />
          </div>
        </motion.section>

        {/* Load Breakdown */}
        <motion.section
          className="glass-panel-strong hover-lift rounded-3xl p-6"
          aria-labelledby="home-load-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <h2
            id="home-load-title"
            className="fluid-text-lg mb-4 flex items-center gap-2 text-lg font-medium"
          >
            <Home size={20} className="text-(--color-secondary)" aria-hidden="true" />
            {t('dashboard.loadBreakdown')}
          </h2>
          <div className="space-y-3">
            <LoadBar
              icon={<Home size={14} className="text-blue-400" />}
              label={t('dashboard.baseLoadLabel')}
              value={baseLoad}
              maxValue={houseKW}
              color="bg-blue-500"
              unit={t('units.kilowatt')}
            />
            <LoadBar
              icon={<Thermometer size={14} className="text-red-400" />}
              label={t('dashboard.heatPump')}
              value={hpKW}
              maxValue={houseKW}
              color="bg-red-500"
              unit={t('units.kilowatt')}
            />
            <LoadBar
              icon={<Car size={14} className="text-green-400" />}
              label={t('dashboard.evCharging')}
              value={evKW}
              maxValue={houseKW}
              color="bg-green-500"
              unit={t('units.kilowatt')}
            />
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-(--color-border)/30 pt-3 text-sm">
            <span className="text-(--color-muted)">{t('dashboard.totalLoad')}</span>
            <span className="font-medium text-(--color-text)">
              {houseKW.toFixed(2)} {t('units.kilowatt')}
            </span>
          </div>
          <Link
            to="/consumption"
            className="focus-ring mt-3 inline-flex items-center gap-1 text-xs font-medium text-(--color-primary) hover:underline"
          >
            {t('dashboard.viewDetails')}
            <ArrowRight size={12} />
          </Link>
        </motion.section>
      </div>

      {/* ─── AI Quick Panel ───────────────────────────────────── */}
      <div id="ai-optimizer">
        <AIOptimizerPanel />
      </div>

      {/* ─── Cross-Links & Navigation ─────────────────────────── */}
      <PageCrossLinks />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function HealthPill({
  icon,
  label,
  value,
  ok,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-(--color-muted)">{label}:</span>
      <span className={`font-medium ${ok ? 'text-(--color-text)' : 'text-red-400'}`}>{value}</span>
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
    </div>
  );
}

function HighlightCard({
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
}

function LoadBar({
  icon,
  label,
  value,
  maxValue,
  color,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  maxValue: number;
  color: string;
  unit: string;
}) {
  const percent = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-(--color-muted)">
          {icon} {label}
        </span>
        <span className="font-medium text-(--color-text)">
          {value.toFixed(2)} {unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-(--color-surface)">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, percent)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ opacity: 0.75 }}
        />
      </div>
    </div>
  );
}

const KpiCard = memo(function KpiCard({
  icon,
  label,
  value,
  sub,
  link,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  link: string;
  accent?: string;
  className?: string;
}) {
  return (
    <Link
      to={link}
      className={`metric-card group focus-ring block overflow-hidden rounded-2xl ${className || ''}`}
    >
      <div className="mb-3 flex min-w-0 items-center gap-3">
        <div className="shrink-0 rounded-xl border border-(--color-border) bg-white/6 p-2.5">
          {icon}
        </div>
        <span className="fluid-text-sm min-w-0 truncate text-sm font-medium text-(--color-text)">
          {label}
        </span>
      </div>
      <div className="fluid-text-2xl truncate text-2xl font-light tracking-tight text-(--color-text)">
        {value}
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="fluid-text-xs truncate text-xs text-(--color-muted)">{sub}</span>
        <ChevronRight
          size={14}
          className="shrink-0 text-(--color-muted) opacity-0 transition-opacity group-hover:opacity-100"
        />
      </div>
    </Link>
  );
});

export const HomePage = memo(HomePageComponent);
export default HomePage;
