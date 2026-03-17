import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import {
  Database,
  Clock,
  TrendingUp,
  Activity,
  Sun,
  Battery,
  Zap,
  CloudSun,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  BrainCircuit,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Brush,
  ComposedChart,
} from 'recharts';
import { PageHeader } from '../components/layout/PageHeader';
import { PageCrossLinks } from '../components/ui/PageCrossLinks';
import { useAppStoreShallow } from '../store';
import { type AIForecastRecord } from '../lib/db';
import { checkInfluxHealth, queryTimeSeries, type InfluxConfig } from '../lib/influxdb-client';
import { getForecastHistory, syncPendingForecasts } from '../lib/ai-forecast-persistence';

// ─── Time Range Options ─────────────────────────────────────────────

type TimeRange = '24h' | '7d' | '30d' | '90d' | '365d';

const TIME_RANGES: { value: TimeRange; labelKey: string }[] = [
  { value: '24h', labelKey: 'historicalAnalytics.range24h' },
  { value: '7d', labelKey: 'historicalAnalytics.range7d' },
  { value: '30d', labelKey: 'historicalAnalytics.range30d' },
  { value: '90d', labelKey: 'historicalAnalytics.range90d' },
  { value: '365d', labelKey: 'historicalAnalytics.range365d' },
];

const AGGREGATE_WINDOWS: Record<TimeRange, string> = {
  '24h': '15m',
  '7d': '1h',
  '30d': '6h',
  '90d': '1d',
  '365d': '7d',
};

// ─── Demo Data Generators ───────────────────────────────────────────

function generateDemoTimeSeries(range: TimeRange) {
  const now = Date.now();
  const counts: Record<TimeRange, number> = {
    '24h': 96,
    '7d': 168,
    '30d': 120,
    '90d': 90,
    '365d': 52,
  };
  const intervals: Record<TimeRange, number> = {
    '24h': 15 * 60_000,
    '7d': 3600_000,
    '30d': 6 * 3600_000,
    '90d': 86400_000,
    '365d': 7 * 86400_000,
  };
  const n = counts[range];
  const interval = intervals[range];

  return Array.from({ length: n }, (_, i) => {
    const ts = now - (n - i) * interval;
    const hour = new Date(ts).getHours();
    const sunFactor = hour >= 6 && hour <= 20 ? Math.sin(((hour - 6) / 14) * Math.PI) : 0;
    const seasonal = 0.6 + 0.4 * Math.sin((new Date(ts).getMonth() / 12) * 2 * Math.PI);
    return {
      timestamp: ts,
      time: formatTimestamp(ts, range),
      pvPower: Math.round(5200 * sunFactor * seasonal * (0.85 + Math.random() * 0.3)),
      gridPower: Math.round(-400 + Math.random() * 2000 - 1500 * sunFactor),
      batteryPower: Math.round((Math.random() - 0.5) * 3000),
      houseLoad: Math.round(800 + Math.random() * 1500 + (hour >= 17 && hour <= 21 ? 800 : 0)),
      batterySoC: Math.round(20 + Math.random() * 70),
    };
  });
}

function generateDemoForecasts(): AIForecastRecord[] {
  const now = Date.now();
  return Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    metric: ['pvPower', 'houseLoad', 'gridPower'][i % 3],
    model: i % 2 === 0 ? 'holt-winters' : 'linear-regression',
    createdAt: now - i * 3600_000 * 6,
    horizonHours: 24,
    accuracy: {
      mae: 80 + Math.random() * 120,
      mape: 5 + Math.random() * 15,
      rmse: 100 + Math.random() * 150,
      r2: 0.75 + Math.random() * 0.2,
    },
    points: Array.from({ length: 24 }, (__, h) => ({
      timestamp: now - i * 3600_000 * 6 + h * 3600_000,
      value: 1000 + Math.random() * 3000,
      lower: 800 + Math.random() * 2500,
      upper: 1200 + Math.random() * 3500,
    })),
    persistedToInflux: i < 5,
  }));
}

function formatTimestamp(ts: number, range: TimeRange): string {
  const d = new Date(ts);
  if (range === '24h') return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  if (range === '7d') return d.toLocaleDateString('de-DE', { weekday: 'short', hour: '2-digit' });
  if (range === '30d') return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  if (range === '90d') return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
  return d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
}

// ─── Component ──────────────────────────────────────────────────────

export default function HistoricalAnalyticsPage() {
  const { t } = useTranslation();
  const { influxUrl, influxToken } = useAppStoreShallow((s) => ({
    influxUrl: s.settings.influxUrl,
    influxToken: s.settings.influxToken,
  }));

  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [influxHealthy, setInfluxHealthy] = useState<boolean | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<ReturnType<typeof generateDemoTimeSeries>>(
    [],
  );
  const [forecastHistory, setForecastHistory] = useState<AIForecastRecord[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const influxConfig: InfluxConfig | null =
    influxUrl && influxToken && influxToken !== '••••••••••••••••'
      ? { url: influxUrl, token: influxToken }
      : null;

  // ─── Load data ──────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    const config: InfluxConfig | null =
      influxUrl && influxToken && influxToken !== '••••••••••••••••'
        ? { url: influxUrl, token: influxToken }
        : null;

    async function loadData() {
      setIsLoading(true);

      // Check InfluxDB health
      if (config) {
        const healthy = await checkInfluxHealth(config);
        if (!cancelled) setInfluxHealthy(healthy);

        if (healthy) {
          // Try loading real data from InfluxDB
          try {
            const [pv, grid, battery, house, soc] = await Promise.all([
              queryTimeSeries(
                config,
                'pvPower',
                { start: `-${timeRange}` },
                AGGREGATE_WINDOWS[timeRange],
              ),
              queryTimeSeries(
                config,
                'gridPower',
                { start: `-${timeRange}` },
                AGGREGATE_WINDOWS[timeRange],
              ),
              queryTimeSeries(
                config,
                'batteryPower',
                { start: `-${timeRange}` },
                AGGREGATE_WINDOWS[timeRange],
              ),
              queryTimeSeries(
                config,
                'houseLoad',
                { start: `-${timeRange}` },
                AGGREGATE_WINDOWS[timeRange],
              ),
              queryTimeSeries(
                config,
                'batterySoC',
                { start: `-${timeRange}` },
                AGGREGATE_WINDOWS[timeRange],
                'mean',
              ),
            ]);

            if (pv.points.length > 0 && !cancelled) {
              const merged = pv.points.map((p, i) => ({
                timestamp: p.timestamp,
                time: formatTimestamp(p.timestamp, timeRange),
                pvPower: Math.round(p.value),
                gridPower: Math.round(grid.points[i]?.value ?? 0),
                batteryPower: Math.round(battery.points[i]?.value ?? 0),
                houseLoad: Math.round(house.points[i]?.value ?? 0),
                batterySoC: Math.round(soc.points[i]?.value ?? 50),
              }));
              setTimeSeriesData(merged);
              setIsLoading(false);

              // Load forecast history from Dexie
              const forecasts = await getForecastHistory(undefined, 20);
              if (!cancelled) setForecastHistory(forecasts);
              return;
            }
          } catch {
            // Fall through to demo data
          }
        }
      } else {
        if (!cancelled) setInfluxHealthy(null);
      }

      // Fallback: demo data
      if (!cancelled) {
        setTimeSeriesData(generateDemoTimeSeries(timeRange));

        // Try loading real forecast history from Dexie first
        try {
          const forecasts = await getForecastHistory(undefined, 20);
          if (!cancelled)
            setForecastHistory(forecasts.length > 0 ? forecasts : generateDemoForecasts());
        } catch {
          if (!cancelled) setForecastHistory(generateDemoForecasts());
        }

        setIsLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [timeRange, influxUrl, influxToken]);

  // ─── Sync unsynced forecasts to InfluxDB ────────────────────────

  async function handleSync() {
    if (!influxConfig || syncing) return;
    setSyncing(true);
    setSyncResult(null);
    const count = await syncPendingForecasts(influxConfig);
    setSyncResult(count);
    setSyncing(false);

    // Refresh forecast history
    const forecasts = await getForecastHistory(undefined, 20);
    setForecastHistory(forecasts);
  }

  // ─── Summary Stats ─────────────────────────────────────────────

  const avgPv =
    timeSeriesData.length > 0
      ? Math.round(timeSeriesData.reduce((s, d) => s + d.pvPower, 0) / timeSeriesData.length)
      : 0;
  const avgLoad =
    timeSeriesData.length > 0
      ? Math.round(timeSeriesData.reduce((s, d) => s + d.houseLoad, 0) / timeSeriesData.length)
      : 0;
  const peakPv = timeSeriesData.length > 0 ? Math.max(...timeSeriesData.map((d) => d.pvPower)) : 0;
  const avgSoC =
    timeSeriesData.length > 0
      ? Math.round(timeSeriesData.reduce((s, d) => s + d.batterySoC, 0) / timeSeriesData.length)
      : 0;

  const unsyncedCount = forecastHistory.filter((f) => !f.persistedToInflux).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('historicalAnalytics.title')}
        subtitle={t('historicalAnalytics.subtitle')}
        icon={<Database size={28} />}
      />

      {/* ── Connection Status + Time Range Selector ──────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* InfluxDB Status */}
        <div className="flex items-center gap-2">
          {influxHealthy === true && (
            <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
              <CheckCircle size={14} />
              {t('historicalAnalytics.influxConnected')}
            </span>
          )}
          {influxHealthy === false && (
            <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
              <AlertCircle size={14} />
              {t('historicalAnalytics.influxDisconnected')}
            </span>
          )}
          {influxHealthy === null && (
            <span className="flex items-center gap-1.5 rounded-full bg-(--color-border)/30 px-3 py-1 text-xs font-medium text-(--color-muted)">
              <Database size={14} />
              {t('historicalAnalytics.influxNotConfigured')}
            </span>
          )}
        </div>

        {/* Time Range Buttons */}
        <div
          className="flex gap-1 rounded-lg bg-(--color-surface)/50 p-1"
          role="radiogroup"
          aria-label={t('historicalAnalytics.selectRange')}
        >
          {TIME_RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setTimeRange(r.value)}
              role="radio"
              aria-checked={timeRange === r.value}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                timeRange === r.value
                  ? 'bg-(--color-primary) text-white shadow-sm'
                  : 'text-(--color-muted) hover:text-(--color-text)'
              }`}
            >
              {t(r.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Summary Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: t('historicalAnalytics.avgPvPower'),
            value: `${avgPv} W`,
            icon: <Sun size={18} />,
            color: 'text-yellow-400',
          },
          {
            label: t('historicalAnalytics.avgHouseLoad'),
            value: `${avgLoad} W`,
            icon: <Zap size={18} />,
            color: 'text-blue-400',
          },
          {
            label: t('historicalAnalytics.peakPv'),
            value: `${peakPv} W`,
            icon: <TrendingUp size={18} />,
            color: 'text-green-400',
          },
          {
            label: t('historicalAnalytics.avgBatterySoC'),
            value: `${avgSoC}%`,
            icon: <Battery size={18} />,
            color: 'text-purple-400',
          },
        ].map((card) => (
          <motion.div
            key={card.label}
            className="glass-panel rounded-xl p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2">
              <span className={card.color}>{card.icon}</span>
              <span className="text-xs text-(--color-muted)">{card.label}</span>
            </div>
            <p className="mt-1 text-xl font-bold text-(--color-text)">
              {isLoading ? '...' : card.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ── Energy Overview Chart (Composed) ─────────────────────── */}
      <motion.section
        className="glass-panel rounded-xl p-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-(--color-text)">
          <Activity size={20} className="text-(--color-primary)" />
          {t('historicalAnalytics.energyOverview')}
        </h2>
        <div
          className="h-72 sm:h-80"
          role="img"
          aria-label={t('historicalAnalytics.energyOverviewAria')}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={timeSeriesData}
              margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#facc15" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#facc15" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
              <XAxis
                dataKey="time"
                stroke="var(--color-muted)"
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis stroke="var(--color-muted)" tick={{ fontSize: 10 }} unit=" W" />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-text)',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area
                type="monotone"
                dataKey="pvPower"
                name={t('historicalAnalytics.pvPower')}
                stroke="#facc15"
                fill="url(#pvGrad)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="houseLoad"
                name={t('historicalAnalytics.houseLoad')}
                stroke="#3b82f6"
                fill="url(#loadGrad)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="gridPower"
                name={t('historicalAnalytics.gridPower')}
                stroke="#ef4444"
                strokeWidth={1.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="batteryPower"
                name={t('historicalAnalytics.batteryPower')}
                stroke="#a855f7"
                strokeWidth={1.5}
                dot={false}
              />
              {timeSeriesData.length > 50 && (
                <Brush dataKey="time" height={20} stroke="var(--color-primary)" />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      {/* ── Battery SoC History ───────────────────────────────────── */}
      <motion.section
        className="glass-panel rounded-xl p-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-(--color-text)">
          <Battery size={20} className="text-purple-400" />
          {t('historicalAnalytics.batterySoCHistory')}
        </h2>
        <div
          className="h-56 sm:h-64"
          role="img"
          aria-label={t('historicalAnalytics.batterySoCAria')}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeriesData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="socGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
              <XAxis
                dataKey="time"
                stroke="var(--color-muted)"
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="var(--color-muted)"
                tick={{ fontSize: 10 }}
                domain={[0, 100]}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-text)',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="batterySoC"
                name={t('historicalAnalytics.batterySoC')}
                stroke="#a855f7"
                fill="url(#socGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      {/* ── AI Forecast History ───────────────────────────────────── */}
      <motion.section
        className="glass-panel rounded-xl p-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-(--color-text)">
            <BrainCircuit size={20} className="text-(--color-neon-green)" />
            {t('historicalAnalytics.aiForecastHistory')}
          </h2>
          <div className="flex items-center gap-2">
            {unsyncedCount > 0 && influxConfig && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="focus-ring flex items-center gap-1.5 rounded-lg bg-(--color-primary)/10 px-3 py-1.5 text-xs font-medium text-(--color-primary) transition-colors hover:bg-(--color-primary)/20 disabled:opacity-50"
              >
                <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                {t('historicalAnalytics.syncToInflux', { count: unsyncedCount })}
              </button>
            )}
            {syncResult !== null && (
              <span className="text-xs text-green-400">
                {t('historicalAnalytics.synced', { count: syncResult })}
              </span>
            )}
          </div>
        </div>

        {forecastHistory.length > 0 ? (
          <div className="space-y-3">
            {/* Accuracy Comparison Chart */}
            <div
              className="h-48 sm:h-56"
              role="img"
              aria-label={t('historicalAnalytics.forecastAccuracyAria')}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={forecastHistory.map((f) => ({
                    label: `${f.metric} (${new Date(f.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit' })})`,
                    r2: Math.round(f.accuracy.r2 * 100),
                    mape: Math.round(f.accuracy.mape * 10) / 10,
                    model: f.model,
                    synced: f.persistedToInflux,
                  }))}
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                  <XAxis
                    dataKey="label"
                    stroke="var(--color-muted)"
                    tick={{ fontSize: 9 }}
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="var(--color-muted)" tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-text)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar
                    dataKey="r2"
                    name={t('historicalAnalytics.r2Score')}
                    fill="#22ff88"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="mape"
                    name={t('historicalAnalytics.mape')}
                    fill="#ff8800"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Forecast Table */}
            <div className="overflow-x-auto rounded-lg border border-(--color-border)">
              <table
                className="w-full text-left text-xs"
                aria-label={t('historicalAnalytics.forecastTable')}
              >
                <thead>
                  <tr className="border-b border-(--color-border) bg-(--color-surface)/50">
                    <th className="px-3 py-2 font-medium text-(--color-muted)">
                      {t('historicalAnalytics.metric')}
                    </th>
                    <th className="px-3 py-2 font-medium text-(--color-muted)">
                      {t('historicalAnalytics.model')}
                    </th>
                    <th className="px-3 py-2 font-medium text-(--color-muted)">
                      {t('historicalAnalytics.created')}
                    </th>
                    <th className="px-3 py-2 font-medium text-(--color-muted)">R²</th>
                    <th className="px-3 py-2 font-medium text-(--color-muted)">MAPE</th>
                    <th className="px-3 py-2 font-medium text-(--color-muted)">InfluxDB</th>
                  </tr>
                </thead>
                <tbody>
                  {forecastHistory.slice(0, 10).map((f) => (
                    <tr key={f.id ?? f.createdAt} className="border-b border-(--color-border)/50">
                      <td className="px-3 py-2 text-(--color-text)">{f.metric}</td>
                      <td className="px-3 py-2 text-(--color-muted)">{f.model}</td>
                      <td className="px-3 py-2 text-(--color-muted)">
                        {new Date(f.createdAt).toLocaleString('de-DE')}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            f.accuracy.r2 >= 0.8
                              ? 'text-green-400'
                              : f.accuracy.r2 >= 0.5
                                ? 'text-yellow-400'
                                : 'text-red-400'
                          }
                        >
                          {(f.accuracy.r2 * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-3 py-2 text-(--color-muted)">
                        {f.accuracy.mape.toFixed(1)}%
                      </td>
                      <td className="px-3 py-2">
                        {f.persistedToInflux ? (
                          <CheckCircle size={14} className="text-green-400" />
                        ) : (
                          <Clock size={14} className="text-(--color-muted)" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-(--color-muted)">
            {t('historicalAnalytics.noForecasts')}
          </p>
        )}
      </motion.section>

      {/* ── Infrastructure Info ───────────────────────────────────── */}
      <motion.section
        className="glass-panel rounded-xl p-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-(--color-text)">
          <CloudSun size={20} className="text-(--color-electric-blue)" />
          {t('historicalAnalytics.infrastructure')}
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              name: 'InfluxDB',
              desc: t('historicalAnalytics.influxDesc'),
              port: '8086',
              status: influxHealthy,
            },
            {
              name: 'Prometheus',
              desc: t('historicalAnalytics.prometheusDesc'),
              port: '9090',
              status: null as boolean | null,
            },
            {
              name: 'Grafana',
              desc: t('historicalAnalytics.grafanaDesc'),
              port: '3001',
              status: null as boolean | null,
            },
          ].map((svc) => (
            <div key={svc.name} className="rounded-lg border border-(--color-border) p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-(--color-text)">{svc.name}</span>
                {svc.status === true && <CheckCircle size={14} className="text-green-400" />}
                {svc.status === false && <AlertCircle size={14} className="text-red-400" />}
              </div>
              <p className="mt-1 text-xs text-(--color-muted)">{svc.desc}</p>
              <p className="mt-1 text-xs text-(--color-muted)">
                Port: {svc.port}
                {svc.name === 'Grafana' && (
                  <a
                    href={`http://localhost:${svc.port}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 inline-flex items-center gap-0.5 text-(--color-primary) hover:underline"
                  >
                    <ExternalLink size={10} />
                    {t('historicalAnalytics.open')}
                  </a>
                )}
              </p>
            </div>
          ))}
        </div>
      </motion.section>

      <PageCrossLinks />
    </div>
  );
}
