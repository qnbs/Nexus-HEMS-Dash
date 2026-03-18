import { useState } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sun,
  Battery,
  Home,
  Zap,
  Activity,
  Leaf,
  Thermometer,
  Car,
  ChevronRight,
  Sparkles,
  FileBarChart,
  ShieldAlert,
} from 'lucide-react';

import { useEnergyContext } from '../core/EnergyContext';
import { useAppStoreShallow } from '../store';
import { PageHeader } from '../components/layout/PageHeader';
import { DemoBadge } from '../components/DemoBadge';
import { OptimizedSankey } from '../components/energy/OptimizedSankey';
import { EnergyCard } from '../components/ui/EnergyCard';
import { LiveMetric } from '../components/ui/LiveMetric';
import { FloatingActionBar } from '../components/ui/FloatingActionBar';
import { AIOptimizerPanel } from '../components/AIOptimizerPanel';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { EmptyState } from '../components/ui/EmptyState';
import { PageTour, type TourStep } from '../components/ui/PageTour';

// ─── 8 metric card definitions ───────────────────────────────────────

interface MetricDef {
  id: string;
  labelKey: string;
  icon: React.ReactNode;
  getValue: (d: ReturnType<typeof useMetrics>) => number;
  unit: string;
  format: 'power' | 'energy' | 'percent' | 'currency';
  link: string;
  variant: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  detailKey: string;
  getDetail: (d: ReturnType<typeof useMetrics>) => string;
}

function useMetrics() {
  const { data: energyData, connected } = useEnergyContext();
  const settings = useAppStoreShallow((s) => s.settings);

  const pvKW = energyData.pvPower / 1000;
  const houseKW = energyData.houseLoad / 1000;
  const gridKW = energyData.gridPower / 1000;
  const battKW = energyData.batteryPower / 1000;
  const hpKW = energyData.heatPumpPower / 1000;
  const evKW = energyData.evPower / 1000;

  const gridImport = Math.max(0, energyData.gridPower);
  const selfSufficiency =
    energyData.houseLoad > 0
      ? Math.min(100, ((energyData.houseLoad - gridImport) / energyData.houseLoad) * 100)
      : 0;

  const peakKWp = settings.systemConfig.pv.peakPowerKWp;
  const co2SavedToday = energyData.pvYieldToday * 0.38;

  return {
    energyData,
    pvKW,
    houseKW,
    gridKW,
    battKW,
    hpKW,
    evKW,
    selfSufficiency,
    peakKWp,
    co2SavedToday,
    connected,
  };
}

const metricCards: MetricDef[] = [
  {
    id: 'pv',
    labelKey: 'metrics.pvGeneration',
    icon: <Sun size={18} className="text-yellow-400" />,
    getValue: (d) => d.pvKW,
    unit: 'kW',
    format: 'power',
    link: '/energy-flow',
    variant: 'success',
    detailKey: 'commandHub.pvDetail',
    getDetail: (d) => `${d.energyData.pvYieldToday.toFixed(1)} kWh`,
  },
  {
    id: 'battery',
    labelKey: 'metrics.battery',
    icon: <Battery size={18} className="text-emerald-400" />,
    getValue: (d) => d.energyData.batterySoC,
    unit: '%',
    format: 'percent',
    link: '/energy-flow',
    variant: 'success',
    detailKey: 'commandHub.batteryDetail',
    getDetail: (d) =>
      d.battKW < -0.05 ? 'batteryCharging' : d.battKW > 0.05 ? 'batteryDischarging' : 'batteryIdle',
  },
  {
    id: 'house',
    labelKey: 'metrics.houseLoad',
    icon: <Home size={18} className="text-blue-400" />,
    getValue: (d) => d.houseKW,
    unit: 'kW',
    format: 'power',
    link: '/energy-flow',
    variant: 'primary',
    detailKey: 'commandHub.houseDetail',
    getDetail: () => '',
  },
  {
    id: 'grid',
    labelKey: 'metrics.grid',
    icon: <Zap size={18} className="text-red-400" />,
    getValue: (d) => Math.abs(d.gridKW),
    unit: 'kW',
    format: 'power',
    link: '/energy-flow',
    variant: 'danger',
    detailKey: 'commandHub.gridDetail',
    getDetail: (d) => (d.gridKW > 0 ? 'import' : 'export'),
  },
  {
    id: 'selfSufficiency',
    labelKey: 'metrics.autonomy',
    icon: <Leaf size={18} className="text-emerald-400" />,
    getValue: (d) => d.selfSufficiency,
    unit: '%',
    format: 'percent',
    link: '/analytics',
    variant: 'success',
    detailKey: 'commandHub.autonomyDetail',
    getDetail: () => '',
  },
  {
    id: 'heatPump',
    labelKey: 'dashboard.heatPump',
    icon: <Thermometer size={18} className="text-orange-400" />,
    getValue: (d) => d.hpKW,
    unit: 'kW',
    format: 'power',
    link: '/devices',
    variant: 'warning',
    detailKey: 'commandHub.heatPumpDetail',
    getDetail: () => '',
  },
  {
    id: 'ev',
    labelKey: 'dashboard.evCharging',
    icon: <Car size={18} className="text-cyan-400" />,
    getValue: (d) => d.evKW,
    unit: 'kW',
    format: 'power',
    link: '/devices',
    variant: 'primary',
    detailKey: 'commandHub.evDetail',
    getDetail: () => '',
  },
  {
    id: 'price',
    labelKey: 'metrics.tariff',
    icon: <Activity size={18} className="text-purple-400" />,
    getValue: (d) => d.energyData.priceCurrent * 100,
    unit: 'ct/kWh',
    format: 'currency',
    link: '/tariffs',
    variant: 'neutral',
    detailKey: 'commandHub.priceDetail',
    getDetail: () => '',
  },
];

// ─── Page component ──────────────────────────────────────────────────

function CommandHubComponent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const metrics = useMetrics();
  const {
    data: energyData,
    connected,
    detailPanel,
    selfSufficiencyPercent,
    isExporting,
  } = useEnergyContext();
  const isDemo = !connected;

  // Quick-actions bar — always visible on this page
  const [actionsOpen] = useState(true);

  const tourSteps: TourStep[] = [
    {
      icon: Home,
      titleKey: 'tour.hub.overviewTitle',
      descKey: 'tour.hub.overviewDesc',
      color: '#38bdf8',
    },
    {
      icon: Activity,
      titleKey: 'tour.hub.sankeyTitle',
      descKey: 'tour.hub.sankeyDesc',
      color: '#22ff88',
    },
    { icon: Sparkles, titleKey: 'tour.hub.aiTitle', descKey: 'tour.hub.aiDesc', color: '#a855f6' },
  ];

  return (
    <div className="space-y-6">
      <PageTour tourId="command-hub" steps={tourSteps} />

      {/* ─── Page Header ─────────────────────────────────────── */}
      <PageHeader
        title={t('commandHub.title', 'Command Hub')}
        subtitle={t('commandHub.subtitle', 'Gesamtübersicht aller Energiesysteme')}
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

      {/* ─── 8 LiveMetric Cards (responsive grid) ────────────── */}
      <section aria-label={t('commandHub.metricsOverview', 'Kennzahlen')} className="@container">
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-xs font-semibold tracking-widest text-(--color-muted) uppercase">
            {t('commandHub.metricsOverview', 'Kennzahlen')}
          </h2>
          <HelpTooltip
            content={t(
              'tour.hub.metricsHelp',
              'Live-Werte aller Energiekomponenten. Klicke auf eine Karte für Details.',
            )}
          />
        </div>
        <motion.div
          className="grid grid-cols-2 gap-3 @md:grid-cols-3 @xl:grid-cols-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          {metricCards.map((card) => (
            <Link key={card.id} to={card.link} className="focus-ring rounded-2xl">
              <EnergyCard
                variant={card.variant}
                details={
                  card.getDetail(metrics) ? (
                    <p className="text-xs text-(--color-muted)">
                      {t(`metrics.${card.getDetail(metrics)}`, card.getDetail(metrics))}
                    </p>
                  ) : undefined
                }
              >
                <span className="shrink-0">{card.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium tracking-wide text-(--color-muted) uppercase">
                    {t(card.labelKey)}
                  </p>
                  <LiveMetric
                    value={card.getValue(metrics)}
                    unit={card.unit}
                    format={card.format}
                    size="sm"
                    precision={card.format === 'percent' ? 0 : card.format === 'currency' ? 1 : 2}
                  />
                </div>
                <ChevronRight
                  size={14}
                  className="shrink-0 text-(--color-muted) opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden="true"
                />
              </EnergyCard>
            </Link>
          ))}
        </motion.div>
      </section>

      {/* ─── Mini Sankey (Echtzeit-Energiefluss) ─────────────── */}
      {energyData.pvPower === 0 && energyData.houseLoad === 0 && energyData.gridPower === 0 ? (
        <EmptyState
          icon={Activity}
          title={t('empty.noEnergyData', 'Keine Energiedaten verfügbar')}
          description={t(
            'empty.noEnergyDataDesc',
            'Verbinde einen Gateway in den Einstellungen, um Echtzeitdaten zu sehen.',
          )}
          pulse
          action={
            <button
              onClick={() => navigate('/settings')}
              className="focus-ring rounded-xl bg-(--color-primary)/15 px-4 py-2 text-sm font-medium text-(--color-primary) transition-colors hover:bg-(--color-primary)/25"
            >
              {t('empty.goToSettings', 'Einstellungen öffnen')}
            </button>
          }
        />
      ) : (
        <motion.section
          className="glass-panel-strong hover-lift overflow-hidden rounded-2xl"
          aria-labelledby="hub-sankey-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center justify-between border-b border-(--color-border)/30 px-5 py-3">
            <h2
              id="hub-sankey-title"
              className="fluid-text-base flex items-center gap-2 font-medium"
            >
              <Activity size={18} className="text-(--color-secondary)" aria-hidden="true" />
              {t('dashboard.realtimeFlow')}
            </h2>
            <div className="flex items-center gap-3 text-xs text-(--color-muted)">
              <span className="flex items-center gap-1.5">
                <Leaf
                  size={12}
                  className={isExporting ? 'text-emerald-400' : 'text-(--color-muted)'}
                />
                {selfSufficiencyPercent}% {t('commandHub.autonomous', 'autark')}
              </span>
              <Link
                to="/energy-flow"
                className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium text-(--color-primary) transition-colors hover:bg-(--color-primary)/10"
              >
                {t('nav.viewAll', 'Details')}
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
          <div className="min-h-[240px] p-4 sm:min-h-[320px]">
            <OptimizedSankey
              data={energyData}
              detailOpen={detailPanel.open}
              onDetailClose={detailPanel.close}
              allowFullscreen
            />
          </div>
        </motion.section>
      )}

      {/* ─── AI-Empfehlung des Tages ─────────────────────────── */}
      <motion.section
        aria-labelledby="hub-ai-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id="hub-ai-title" className="fluid-text-base flex items-center gap-2 font-medium">
            <Sparkles size={18} className="text-purple-400" aria-hidden="true" />
            {t('commandHub.aiRecommendation', 'KI-Empfehlung des Tages')}
          </h2>
          <Link
            to="/optimization-ai"
            className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-(--color-primary) transition-colors hover:bg-(--color-primary)/10"
          >
            {t('commandHub.allRecommendations', 'Alle Empfehlungen')}
            <ChevronRight size={14} />
          </Link>
        </div>
        <div id="ai-optimizer">
          <AIOptimizerPanel />
        </div>
      </motion.section>

      {/* ─── Quick-Actions FloatingActionBar ──────────────────── */}
      <FloatingActionBar
        open={actionsOpen}
        ariaLabel={t('commandHub.quickActions', 'Schnellaktionen')}
        primaryAction={
          <button
            type="button"
            onClick={() => navigate('/optimization-ai')}
            className="focus-ring inline-flex items-center gap-2 rounded-xl bg-(--color-primary) px-4 py-2 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-(--color-primary)/80"
          >
            <Sparkles size={16} aria-hidden="true" />
            {t('command.optimizeNow', 'Jetzt optimieren')}
          </button>
        }
        secondaryAction={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/analytics')}
              className="focus-ring inline-flex items-center gap-2 rounded-xl border border-(--color-border) bg-(--color-surface-strong) px-3 py-2 text-sm font-medium text-(--color-text) transition-colors hover:bg-white/5"
            >
              <FileBarChart size={16} aria-hidden="true" />
              <span className="hidden sm:inline">{t('command.exportReport', 'Bericht')}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="focus-ring inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
            >
              <ShieldAlert size={16} aria-hidden="true" />
              <span className="hidden sm:inline">{t('emergencyStopShort', 'Notaus')}</span>
            </button>
          </div>
        }
      />
    </div>
  );
}

export const CommandHub = CommandHubComponent;
export default CommandHub;
