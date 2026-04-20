import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Info,
  Layers,
  Link2,
  Package,
  Play,
  Puzzle,
  Square,
  Trash2,
  XCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/layout/PageHeader';
import { NeonCard, NeonCardBody } from '../components/ui/NeonCard';
import { PageCrossLinks } from '../components/ui/PageCrossLinks';
import { type PluginEntry, type PluginState, pluginManager } from '../core/plugin-system';

// ─── State badge colors ─────────────────────────────────────────────

const STATE_STYLES: Record<PluginState, { color: string; Icon: typeof CheckCircle2 }> = {
  installed: { color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', Icon: Package },
  resolved: { color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30', Icon: Link2 },
  starting: { color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', Icon: Clock },
  active: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', Icon: CheckCircle2 },
  stopping: { color: 'text-orange-400 bg-orange-500/10 border-orange-500/30', Icon: Clock },
  uninstalled: { color: 'text-gray-400 bg-gray-500/10 border-gray-500/30', Icon: XCircle },
};

const STATE_I18N: Record<PluginState, string> = {
  installed: 'plugins.installed',
  resolved: 'plugins.resolved',
  starting: 'plugins.starting',
  active: 'plugins.running',
  stopping: 'plugins.stopping',
  uninstalled: 'plugins.uninstalled',
};

// ─── Category badge ─────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  adapter: 'text-purple-400 bg-purple-500/10',
  controller: 'text-orange-400 bg-orange-500/10',
  analytics: 'text-blue-400 bg-blue-500/10',
  ui: 'text-pink-400 bg-pink-500/10',
  integration: 'text-cyan-400 bg-cyan-500/10',
};

// ─── Overview Card ──────────────────────────────────────────────────

function PluginOverviewCard({ entries }: { entries: PluginEntry[] }) {
  const { t } = useTranslation();
  const active = entries.filter((e) => e.state === 'active').length;
  const total = entries.length;
  const services = pluginManager.listServices();

  return (
    <NeonCard variant="primary" glow>
      <NeonCardBody>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-(--color-primary)/10">
              <Puzzle className="h-6 w-6 text-(--color-primary)" />
            </div>
            <div>
              <h2 className="fluid-text-lg font-semibold">{t('plugins.title')}</h2>
              <p className="fluid-text-sm text-(--color-muted)">
                {active}/{total} {t('plugins.running')}
                {services.length > 0 && (
                  <span className="ml-2">
                    • {services.length} {t('plugins.services', 'Services')}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="fluid-text-2xl font-mono font-bold text-(--color-primary)">
                {total}
              </span>
              <p className="fluid-text-xs text-(--color-muted)">{t('plugins.installed')}</p>
            </div>
          </div>
        </div>
      </NeonCardBody>
    </NeonCard>
  );
}

// ─── Plugin Card ────────────────────────────────────────────────────

function PluginCard({
  entry,
  onStart,
  onStop,
  onUninstall,
}: {
  entry: PluginEntry;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onUninstall: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const { plugin, state, installedAt, activatedAt, error } = entry;
  const descriptor = plugin.descriptor;
  const stateStyle = STATE_STYLES[state] ?? STATE_STYLES.installed;
  const StateIcon = stateStyle.Icon;
  const categoryColor =
    CATEGORY_COLORS[descriptor.category ?? 'integration'] ?? CATEGORY_COLORS.integration;

  return (
    <NeonCard
      variant={error ? 'warning' : 'default'}
      hover={false}
      className={state === 'uninstalled' ? 'opacity-50' : ''}
    >
      <NeonCardBody className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-(--color-primary)/20 bg-(--color-primary)/10">
              <Puzzle className="h-5 w-5 text-(--color-primary)" />
            </div>
            <div>
              <h3 className="fluid-text-base font-semibold">{descriptor.name}</h3>
              <div className="fluid-text-xs flex items-center gap-2 text-(--color-muted)">
                <span className="font-mono">v{descriptor.version}</span>
                {descriptor.category && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${categoryColor}`}
                  >
                    {descriptor.category}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* State badge */}
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wider uppercase ${stateStyle.color}`}
            >
              <StateIcon className="h-3 w-3" />
              {t(STATE_I18N[state] ?? 'plugins.installed')}
            </span>

            {/* Expand */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="focus-ring rounded-lg p-1 text-(--color-muted) hover:text-(--color-text)"
              aria-expanded={expanded}
              aria-label={
                expanded ? t('common.collapse', 'Einklappen') : t('common.expand', 'Ausklappen')
              }
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Description */}
        {descriptor.description && (
          <p className="fluid-text-sm text-(--color-muted)">{descriptor.description}</p>
        )}

        {/* Error */}
        {error && (
          <div className="fluid-text-xs flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-red-400">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {state === 'installed' || state === 'resolved' ? (
            <button
              onClick={() => onStart(descriptor.id)}
              className="focus-ring flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
            >
              <Play className="h-3.5 w-3.5" />
              {t('plugins.start')}
            </button>
          ) : state === 'active' ? (
            <button
              onClick={() => onStop(descriptor.id)}
              className="focus-ring flex items-center gap-1.5 rounded-xl bg-orange-500/10 px-3 py-1.5 text-sm font-medium text-orange-400 transition-colors hover:bg-orange-500/20"
            >
              <Square className="h-3.5 w-3.5" />
              {t('plugins.stop')}
            </button>
          ) : null}

          {state !== 'active' && state !== 'uninstalled' && (
            <button
              onClick={() => onUninstall(descriptor.id)}
              className="focus-ring flex items-center gap-1.5 rounded-xl bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t('plugins.uninstall')}
            </button>
          )}
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 space-y-3 rounded-xl border border-(--color-border) bg-white/[0.02] p-4">
                {descriptor.author && (
                  <div className="fluid-text-sm flex justify-between">
                    <span className="text-(--color-muted)">{t('plugins.author')}</span>
                    <span>{descriptor.author}</span>
                  </div>
                )}
                <div className="fluid-text-sm flex justify-between">
                  <span className="text-(--color-muted)">{t('plugins.installed')}</span>
                  <span>{new Date(installedAt).toLocaleString()}</span>
                </div>
                {activatedAt && (
                  <div className="fluid-text-sm flex justify-between">
                    <span className="text-(--color-muted)">
                      {t('plugins.lastActivated', 'Letzte Aktivierung')}
                    </span>
                    <span>{new Date(activatedAt).toLocaleString()}</span>
                  </div>
                )}
                {descriptor.provides && descriptor.provides.length > 0 && (
                  <div>
                    <span className="fluid-text-xs font-semibold tracking-wider text-(--color-muted) uppercase">
                      {t('plugins.providesServices', 'Bereitgestellte Services')}
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {descriptor.provides.map((svc) => (
                        <span
                          key={svc}
                          className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] text-(--color-muted)"
                        >
                          {svc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {descriptor.dependencies && Object.keys(descriptor.dependencies).length > 0 && (
                  <div>
                    <span className="fluid-text-xs font-semibold tracking-wider text-(--color-muted) uppercase">
                      {t('plugins.dependencies')}
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {Object.entries(descriptor.dependencies).map(([depId, ver]) => (
                        <span
                          key={depId}
                          className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] text-(--color-muted)"
                        >
                          {depId}@{ver}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </NeonCardBody>
    </NeonCard>
  );
}

// ─── Empty State ────────────────────────────────────────────────────

function EmptyPluginState() {
  const { t } = useTranslation();
  return (
    <NeonCard variant="default">
      <NeonCardBody className="py-12 text-center">
        <Layers className="mx-auto mb-4 h-12 w-12 text-(--color-muted)" />
        <h3 className="fluid-text-lg mb-2 font-semibold">{t('plugins.noPlugins')}</h3>
        <p className="fluid-text-sm mx-auto max-w-md text-(--color-muted)">
          {t(
            'plugins.noPluginsDescription',
            'Das Plugin-System ist bereit. Plugins können über die API installiert werden.',
          )}
        </p>
      </NeonCardBody>
    </NeonCard>
  );
}

// ─── Services List ──────────────────────────────────────────────────

function ServicesList() {
  const { t } = useTranslation();
  const services = pluginManager.listServices();

  if (services.length === 0) return null;

  return (
    <NeonCard variant="default">
      <NeonCardBody>
        <div className="mb-3 flex items-center gap-2">
          <Info className="h-4 w-4 text-(--color-primary)" />
          <h3 className="fluid-text-base font-semibold">
            {t('plugins.serviceRegistry', 'Service Registry')}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {services.map((svc) => (
            <span
              key={svc}
              className="inline-flex items-center gap-1.5 rounded-xl border border-(--color-border) bg-white/[0.02] px-3 py-1.5 font-mono text-sm"
            >
              <Link2 className="h-3.5 w-3.5 text-(--color-primary)" />
              {svc}
            </span>
          ))}
        </div>
      </NeonCardBody>
    </NeonCard>
  );
}

// ─── Page Component ─────────────────────────────────────────────────

function PluginsPageComponent() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<PluginEntry[]>(() => pluginManager.list());

  const refresh = () => setEntries(pluginManager.list());

  const handleStart = async (id: string) => {
    await pluginManager.start(id);
    refresh();
  };

  const handleStop = async (id: string) => {
    await pluginManager.stop(id);
    refresh();
  };

  const handleUninstall = async (id: string) => {
    await pluginManager.uninstall(id);
    refresh();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('plugins.title')}
        subtitle={t('plugins.subtitle', 'OSGi-inspiriertes Plugin-Lifecycle-Management')}
        icon={<Puzzle className="h-5 w-5" />}
      />

      {/* Overview */}
      <PluginOverviewCard entries={entries} />

      {/* Services */}
      <ServicesList />

      {/* Plugin Grid */}
      {entries.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry) => (
            <PluginCard
              key={entry.plugin.descriptor.id}
              entry={entry}
              onStart={handleStart}
              onStop={handleStop}
              onUninstall={handleUninstall}
            />
          ))}
        </div>
      ) : (
        <EmptyPluginState />
      )}

      <PageCrossLinks />
    </div>
  );
}

export default PluginsPageComponent;
