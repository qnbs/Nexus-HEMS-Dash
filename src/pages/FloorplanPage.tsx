import { memo } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Map, Home, Wifi, Thermometer, Droplets, Lightbulb, Wind } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Floorplan } from '../components/Floorplan';

const ROOMS = [
  { id: 'kitchen', icon: '🍳', temp: 22.0, humidity: 55, lights: false, window: true, ga: '1/1/0' },
  { id: 'living', icon: '🛋️', temp: 21.5, humidity: 48, lights: true, window: false, ga: '1/3/0' },
  {
    id: 'bathroom',
    icon: '🚿',
    temp: 23.5,
    humidity: 72,
    lights: false,
    window: false,
    ga: '1/2/0',
  },
  { id: 'bedroom', icon: '🛏️', temp: 19.8, humidity: 45, lights: false, window: true, ga: '1/4/0' },
  { id: 'office', icon: '💻', temp: 21.0, humidity: 42, lights: true, window: false, ga: '1/5/0' },
];

const SCENES = [
  { key: 'sceneComfort', icon: '☀️', ga: '14/0/0' },
  { key: 'sceneEvening', icon: '🌙', ga: '14/0/1' },
  { key: 'sceneAway', icon: '🚪', ga: '14/0/2' },
  { key: 'sceneAllOff', icon: '⭕', ga: '14/0/3' },
] as const;

function FloorplanPageComponent() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.floorplan', 'KNX Floorplan')}
        subtitle={t('dashboard.automation')}
        icon={<Map size={22} aria-hidden="true" />}
      />

      {/* Full Floorplan */}
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
          {t('floorplan.interactiveView', 'Interactive Building View')}
        </h2>
        <div className="min-h-[400px] w-full overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface)">
          <Floorplan />
        </div>
      </motion.section>

      {/* KNX Bus Status */}
      <motion.div
        className="glass-panel rounded-2xl p-4 flex items-center justify-between"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <div className="flex items-center gap-3">
          <Wifi size={18} className="text-green-400" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-(--color-text)">{t('floorplan.knxStatus')}</p>
            <p className="text-xs text-(--color-muted)">
              {t('floorplan.knxConnected')} · KNX/IP 192.168.1.10:3671
            </p>
          </div>
        </div>
        <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-medium text-green-400">
          {t('common.connected')}
        </span>
      </motion.div>

      {/* KNX Scenes */}
      <motion.section
        className="glass-panel rounded-2xl p-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h3 className="mb-3 text-sm fluid-text-sm font-medium text-(--color-text)">
          {t('floorplan.scenesTitle')}
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SCENES.map((scene) => (
            <button
              key={scene.key}
              className="flex items-center gap-2 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-sm text-(--color-text) hover:border-(--color-primary) transition-colors focus-ring"
              aria-label={t(`floorplan.${scene.key}`)}
            >
              <span aria-hidden="true">{scene.icon}</span>
              <span>{t(`floorplan.${scene.key}`)}</span>
              <span className="ml-auto text-[10px] font-mono text-(--color-muted)">{scene.ga}</span>
            </button>
          ))}
        </div>
      </motion.section>

      {/* Room Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {ROOMS.map((room, i) => (
          <motion.div
            key={room.id}
            className="glass-panel rounded-2xl p-4 space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 + i * 0.05 }}
          >
            <div className="flex items-center gap-3">
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
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-(--color-muted)">
                <Thermometer size={12} className="text-orange-400" aria-hidden="true" />
                {room.temp.toFixed(1)}°C
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
                {room.lights ? t('common.active') : t('floorplan.closed')}
              </div>
              <div className="flex items-center gap-1.5 text-(--color-muted)">
                <Wind size={12} className={room.window ? 'text-sky-400' : ''} aria-hidden="true" />
                {room.window ? t('floorplan.open') : t('floorplan.closed')}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default memo(FloorplanPageComponent);
