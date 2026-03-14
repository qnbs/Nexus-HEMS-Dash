import { memo, useState } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  Map,
  Home,
  Wifi,
  Thermometer,
  Droplets,
  Lightbulb,
  Wind,
  Activity,
  Shield,
  AlertTriangle,
  Gauge,
  Zap,
  BarChart3,
  CheckCircle2,
  Leaf,
  Clock,
} from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PageHeader } from '../components/layout/PageHeader';
import { Floorplan } from '../components/Floorplan';

const ROOMS = [
  {
    id: 'kitchen',
    icon: '🍳',
    temp: 22.0,
    setpoint: 21.0,
    humidity: 55,
    co2: 620,
    lights: false,
    dimmer: 100,
    window: true,
    ga: '1/1/0',
    energyW: 120,
  },
  {
    id: 'living',
    icon: '🛋️',
    temp: 21.5,
    setpoint: 22.0,
    humidity: 48,
    co2: 510,
    lights: true,
    dimmer: 80,
    window: false,
    ga: '1/3/0',
    energyW: 340,
  },
  {
    id: 'bathroom',
    icon: '🚿',
    temp: 23.5,
    setpoint: 24.0,
    humidity: 72,
    co2: 480,
    lights: false,
    dimmer: 60,
    window: false,
    ga: '1/2/0',
    energyW: 85,
  },
  {
    id: 'bedroom',
    icon: '🛏️',
    temp: 19.8,
    setpoint: 19.0,
    humidity: 45,
    co2: 390,
    lights: false,
    dimmer: 30,
    window: true,
    ga: '1/4/0',
    energyW: 45,
  },
  {
    id: 'office',
    icon: '💻',
    temp: 21.0,
    setpoint: 21.0,
    humidity: 42,
    co2: 550,
    lights: true,
    dimmer: 90,
    window: false,
    ga: '1/5/0',
    energyW: 280,
  },
  {
    id: 'hallway',
    icon: '🚶',
    temp: 20.5,
    setpoint: 20.0,
    humidity: 44,
    co2: 410,
    lights: true,
    dimmer: 50,
    window: false,
    ga: '1/6/0',
    energyW: 35,
  },
];

const SCENES = [
  { key: 'sceneComfort', icon: '☀️', ga: '14/0/0' },
  { key: 'sceneEvening', icon: '🌙', ga: '14/0/1' },
  { key: 'sceneAway', icon: '🚪', ga: '14/0/2' },
  { key: 'sceneAllOff', icon: '⭕', ga: '14/0/3' },
] as const;

function getComfortLevel(
  temp: number,
  setpoint: number,
  humidity: number,
  co2: number,
): { label: string; color: string; score: number } {
  let score = 100;
  score -= Math.abs(temp - setpoint) * 15;
  if (humidity < 30 || humidity > 65) score -= 15;
  if (humidity > 70) score -= 25;
  if (co2 > 800) score -= 15;
  if (co2 > 1000) score -= 25;
  score = Math.max(0, Math.min(100, score));
  if (score >= 80) return { label: 'good', color: 'text-emerald-400', score };
  if (score >= 55) return { label: 'moderate', color: 'text-yellow-400', score };
  return { label: 'poor', color: 'text-red-400', score };
}

function FloorplanPageComponent() {
  const { t } = useTranslation();
  const [activeScene, setActiveScene] = useState<string | null>('sceneComfort');

  // ─── Aggregate stats ──────────────────────────────────────────────
  const avgTemp = ROOMS.reduce((a, r) => a + r.temp, 0) / ROOMS.length;
  const avgHumidity = ROOMS.reduce((a, r) => a + r.humidity, 0) / ROOMS.length;
  const avgCo2 = ROOMS.reduce((a, r) => a + r.co2, 0) / ROOMS.length;
  const windowsOpen = ROOMS.filter((r) => r.window).length;
  const lightsOn = ROOMS.filter((r) => r.lights).length;
  const totalEnergyW = ROOMS.reduce((a, r) => a + r.energyW, 0);

  const ROOM_COLORS = ['#22ff88', '#00f0ff', '#ff8800', '#a78bfa', '#f472b6', '#fbbf24'];
  const roomEnergyData = ROOMS.map((r, i) => ({
    name: r.icon + ' ' + r.id,
    value: r.energyW,
    color: ROOM_COLORS[i % ROOM_COLORS.length],
  }));

  // Overall comfort score
  const comfortScores = ROOMS.map(
    (r) => getComfortLevel(r.temp, r.setpoint, r.humidity, r.co2).score,
  );
  const overallComfort = Math.round(
    comfortScores.reduce((a, s) => a + s, 0) / comfortScores.length,
  );

  // KNX bus metrics (simulated)
  const knxStats = {
    datapoints: 247,
    telegramsSec: 12,
    busLoad: 8,
    devices: 34,
    errors: 0,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.floorplan', 'KNX Floorplan')}
        subtitle={t('dashboard.automation')}
        icon={<Map size={22} aria-hidden="true" />}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 energy-pulse" />
            KNX/IP
          </span>
        }
      />

      {/* ─── Building Health Banner ────────────────────────────── */}
      <motion.section
        className="glass-panel rounded-2xl px-5 py-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        aria-label={t('floorplan.buildingHealth')}
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <HealthPill
            icon={<Thermometer size={13} className="text-orange-400" />}
            label={t('floorplan.avgTemp')}
            value={`${avgTemp.toFixed(1)}°C`}
            ok={avgTemp >= 18 && avgTemp <= 24}
          />
          <HealthPill
            icon={<Droplets size={13} className="text-blue-400" />}
            label={t('floorplan.avgHumidity')}
            value={`${avgHumidity.toFixed(0)}%`}
            ok={avgHumidity >= 30 && avgHumidity <= 65}
          />
          <HealthPill
            icon={<Wind size={13} className="text-cyan-400" />}
            label={t('floorplan.windowsLabel')}
            value={`${windowsOpen}/${ROOMS.length} ${t('floorplan.open')}`}
            ok
          />
          <HealthPill
            icon={<Lightbulb size={13} className="text-yellow-400" />}
            label={t('floorplan.lights')}
            value={`${lightsOn}/${ROOMS.length}`}
            ok
          />
          <HealthPill
            icon={<Zap size={13} className="text-purple-400" />}
            label={t('floorplan.roomEnergy')}
            value={`${totalEnergyW} W`}
            ok
          />
          <HealthPill
            icon={<Shield size={13} className="text-emerald-400" />}
            label={t('floorplan.comfortLabel')}
            value={`${overallComfort}%`}
            ok={overallComfort >= 70}
          />
        </div>
      </motion.section>

      {/* ─── Full Floorplan ────────────────────────────────────── */}
      <motion.section
        className="glass-panel-strong rounded-3xl p-6 hover-lift"
        aria-labelledby="floorplan-full-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h2
          id="floorplan-full-title"
          className="mb-4 flex items-center gap-2 text-lg font-medium fluid-text-lg"
        >
          <Home size={20} className="text-(--color-secondary)" aria-hidden="true" />
          {t('floorplan.interactiveView')}
        </h2>
        <div className="min-h-[400px] w-full overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface)">
          <Floorplan />
        </div>
      </motion.section>

      {/* ─── KNX Bus + Scenes Row ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* KNX Bus Status */}
        <motion.section
          className="glass-panel-strong rounded-3xl p-6 hover-lift"
          aria-labelledby="knx-bus-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <h2
            id="knx-bus-title"
            className="mb-4 flex items-center gap-2 text-lg font-medium fluid-text-lg"
          >
            <Wifi size={20} className="text-green-400" aria-hidden="true" />
            {t('floorplan.knxStatus')}
          </h2>
          <div className="mb-4 flex items-center justify-between rounded-xl border border-green-500/20 bg-green-500/5 p-3">
            <div>
              <p className="text-sm font-medium text-green-400">{t('common.connected')}</p>
              <p className="text-[11px] text-(--color-muted)">KNX/IP 192.168.1.10:3671</p>
            </div>
            <span className="h-3 w-3 rounded-full bg-green-400 energy-pulse" />
          </div>
          <dl className="space-y-2">
            <BusStatRow label={t('floorplan.datapoints')} value={`${knxStats.datapoints}`} />
            <BusStatRow label={t('floorplan.devices')} value={`${knxStats.devices}`} />
            <BusStatRow label={t('floorplan.telegramsRate')} value={`${knxStats.telegramsSec}/s`} />
            <BusStatRow label={t('floorplan.busLoad')} value={`${knxStats.busLoad}%`} />
            <BusStatRow
              label={t('floorplan.busErrors')}
              value={`${knxStats.errors}`}
              highlight={knxStats.errors > 0}
            />
          </dl>
        </motion.section>

        {/* KNX Scenes */}
        <motion.section
          className="glass-panel-strong rounded-3xl p-6 hover-lift lg:col-span-2"
          aria-labelledby="knx-scenes-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2
            id="knx-scenes-title"
            className="mb-4 flex items-center gap-2 text-lg font-medium fluid-text-lg"
          >
            <Activity size={20} className="text-(--color-secondary)" aria-hidden="true" />
            {t('floorplan.scenesTitle')}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SCENES.map((scene) => {
              const isActive = activeScene === scene.key;
              return (
                <button
                  key={scene.key}
                  onClick={() => setActiveScene(isActive ? null : scene.key)}
                  className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm transition-all active:scale-[0.96] focus-ring ${
                    isActive
                      ? 'border-(--color-primary) bg-(--color-primary)/10 text-(--color-text)'
                      : 'border-(--color-border) bg-(--color-surface) text-(--color-muted) hover:border-(--color-primary)/50'
                  }`}
                  aria-label={t(`floorplan.${scene.key}`)}
                  aria-pressed={isActive}
                >
                  <span className="text-2xl" aria-hidden="true">
                    {scene.icon}
                  </span>
                  <span className="font-medium">{t(`floorplan.${scene.key}`)}</span>
                  <span className="text-[10px] font-mono text-(--color-muted)">{scene.ga}</span>
                  {isActive && (
                    <motion.span
                      className="mt-1 inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[9px] font-semibold text-green-400"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <CheckCircle2 size={10} />
                      {t('common.active')}
                    </motion.span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-(--color-muted)">{t('floorplan.scenesDesc')}</p>
        </motion.section>
      </div>

      {/* ─── Room Cards ────────────────────────────────────────── */}
      <motion.section
        aria-labelledby="room-cards-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        <h2
          id="room-cards-title"
          className="mb-4 flex items-center gap-2 text-lg font-medium fluid-text-lg"
        >
          <BarChart3 size={20} className="text-(--color-secondary)" aria-hidden="true" />
          {t('floorplan.roomOverview')}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {ROOMS.map((room, i) => {
            const comfort = getComfortLevel(room.temp, room.setpoint, room.humidity, room.co2);
            const tempDelta = room.temp - room.setpoint;
            return (
              <motion.div
                key={room.id}
                className="glass-panel rounded-2xl p-4 space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.05 }}
              >
                {/* Room header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl" aria-hidden="true">
                      {room.icon}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-(--color-text)">
                        {t(`floorplan.${room.id === 'living' ? 'livingRoom' : room.id}`)}
                      </p>
                      <p className="text-[10px] font-mono text-(--color-muted)">GA {room.ga}</p>
                    </div>
                  </div>
                  {/* Comfort pill */}
                  <span
                    className={`rounded-full border border-(--color-border)/30 px-2 py-0.5 text-[9px] font-semibold ${comfort.color}`}
                  >
                    {comfort.score}%
                  </span>
                </div>

                {/* Sensor grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-(--color-muted)">
                    <Thermometer size={12} className="text-orange-400" aria-hidden="true" />
                    <span>{room.temp.toFixed(1)}°C</span>
                    {Math.abs(tempDelta) > 0.5 && (
                      <span
                        className={`text-[9px] ${tempDelta > 0 ? 'text-red-400' : 'text-blue-400'}`}
                      >
                        {tempDelta > 0 ? '+' : ''}
                        {tempDelta.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-(--color-muted)">
                    <Droplets size={12} className="text-blue-400" aria-hidden="true" />
                    {room.humidity}%
                  </div>
                  <div className="flex items-center gap-1.5 text-(--color-muted)">
                    <Lightbulb
                      size={12}
                      className={room.lights ? 'text-yellow-400' : ''}
                      aria-hidden="true"
                    />
                    {room.lights ? `${room.dimmer}%` : t('floorplan.closed')}
                  </div>
                  <div className="flex items-center gap-1.5 text-(--color-muted)">
                    <Wind
                      size={12}
                      className={room.window ? 'text-sky-400' : ''}
                      aria-hidden="true"
                    />
                    {room.window ? t('floorplan.open') : t('floorplan.closed')}
                  </div>
                </div>

                {/* CO₂ + Energy row */}
                <div className="flex items-center justify-between border-t border-(--color-border)/30 pt-2 text-[10px]">
                  <span
                    className={`text-(--color-muted) ${room.co2 > 800 ? '!text-yellow-400' : ''}`}
                  >
                    CO₂: {room.co2} ppm
                  </span>
                  <span className="flex items-center gap-1 text-(--color-muted)">
                    <Zap size={10} className="text-purple-400" />
                    {room.energyW} W
                  </span>
                </div>

                {/* Comfort bar */}
                <div className="h-1.5 overflow-hidden rounded-full bg-(--color-surface)">
                  <motion.div
                    className={`h-full rounded-full ${
                      comfort.score >= 80
                        ? 'bg-emerald-500'
                        : comfort.score >= 55
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${comfort.score}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ opacity: 0.7 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* ─── Building Comfort Ring + Alerts ──────────────────────── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Comfort Ring Gauge */}
        <motion.section
          className="glass-panel-strong rounded-3xl p-6 hover-lift"
          aria-labelledby="comfort-gauge-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <h2
            id="comfort-gauge-title"
            className="mb-4 flex items-center gap-2 text-lg font-medium fluid-text-lg"
          >
            <Gauge size={20} className="text-(--color-secondary)" aria-hidden="true" />
            {t('floorplan.comfortIndex')}
          </h2>
          <div className="flex flex-col items-center">
            <div className="relative h-44 w-44">
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
                <motion.circle
                  cx="100"
                  cy="100"
                  r="85"
                  fill="none"
                  stroke={
                    overallComfort >= 80 ? '#10b981' : overallComfort >= 55 ? '#eab308' : '#ef4444'
                  }
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 85}
                  initial={{ strokeDashoffset: 2 * Math.PI * 85 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 85 * (1 - overallComfort / 100) }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  style={{
                    filter: `drop-shadow(0 0 6px ${overallComfort >= 80 ? '#10b98150' : overallComfort >= 55 ? '#eab30850' : '#ef444450'})`,
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={`text-3xl font-bold ${overallComfort >= 80 ? 'text-emerald-400' : overallComfort >= 55 ? 'text-yellow-400' : 'text-red-400'}`}
                >
                  {overallComfort}
                </span>
                <span className="text-xs text-(--color-muted)">{t('floorplan.comfortScore')}</span>
              </div>
            </div>
            <div className="mt-4 grid w-full grid-cols-3 gap-3 text-center text-xs">
              <div>
                <p className="text-(--color-muted)">{t('floorplan.avgTemp')}</p>
                <p className="font-medium text-(--color-text)">{avgTemp.toFixed(1)}°C</p>
              </div>
              <div>
                <p className="text-(--color-muted)">{t('floorplan.avgHumidity')}</p>
                <p className="font-medium text-(--color-text)">{avgHumidity.toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-(--color-muted)">CO₂ Ø</p>
                <p
                  className={`font-medium ${avgCo2 > 800 ? 'text-yellow-400' : 'text-(--color-text)'}`}
                >
                  {avgCo2.toFixed(0)} ppm
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Building Alerts */}
        <motion.section
          className="glass-panel-strong rounded-3xl p-6 hover-lift"
          aria-labelledby="building-alerts-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <h2
            id="building-alerts-title"
            className="mb-4 flex items-center gap-2 text-lg font-medium fluid-text-lg"
          >
            <AlertTriangle size={20} className="text-(--color-secondary)" aria-hidden="true" />
            {t('floorplan.alerts')}
          </h2>
          <div className="space-y-3">
            {/* Window open while heating */}
            {ROOMS.some((r) => r.window && r.temp < r.setpoint) && (
              <AlertRow
                icon={<Wind size={14} className="text-sky-400" />}
                type="warning"
                title={t('floorplan.alertWindowHeating')}
                desc={t('floorplan.alertWindowHeatingDesc')}
              />
            )}
            {/* High humidity */}
            {ROOMS.some((r) => r.humidity > 70) && (
              <AlertRow
                icon={<Droplets size={14} className="text-blue-400" />}
                type="warning"
                title={t('floorplan.alertHumidity')}
                desc={t('floorplan.alertHumidityDesc', { room: t('floorplan.bathroom') })}
              />
            )}
            {/* All good */}
            {!ROOMS.some((r) => (r.window && r.temp < r.setpoint) || r.humidity > 70) && (
              <AlertRow
                icon={<CheckCircle2 size={14} className="text-emerald-400" />}
                type="ok"
                title={t('floorplan.alertAllGood')}
                desc={t('floorplan.alertAllGoodDesc')}
              />
            )}
            {/* KNX Bus OK */}
            <AlertRow
              icon={<Wifi size={14} className="text-green-400" />}
              type="ok"
              title={t('floorplan.alertKnxOk')}
              desc={`${knxStats.devices} ${t('floorplan.devices')}, ${knxStats.datapoints} ${t('floorplan.datapoints')}`}
            />
          </div>
        </motion.section>
      </div>

      {/* ─── Room Energy Distribution + Air Quality ────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Room Energy Donut */}
        <motion.section
          className="glass-panel-strong rounded-3xl p-6 hover-lift"
          aria-labelledby="room-energy-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2
            id="room-energy-title"
            className="mb-4 flex items-center gap-2 text-lg font-medium fluid-text-lg"
          >
            <Zap size={20} className="text-(--color-secondary)" aria-hidden="true" />
            {t('floorplan.energyDistribution')}
          </h2>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={roomEnergyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {roomEnergyData.map((entry) => (
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
                  formatter={(value) => [`${value} W`]}
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
          <div className="mt-2 flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs">
            <span className="text-(--color-muted)">{t('floorplan.totalRoomEnergy')}</span>
            <span className="font-medium text-(--color-text)">{totalEnergyW} W</span>
          </div>
        </motion.section>

        {/* Air Quality Index + Temperature Comparison */}
        <motion.section
          className="glass-panel-strong rounded-3xl p-6 hover-lift lg:col-span-2"
          aria-labelledby="air-quality-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.42 }}
        >
          <h2
            id="air-quality-title"
            className="mb-4 flex items-center gap-2 text-lg font-medium fluid-text-lg"
          >
            <Leaf size={20} className="text-(--color-secondary)" aria-hidden="true" />
            {t('floorplan.airQuality')}
          </h2>

          {/* IAQ summary */}
          <div className="mb-5 grid grid-cols-3 gap-3">
            <div className="glass-panel rounded-xl p-3 text-center">
              <p className="text-[10px] text-(--color-muted)">CO₂ Ø</p>
              <p
                className={`text-lg font-light ${avgCo2 > 800 ? 'text-yellow-400' : avgCo2 > 1000 ? 'text-red-400' : 'text-emerald-400'}`}
              >
                {avgCo2.toFixed(0)}
              </p>
              <p className="text-[9px] text-(--color-muted)">ppm</p>
            </div>
            <div className="glass-panel rounded-xl p-3 text-center">
              <p className="text-[10px] text-(--color-muted)">{t('floorplan.avgHumidity')}</p>
              <p
                className={`text-lg font-light ${avgHumidity > 65 ? 'text-yellow-400' : 'text-blue-400'}`}
              >
                {avgHumidity.toFixed(0)}%
              </p>
              <p className="text-[9px] text-(--color-muted)">rH</p>
            </div>
            <div className="glass-panel rounded-xl p-3 text-center">
              <p className="text-[10px] text-(--color-muted)">{t('floorplan.iaqRating')}</p>
              <p
                className={`text-lg font-light ${avgCo2 < 600 ? 'text-emerald-400' : avgCo2 < 800 ? 'text-yellow-400' : 'text-red-400'}`}
              >
                {avgCo2 < 600
                  ? t('floorplan.iaqGood')
                  : avgCo2 < 800
                    ? t('floorplan.iaqModerate')
                    : t('floorplan.iaqPoor')}
              </p>
              <p className="text-[9px] text-(--color-muted)">IAQ</p>
            </div>
          </div>

          {/* Temperature: actual vs setpoint per room */}
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-(--color-text)">
            <Thermometer size={14} className="text-orange-400" />
            {t('floorplan.tempComparison')}
          </h3>
          <div className="space-y-2.5">
            {ROOMS.map((room) => {
              const delta = room.temp - room.setpoint;
              const barPercent = (room.temp / 30) * 100;
              const setpointPercent = (room.setpoint / 30) * 100;
              return (
                <div key={room.id}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-(--color-muted)">
                      <span aria-hidden="true">{room.icon}</span>
                      {t(`floorplan.${room.id === 'living' ? 'livingRoom' : room.id}`)}
                    </span>
                    <span className="flex items-center gap-2 text-(--color-text)">
                      <span className="font-medium">{room.temp.toFixed(1)}°C</span>
                      <span className="text-(--color-muted)">/ {room.setpoint.toFixed(1)}°C</span>
                      {Math.abs(delta) > 0.3 && (
                        <span
                          className={`text-[10px] ${delta > 0 ? 'text-red-400' : 'text-blue-400'}`}
                        >
                          {delta > 0 ? '+' : ''}
                          {delta.toFixed(1)}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-(--color-surface)">
                    <motion.div
                      className={`h-full rounded-full ${delta > 1 ? 'bg-red-500/70' : delta < -1 ? 'bg-blue-500/70' : 'bg-emerald-500/70'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, barPercent)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                    {/* Setpoint marker */}
                    <div
                      className="absolute top-0 h-full w-0.5 bg-(--color-muted)"
                      style={{ left: `${setpointPercent}%`, opacity: 0.5 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>
      </div>

      {/* ─── KNX Activity Timeline ─────────────────────────────── */}
      <motion.section
        className="glass-panel-strong rounded-3xl p-6 hover-lift"
        aria-labelledby="knx-activity-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
      >
        <h2
          id="knx-activity-title"
          className="mb-4 flex items-center gap-2 text-lg font-medium fluid-text-lg"
        >
          <Clock size={20} className="text-(--color-secondary)" aria-hidden="true" />
          {t('floorplan.recentActivity')}
        </h2>
        <div className="space-y-2">
          {[
            {
              time: '14:32:08',
              ga: '1/3/0',
              action: t('floorplan.actLivingLights'),
              value: 'ON 80%',
              icon: <Lightbulb size={13} className="text-yellow-400" />,
            },
            {
              time: '14:28:45',
              ga: '1/1/5',
              action: t('floorplan.actKitchenWindow'),
              value: t('floorplan.open'),
              icon: <Wind size={13} className="text-sky-400" />,
            },
            {
              time: '14:15:12',
              ga: '1/4/1',
              action: t('floorplan.actBedroomTemp'),
              value: '19.0°C',
              icon: <Thermometer size={13} className="text-orange-400" />,
            },
            {
              time: '14:02:33',
              ga: '14/0/0',
              action: t('floorplan.actSceneComfort'),
              value: t('common.active'),
              icon: <Activity size={13} className="text-purple-400" />,
            },
            {
              time: '13:48:19',
              ga: '1/5/0',
              action: t('floorplan.actOfficeLights'),
              value: 'ON 90%',
              icon: <Lightbulb size={13} className="text-yellow-400" />,
            },
          ].map((entry) => (
            <div
              key={entry.time}
              className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2 text-xs"
            >
              <span className="font-mono text-[10px] text-(--color-muted)">{entry.time}</span>
              <span className="flex-shrink-0">{entry.icon}</span>
              <span className="flex-1 text-(--color-text)">{entry.action}</span>
              <span className="font-mono text-(--color-muted)">{entry.ga}</span>
              <span className="font-medium text-(--color-text)">{entry.value}</span>
            </div>
          ))}
        </div>
      </motion.section>
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

function BusStatRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-(--color-border)/30 pb-1.5 last:border-0 last:pb-0">
      <dt className="text-sm text-(--color-muted)">{label}</dt>
      <dd className={`text-sm font-medium ${highlight ? 'text-red-400' : 'text-(--color-text)'}`}>
        {value}
      </dd>
    </div>
  );
}

function AlertRow({
  icon,
  type,
  title,
  desc,
}: {
  icon: React.ReactNode;
  type: 'warning' | 'ok';
  title: string;
  desc: string;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        type === 'warning'
          ? 'border-yellow-500/30 bg-yellow-500/5'
          : 'border-emerald-500/20 bg-emerald-500/5'
      }`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span
          className={`text-sm font-medium ${type === 'warning' ? 'text-yellow-400' : 'text-emerald-400'}`}
        >
          {title}
        </span>
      </div>
      <p className="mt-1 text-xs text-(--color-muted)">{desc}</p>
    </div>
  );
}

export default memo(FloorplanPageComponent);
