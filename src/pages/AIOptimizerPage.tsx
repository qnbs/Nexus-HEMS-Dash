import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  BrainCircuit,
  Zap,
  Battery,
  Car,
  Flame,
  Sun,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  ShieldCheck,
  Activity,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Gauge,
  Wallet,
  Leaf,
  CircleDot,
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
} from 'recharts';
import { PageHeader } from '../components/layout/PageHeader';
import { AIOptimizerPanel } from '../components/AIOptimizerPanel';
import { EnhancedAIOptimizer } from '../components/EnhancedAIOptimizer';
import { PageCrossLinks } from '../components/ui/PageCrossLinks';
import { useAppStore } from '../store';
import { formatPower } from '../lib/format';

// ─── Static data (generated once, outside render) ────────────────────

const NOW = new Date();
const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = (NOW.getHours() + i) % 24;
  return `${String(h).padStart(2, '0')}:00`;
});

const STRATEGY_TIMELINE = HOURS.map((hour, i) => {
  const h = parseInt(hour);
  const price =
    0.15 +
    Math.sin(i / 3.5) * 0.08 +
    (h >= 7 && h <= 9 ? 0.06 : 0) +
    (h >= 17 && h <= 20 ? 0.08 : 0);
  const pvForecast = h >= 6 && h <= 20 ? Math.sin(((h - 6) / 14) * Math.PI) * 8.5 : 0;
  let action: 'charge_ev' | 'charge_battery' | 'preheat' | 'export' | 'idle' = 'idle';
  if (price < 0.12 && h >= 1 && h <= 5) action = 'charge_ev';
  else if (price < 0.14 && h >= 0 && h <= 6) action = 'charge_battery';
  else if (pvForecast > 4 && h >= 10 && h <= 15) action = 'export';
  else if (h >= 14 && h <= 16 && pvForecast > 3) action = 'preheat';
  return {
    hour,
    price: Math.round(price * 1000) / 1000,
    pvForecast: Math.round(pvForecast * 10) / 10,
    action,
  };
});

const SAVINGS_DATA = [
  { day: 'Mo', saved: 3.2, co2: 1.2 },
  { day: 'Di', saved: 4.8, co2: 1.8 },
  { day: 'Mi', saved: 2.9, co2: 1.1 },
  { day: 'Do', saved: 5.1, co2: 1.9 },
  { day: 'Fr', saved: 4.3, co2: 1.6 },
  { day: 'Sa', saved: 6.2, co2: 2.3 },
  { day: 'So', saved: 5.7, co2: 2.1 },
];

const ACTION_COLORS: Record<string, string> = {
  charge_ev: '#22ff88',
  charge_battery: '#00f0ff',
  preheat: '#ff8800',
  export: '#a855f7',
  idle: '#334155',
};

function AIOptimizerPageComponent() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const energyData = useAppStore((s) => s.energyData);
  const [expandedStrategy, setExpandedStrategy] = useState<number | null>(null);

  // ─── Derived metrics ───────────────────────────────────────────────
  const pvSurplus = Math.max(0, energyData.pvPower - energyData.houseLoad);
  const selfConsumption =
    energyData.pvPower > 0
      ? Math.min(
          100,
          Math.round(
            ((energyData.pvPower - Math.max(0, -energyData.gridPower)) / energyData.pvPower) * 100,
          ),
        )
      : 0;
  const optimizationScore = Math.min(
    100,
    Math.round(
      selfConsumption * 0.4 +
        (energyData.batterySoC > 20 ? 25 : energyData.batterySoC) +
        (energyData.priceCurrent < 0.2 ? 20 : 10) +
        (pvSurplus > 0 ? 15 : 5),
    ),
  );
  const dailySavings = SAVINGS_DATA.reduce((acc, d) => acc + d.saved, 0);
  const weeklyCo2 = SAVINGS_DATA.reduce((acc, d) => acc + d.co2, 0);
  const optimalActions = STRATEGY_TIMELINE.filter((s) => s.action !== 'idle').length;

  // ─── Strategy items (next 6 actionable) ────────────────────────────
  const nextActions = STRATEGY_TIMELINE.filter((s) => s.action !== 'idle').slice(0, 6);

  // ─── KPI cards ─────────────────────────────────────────────────────
  const kpiCards = [
    {
      icon: Sun,
      label: t('energyFlow.pvGeneration', 'PV-Erzeugung'),
      value: formatPower(energyData.pvPower, locale),
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10 border-yellow-400/20',
    },
    {
      icon: Battery,
      label: t('energyFlow.batterySoC', 'Batterie-SoC'),
      value: `${energyData.batterySoC}%`,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10 border-emerald-400/20',
    },
    {
      icon: Zap,
      label: t('energyFlow.gridExchange', 'Netzaustausch'),
      value: formatPower(Math.abs(energyData.gridPower), locale),
      color: energyData.gridPower > 0 ? 'text-red-400' : 'text-emerald-400',
      bg:
        energyData.gridPower > 0
          ? 'bg-red-400/10 border-red-400/20'
          : 'bg-emerald-400/10 border-emerald-400/20',
    },
    {
      icon: Flame,
      label: t('ai.heatPumpStrategy', 'Wärmepumpe'),
      value: formatPower(energyData.heatPumpPower, locale),
      color: 'text-orange-400',
      bg: 'bg-orange-400/10 border-orange-400/20',
    },
    {
      icon: Car,
      label: t('ai.evStrategy', 'EV-Laden'),
      value: formatPower(energyData.evPower, locale),
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10 border-cyan-400/20',
    },
    {
      icon: Wallet,
      label: t('energyFlow.currentPrice', 'Aktueller Preis'),
      value: `${energyData.priceCurrent.toFixed(3)} €`,
      color: energyData.priceCurrent < 0.15 ? 'text-emerald-400' : 'text-orange-400',
      bg:
        energyData.priceCurrent < 0.15
          ? 'bg-emerald-400/10 border-emerald-400/20'
          : 'bg-orange-400/10 border-orange-400/20',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={t('nav.aiOptimizer', 'AI Optimizer')}
        subtitle={t('ai.subtitle')}
        icon={<Sparkles size={22} />}
      />

      {/* ─── AI Status Bar ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-panel-strong flex flex-wrap items-center justify-between gap-3 rounded-2xl p-3 sm:gap-4 sm:rounded-3xl sm:p-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--color-primary)/15">
            <BrainCircuit className="h-5 w-5 text-(--color-primary)" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-(--color-text)">
              {t('aiOptimizer.engineStatus', 'Optimierungs-Engine')}
            </p>
            <p className="text-xs text-(--color-muted)">{t('ai.geminiPowered')}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
            <CircleDot size={10} className="animate-pulse" aria-hidden="true" />
            {t('common.live')}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-(--color-border) bg-white/5 px-2.5 py-1 text-xs text-(--color-muted)">
            <Target size={12} aria-hidden="true" />
            {optimalActions} {t('aiOptimizer.actionsPlanned', 'Aktionen geplant')}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-(--color-border) bg-white/5 px-2.5 py-1 text-xs text-(--color-muted)">
            <ShieldCheck size={12} aria-hidden="true" />
            BYOK
          </span>
        </div>
      </motion.div>

      {/* ─── Live System Snapshot (6 KPIs) ───────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpiCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            className={`rounded-2xl border p-3 sm:p-4 ${card.bg}`}
          >
            <div className="mb-2 flex items-center gap-2">
              <card.icon size={16} className={`shrink-0 ${card.color}`} aria-hidden="true" />
              <span className="truncate text-xs text-(--color-muted)">{card.label}</span>
            </div>
            <p className={`text-lg font-bold ${card.color} truncate`}>{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ─── Row: Optimization Score + Savings Tracker ───────────── */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Optimization Score Gauge */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="glass-panel-strong flex flex-col items-center justify-center rounded-2xl p-5 sm:rounded-3xl sm:p-6"
          aria-label={t('aiOptimizer.optimizationScore', 'Optimierungsscore')}
        >
          <p className="mb-4 text-sm font-semibold text-(--color-muted)">
            {t('aiOptimizer.optimizationScore', 'Optimierungsscore')}
          </p>
          <div className="relative h-40 w-40 sm:h-48 sm:w-48">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="8"
                opacity="0.3"
              />
              <motion.circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={
                  optimizationScore >= 75
                    ? '#22ff88'
                    : optimizationScore >= 50
                      ? '#ff8800'
                      : '#ef4444'
                }
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 52}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - optimizationScore / 100) }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-(--color-text) sm:text-4xl">
                {optimizationScore}
              </span>
              <span className="text-xs text-(--color-muted)">/100</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Gauge size={14} className="text-(--color-primary)" aria-hidden="true" />
            <span className="text-xs text-(--color-muted)">
              {optimizationScore >= 75
                ? t('aiOptimizer.scoreExcellent', 'Exzellent')
                : optimizationScore >= 50
                  ? t('aiOptimizer.scoreGood', 'Gut')
                  : t('aiOptimizer.scoreImprove', 'Verbesserungspotenzial')}
            </span>
          </div>
          <div className="mt-3 grid w-full grid-cols-2 gap-2 text-center">
            <div className="rounded-xl border border-(--color-border) bg-white/5 p-2">
              <p className="text-lg font-bold text-emerald-400">{selfConsumption}%</p>
              <p className="text-[10px] text-(--color-muted)">
                {t('energyFlow.selfSufficiency', 'Autarkie')}
              </p>
            </div>
            <div className="rounded-xl border border-(--color-border) bg-white/5 p-2">
              <p className="text-lg font-bold text-cyan-400">{formatPower(pvSurplus, locale)}</p>
              <p className="text-[10px] text-(--color-muted)">{t('ai.surplus')}</p>
            </div>
          </div>
        </motion.section>

        {/* Weekly Savings Chart */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-panel-strong rounded-2xl p-4 sm:rounded-3xl sm:p-5 lg:col-span-2"
          aria-label={t('aiOptimizer.savingsTracker', 'Einsparungs-Tracker')}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-(--color-text) sm:text-base">
                <BarChart3 size={16} className="text-(--color-primary)" aria-hidden="true" />
                {t('aiOptimizer.savingsTracker', 'Einsparungs-Tracker')}
              </h3>
              <p className="mt-0.5 text-xs text-(--color-muted)">
                {t('aiOptimizer.weeklyOverview', 'Diese Woche')}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-400">€{dailySavings.toFixed(1)}</p>
                <p className="text-[10px] text-(--color-muted)">{t('ai.costSaving')}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-cyan-400">{weeklyCo2.toFixed(1)} kg</p>
                <p className="text-[10px] text-(--color-muted)">{t('ai.co2Reduction')}</p>
              </div>
            </div>
          </div>
          <div className="h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SAVINGS_DATA} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface-strong)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: 'var(--color-text)' }}
                  formatter={(value: unknown, name: unknown) => [
                    name === 'saved'
                      ? `€${Number(value).toFixed(2)}`
                      : `${Number(value).toFixed(1)} kg`,
                    name === 'saved' ? t('ai.costSaving') : t('ai.co2Reduction'),
                  ]}
                />
                <Bar dataKey="saved" fill="#22ff88" radius={[6, 6, 0, 0]} name="saved" />
                <Bar dataKey="co2" fill="#00f0ff" radius={[6, 6, 0, 0]} name="co2" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-(--color-muted)">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#22ff88]" /> {t('ai.costSaving')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#00f0ff]" /> {t('ai.co2Reduction')}
            </span>
          </div>
        </motion.section>
      </div>

      {/* ─── 24h Strategy Timeline ───────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="glass-panel-strong rounded-2xl p-4 sm:rounded-3xl sm:p-5"
        aria-label={t('aiOptimizer.strategyTimeline', 'Strategie-Zeitplan')}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-(--color-text) sm:text-base">
            <Clock size={16} className="text-(--color-primary)" aria-hidden="true" />
            {t('aiOptimizer.strategyTimeline', '24h Strategie-Zeitplan')}
          </h3>
          <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs">
            {[
              { key: 'charge_ev', label: t('aiOptimizer.actionEV', 'EV laden'), color: '#22ff88' },
              {
                key: 'charge_battery',
                label: t('aiOptimizer.actionBattery', 'Batterie laden'),
                color: '#00f0ff',
              },
              {
                key: 'preheat',
                label: t('aiOptimizer.actionPreheat', 'Vorwärmen'),
                color: '#ff8800',
              },
              {
                key: 'export',
                label: t('aiOptimizer.actionExport', 'Exportieren'),
                color: '#a855f7',
              },
            ].map((l) => (
              <span key={l.key} className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
        </div>

        {/* Price + PV chart */}
        <div className="h-48 sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={STRATEGY_TIMELINE}>
              <defs>
                <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#facc15" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
              <XAxis
                dataKey="hour"
                tick={{ fill: 'var(--color-muted)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={2}
              />
              <YAxis
                yAxisId="price"
                tick={{ fill: 'var(--color-muted)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={35}
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}ct`}
              />
              <YAxis
                yAxisId="pv"
                orientation="right"
                tick={{ fill: 'var(--color-muted)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={35}
                tickFormatter={(v: number) => `${v}kW`}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface-strong)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'var(--color-text)' }}
                formatter={(value: unknown, name: unknown) => [
                  name === 'price' ? `${(Number(value) * 100).toFixed(1)} ct/kWh` : `${value} kW`,
                  name === 'price'
                    ? t('energyFlow.currentPrice', 'Preis')
                    : t('energyFlow.pvForecast', 'PV-Prognose'),
                ]}
              />
              <Area
                yAxisId="pv"
                type="monotone"
                dataKey="pvForecast"
                stroke="#facc15"
                fill="url(#pvGrad)"
                strokeWidth={2}
                name="pvForecast"
              />
              <Area
                yAxisId="price"
                type="stepAfter"
                dataKey="price"
                stroke="#ef4444"
                fill="none"
                strokeWidth={2}
                strokeDasharray="4 2"
                name="price"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Action bar */}
        <div
          className="mt-4 flex gap-0.5 overflow-hidden rounded-xl"
          role="img"
          aria-label={t('aiOptimizer.actionTimeline', 'Aktions-Timeline')}
        >
          {STRATEGY_TIMELINE.map((slot, i) => (
            <div
              key={i}
              className="h-3 flex-1 transition-all duration-200 first:rounded-l-lg last:rounded-r-lg hover:h-5"
              style={{ background: ACTION_COLORS[slot.action] }}
              title={`${slot.hour}: ${slot.action}`}
            />
          ))}
        </div>
      </motion.section>

      {/* ─── Next Optimal Actions ────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="glass-panel-strong rounded-2xl p-4 sm:rounded-3xl sm:p-5"
        aria-label={t('aiOptimizer.nextActions', 'Nächste optimale Aktionen')}
      >
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-(--color-text) sm:text-base">
          <Activity size={16} className="text-(--color-primary)" aria-hidden="true" />
          {t('aiOptimizer.nextActions', 'Nächste optimale Aktionen')}
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {nextActions.map((action, i) => {
            const actionMeta = {
              charge_ev: {
                icon: Car,
                label: t('aiOptimizer.actionEV', 'EV laden'),
                color: 'text-emerald-400',
                border: 'border-emerald-400/20 bg-emerald-400/5',
              },
              charge_battery: {
                icon: Battery,
                label: t('aiOptimizer.actionBattery', 'Batterie laden'),
                color: 'text-cyan-400',
                border: 'border-cyan-400/20 bg-cyan-400/5',
              },
              preheat: {
                icon: Flame,
                label: t('aiOptimizer.actionPreheat', 'Vorwärmen'),
                color: 'text-orange-400',
                border: 'border-orange-400/20 bg-orange-400/5',
              },
              export: {
                icon: TrendingUp,
                label: t('aiOptimizer.actionExport', 'Exportieren'),
                color: 'text-purple-400',
                border: 'border-purple-400/20 bg-purple-400/5',
              },
              idle: {
                icon: Clock,
                label: 'Idle',
                color: 'text-(--color-muted)',
                border: 'border-(--color-muted)/20 bg-(--color-muted)/5',
              },
            }[action.action];
            const Icon = actionMeta.icon;
            const isExpanded = expandedStrategy === i;

            return (
              <motion.button
                key={i}
                onClick={() => setExpandedStrategy(isExpanded ? null : i)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className={`rounded-2xl border p-3 text-left transition-all sm:p-4 ${actionMeta.border} hover:shadow-lg`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className={actionMeta.color} aria-hidden="true" />
                    <span className={`text-sm font-semibold ${actionMeta.color}`}>
                      {actionMeta.label}
                    </span>
                  </div>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-(--color-muted)">
                    {action.hour}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-(--color-muted)">
                  <span>{(action.price * 100).toFixed(1)} ct/kWh</span>
                  {action.pvForecast > 0 && <span>{action.pvForecast} kW PV</span>}
                </div>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 border-t border-(--color-border) pt-2 text-xs text-(--color-muted)"
                    >
                      <div className="flex items-center gap-1">
                        <ArrowRight size={10} aria-hidden="true" />
                        {action.price < 0.13
                          ? t('aiOptimizer.reasonLowPrice', 'Günstigster Tarif im 24h-Fenster')
                          : action.pvForecast > 4
                            ? t('aiOptimizer.reasonHighPV', 'Hohe PV-Erzeugung, Überschuss nutzen')
                            : t(
                                'aiOptimizer.reasonThermal',
                                'Thermischen Speicher vorladen bei moderatem Tarif',
                              )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      {/* ─── Optimization Insights ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
        {[
          {
            icon: CheckCircle2,
            title: t('aiOptimizer.insightSelfConsumption', 'Eigenverbrauch maximiert'),
            desc: t(
              'aiOptimizer.insightSelfConsumptionDesc',
              'PV-Überschuss wird in Batterie, EV und Wärmepumpe gelenkt bevor exportiert wird.',
            ),
            color: 'text-emerald-400',
            border: 'border-emerald-400/20',
          },
          {
            icon: TrendingDown,
            title: t('aiOptimizer.insightCostOptimized', 'Kosten optimiert'),
            desc: t(
              'aiOptimizer.insightCostOptimizedDesc',
              'Ladezeitpunkte automatisch auf Tarif-Täler gelegt für minimale Stromkosten.',
            ),
            color: 'text-cyan-400',
            border: 'border-cyan-400/20',
          },
          {
            icon: Leaf,
            title: t('aiOptimizer.insightCO2Minimized', 'CO₂ minimiert'),
            desc: t(
              'aiOptimizer.insightCO2MinimizedDesc',
              'Verbrauch auf Zeiten mit hohem Erneuerbaren-Anteil und lokaler PV-Erzeugung gelegt.',
            ),
            color: 'text-green-400',
            border: 'border-green-400/20',
          },
        ].map((insight, i) => (
          <motion.div
            key={insight.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.06, duration: 0.35 }}
            className={`glass-panel rounded-2xl border ${insight.border} p-4 sm:p-5`}
          >
            <div className="mb-2 flex items-center gap-2">
              <insight.icon size={18} className={insight.color} aria-hidden="true" />
              <h4 className={`text-sm font-semibold ${insight.color}`}>{insight.title}</h4>
            </div>
            <p className="text-xs leading-relaxed text-(--color-muted)">{insight.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* ─── AI Alert Summary ────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="glass-panel-strong rounded-2xl p-4 sm:rounded-3xl sm:p-5"
        aria-label={t('aiOptimizer.alertSummary', 'KI-Hinweise')}
      >
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-(--color-text) sm:text-base">
          <AlertTriangle size={16} className="text-orange-400" aria-hidden="true" />
          {t('aiOptimizer.alertSummary', 'KI-Hinweise & Warnungen')}
        </h3>
        <div className="space-y-2">
          {[
            {
              level: 'info',
              msg: t(
                'aiOptimizer.alertTariffDrop',
                'Tarifabsenkung um 02:00 erwartet — EV-Ladung wird automatisch verschoben',
              ),
              icon: TrendingDown,
              color: 'text-cyan-400 border-cyan-400/20 bg-cyan-400/5',
            },
            {
              level: 'success',
              msg: t(
                'aiOptimizer.alertSelfConsumption',
                'Eigenverbrauchsquote heute bei 87% — überdurchschnittlich',
              ),
              icon: CheckCircle2,
              color: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5',
            },
            {
              level: 'warning',
              msg: t(
                'aiOptimizer.alertGridPeak',
                'Netzbezugspitze um 18:00 prognostiziert — Batterie-Entladung eingeplant',
              ),
              icon: AlertTriangle,
              color: 'text-orange-400 border-orange-400/20 bg-orange-400/5',
            },
          ].map((alert, i) => (
            <div key={i} className={`flex items-start gap-3 rounded-xl border p-3 ${alert.color}`}>
              <alert.icon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p className="text-xs sm:text-sm">{alert.msg}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ─── Existing AI Panels ──────────────────────────────────── */}
      <motion.div
        id="ai-optimizer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
        className="min-w-0"
      >
        <AIOptimizerPanel />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="min-w-0"
      >
        <EnhancedAIOptimizer />
      </motion.div>

      {/* ─── Cross-Links & Navigation ─────────────────────────── */}
      <PageCrossLinks />
    </div>
  );
}

export default AIOptimizerPageComponent;
