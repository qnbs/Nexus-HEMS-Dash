import { memo } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Map, Home } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Floorplan } from '../components/Floorplan';

function FloorplanPageComponent() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.floorplan', 'KNX Floorplan')}
        subtitle={t('dashboard.automation')}
        icon={<Map size={22} />}
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
          <Home size={20} className="text-[color:var(--color-secondary)]" aria-hidden="true" />
          {t('floorplan.interactiveView', 'Interactive Building View')}
        </h2>
        <div className="min-h-[400px] w-full overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-slate-800/50">
          <Floorplan />
        </div>
      </motion.section>

      {/* KNX Device Info */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: t('floorplan.kitchen'), icon: '🍳', status: t('common.active') },
          { label: t('floorplan.livingRoom'), icon: '🛋️', status: t('common.active') },
          { label: t('floorplan.bathroom'), icon: '🚿', status: t('common.active') },
        ].map((room, i) => (
          <motion.div
            key={room.label}
            className="glass-panel rounded-2xl p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 + i * 0.05 }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{room.icon}</span>
              <div>
                <p className="text-sm font-medium text-[color:var(--color-text)]">{room.label}</p>
                <p className="text-xs text-[color:var(--color-muted)]">{room.status}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default memo(FloorplanPageComponent);
