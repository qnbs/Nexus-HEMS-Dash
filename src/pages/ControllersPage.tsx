import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  Cpu,
  Play,
  RotateCcw,
  Activity,
  Shield,
  Zap,
  TrendingDown,
  Sun,
  ThermometerSun,
  Car,
  Battery,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useAppStoreShallow } from '../store';
import { getDisplayData } from '../lib/demo-data';
import { PageHeader } from '../components/layout/PageHeader';
import { NeonCard, NeonCardBody } from '../components/ui/NeonCard';
import { PageCrossLinks } from '../components/ui/PageCrossLinks';
import {
  controllerPipeline,
  type ControllerState,
  type ControllerPriority,
} from '../core/energy-controllers';

// ─── Controller icon mapping ────────────────────────────────────────

const CONTROLLER_ICONS: Record<string, typeof Cpu> = {
  'ess-symmetric': Battery,
  'peak-shaving': TrendingDown,
  'grid-optimized-charge': Zap,
  'self-consumption': Sun,
  'emergency-capacity': Shield,
  'heatpump-sg-ready': ThermometerSun,
  'ev-smart-charge': Car,
};

const CONTROLLER_I18N: Record<string, string> = {
  'ess-symmetric': 'controllers.essSymmetric',
  'peak-shaving': 'controllers.peakShaving',
  'grid-optimized-charge': 'controllers.gridOptimizedCharge',
  'self-consumption': 'controllers.selfConsumption',
  'emergency-capacity': 'controllers.emergencyCapacity',
  'heatpump-sg-ready': 'controllers.heatPumpSgReady',
  'ev-smart-charge': 'controllers.evSmartCharge',
};

const PRIORITY_COLORS: Record<ControllerPriority, string> = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/30',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  normal: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  low: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
};

// ─── Pipeline Status Card ───────────────────────────────────────────

function PipelineStatusCard({
  states,
  onRunCycle,
  onResetAll,
}: {
  states: ControllerState[];
  onRunCycle: () => void;
  onResetAll: () => void;
}) {
  const { t } = useTranslation();
  const activeCount = states.filter((s) => s.enabled).length;
  const errorCount = states.reduce((sum, s) => sum + s.errorCount, 0);
  const avgCycleTime =
    states.length > 0 ? states.reduce((sum, s) => sum + s.cycleTimeMs, 0) / states.length : 0;

  return (
    <NeonCard variant={errorCount > 0 ? 'warning' : 'primary'} glow>
      <NeonCardBody>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-(--color-primary)/10">
              <Activity className="h-6 w-6 text-(--color-primary)" />
            </div>
            <div>
              <h2 className="fluid-text-lg font-semibold">{t('controllers.pipeline')}</h2>
              <p className="fluid-text-sm text-(--color-muted)">
                {activeCount}/{states.length} {t('controllers.enabled')}
                {errorCount > 0 && (
                  <span className="ml-2 text-orange-400">
                    • {errorCount} {t('common.errors', 'Fehler')}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="fluid-text-xs text-(--color-muted)">
              ∅ {avgCycleTime.toFixed(2)}ms
            </span>
            <button
              onClick={onRunCycle}
              className="focus-ring flex items-center gap-1.5 rounded-xl bg-(--color-primary)/10 px-3 py-2 text-sm font-medium text-(--color-primary) transition-colors hover:bg-(--color-primary)/20"
              aria-label={t('controllers.runCycle')}
            >
              <Play className="h-4 w-4" />
              {t('controllers.runCycle')}
            </button>
            <button
              onClick={onResetAll}
              className="focus-ring flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2 text-sm font-medium text-(--color-muted) transition-colors hover:bg-white/10"
              aria-label={t('common.reset', 'Zurücksetzen')}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </NeonCardBody>
    </NeonCard>
  );
}

// ─── Individual Controller Card ─────────────────────────────────────

function ControllerCard({
  state,
  onToggle,
}: {
  state: ControllerState;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const Icon = CONTROLLER_ICONS[state.id] ?? Cpu;
  const i18nKey = CONTROLLER_I18N[state.id] ?? state.name;
  const priorityClass = PRIORITY_COLORS[state.priority];

  const lastRunStr = state.lastRun ? new Date(state.lastRun).toLocaleTimeString() : '—';

  return (
    <NeonCard
      variant={state.enabled ? 'default' : 'default'}
      className={!state.enabled ? 'opacity-60' : ''}
      hover={false}
    >
      <NeonCardBody className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                state.enabled
                  ? 'border-(--color-primary)/20 bg-(--color-primary)/10 text-(--color-primary)'
                  : 'border-(--color-border) bg-white/5 text-(--color-muted)'
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="fluid-text-base font-semibold">{t(i18nKey)}</h3>
              <div className="fluid-text-xs flex items-center gap-2 text-(--color-muted)">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wider uppercase ${priorityClass}`}
                >
                  {t('controllers.priority')}: {state.priority}
                </span>
                {state.errorCount > 0 && (
                  <span className="flex items-center gap-1 text-orange-400">
                    <AlertTriangle className="h-3 w-3" />
                    {state.errorCount}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle */}
            <button
              onClick={() => onToggle(state.id, !state.enabled)}
              className={`focus-ring relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                state.enabled ? 'bg-(--color-primary)' : 'bg-white/10'
              }`}
              role="switch"
              aria-checked={state.enabled}
              aria-label={`${t(i18nKey)} ${state.enabled ? t('controllers.enabled') : t('controllers.disabled')}`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow-lg transition-transform ${
                  state.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>

            {/* Expand */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="focus-ring rounded-lg p-1 text-(--color-muted) hover:text-(--color-text)"
              aria-expanded={expanded}
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Status Row */}
        <div className="fluid-text-xs flex items-center gap-4 text-(--color-muted)">
          <span className="flex items-center gap-1">
            {state.enabled ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <XCircle className="h-3.5 w-3.5 text-gray-500" />
            )}
            {state.enabled ? t('controllers.enabled') : t('controllers.disabled')}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {lastRunStr}
          </span>
          <span>{state.cycleTimeMs.toFixed(2)}ms</span>
        </div>

        {/* Expanded: Last Output */}
        <AnimatePresence>
          {expanded && state.lastOutput && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 space-y-2 rounded-xl border border-(--color-border) bg-white/[0.02] p-4">
                <h4 className="fluid-text-xs font-semibold tracking-wider text-(--color-muted) uppercase">
                  {t('controllers.lastRun')}
                </h4>
                {state.lastOutput.essPowerW !== undefined && (
                  <div className="fluid-text-sm flex justify-between">
                    <span>ESS Power</span>
                    <span className="font-mono">
                      {state.lastOutput.essPowerW > 0 ? '+' : ''}
                      {(state.lastOutput.essPowerW / 1000).toFixed(2)} kW
                    </span>
                  </div>
                )}
                {state.lastOutput.evCurrentA !== undefined && (
                  <div className="fluid-text-sm flex justify-between">
                    <span>EV Current</span>
                    <span className="font-mono">{state.lastOutput.evCurrentA} A</span>
                  </div>
                )}
                {state.lastOutput.sgReadyMode !== undefined && (
                  <div className="fluid-text-sm flex justify-between">
                    <span>SG Ready</span>
                    <span className="font-mono">
                      {t('common.mode', 'Modus')} {state.lastOutput.sgReadyMode}
                    </span>
                  </div>
                )}
                {state.lastOutput.gridLimitW !== undefined && (
                  <div className="fluid-text-sm flex justify-between">
                    <span>Grid Limit</span>
                    <span className="font-mono">
                      {(state.lastOutput.gridLimitW / 1000).toFixed(1)} kW
                    </span>
                  </div>
                )}
                <div className="fluid-text-sm flex justify-between">
                  <span>Confidence</span>
                  <span className="font-mono">
                    {(state.lastOutput.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="fluid-text-xs text-(--color-muted) italic">
                  {state.lastOutput.reason}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </NeonCardBody>
    </NeonCard>
  );
}

// ─── Page Component ─────────────────────────────────────────────────

function ControllersPageComponent() {
  const { t } = useTranslation();
  const { storeData, connected, settings } = useAppStoreShallow((s) => ({
    storeData: s.energyData,
    connected: s.connected,
    settings: s.settings,
  }));
  const energyData = getDisplayData(storeData, connected);
  const [states, setStates] = useState<ControllerState[]>(() => controllerPipeline.getStates());

  const refreshStates = () => setStates(controllerPipeline.getStates());

  const handleRunCycle = () => {
    controllerPipeline.run(energyData, settings);
    refreshStates();
  };

  const handleToggle = (id: string, enabled: boolean) => {
    controllerPipeline.setEnabled(id, enabled);
    refreshStates();
  };

  const handleResetAll = () => {
    controllerPipeline.resetAll();
    refreshStates();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('controllers.title')}
        subtitle={t('controllers.pipelineSubtitle', 'OpenEMS-inspirierte Energieregler-Pipeline')}
        icon={<Cpu className="h-5 w-5" />}
      />

      {/* Pipeline Overview */}
      <PipelineStatusCard states={states} onRunCycle={handleRunCycle} onResetAll={handleResetAll} />

      {/* Controller Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {states.map((state) => (
          <ControllerCard key={state.id} state={state} onToggle={handleToggle} />
        ))}
      </div>

      {/* Merged Output Card */}
      <NeonCard variant="default">
        <NeonCardBody>
          <h2 className="fluid-text-base mb-4 font-semibold">
            {t('controllers.mergedOutput', 'Zusammengeführte Ausgabe')}
          </h2>
          {(() => {
            const merged = controllerPipeline.run(energyData, settings);
            return (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {merged.essPowerW !== undefined && (
                  <div className="rounded-xl border border-(--color-border) bg-white/[0.02] p-4">
                    <div className="mb-1 flex items-center gap-2">
                      <Battery className="h-4 w-4 text-(--color-primary)" />
                      <span className="fluid-text-xs text-(--color-muted)">ESS Power</span>
                    </div>
                    <span className="fluid-text-xl font-mono font-bold">
                      {merged.essPowerW > 0 ? '+' : ''}
                      {(merged.essPowerW / 1000).toFixed(2)}
                      <span className="fluid-text-sm ml-1 font-normal">kW</span>
                    </span>
                  </div>
                )}
                {merged.evCurrentA !== undefined && (
                  <div className="rounded-xl border border-(--color-border) bg-white/[0.02] p-4">
                    <div className="mb-1 flex items-center gap-2">
                      <Car className="h-4 w-4 text-blue-400" />
                      <span className="fluid-text-xs text-(--color-muted)">EV Current</span>
                    </div>
                    <span className="fluid-text-xl font-mono font-bold">
                      {merged.evCurrentA}
                      <span className="fluid-text-sm ml-1 font-normal">A</span>
                    </span>
                  </div>
                )}
                {merged.sgReadyMode !== undefined && (
                  <div className="rounded-xl border border-(--color-border) bg-white/[0.02] p-4">
                    <div className="mb-1 flex items-center gap-2">
                      <ThermometerSun className="h-4 w-4 text-orange-400" />
                      <span className="fluid-text-xs text-(--color-muted)">SG Ready</span>
                    </div>
                    <span className="fluid-text-xl font-mono font-bold">
                      {t('common.mode', 'Modus')} {merged.sgReadyMode}
                    </span>
                  </div>
                )}
                {merged.gridLimitW !== undefined && (
                  <div className="rounded-xl border border-(--color-border) bg-white/[0.02] p-4">
                    <div className="mb-1 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-400" />
                      <span className="fluid-text-xs text-(--color-muted)">Grid Limit</span>
                    </div>
                    <span className="fluid-text-xl font-mono font-bold">
                      {(merged.gridLimitW / 1000).toFixed(1)}
                      <span className="fluid-text-sm ml-1 font-normal">kW</span>
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
        </NeonCardBody>
      </NeonCard>

      <PageCrossLinks />
    </div>
  );
}

export default ControllersPageComponent;
