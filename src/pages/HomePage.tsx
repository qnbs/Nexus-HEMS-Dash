import { memo } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Sun, Battery, Home, Zap, Activity, TrendingUp } from 'lucide-react';
import { useAppStore } from '../store';
import { useLegacySendCommand } from '../core/useLegacySendCommand';
import { PageHeader } from '../components/layout/PageHeader';
import { SankeyDiagram } from '../components/SankeyDiagram';
import { AIOptimizerPanel } from '../components/AIOptimizerPanel';
import { ControlPanel } from '../components/ControlPanel';
import { Link } from 'react-router-dom';

function HomePageComponent() {
  const { t } = useTranslation();
  const energyData = useAppStore((s) => s.energyData);
  const { sendCommand } = useLegacySendCommand();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.home', 'Overview')}
        subtitle={t('common.tagline')}
        icon={<Home size={22} aria-hidden="true" />}
      />

      {/* KPI Grid */}
      <section
        aria-label={t('metrics.overview', 'Key metrics')}
        aria-live="polite"
        aria-atomic="false"
      >
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            icon={<Sun className="text-yellow-400" aria-hidden="true" />}
            label={t('metrics.pvGeneration')}
            value={`${(energyData.pvPower / 1000).toFixed(2)} ${t('units.kilowatt')}`}
            sub={`${energyData.pvYieldToday.toFixed(1)} ${t('units.kilowattHour')} ${t('common.today')}`}
            link="/production"
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
            sub={`${(energyData.batteryPower / 1000).toFixed(2)} ${t('units.kilowatt')}`}
            link="/storage"
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
            value={`${(energyData.houseLoad / 1000).toFixed(2)} ${t('units.kilowatt')}`}
            sub={t('metrics.baseLoad')}
            link="/consumption"
          />
          <KpiCard
            icon={
              <Zap className={energyData.gridPower > 0 ? 'text-red-400' : 'text-emerald-400'} aria-hidden="true" />
            }
            label={t('metrics.grid')}
            value={`${(energyData.gridPower / 1000).toFixed(2)} ${t('units.kilowatt')}`}
            sub={energyData.gridPower > 0 ? t('metrics.import') : t('metrics.export')}
            link="/energy-flow"
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
      <div id="ai-optimizer">
        <AIOptimizerPanel />
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
  className?: string;
}) {
  return (
    <Link
      to={link}
      className={`metric-card block rounded-2xl focus-ring ${className || ''}`}
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
  );
});

export const HomePage = memo(HomePageComponent);
export default HomePage;
