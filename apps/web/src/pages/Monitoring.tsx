import {
  Activity,
  ChevronDown,
  ChevronUp,
  Eye,
  Lock,
  Server,
  ShieldAlert,
  ShieldCheck,
  Wifi,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/layout/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { PageCrossLinks } from '../components/ui/PageCrossLinks';
import { useAppStoreShallow } from '../store';

// ─── Lazy-load the full monitoring panel ─────────────────────────────
const MonitoringPage = lazy(() => import('./MonitoringPage'));

function TabFallback() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[30vh] items-center justify-center" role="status">
      <div className="flex flex-col items-center gap-3">
        <div
          className="cyber-shimmer h-6 w-6 animate-spin rounded-full border-(--color-primary) border-2 border-t-transparent"
          aria-hidden="true"
        />
        <span className="text-(--color-muted) text-xs">{t('common.loading', 'Laden…')}</span>
      </div>
    </div>
  );
}

// ─── Unified Monitoring & Health Page ────────────────────────────────

function MonitoringUnifiedComponent() {
  const { t } = useTranslation();
  const { connected, debugMode } = useAppStoreShallow((s) => ({
    connected: s.connected,
    debugMode: s.settings.debugMode ?? false,
  }));
  const [powerUserMode, setPowerUserMode] = useState(debugMode ?? false);
  const [showAdvancedHint, setShowAdvancedHint] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('monitoringUnified.title')}
        subtitle={t('monitoringUnified.subtitle')}
        icon={<Eye size={22} aria-hidden="true" />}
        actions={
          <div className="flex items-center gap-3">
            {/* Connection status */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold text-[10px] uppercase tracking-wider ${
                connected ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
              }`}
            >
              <span
                className={`energy-pulse h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`}
              />
              {connected ? t('common.connected') : t('common.disconnected')}
            </span>
          </div>
        }
      />

      {/* ─── Quick System Status Banner ──────────────────────────── */}
      <motion.section
        className="glass-panel-strong hover-lift p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {connected ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15">
                <ShieldCheck size={24} className="text-emerald-400" />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15">
                <ShieldAlert size={24} className="text-red-400" />
              </div>
            )}
            <div>
              <h2 className="font-medium text-(--color-text) text-lg">
                {connected
                  ? t('monitoringUnified.systemHealthy')
                  : t('monitoringUnified.systemDegraded')}
              </h2>
              <p className="text-(--color-muted) text-xs">{t('monitoringUnified.statusHint')}</p>
            </div>
          </div>

          {/* Quick status pills */}
          <div className="flex flex-wrap gap-2">
            <StatusPill label="MQTT" ok={connected} />
            <StatusPill label="KNX/IP" ok={true} />
            <StatusPill label="OCPP" ok={true} />
            <StatusPill label="EEBUS" ok={true} />
          </div>
        </div>
      </motion.section>

      {/* ─── Power User Toggle ─────────────────────────────────────── */}
      <motion.div
        className="glass-panel rounded-2xl p-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--color-primary)/10">
              <Server size={20} className="text-(--color-primary)" />
            </div>
            <div>
              <p className="flex items-center gap-1.5 font-medium text-(--color-text) text-sm">
                {t('monitoringUnified.powerUserMode')}
                <HelpTooltip
                  content={t(
                    'tour.monitoring.powerUserHelp',
                    'Zeigt Prometheus-Metriken, Adapter-Logs und erweiterte Diagnosedaten.',
                  )}
                />
              </p>
              <p className="text-(--color-muted) text-xs">
                {t('monitoringUnified.powerUserModeHint')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!powerUserMode && (
              <button
                type="button"
                onClick={() => setShowAdvancedHint(!showAdvancedHint)}
                className="focus-ring rounded-lg p-1.5 text-(--color-muted) hover:text-(--color-text)"
                aria-label={t('common.info')}
              >
                {showAdvancedHint ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            )}
            <label
              htmlFor="power-user-toggle"
              className="relative inline-flex cursor-pointer items-center"
            >
              <input
                id="power-user-toggle"
                type="checkbox"
                checked={powerUserMode}
                onChange={(e) => setPowerUserMode(e.target.checked)}
                className="peer sr-only"
              />
              <span className="sr-only">{t('monitoringUnified.powerUserMode')}</span>
              <div className="h-6 w-11 rounded-full border border-(--color-border) bg-(--color-surface) transition-colors duration-300 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:duration-300 peer-checked:bg-(--color-primary) peer-checked:after:translate-x-5 peer-focus:ring-(--color-primary)/30 peer-focus:ring-2" />
            </label>
          </div>
        </div>

        {/* Info hint when collapsed */}
        <AnimatePresence>
          {showAdvancedHint && !powerUserMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 rounded-xl border border-(--color-primary)/20 bg-(--color-primary)/5 p-3 text-(--color-muted) text-xs">
                <span className="font-medium text-(--color-primary)" aria-hidden="true">
                  💡{' '}
                </span>
                {t('monitoringUnified.powerUserHint')}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ─── Summary Cards (always visible) ────────────────────────── */}
      {!powerUserMode && (
        <motion.div
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <SummaryCard
            icon={<Wifi size={18} className="text-emerald-400" />}
            label={t('monitoringUnified.adaptersOnline')}
            value={connected ? '5/5' : '0/5'}
            status={connected ? 'ok' : 'crit'}
          />
          <SummaryCard
            icon={<Activity size={18} className="text-blue-400" />}
            label={t('monitoringUnified.prometheusStatus')}
            value={t('common.active')}
            status="ok"
          />
          <SummaryCard
            icon={<Server size={18} className="text-purple-400" />}
            label={t('monitoringUnified.systemLoad')}
            value="23%"
            status="ok"
          />
          <SummaryCard
            icon={<Lock size={18} className="text-cyan-400" />}
            label={t('monitoringUnified.security')}
            value={t('monitoringUnified.securityOk')}
            status="ok"
          />
        </motion.div>
      )}

      {/* ─── Full Monitoring Panel (power user mode) ───────────────── */}
      <AnimatePresence>
        {powerUserMode && (
          <motion.div
            key="monitoring-full"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Suspense fallback={<TabFallback />}>
              <MonitoringPage />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Invite to enable power user mode ──────────────────────── */}
      {!powerUserMode && (
        <EmptyState
          icon={Eye}
          title={t('monitoringUnified.enableHint')}
          description={t(
            'tour.monitoring.emptyDesc',
            'Aktiviere den Power-User-Modus, um Prometheus-Metriken, Adapter-Status und Ereignislogs einzusehen.',
          )}
          pulse
          action={
            <button
              type="button"
              onClick={() => setPowerUserMode(true)}
              className="focus-ring rounded-xl bg-(--color-primary)/15 px-4 py-2 font-medium text-(--color-primary) text-sm transition-colors hover:bg-(--color-primary)/25"
            >
              {t('monitoringUnified.enableButton')}
            </button>
          }
        />
      )}

      <PageCrossLinks />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function StatusPill({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium text-[10px] ${
        ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
      {label}
    </span>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  status: 'ok' | 'warn' | 'crit';
}) {
  const dot =
    status === 'crit' ? 'bg-red-400' : status === 'warn' ? 'bg-yellow-400' : 'bg-emerald-400';

  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
          {icon}
        </span>
        <span
          className={`h-2.5 w-2.5 rounded-full ${dot} ${status !== 'ok' ? 'energy-pulse' : ''}`}
        />
      </div>
      <p className="font-medium text-(--color-text) text-lg">{value}</p>
      <p className="mt-0.5 text-(--color-muted) text-[10px]">{label}</p>
    </div>
  );
}

export default MonitoringUnifiedComponent;
