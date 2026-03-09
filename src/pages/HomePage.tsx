import { memo } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Sun, Battery, Home, Zap, Activity, Sparkles, TrendingUp } from 'lucide-react';
import { useAppStore } from '../store';
import { useLegacySendCommand } from '../core/useLegacySendCommand';
import { PageHeader } from '../components/layout/PageHeader';
import { SankeyDiagram } from '../components/SankeyDiagram';
import { AIOptimizerPanel } from '../components/AIOptimizerPanel';
import { ControlPanel } from '../components/ControlPanel';
import { Link } from 'react-router-dom';

function HomePageComponent() {
  const { t } = useTranslation();
  const { energyData } = useAppStore();
  const { sendCommand } = useLegacySendCommand();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.home', 'Overview')}
        subtitle={t('common.tagline')}
        icon={<Home size={22} />}
      />

      {/* KPI Grid */}
      <section
        aria-label={t('metrics.overview', 'Key metrics')}
        aria-live="polite"
        aria-atomic="false"
      >
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            icon={<Sun className="text-yellow-400" />}
            label={t('metrics.pvGeneration')}
            value={`${(energyData.pvPower / 1000).toFixed(2)} ${t('units.kilowatt')}`}
            sub={`${energyData.pvYieldToday.toFixed(1)} ${t('units.kilowattHour')} ${t('common.today')}`}
            link="/production"
            delay={0.1}
          />
          <KpiCard
            icon={
              <Battery
                className={energyData.batterySoC > 20 ? 'text-emerald-400' : 'text-red-400'}
              />
            }
            label={t('metrics.battery')}
            value={`${energyData.batterySoC.toFixed(1)}${t('units.percent')}`}
            sub={`${(energyData.batteryPower / 1000).toFixed(2)} ${t('units.kilowatt')}`}
            link="/storage"
            className={
              energyData.batteryPower < -50
                ? 'battery-charging'
                : energyData.batteryPower > 50
                  ? 'battery-discharging'
                  : ''
            }
            delay={0.15}
          />
          <KpiCard
            icon={<Home className="text-blue-400" />}
            label={t('metrics.houseLoad')}
            value={`${(energyData.houseLoad / 1000).toFixed(2)} ${t('units.kilowatt')}`}
            sub={t('metrics.baseLoad')}
            link="/consumption"
            delay={0.2}
          />
          <KpiCard
            icon={
              <Zap className={energyData.gridPower > 0 ? 'text-red-400' : 'text-emerald-400'} />
            }
            label={t('metrics.grid')}
            value={`${(energyData.gridPower / 1000).toFixed(2)} ${t('units.kilowatt')}`}
            sub={energyData.gridPower > 0 ? t('metrics.import') : t('metrics.export')}
            link="/energy-flow"
            delay={0.25}
          />
        </div>
      </section>

      {/* Mini Sankey + AI Quick + Controls */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Compact Sankey */}
        <motion.section
          className="glass-panel-strong rounded-3xl p-6 lg:col-span-2 hover-lift"
          aria-labelledby="home-flow-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2
              id="home-flow-title"
              className="flex items-center gap-2 text-lg font-medium fluid-text-lg"
            >
              <Activity
                size={20}
                className="text-[color:var(--color-secondary)]"
                aria-hidden="true"
              />
              {t('dashboard.realtimeFlow')}
            </h2>
            <Link
              to="/energy-flow"
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-[color:var(--color-primary)] transition-colors hover:bg-[color:var(--color-primary)]/10 focus-ring"
            >
              {t('nav.viewAll', 'View details →')}
            </Link>
          </div>
          <div className="min-h-[280px] sm:min-h-[340px]">
            <SankeyDiagram data={energyData} />
          </div>
        </motion.section>

        {/* Quick Controls */}
        <motion.section
          className="glass-panel-strong rounded-3xl p-6 hover-lift"
          aria-labelledby="home-controls-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2
            id="home-controls-title"
            className="mb-4 flex items-center gap-2 text-lg font-medium fluid-text-lg"
          >
            <TrendingUp
              size={20}
              className="text-[color:var(--color-secondary)]"
              aria-hidden="true"
            />
            {t('dashboard.control')}
          </h2>
          <ControlPanel sendCommand={sendCommand} data={energyData} />
        </motion.section>
      </div>

      {/* AI Quick Panel */}
      <motion.div
        id="ai-optimizer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <AIOptimizerPanel />
      </motion.div>

      {/* Quick Navigation Cards */}
      <section aria-label={t('nav.quickLinks', 'Quick navigation')}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            {
              path: '/energy-flow',
              icon: <Activity size={20} />,
              key: 'nav.energyFlow',
              color: 'text-cyan-400',
            },
            {
              path: '/production',
              icon: <Sun size={20} />,
              key: 'nav.production',
              color: 'text-yellow-400',
            },
            {
              path: '/storage',
              icon: <Battery size={20} />,
              key: 'nav.storage',
              color: 'text-emerald-400',
            },
            {
              path: '/consumption',
              icon: <Home size={20} />,
              key: 'nav.consumption',
              color: 'text-blue-400',
            },
            {
              path: '/tariffs',
              icon: <TrendingUp size={20} />,
              key: 'nav.tariffs',
              color: 'text-orange-400',
            },
            {
              path: '/analytics',
              icon: <Sparkles size={20} />,
              key: 'nav.analytics',
              color: 'text-purple-400',
            },
          ].map(({ path, icon, key, color }) => (
            <Link
              key={path}
              to={path}
              className="glass-panel group flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition-all hover:scale-[1.03] hover:bg-white/5 focus-ring"
            >
              <div className={`${color} transition-transform group-hover:scale-110`}>{icon}</div>
              <span className="text-xs font-medium text-[color:var(--color-muted)] group-hover:text-[color:var(--color-text)]">
                {t(key)}
              </span>
            </Link>
          ))}
        </div>
      </section>
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
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  link: string;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay, type: 'spring', stiffness: 260, damping: 20 }}
    >
      <Link
        to={link}
        className={`metric-card block rounded-3xl hover-lift hover-glow focus-ring ${className || ''}`}
      >
        <div className="mb-3 flex items-center gap-3">
          <div className="rounded-xl border border-[color:var(--color-border)] bg-white/6 p-2.5">
            {icon}
          </div>
          <span className="text-sm font-medium text-[color:var(--color-text)] fluid-text-sm">
            {label}
          </span>
        </div>
        <div className="text-2xl font-light tracking-tight text-[color:var(--color-text)] fluid-text-2xl">
          {value}
        </div>
        <div className="mt-1.5 text-xs text-[color:var(--color-muted)] fluid-text-xs">{sub}</div>
      </Link>
    </motion.div>
  );
});

export const HomePage = memo(HomePageComponent);
export default HomePage;
