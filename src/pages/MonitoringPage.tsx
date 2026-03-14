import { memo, useMemo } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  Server,
  Wifi,
  WifiOff,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  HardDrive,
  MemoryStick,
  Zap,
  ThermometerSun,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Radio,
  Terminal,
  BarChart3,
  Eye,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAppStore } from '../store';
import { PageHeader } from '../components/layout/PageHeader';
import { useMetrics, getMetricFromSnapshot } from '../core/useMetrics';
import { PageCrossLinks } from '../components/ui/PageCrossLinks';

// ─── Deterministic system load history ────────────────────────────────

function generateSystemLoadHistory(currentLoad: number) {
  const now = new Date();
  const currentHour = now.getHours();
  return Array.from({ length: 24 }, (_, i) => {
    const h = i;
    const dayFactor =
      h >= 6 && h <= 22 ? 0.6 + Math.sin(((h - 6) / 16) * Math.PI) * 0.35 : 0.3 + (h % 3) * 0.05;
    const load = Math.round(currentLoad * dayFactor * (0.85 + (h % 7) * 0.03));
    const cpu = Math.round(15 + dayFactor * 40 + (h % 5) * 2);
    const mem = Math.round(45 + dayFactor * 25 + (h % 4) * 1.5);
    return {
      hour: `${String(h).padStart(2, '0')}:00`,
      load,
      cpu,
      memory: mem,
      isFuture: h > currentHour,
    };
  });
}

// ─── Component ────────────────────────────────────────────────────────

function MonitoringPageComponent() {
  const { t } = useTranslation();
  const energyData = useAppStore((s) => s.energyData);
  const connected = useAppStore((s) => s.connected);
  const { families, health, lastUpdated, error } = useMetrics(5000);

  const get = (name: string, labels?: Record<string, string>) =>
    getMetricFromSnapshot(families, name, labels);

  // ─── Extract key metrics ────────────────────────────────────────────
  const pvPower = get('hems_pv_power_watts') ?? energyData.pvPower;
  const gridPower = get('hems_grid_power_watts') ?? energyData.gridPower;
  const batteryPower = get('hems_battery_power_watts') ?? energyData.batteryPower;
  const batterySoC = get('hems_battery_soc_percent') ?? energyData.batterySoC;
  const houseLoad = get('hems_house_load_watts') ?? energyData.houseLoad;
  const evPower = get('hems_ev_charger_power_watts') ?? energyData.evPower;
  const heatPump = get('hems_heat_pump_power_watts') ?? energyData.heatPumpPower;
  const voltage = get('hems_grid_voltage_volts') ?? energyData.gridVoltage;
  const price = get('hems_tariff_price_eur_per_kwh') ?? energyData.priceCurrent;
  const uptime = get('hems_uptime_seconds') ?? health.uptime;

  // ─── Status derivations ─────────────────────────────────────────────
  const gridStatus: 'ok' | 'warn' | 'crit' =
    gridPower > 4200 ? 'crit' : gridPower > 3000 ? 'warn' : 'ok';
  const batteryStatus: 'ok' | 'warn' | 'crit' =
    batterySoC < 10 ? 'crit' : batterySoC < 20 ? 'warn' : 'ok';
  const voltageStatus: 'ok' | 'warn' | 'crit' =
    voltage < 210 || voltage > 250 ? 'crit' : voltage < 220 || voltage > 240 ? 'warn' : 'ok';
  const priceStatus: 'ok' | 'warn' | 'crit' = price > 0.4 ? 'crit' : price > 0.3 ? 'warn' : 'ok';

  const statusColor = (s: 'ok' | 'warn' | 'crit') =>
    s === 'crit' ? 'text-red-400' : s === 'warn' ? 'text-yellow-400' : 'text-emerald-400';
  const statusBg = (s: 'ok' | 'warn' | 'crit') =>
    s === 'crit' ? 'bg-red-500/10' : s === 'warn' ? 'bg-yellow-500/10' : 'bg-emerald-500/10';

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    return `${h}h ${m}m`;
  };

  // ─── Adapter list ───────────────────────────────────────────────────
  const adapters = useMemo(
    () => [
      {
        name: 'Victron MQTT',
        protocol: 'MQTT/WS',
        id: 'victron-mqtt',
        icon: <Radio size={14} />,
        desc: t('monitoring.adapterVictronDesc'),
      },
      {
        name: 'Modbus SunSpec',
        protocol: 'Modbus TCP',
        id: 'modbus-sunspec',
        icon: <Zap size={14} />,
        desc: t('monitoring.adapterModbusDesc'),
      },
      {
        name: 'KNX/IP',
        protocol: 'KNXnet/IP',
        id: 'knx',
        icon: <Server size={14} />,
        desc: t('monitoring.adapterKnxDesc'),
      },
      {
        name: 'OCPP 2.1',
        protocol: 'OCPP/WS',
        id: 'ocpp',
        icon: <Zap size={14} />,
        desc: t('monitoring.adapterOcppDesc'),
      },
      {
        name: 'EEBUS',
        protocol: 'SPINE/SHIP',
        id: 'eebus',
        icon: <Shield size={14} />,
        desc: t('monitoring.adapterEebusDesc'),
      },
    ],
    [t],
  );

  // ─── 10 live metric cards ──────────────────────────────────────────
  const metricCards = [
    {
      label: t('monitoring.pvPower'),
      value: `${pvPower.toFixed(0)}`,
      unit: 'W',
      icon: <ThermometerSun size={16} />,
      status: 'ok' as const,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
    },
    {
      label: t('monitoring.gridPower'),
      value: `${gridPower.toFixed(0)}`,
      unit: 'W',
      icon: <Zap size={16} />,
      status: gridStatus,
      color: statusColor(gridStatus),
      bg: statusBg(gridStatus),
    },
    {
      label: t('monitoring.batteryPower'),
      value: `${batteryPower.toFixed(0)}`,
      unit: 'W',
      icon: <Activity size={16} />,
      status: 'ok' as const,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: t('monitoring.batterySoC'),
      value: `${batterySoC.toFixed(0)}`,
      unit: '%',
      icon: <Gauge size={16} />,
      status: batteryStatus,
      color: statusColor(batteryStatus),
      bg: statusBg(batteryStatus),
    },
    {
      label: t('monitoring.houseLoad'),
      value: `${houseLoad.toFixed(0)}`,
      unit: 'W',
      icon: <Activity size={16} />,
      status: 'ok' as const,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      label: t('monitoring.evCharger'),
      value: `${evPower.toFixed(0)}`,
      unit: 'W',
      icon: <Zap size={16} />,
      status: 'ok' as const,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
    {
      label: t('monitoring.heatPump'),
      value: `${heatPump.toFixed(0)}`,
      unit: 'W',
      icon: <ThermometerSun size={16} />,
      status: 'ok' as const,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
    },
    {
      label: t('monitoring.gridVoltage'),
      value: `${voltage.toFixed(1)}`,
      unit: 'V',
      icon: <Gauge size={16} />,
      status: voltageStatus,
      color: statusColor(voltageStatus),
      bg: statusBg(voltageStatus),
    },
    {
      label: t('monitoring.price'),
      value: `${(price * 100).toFixed(1)}`,
      unit: 'ct/kWh',
      icon: <BarChart3 size={16} />,
      status: priceStatus,
      color: statusColor(priceStatus),
      bg: statusBg(priceStatus),
    },
    {
      label: t('monitoring.connections'),
      value: `${health.connections}`,
      unit: 'WS',
      icon: <Wifi size={16} />,
      status: 'ok' as const,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
  ];

  // ─── System resource utilization (simulated) ─────────────────────
  const cpuUsage = 18 + (houseLoad % 30);
  const memUsage = 52 + (pvPower % 15);
  const diskUsage = 34;
  const networkIO = Math.round(pvPower / 100 + gridPower / 200);

  // ─── System load history ────────────────────────────────────────────
  const loadHistory = useMemo(() => generateSystemLoadHistory(houseLoad), [houseLoad]);

  // ─── Alert rules ────────────────────────────────────────────────────
  const alertRules = [
    {
      name: 'HighGridImport',
      expr: 'hems_grid_power_watts > 4200',
      for: '5m',
      severity: 'warning' as const,
      desc: t('monitoring.ruleHighGrid'),
      active: gridPower > 4200,
    },
    {
      name: 'BatteryLow',
      expr: 'hems_battery_soc_percent < 10',
      for: '10m',
      severity: 'critical' as const,
      desc: t('monitoring.ruleBatteryLow'),
      active: batterySoC < 10,
    },
    {
      name: 'AdapterDisconnected',
      expr: 'hems_adapter_connected == 0',
      for: '2m',
      severity: 'warning' as const,
      desc: t('monitoring.ruleAdapterDown'),
      active: !connected,
    },
    {
      name: 'HighElectricityPrice',
      expr: 'hems_tariff_price > 0.40',
      for: '0m',
      severity: 'info' as const,
      desc: t('monitoring.ruleHighPrice'),
      active: price > 0.4,
    },
    {
      name: 'GridVoltageAnomaly',
      expr: 'hems_grid_voltage < 210 OR > 250',
      for: '1m',
      severity: 'critical' as const,
      desc: t('monitoring.ruleVoltage'),
      active: voltage < 210 || voltage > 250,
    },
    {
      name: 'NoSolarGeneration',
      expr: 'hems_pv_power_watts == 0 AND daytime',
      for: '30m',
      severity: 'warning' as const,
      desc: t('monitoring.ruleNoSolar'),
      active: pvPower === 0 && new Date().getHours() >= 7 && new Date().getHours() <= 19,
    },
  ];

  const activeAlerts = alertRules.filter((r) => r.active).length;

  // ─── Event log (simulated recent events) ────────────────────────────
  const eventLog = [
    {
      time: '14:32:08',
      level: 'info' as const,
      source: 'victron-mqtt',
      msg: t('monitoring.evtMqttReconnect'),
    },
    {
      time: '14:15:22',
      level: 'warn' as const,
      source: 'prometheus',
      msg: t('monitoring.evtScrapeTimeout'),
    },
    {
      time: '13:48:03',
      level: 'info' as const,
      source: 'ocpp',
      msg: t('monitoring.evtEvSession'),
    },
    {
      time: '13:12:45',
      level: 'info' as const,
      source: 'eebus',
      msg: t('monitoring.evtEebusHandshake'),
    },
    {
      time: '12:55:11',
      level: 'error' as const,
      source: 'knx',
      msg: t('monitoring.evtKnxTimeout'),
    },
    {
      time: '12:30:00',
      level: 'info' as const,
      source: 'system',
      msg: t('monitoring.evtStartup'),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('monitoring.pageTitle', 'Monitoring')}
        subtitle={t('monitoring.pageDescription')}
        icon={<Eye size={22} aria-hidden="true" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase ${
                error ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
              }`}
            >
              <span
                className={`energy-pulse h-1.5 w-1.5 rounded-full ${error ? 'bg-red-400' : 'bg-emerald-400'}`}
              />
              {error ? t('monitoring.error') : t('monitoring.live')}
            </span>
            {activeAlerts > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 px-3 py-1.5 text-[10px] font-semibold tracking-wider text-orange-400 uppercase">
                <AlertTriangle size={10} aria-hidden="true" />
                {activeAlerts} {t('monitoring.activeAlerts')}
              </span>
            )}
          </div>
        }
      />

      {/* ─── System Health Banner ──────────────────────────────────── */}
      <motion.section
        className="glass-panel-strong hover-lift rounded-3xl p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {error ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15">
                <ShieldAlert size={24} className="text-red-400" />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15">
                <ShieldCheck size={24} className="text-emerald-400" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-medium text-(--color-text)">
                {error ? t('monitoring.systemDegraded') : t('monitoring.systemHealthy')}
              </h2>
              <p className="text-xs text-(--color-muted)">
                {t('monitoring.uptime')}: {formatUptime(uptime)} · {t('monitoring.interval')}: 5s
                {lastUpdated > 0 && (
                  <>
                    {' '}
                    · {t('monitoring.lastScrape')}: {new Date(lastUpdated).toLocaleTimeString()}
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill label="Prometheus" ok={!error} />
            <StatusPill label="Grafana" ok={true} />
            <StatusPill label="MQTT" ok={connected} />
            <StatusPill label="KNX/IP" ok={true} />
          </div>
        </div>
        {/* Scrape Endpoints */}
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-xl bg-white/5 px-3 py-2">
            <p className="text-[10px] text-(--color-muted)">Prometheus Scrape</p>
            <code className="truncate font-mono text-xs text-(--color-primary)">GET /metrics</code>
          </div>
          <div className="rounded-xl bg-white/5 px-3 py-2">
            <p className="text-[10px] text-(--color-muted)">JSON API</p>
            <code className="truncate font-mono text-xs text-(--color-primary)">
              GET /api/metrics/json
            </code>
          </div>
          <div className="rounded-xl bg-white/5 px-3 py-2">
            <p className="text-[10px] text-(--color-muted)">Health Check</p>
            <code className="truncate font-mono text-xs text-(--color-primary)">GET /health</code>
          </div>
        </div>
      </motion.section>

      {/* ─── 10 Live Metric Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {metricCards.map((card, i) => (
          <motion.div
            key={card.label}
            className="group metric-card hover-lift rounded-2xl"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.05 + i * 0.03 }}
          >
            <div className="mb-2 flex items-center justify-between">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${card.bg} ${card.color}`}
              >
                {card.icon}
              </span>
              <span
                className={`h-2 w-2 rounded-full ${
                  card.status === 'crit'
                    ? 'energy-pulse bg-red-400'
                    : card.status === 'warn'
                      ? 'energy-pulse bg-yellow-400'
                      : 'bg-emerald-400'
                }`}
              />
            </div>
            <p className={`truncate text-xl font-light ${card.color}`}>
              {card.value}
              <span className="ml-1 text-xs text-(--color-muted)">{card.unit}</span>
            </p>
            <p className="mt-0.5 truncate text-[10px] leading-tight text-(--color-muted)">
              {card.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ─── System Load Chart + Resource Utilization ──────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 24h System Load Chart */}
        <motion.section
          className="glass-panel-strong hover-lift rounded-3xl p-6 lg:col-span-2"
          aria-labelledby="load-chart-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2
              id="load-chart-title"
              className="fluid-text-lg flex items-center gap-2 text-lg font-medium"
            >
              <Activity size={20} className="text-(--color-secondary)" aria-hidden="true" />
              {t('monitoring.systemLoad24h')}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-cyan-400" />
                {t('monitoring.houseLoad')}
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-purple-400" />
                CPU %
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-400" />
                RAM %
              </span>
            </div>
          </div>
          <div className="h-[240px]" role="img" aria-label={t('monitoring.systemLoad24h')}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={loadHistory}>
                <defs>
                  <linearGradient id="gradLoad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradMem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
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
                <Area
                  type="monotone"
                  dataKey="load"
                  stroke="#00f0ff"
                  fill="url(#gradLoad)"
                  strokeWidth={2}
                  name="Load (W)"
                />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  stroke="#a78bfa"
                  fill="url(#gradCpu)"
                  strokeWidth={1.5}
                  name="CPU %"
                />
                <Area
                  type="monotone"
                  dataKey="memory"
                  stroke="#3b82f6"
                  fill="url(#gradMem)"
                  strokeWidth={1.5}
                  name="RAM %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        {/* Resource Utilization */}
        <motion.section
          className="glass-panel-strong hover-lift rounded-3xl p-6"
          aria-labelledby="resources-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.38 }}
        >
          <h2
            id="resources-title"
            className="fluid-text-lg mb-4 flex items-center gap-2 text-lg font-medium"
          >
            <Server size={20} className="text-(--color-secondary)" aria-hidden="true" />
            {t('monitoring.resources')}
          </h2>
          <div className="space-y-4">
            <ResourceGauge
              icon={<Cpu size={16} className="text-purple-400" />}
              label="CPU"
              value={cpuUsage}
              color={
                cpuUsage > 80
                  ? 'bg-red-500/70'
                  : cpuUsage > 60
                    ? 'bg-yellow-500/70'
                    : 'bg-emerald-500/70'
              }
            />
            <ResourceGauge
              icon={<MemoryStick size={16} className="text-blue-400" />}
              label="RAM"
              value={memUsage}
              color={
                memUsage > 85
                  ? 'bg-red-500/70'
                  : memUsage > 70
                    ? 'bg-yellow-500/70'
                    : 'bg-blue-500/70'
              }
            />
            <ResourceGauge
              icon={<HardDrive size={16} className="text-cyan-400" />}
              label={t('monitoring.disk')}
              value={diskUsage}
              color="bg-cyan-500/70"
            />
            <div className="rounded-xl bg-white/5 px-3 py-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-(--color-muted)">
                  <Activity size={14} className="text-emerald-400" />
                  {t('monitoring.networkIO')}
                </span>
                <span className="font-medium text-(--color-text)">{networkIO} KB/s</span>
              </div>
            </div>
          </div>
          {/* System info */}
          <div className="mt-4 space-y-1.5 text-[10px] text-(--color-muted)">
            <div className="flex justify-between">
              <span>Node.js</span>
              <span className="font-mono">v22.14.0</span>
            </div>
            <div className="flex justify-between">
              <span>Runtime</span>
              <span className="font-mono">Vite 6.2 + Express</span>
            </div>
            <div className="flex justify-between">
              <span>OS</span>
              <span className="font-mono">Linux 6.1 ARM64</span>
            </div>
          </div>
        </motion.section>
      </div>

      {/* ─── Adapter Health + Alert Rules ──────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Adapter Connectivity */}
        <motion.section
          className="glass-panel-strong hover-lift rounded-3xl p-6"
          aria-labelledby="adapters-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2
            id="adapters-title"
            className="fluid-text-lg mb-4 flex items-center gap-2 text-lg font-medium"
          >
            <Wifi size={20} className="text-(--color-secondary)" aria-hidden="true" />
            {t('monitoring.adapterHealth')}
          </h2>
          <div className="space-y-2">
            {adapters.map((adapter) => {
              const isConnected = (get('hems_adapter_connected', { adapter: adapter.id }) ?? 1) > 0;
              const lat = get('hems_adapter_latency_seconds', { adapter: adapter.id }) ?? 0;
              const latencyMs = lat * 1000;
              return (
                <div
                  key={adapter.id}
                  className="group flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 transition-colors hover:bg-white/10"
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      isConnected
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-red-500/15 text-red-400'
                    }`}
                  >
                    {adapter.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-(--color-text)">
                        {adapter.name}
                      </span>
                      <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] text-(--color-muted)">
                        {adapter.protocol}
                      </span>
                    </div>
                    <p className="truncate text-[10px] text-(--color-muted)">{adapter.desc}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {latencyMs > 0 && (
                      <span className="font-mono text-[10px] text-(--color-muted)">
                        {latencyMs.toFixed(0)}ms
                      </span>
                    )}
                    {isConnected ? (
                      <Wifi size={14} className="text-emerald-400" />
                    ) : (
                      <WifiOff size={14} className="text-red-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Alert Rules */}
        <motion.section
          className="glass-panel-strong hover-lift rounded-3xl p-6"
          aria-labelledby="alerts-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.42 }}
        >
          <h2
            id="alerts-title"
            className="fluid-text-lg mb-4 flex items-center gap-2 text-lg font-medium"
          >
            <ShieldAlert size={20} className="text-(--color-secondary)" aria-hidden="true" />
            {t('monitoring.alertRules')}
          </h2>
          <div className="space-y-2">
            {alertRules.map((rule) => (
              <div key={rule.name} className="rounded-xl bg-white/5 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  {rule.active ? (
                    <XCircle size={14} className="shrink-0 text-red-400" />
                  ) : (
                    <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
                  )}
                  <span className="truncate text-sm font-medium text-(--color-text)">
                    {rule.name}
                  </span>
                  <span
                    className={`ml-auto shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
                      rule.severity === 'critical'
                        ? 'bg-red-500/15 text-red-400'
                        : rule.severity === 'warning'
                          ? 'bg-orange-500/15 text-orange-400'
                          : 'bg-blue-500/15 text-blue-400'
                    }`}
                  >
                    {rule.severity}
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-(--color-muted)">{rule.desc}</p>
                <div className="mt-1 flex items-center gap-2 font-mono text-[9px] text-(--color-muted)">
                  <code className="truncate">{rule.expr}</code>
                  <span className="shrink-0">for: {rule.for}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      </div>

      {/* ─── Event Log Timeline ────────────────────────────────────── */}
      <motion.section
        className="glass-panel-strong hover-lift rounded-3xl p-6"
        aria-labelledby="event-log-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.44 }}
      >
        <h2
          id="event-log-title"
          className="fluid-text-lg mb-4 flex items-center gap-2 text-lg font-medium"
        >
          <Terminal size={20} className="text-(--color-secondary)" aria-hidden="true" />
          {t('monitoring.eventLog')}
        </h2>
        <div className="space-y-1.5">
          {eventLog.map((evt) => (
            <div
              key={evt.time + evt.source}
              className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2 text-xs"
            >
              <span className="shrink-0 font-mono text-[10px] text-(--color-muted)">
                {evt.time}
              </span>
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${
                  evt.level === 'error'
                    ? 'bg-red-500/15 text-red-400'
                    : evt.level === 'warn'
                      ? 'bg-yellow-500/15 text-yellow-400'
                      : 'bg-blue-500/15 text-blue-400'
                }`}
              >
                {evt.level === 'error' ? (
                  <XCircle size={10} />
                ) : evt.level === 'warn' ? (
                  <AlertTriangle size={10} />
                ) : (
                  <CheckCircle2 size={10} />
                )}
              </span>
              <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] text-(--color-muted)">
                {evt.source}
              </span>
              <span className="min-w-0 flex-1 truncate text-(--color-text)">{evt.msg}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ─── Grafana Integration ───────────────────────────────────── */}
      <motion.section
        className="glass-panel-strong hover-lift rounded-3xl p-6"
        aria-labelledby="grafana-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.46 }}
      >
        <h2
          id="grafana-title"
          className="fluid-text-lg mb-4 flex items-center gap-2 text-lg font-medium"
        >
          <BarChart3 size={20} className="text-(--color-secondary)" aria-hidden="true" />
          Grafana Dashboard
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-[10px] text-(--color-muted)">Dashboard UID</p>
            <code className="font-mono text-xs text-(--color-primary)">nexus-hems-overview</code>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-[10px] text-(--color-muted)">Data Source</p>
            <code className="font-mono text-xs text-(--color-primary)">Prometheus</code>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-[10px] text-(--color-muted)">{t('monitoring.interval')}</p>
            <code className="font-mono text-xs text-(--color-primary)">5s</code>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-[10px] text-(--color-muted)">{t('monitoring.retention')}</p>
            <code className="font-mono text-xs text-(--color-primary)">30d</code>
          </div>
        </div>
        <div className="mt-3 rounded-xl border border-(--color-primary)/20 bg-(--color-primary)/5 p-3 text-xs text-(--color-muted)">
          <span className="font-medium text-(--color-primary)">💡 </span>
          {t('monitoring.grafanaHint')}
        </div>
      </motion.section>

      {/* ─── Cross-Links & Navigation ─────────────────────────── */}
      <PageCrossLinks />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function StatusPill({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
        ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
      {label}
    </span>
  );
}

function ResourceGauge({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-2 text-(--color-muted)">
          {icon}
          {label}
        </span>
        <span className="font-medium text-(--color-text)">{value.toFixed(0)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-(--color-surface)">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, value)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export default memo(MonitoringPageComponent);
