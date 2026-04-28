import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Battery,
  Calendar,
  Car,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Clock,
  Flame,
  Gauge,
  Leaf,
  Receipt,
  Signal,
  Sun,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { LivePriceWidget } from '../components/LivePriceWidget';
import { PageHeader } from '../components/layout/PageHeader';
import { PredictiveForecast } from '../components/PredictiveForecast';
import { PageCrossLinks } from '../components/ui/PageCrossLinks';
import { useAppStoreShallow } from '../store';

// ─── Static data (generated once, outside render) ────────────────────

const NOW = new Date();
const HOURS_48 = Array.from({ length: 48 }, (_, i) => {
  const d = new Date(NOW.getTime() + i * 3600000);
  return {
    hour: `${String(d.getHours()).padStart(2, '0')}:00`,
    day: d.getDate(),
    dayLabel: d.toLocaleDateString('de-DE', { weekday: 'short' }),
    isToday: d.getDate() === NOW.getDate(),
  };
});

/** Simulated 48h price curve with realistic day/night pattern */
const PRICE_TIMELINE = HOURS_48.map((slot, i) => {
  const h = parseInt(slot.hour, 10);
  const base = 0.18;
  const nightDip = h >= 1 && h <= 5 ? -0.08 : 0;
  const morningPeak = h >= 7 && h <= 9 ? 0.06 : 0;
  const solarDip = h >= 11 && h <= 14 ? -0.04 : 0;
  const eveningPeak = h >= 17 && h <= 20 ? 0.09 : 0;
  const noise = Math.sin(i * 1.7) * 0.015;
  const price = Math.max(0.04, base + nightDip + morningPeak + solarDip + eveningPeak + noise);
  const pvForecast = h >= 6 && h <= 20 ? Math.max(0, Math.sin(((h - 6) / 14) * Math.PI) * 7.5) : 0;
  const renewable = 35 + pvForecast * 3 + Math.sin(i / 5) * 10;
  return {
    time: slot.hour,
    label: `${slot.dayLabel} ${slot.hour}`,
    price: Math.round(price * 1000) / 1000,
    pvForecast: Math.round(pvForecast * 10) / 10,
    renewable: Math.round(Math.min(100, Math.max(0, renewable))),
    isToday: slot.isToday,
  };
});

const PRICES = PRICE_TIMELINE.map((p) => p.price);
const PRICE_MIN = Math.min(...PRICES);
const PRICE_MAX = Math.max(...PRICES);
const PRICE_AVG = PRICES.reduce((a, b) => a + b, 0) / PRICES.length;
const PRICE_SPREAD = PRICE_MAX - PRICE_MIN;

/** 7-day × 24h heatmap data */
const HEATMAP_DATA = Array.from({ length: 7 }, (_, dayIdx) => {
  const d = new Date(NOW.getTime() - (6 - dayIdx) * 86400000);
  return {
    day: d.toLocaleDateString('de-DE', { weekday: 'short' }),
    date: d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
    hours: Array.from({ length: 24 }, (__, h) => {
      const base = 0.18;
      const nightDip = h >= 1 && h <= 5 ? -0.07 : 0;
      const morningPeak = h >= 7 && h <= 9 ? 0.05 : 0;
      const solarDip = h >= 11 && h <= 14 ? -0.03 : 0;
      const eveningPeak = h >= 17 && h <= 20 ? 0.08 : 0;
      const dayNoise = Math.sin(dayIdx * 2.3 + h * 0.8) * 0.02;
      return Math.max(0.04, base + nightDip + morningPeak + solarDip + eveningPeak + dayNoise);
    }),
  };
});

/** Price distribution histogram */
const PRICE_BINS = (() => {
  const binCount = 10;
  const binWidth = (PRICE_MAX - PRICE_MIN) / binCount || 0.01;
  const bins = Array.from({ length: binCount }, (_, i) => ({
    range: `${((PRICE_MIN + i * binWidth) * 100).toFixed(1)}`,
    rangeEnd: `${((PRICE_MIN + (i + 1) * binWidth) * 100).toFixed(1)}`,
    count: 0,
    label: `${((PRICE_MIN + i * binWidth) * 100).toFixed(1)}–${((PRICE_MIN + (i + 1) * binWidth) * 100).toFixed(1)}`,
  }));
  for (const p of PRICES) {
    const idx = Math.min(Math.floor((p - PRICE_MIN) / binWidth), binCount - 1);
    bins[idx]!.count++;
  }
  return bins;
})();

/** Optimal charging windows (sorted by price) */
const CHARGE_WINDOWS = (() => {
  const windows: {
    start: string;
    end: string;
    avgPrice: number;
    savings: number;
    duration: number;
    category: 'optimal' | 'good' | 'acceptable';
    renewable: number;
  }[] = [];
  let windowStart = -1;
  const threshold = PRICE_AVG * 0.85;

  for (let i = 0; i < PRICE_TIMELINE.length; i++) {
    const p = PRICE_TIMELINE[i]!;
    if (p.price <= threshold && windowStart === -1) {
      windowStart = i;
    } else if ((p.price > threshold || i === PRICE_TIMELINE.length - 1) && windowStart !== -1) {
      const slice = PRICE_TIMELINE.slice(windowStart, i);
      const avgPrice = slice.reduce((s, x) => s + x.price, 0) / slice.length;
      const avgRenewable = slice.reduce((s, x) => s + x.renewable, 0) / slice.length;
      const savingsVsAvg = (PRICE_AVG - avgPrice) * 20; // 20 kWh assumed
      windows.push({
        start: PRICE_TIMELINE[windowStart]!.time,
        end: PRICE_TIMELINE[Math.min(i, PRICE_TIMELINE.length - 1)]!.time,
        avgPrice,
        savings: Math.max(0, savingsVsAvg),
        duration: i - windowStart,
        category:
          avgPrice < PRICE_MIN + PRICE_SPREAD * 0.2
            ? 'optimal'
            : avgPrice < PRICE_MIN + PRICE_SPREAD * 0.5
              ? 'good'
              : 'acceptable',
        renewable: Math.round(avgRenewable),
      });
      windowStart = -1;
    }
  }
  return windows.sort((a, b) => a.avgPrice - b.avgPrice).slice(0, 6);
})();

/** Device scheduling recommendations */
const DEVICE_SCHEDULES = [
  {
    device: 'ev',
    icon: 'Car',
    time: '02:00–05:00',
    price: PRICE_MIN,
    savings: 3.8,
    priority: 'high' as const,
  },
  {
    device: 'battery',
    icon: 'Battery',
    time: '01:00–06:00',
    price: PRICE_MIN + 0.01,
    savings: 2.4,
    priority: 'high' as const,
  },
  {
    device: 'heatPump',
    icon: 'Flame',
    time: '12:00–14:00',
    price: PRICE_AVG * 0.8,
    savings: 1.2,
    priority: 'medium' as const,
  },
  {
    device: 'washer',
    icon: 'Activity',
    time: '13:00–15:00',
    price: PRICE_AVG * 0.75,
    savings: 0.6,
    priority: 'low' as const,
  },
];

/** Monthly cost tracking */
const MONTHLY_DAYS = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(NOW.getFullYear(), NOW.getMonth(), i + 1);
  const baseCost = 2.2 + Math.sin(i * 0.9) * 0.8;
  const optimizedCost = baseCost * (0.7 + Math.random() * 0.15);
  return {
    day: d.toLocaleDateString('de-DE', { day: '2-digit' }),
    actual: Math.round(baseCost * 100) / 100,
    optimized: Math.round(optimizedCost * 100) / 100,
    savings: Math.round((baseCost - optimizedCost) * 100) / 100,
  };
});

const MONTHLY_TOTAL = MONTHLY_DAYS.reduce((s, d) => s + d.actual, 0);
const MONTHLY_SAVINGS = MONTHLY_DAYS.reduce((s, d) => s + d.savings, 0);

// ─── Helpers ─────────────────────────────────────────────────────────

function getPriceColor(price: number): string {
  const ratio = (price - PRICE_MIN) / (PRICE_SPREAD || 1);
  if (ratio < 0.3) return '#22c55e'; // green
  if (ratio < 0.6) return '#eab308'; // yellow
  if (ratio < 0.8) return '#f97316'; // orange
  return '#ef4444'; // red
}

function getHeatmapBg(price: number): string {
  const min = 0.04;
  const max = 0.3;
  const ratio = Math.min(1, Math.max(0, (price - min) / (max - min)));
  if (ratio < 0.2) return 'bg-emerald-500/60';
  if (ratio < 0.4) return 'bg-emerald-500/30';
  if (ratio < 0.6) return 'bg-yellow-500/30';
  if (ratio < 0.8) return 'bg-orange-500/40';
  return 'bg-red-500/50';
}

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  Car: <Car className="h-5 w-5" aria-hidden="true" />,
  Battery: <Battery className="h-5 w-5" aria-hidden="true" />,
  Flame: <Flame className="h-5 w-5" aria-hidden="true" />,
  Activity: <Activity className="h-5 w-5" aria-hidden="true" />,
};

const sectionAnim = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, type: 'spring' as const, bounce: 0.15 },
};

// ─── Component ───────────────────────────────────────────────────────

function TariffsPageComponent() {
  const { t } = useTranslation();
  // Granular selectors — only re-render when these specific fields change
  const {
    priceCurrent,
    pvYieldToday,
    chargeThreshold,
    tariffProvider,
    feedInTariff,
    monthlyBudget,
    priceAlerts,
    priceAlertThreshold,
  } = useAppStoreShallow((s) => ({
    priceCurrent: s.energyData.priceCurrent,
    pvYieldToday: s.energyData.pvYieldToday,
    chargeThreshold: s.settings.chargeThreshold ?? 0.15,
    tariffProvider: s.settings.tariffProvider,
    feedInTariff: s.settings.feedInTariff ?? 0.082,
    monthlyBudget: s.settings.monthlyBudget ?? 80,
    priceAlerts: s.settings.priceAlerts,
    priceAlertThreshold: s.settings.priceAlertThreshold ?? 0.1,
  }));
  const [expandedWindow, setExpandedWindow] = useState<number | null>(null);
  const [view48h, setView48h] = useState<'price' | 'renewable'>('price');

  const currentPrice = priceCurrent ?? 0.18;
  const isGoodPrice = currentPrice < chargeThreshold;
  const priceZone =
    currentPrice < PRICE_AVG * 0.7 ? 'low' : currentPrice < PRICE_AVG * 1.2 ? 'mid' : 'high';

  const providerLabel =
    tariffProvider === 'tibber'
      ? 'Tibber'
      : tariffProvider === 'awattar'
        ? 'aWATTar'
        : t('settings.none');

  const monthlyBudgetPct = Math.min(100, (MONTHLY_TOTAL / monthlyBudget) * 100);

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <PageHeader
        title={t('nav.tariffs', 'Tarife')}
        subtitle={t('tariffs.subtitle')}
        icon={<TrendingUp size={22} aria-hidden="true" />}
        actions={
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold text-xs ${
                tariffProvider !== 'none'
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-zinc-500/15 text-zinc-400'
              }`}
            >
              <Signal className="h-3 w-3" aria-hidden="true" />
              {providerLabel}
            </span>
            <span
              className={`price-pill text-lg ${
                priceZone === 'low'
                  ? 'text-emerald-400'
                  : priceZone === 'high'
                    ? 'text-red-400'
                    : ''
              }`}
            >
              {currentPrice.toFixed(3)} {t('units.euroPerKwh')}
            </span>
          </div>
        }
      />

      {/* ── Price Status Bar ───────────────────────────── */}
      <motion.div {...sectionAnim} className="glass-panel rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                isGoodPrice
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-orange-500/20 text-orange-400'
              }`}
            >
              <Zap className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-(--color-muted) text-sm">{t('tariffs.currentStatus')}</p>
              <p
                className={`font-semibold ${isGoodPrice ? 'text-emerald-400' : 'text-orange-400'}`}
              >
                {isGoodPrice ? t('tariffs.priceGood') : t('tariffs.priceHigh')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-(--color-muted) text-sm sm:gap-x-6">
            <span className="flex items-center gap-1.5">
              <TrendingDown className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              {t('tariffs.todayLow')}:{' '}
              <strong className="text-emerald-400">{PRICE_MIN.toFixed(3)}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Target className="h-4 w-4 text-yellow-400" aria-hidden="true" />
              {t('tariffs.todayAvg')}:{' '}
              <strong className="text-yellow-400">{PRICE_AVG.toFixed(3)}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-red-400" aria-hidden="true" />
              {t('tariffs.todayHigh')}:{' '}
              <strong className="text-red-400">{PRICE_MAX.toFixed(3)}</strong>
            </span>
          </div>
        </div>

        {/* Price position bar */}
        <div className="mt-4">
          <div className="relative h-2.5 overflow-hidden rounded-full bg-(--color-surface)">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500"
              style={{ width: '100%' }}
            />
            <motion.div
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-(--color-background) shadow-lg"
              style={{
                left: `${Math.min(100, Math.max(0, ((currentPrice - PRICE_MIN) / (PRICE_SPREAD || 1)) * 100))}%`,
              }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          </div>
          <div className="mt-1 flex justify-between text-(--color-muted) text-[10px]">
            <span>{PRICE_MIN.toFixed(2)} €</span>
            <span>{PRICE_MAX.toFixed(2)} €</span>
          </div>
        </div>
      </motion.div>

      {/* ── 6 KPI Cards ───────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          {
            label: t('tariffs.kpiCurrent'),
            value: `${currentPrice.toFixed(3)}`,
            unit: '€/kWh',
            icon: <Zap className="h-5 w-5" aria-hidden="true" />,
            color: isGoodPrice ? 'text-emerald-400' : 'text-orange-400',
            bg: isGoodPrice ? 'bg-emerald-500/10' : 'bg-orange-500/10',
          },
          {
            label: t('tariffs.kpiAvg24h'),
            value: `${PRICE_AVG.toFixed(3)}`,
            unit: '€/kWh',
            icon: <BarChart3 className="h-5 w-5" aria-hidden="true" />,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
          },
          {
            label: t('tariffs.kpiLow'),
            value: `${PRICE_MIN.toFixed(3)}`,
            unit: '€/kWh',
            icon: <TrendingDown className="h-5 w-5" aria-hidden="true" />,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
          },
          {
            label: t('tariffs.kpiHigh'),
            value: `${PRICE_MAX.toFixed(3)}`,
            unit: '€/kWh',
            icon: <TrendingUp className="h-5 w-5" aria-hidden="true" />,
            color: 'text-red-400',
            bg: 'bg-red-500/10',
          },
          {
            label: t('tariffs.kpiSpread'),
            value: `${(PRICE_SPREAD * 100).toFixed(1)}`,
            unit: 'ct',
            icon: <Activity className="h-5 w-5" aria-hidden="true" />,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
          },
          {
            label: t('tariffs.kpiFeedIn'),
            value: `${feedInTariff.toFixed(3)}`,
            unit: '€/kWh',
            icon: <Sun className="h-5 w-5" aria-hidden="true" />,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            className="glass-panel-strong hover-lift rounded-2xl p-4"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.05 * i, type: 'spring', bounce: 0.2 }}
          >
            <div
              className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${kpi.bg} ${kpi.color}`}
            >
              {kpi.icon}
            </div>
            <p className="truncate text-(--color-muted) text-xs">{kpi.label}</p>
            <p className={`mt-0.5 truncate font-bold text-xl tabular-nums ${kpi.color}`}>
              {kpi.value}
            </p>
            <p className="text-(--color-muted) text-[10px]">{kpi.unit}</p>
          </motion.div>
        ))}
      </div>

      {/* ── 48h Price Timeline ─────────────────────────── */}
      <motion.section
        className="glass-panel-strong hover-lift p-6"
        {...sectionAnim}
        transition={{ ...sectionAnim.transition, delay: 0.15 }}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="fluid-text-lg font-semibold text-(--color-text)">
              <Clock className="mr-2 inline h-5 w-5 text-(--color-primary)" aria-hidden="true" />
              {t('tariffs.timeline48h')}
            </h2>
            <p className="mt-0.5 text-(--color-muted) text-sm">{t('tariffs.timelineDesc')}</p>
          </div>
          <div className="flex gap-2">
            {(['price', 'renewable'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView48h(v)}
                className={`focus-ring rounded-lg px-3 py-1.5 font-medium text-xs transition-colors ${
                  view48h === v
                    ? 'bg-(--color-primary) text-(--color-on-primary)'
                    : 'bg-(--color-surface) text-(--color-muted) hover:bg-white/10'
                }`}
                aria-pressed={view48h === v}
              >
                {v === 'price' ? t('tariffs.viewPrice') : t('tariffs.viewRenewable')}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72" role="img" aria-label={t('tariffs.timelineAria')}>
          <ResponsiveContainer width="100%" height="100%">
            {view48h === 'price' ? (
              <BarChart data={PRICE_TIMELINE} barCategoryGap="8%">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  dataKey="time"
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  interval={3}
                />
                <YAxis
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  tickFormatter={(v: number) => `${(v * 100).toFixed(0)}`}
                  label={{
                    value: 'ct/kWh',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#9ca3af',
                    fontSize: 10,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                  }}
                  formatter={(value: unknown) => [`${(Number(value) * 100).toFixed(2)} ct/kWh`]}
                  labelFormatter={(label: unknown) => `${label}`}
                />
                <ReferenceLine
                  y={PRICE_AVG}
                  stroke="#eab308"
                  strokeDasharray="6 4"
                  label={{ value: 'Ø', fill: '#eab308', fontSize: 11, position: 'right' }}
                />
                <ReferenceLine
                  y={chargeThreshold}
                  stroke="#22c55e"
                  strokeDasharray="3 3"
                  label={{ value: '⚡', fill: '#22c55e', fontSize: 11, position: 'left' }}
                />
                <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                  {PRICE_TIMELINE.map((entry) => (
                    <Cell
                      key={entry.time}
                      fill={getPriceColor(entry.price)}
                      fillOpacity={entry.isToday ? 1 : 0.5}
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <AreaChart data={PRICE_TIMELINE}>
                <defs>
                  <linearGradient id="renewGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  dataKey="time"
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  interval={3}
                />
                <YAxis
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  label={{
                    value: '%',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#9ca3af',
                    fontSize: 10,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                  }}
                  formatter={(value: unknown) => [`${Number(value).toFixed(0)} %`]}
                />
                <Area
                  type="monotone"
                  dataKey="renewable"
                  stroke="#22c55e"
                  fill="url(#renewGrad)"
                  strokeWidth={2}
                  name={t('tariffs.renewableShare')}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-(--color-muted) text-xs">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />{' '}
            {t('tariffs.legendCheap')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-500" />{' '}
            {t('tariffs.legendMid')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />{' '}
            {t('tariffs.legendExpensive')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 border-yellow-500 border-t-2 border-dashed" />{' '}
            {t('tariffs.legendAvg')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 border-emerald-500 border-t-2 border-dashed" />{' '}
            {t('tariffs.legendThreshold')}
          </span>
        </div>
      </motion.section>

      {/* ── Price Heatmap (7d × 24h) ──────────────────── */}
      <motion.section
        className="glass-panel-strong hover-lift p-6"
        {...sectionAnim}
        transition={{ ...sectionAnim.transition, delay: 0.2 }}
      >
        <h2 className="fluid-text-lg mb-1 font-semibold text-(--color-text)">
          <Calendar className="mr-2 inline h-5 w-5 text-(--color-primary)" aria-hidden="true" />
          {t('tariffs.heatmapTitle')}
        </h2>
        <p className="mb-4 text-(--color-muted) text-sm">{t('tariffs.heatmapDesc')}</p>

        <div className="overflow-x-auto">
          {/* biome-ignore lint/a11y/useSemanticElements: heatmap uses flexbox layout incompatible with HTML table element */}
          <div className="min-w-[700px]" role="table" aria-label={t('tariffs.heatmapAria')}>
            {/* Column headers (rowgroup → row → columnheader required by ARIA table pattern) */}
            <div role="rowgroup">
              <div role="row" className="mb-1 flex">
                <div
                  role="columnheader"
                  className="w-16 shrink-0"
                  aria-label={t('tariffs.day', 'Day')}
                />
                {Array.from({ length: 24 }, (_, h) => h).map((h) => (
                  <div
                    key={`hour-label-${h}`}
                    role="columnheader"
                    className="flex-1 text-center text-(--color-muted) text-[9px]"
                    aria-label={`${String(h).padStart(2, '0')}:00`}
                  >
                    {h % 3 === 0 ? `${String(h).padStart(2, '0')}` : ''}
                  </div>
                ))}
              </div>
            </div>

            {/* Data rows */}
            <div role="rowgroup">
              {HEATMAP_DATA.map((row) => (
                <div key={row.date} role="row" className="mb-0.5 flex items-center">
                  <div
                    role="rowheader"
                    className="w-16 shrink-0 pr-2 text-right text-(--color-muted) text-[10px]"
                  >
                    {row.day} {row.date}
                  </div>
                  {row.hours
                    .map((price, h) => ({ price, h }))
                    .map(({ price, h }) => (
                      <div
                        key={`${row.date}-${h}`}
                        role="cell"
                        className={`mx-px h-5 flex-1 rounded-sm transition-all hover:scale-110 hover:ring-1 hover:ring-white/30 ${getHeatmapBg(price)}`}
                        title={`${row.day} ${String(h).padStart(2, '0')}:00 — ${(price * 100).toFixed(1)} ct/kWh`}
                      />
                    ))}
                </div>
              ))}
            </div>

            {/* Heatmap legend */}
            <div className="mt-3 flex items-center gap-2 text-(--color-muted) text-[10px]">
              <span>{t('tariffs.cheap')}</span>
              <div className="flex gap-0.5">
                <span className="inline-block h-3 w-5 rounded-sm bg-emerald-500/60" />
                <span className="inline-block h-3 w-5 rounded-sm bg-emerald-500/30" />
                <span className="inline-block h-3 w-5 rounded-sm bg-yellow-500/30" />
                <span className="inline-block h-3 w-5 rounded-sm bg-orange-500/40" />
                <span className="inline-block h-3 w-5 rounded-sm bg-red-500/50" />
              </div>
              <span>{t('tariffs.expensive')}</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Optimal Charging Windows ───────────────────── */}
      <motion.section
        className="glass-panel-strong hover-lift p-6"
        {...sectionAnim}
        transition={{ ...sectionAnim.transition, delay: 0.25 }}
      >
        <h2 className="fluid-text-lg mb-1 font-semibold text-(--color-text)">
          <CheckCircle2 className="mr-2 inline h-5 w-5 text-emerald-400" aria-hidden="true" />
          {t('tariffs.windowsTitle')}
        </h2>
        <p className="mb-4 text-(--color-muted) text-sm">{t('tariffs.windowsDesc')}</p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CHARGE_WINDOWS.map((win, i) => (
            <motion.button
              key={`${win.start}-${win.end}`}
              className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all ${
                win.category === 'optimal'
                  ? 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10'
                  : win.category === 'good'
                    ? 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10'
                    : 'border-zinc-500/20 bg-zinc-500/5 hover:bg-zinc-500/10'
              }`}
              onClick={() => setExpandedWindow(expandedWindow === i ? null : i)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Category badge */}
              <span
                className={`absolute top-3 right-3 rounded-full px-2 py-0.5 font-bold text-[10px] uppercase ${
                  win.category === 'optimal'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : win.category === 'good'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-zinc-500/20 text-zinc-400'
                }`}
              >
                {win.category === 'optimal'
                  ? t('tariffs.catOptimal')
                  : win.category === 'good'
                    ? t('tariffs.catGood')
                    : t('tariffs.catAcceptable')}
              </span>

              <p className="font-semibold text-(--color-text) text-lg">
                {win.start} – {win.end}
              </p>
              <p className="mt-1 text-(--color-muted) text-sm tabular-nums">
                Ø {(win.avgPrice * 100).toFixed(1)} ct/kWh · {win.duration}h
              </p>

              <AnimatePresence>
                {expandedWindow === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 grid grid-cols-2 gap-2 border-(--color-border) border-t pt-3">
                      <div>
                        <p className="text-(--color-muted) text-[10px]">
                          {t('tariffs.potentialSavings')}
                        </p>
                        <p className="font-semibold text-emerald-400">€{win.savings.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-(--color-muted) text-[10px]">
                          {t('tariffs.renewableShare')}
                        </p>
                        <p className="font-semibold text-green-400">{win.renewable}%</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <ChevronDown
                className={`absolute right-3 bottom-3 h-4 w-4 text-(--color-muted) transition-transform ${
                  expandedWindow === i ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* ── Smart Device Scheduling + Price Distribution ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Device Scheduling */}
        <motion.section
          className="glass-panel-strong hover-lift cv-auto p-6"
          {...sectionAnim}
          transition={{ ...sectionAnim.transition, delay: 0.3 }}
        >
          <h2 className="fluid-text-lg mb-1 font-semibold text-(--color-text)">
            <Gauge className="mr-2 inline h-5 w-5 text-(--color-primary)" aria-hidden="true" />
            {t('tariffs.scheduleTitle')}
          </h2>
          <p className="mb-4 text-(--color-muted) text-sm">{t('tariffs.scheduleDesc')}</p>

          <div className="space-y-3">
            {DEVICE_SCHEDULES.map((sched) => (
              <div
                key={`${sched.device}-${sched.time}`}
                className="flex items-center gap-4 rounded-2xl border border-(--color-border) bg-(--color-surface)/50 p-3"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    sched.priority === 'high'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : sched.priority === 'medium'
                        ? 'bg-blue-500/15 text-blue-400'
                        : 'bg-zinc-500/15 text-zinc-400'
                  }`}
                >
                  {DEVICE_ICONS[sched.icon]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-(--color-text) text-sm">
                    {t(`tariffs.device_${sched.device}`)}
                  </p>
                  <p className="text-(--color-muted) text-xs">
                    {sched.time} · {(sched.price * 100).toFixed(1)} ct/kWh
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-emerald-400 text-sm">
                    -€{sched.savings.toFixed(2)}
                  </p>
                  <p
                    className={`font-bold text-[10px] uppercase ${
                      sched.priority === 'high'
                        ? 'text-emerald-400'
                        : sched.priority === 'medium'
                          ? 'text-blue-400'
                          : 'text-zinc-400'
                    }`}
                  >
                    {t(`tariffs.priority_${sched.priority}`)}
                  </p>
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-(--color-primary)/20 bg-(--color-primary)/5 p-3 text-center">
              <p className="font-medium text-(--color-primary) text-sm">
                {t('tariffs.totalDailySavings')}: €
                {DEVICE_SCHEDULES.reduce((s, d) => s + d.savings, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </motion.section>

        {/* Price Distribution */}
        <motion.section
          className="glass-panel-strong hover-lift cv-auto p-6"
          {...sectionAnim}
          transition={{ ...sectionAnim.transition, delay: 0.35 }}
        >
          <h2 className="fluid-text-lg mb-1 font-semibold text-(--color-text)">
            <BarChart3 className="mr-2 inline h-5 w-5 text-purple-400" aria-hidden="true" />
            {t('tariffs.distributionTitle')}
          </h2>
          <p className="mb-4 text-(--color-muted) text-sm">{t('tariffs.distributionDesc')}</p>

          <div className="h-56" role="img" aria-label={t('tariffs.distributionAria')}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PRICE_BINS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  dataKey="range"
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 9 }}
                  label={{
                    value: 'ct/kWh',
                    position: 'insideBottom',
                    fill: '#9ca3af',
                    fontSize: 10,
                    offset: -2,
                  }}
                />
                <YAxis
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  label={{
                    value: '#',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#9ca3af',
                    fontSize: 10,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                  }}
                  formatter={(value: unknown) => [`${value} ${t('tariffs.hours')}`]}
                  labelFormatter={(label: unknown) => `${label} ct/kWh`}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {PRICE_BINS.map((entry) => (
                    <Cell
                      key={entry.range}
                      fill={getPriceColor(parseFloat(entry.range) / 100)}
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.section>
      </div>

      {/* ── Monthly Cost Tracker ──────────────────────── */}
      <motion.section
        className="glass-panel-strong hover-lift cv-auto-lg p-6"
        {...sectionAnim}
        transition={{ ...sectionAnim.transition, delay: 0.4 }}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="fluid-text-lg font-semibold text-(--color-text)">
              <Wallet className="mr-2 inline h-5 w-5 text-amber-400" aria-hidden="true" />
              {t('tariffs.monthlyCostTitle')}
            </h2>
            <p className="mt-0.5 text-(--color-muted) text-sm">{t('tariffs.monthlyCostDesc')}</p>
          </div>

          {/* Budget gauge */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-(--color-muted) text-xs">{t('tariffs.budgetUsed')}</p>
              <p className="font-bold text-(--color-text) text-lg tabular-nums">
                €{MONTHLY_TOTAL.toFixed(2)}
                <span className="font-normal text-(--color-muted) text-sm">
                  {' '}
                  / €{monthlyBudget}
                </span>
              </p>
            </div>
            <div className="relative h-12 w-12">
              <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
                <title>{t('tariffs.budgetProgress', 'Monthly budget progress')}</title>
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="currentColor"
                  className="text-(--color-surface)"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke={
                    monthlyBudgetPct > 90
                      ? '#ef4444'
                      : monthlyBudgetPct > 70
                        ? '#eab308'
                        : '#22c55e'
                  }
                  strokeWidth="3"
                  strokeDasharray={`${monthlyBudgetPct} ${100 - monthlyBudgetPct}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-bold text-(--color-text) text-[9px]">
                {Math.round(monthlyBudgetPct)}%
              </span>
            </div>
          </div>
        </div>

        <div className="h-52" role="img" aria-label={t('tariffs.monthlyCostAria')}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MONTHLY_DAYS}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="day" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <YAxis
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                tickFormatter={(v: number) => `€${v.toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  color: '#e2e8f0',
                }}
                formatter={(value: unknown, name: unknown) => [
                  `€${Number(value).toFixed(2)}`,
                  name === 'actual'
                    ? t('tariffs.costActual')
                    : name === 'optimized'
                      ? t('tariffs.costOptimized')
                      : t('tariffs.costSavings'),
                ]}
              />
              <Bar
                dataKey="actual"
                fill="#f97316"
                radius={[4, 4, 0, 0]}
                opacity={0.6}
                name="actual"
              />
              <Bar dataKey="optimized" fill="#22c55e" radius={[4, 4, 0, 0]} name="optimized" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary cards */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-(--color-surface) p-3">
            <p className="text-(--color-muted) text-[10px]">{t('tariffs.costActual')}</p>
            <p className="font-bold text-lg text-orange-400">€{MONTHLY_TOTAL.toFixed(2)}</p>
          </div>
          <div className="rounded-xl bg-(--color-surface) p-3">
            <p className="text-(--color-muted) text-[10px]">{t('tariffs.costOptimized')}</p>
            <p className="font-bold text-emerald-400 text-lg">
              €{(MONTHLY_TOTAL - MONTHLY_SAVINGS).toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl bg-(--color-surface) p-3">
            <p className="text-(--color-muted) text-[10px]">{t('tariffs.costSavings')}</p>
            <p className="font-bold text-green-400 text-lg">€{MONTHLY_SAVINGS.toFixed(2)}</p>
          </div>
          <div className="rounded-xl bg-(--color-surface) p-3">
            <p className="text-(--color-muted) text-[10px]">{t('tariffs.costProjected')}</p>
            <p className="font-bold text-(--color-text) text-lg">
              €{((MONTHLY_TOTAL / Math.max(1, NOW.getDate())) * 30).toFixed(0)}
            </p>
          </div>
        </div>
      </motion.section>

      {/* ── Feed-in Revenue + Provider Info ────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Feed-in Revenue Panel */}
        <motion.section
          className="glass-panel-strong hover-lift cv-auto-sm p-6"
          {...sectionAnim}
          transition={{ ...sectionAnim.transition, delay: 0.45 }}
        >
          <h2 className="fluid-text-lg mb-4 font-semibold text-(--color-text)">
            <Receipt className="mr-2 inline h-5 w-5 text-amber-400" aria-hidden="true" />
            {t('tariffs.feedInTitle')}
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-amber-500/10 p-4">
              <div>
                <p className="text-(--color-muted) text-sm">{t('tariffs.feedInRate')}</p>
                <p className="font-bold text-2xl text-amber-400">
                  {(feedInTariff * 100).toFixed(1)}{' '}
                  <span className="font-normal text-sm">ct/kWh</span>
                </p>
              </div>
              <Sun className="h-10 w-10 text-amber-400/40" aria-hidden="true" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-(--color-surface) p-3">
                <p className="text-(--color-muted) text-[10px]">{t('tariffs.feedInToday')}</p>
                <p className="font-bold text-amber-400 text-lg">
                  €{(pvYieldToday * feedInTariff).toFixed(2)}
                </p>
                <p className="text-(--color-muted) text-[10px]">{pvYieldToday.toFixed(1)} kWh</p>
              </div>
              <div className="rounded-xl bg-(--color-surface) p-3">
                <p className="text-(--color-muted) text-[10px]">{t('tariffs.feedInMonthly')}</p>
                <p className="font-bold text-amber-400 text-lg">
                  €{(pvYieldToday * feedInTariff * 30 * 0.4).toFixed(2)}
                </p>
                <p className="text-(--color-muted) text-[10px]">{t('tariffs.estimated')}</p>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-center">
              <p className="text-(--color-muted) text-xs">{t('tariffs.feedInAnnual')}</p>
              <p className="font-bold text-amber-400 text-xl">
                €{(pvYieldToday * feedInTariff * 365 * 0.4).toFixed(0)}
              </p>
            </div>
          </div>
        </motion.section>

        {/* Provider Info Panel */}
        <motion.section
          className="glass-panel-strong hover-lift cv-auto-sm p-6"
          {...sectionAnim}
          transition={{ ...sectionAnim.transition, delay: 0.5 }}
        >
          <h2 className="fluid-text-lg mb-4 font-semibold text-(--color-text)">
            <Signal className="mr-2 inline h-5 w-5 text-(--color-primary)" aria-hidden="true" />
            {t('tariffs.providerTitle')}
          </h2>

          <div className="space-y-4">
            {/* Active provider */}
            <div className="rounded-2xl border border-(--color-primary)/20 bg-(--color-primary)/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-(--color-muted) text-sm">{t('tariffs.activeProvider')}</p>
                  <p className="font-bold text-(--color-text) text-xl">{providerLabel}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                  <CircleDot className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-emerald-400 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                {t('tariffs.apiConnected')}
              </div>
            </div>

            {/* Provider stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-(--color-surface) p-3">
                <p className="text-(--color-muted) text-[10px]">{t('tariffs.updateFreq')}</p>
                <p className="font-semibold text-(--color-text)">{t('tariffs.hourly')}</p>
              </div>
              <div className="rounded-xl bg-(--color-surface) p-3">
                <p className="text-(--color-muted) text-[10px]">{t('tariffs.dataPoints')}</p>
                <p className="font-semibold text-(--color-text)">48h</p>
              </div>
              <div className="rounded-xl bg-(--color-surface) p-3">
                <p className="text-(--color-muted) text-[10px]">{t('tariffs.priceModel')}</p>
                <p className="font-semibold text-(--color-text)">{t('tariffs.spotMarket')}</p>
              </div>
              <div className="rounded-xl bg-(--color-surface) p-3">
                <p className="text-(--color-muted) text-[10px]">{t('tariffs.chargeThreshold')}</p>
                <p className="font-semibold text-emerald-400">
                  {(chargeThreshold * 100).toFixed(1)} ct
                </p>
              </div>
            </div>

            {/* Alert config */}
            <div
              className={`flex items-center gap-3 rounded-xl p-3 ${
                priceAlerts ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'
              }`}
            >
              {priceAlerts ? (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              )}
              <span className="text-sm">
                {priceAlerts ? t('tariffs.alertsActive') : t('tariffs.alertsInactive')}
              </span>
              {priceAlerts && (
                <span className="ml-auto font-medium text-xs">
                  &lt; {(priceAlertThreshold * 100).toFixed(0)} ct
                </span>
              )}
            </div>
          </div>
        </motion.section>
      </div>

      {/* ── Live Price Widget ──────────────────────────── */}
      <motion.div {...sectionAnim} transition={{ ...sectionAnim.transition, delay: 0.55 }}>
        <ErrorBoundary>
          <LivePriceWidget />
        </ErrorBoundary>
      </motion.div>

      {/* ── Predictive Forecast ────────────────────────── */}
      <motion.div {...sectionAnim} transition={{ ...sectionAnim.transition, delay: 0.6 }}>
        <ErrorBoundary>
          <PredictiveForecast />
        </ErrorBoundary>
      </motion.div>

      {/* ── Insights Summary ──────────────────────────── */}
      <motion.section
        className="glass-panel p-6"
        {...sectionAnim}
        transition={{ ...sectionAnim.transition, delay: 0.65 }}
      >
        <h2 className="fluid-text-lg mb-4 font-semibold text-(--color-text)">
          <Leaf className="mr-2 inline h-5 w-5 text-green-400" aria-hidden="true" />
          {t('tariffs.insightsTitle')}
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              <span className="font-medium text-emerald-400 text-sm">
                {t('tariffs.insightSavings')}
              </span>
            </div>
            <p className="text-(--color-muted) text-sm">{t('tariffs.insightSavingsText')}</p>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Sun className="h-4 w-4 text-blue-400" aria-hidden="true" />
              <span className="font-medium text-blue-400 text-sm">{t('tariffs.insightSolar')}</span>
            </div>
            <p className="text-(--color-muted) text-sm">{t('tariffs.insightSolarText')}</p>
          </div>

          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-purple-400" aria-hidden="true" />
              <span className="font-medium text-purple-400 text-sm">{t('tariffs.insightTip')}</span>
            </div>
            <p className="text-(--color-muted) text-sm">{t('tariffs.insightTipText')}</p>
          </div>
        </div>
      </motion.section>

      {/* ─── Cross-Links & Navigation ─────────────────────────── */}
      <PageCrossLinks />
    </div>
  );
}

export default TariffsPageComponent;
