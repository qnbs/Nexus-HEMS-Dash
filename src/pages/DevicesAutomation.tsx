import * as Dialog from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  ArrowUpDown,
  Battery,
  Building2,
  Car,
  ChevronRight,
  Filter,
  Gauge,
  LayoutGrid,
  Leaf,
  Map as MapIcon,
  PlugZap,
  Power,
  Search,
  Sun,
  Thermometer,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { lazy, Suspense, useActionState, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DemoBadge } from '../components/DemoBadge';
import { PageHeader } from '../components/layout/PageHeader';
import { ControlPanel as ControlPanelUI } from '../components/ui/ControlPanel';
import { EmptyState } from '../components/ui/EmptyState';
import { EnergyCard, type EnergyCardVariant } from '../components/ui/EnergyCard';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { LiveMetric } from '../components/ui/LiveMetric';
import { PageTour, type TourStep } from '../components/ui/PageTour';
import { useEnergyContext } from '../core/EnergyContext';
import { useLegacySendCommand } from '../core/useLegacySendCommand';
import { hapticClick, hapticModeChange, hapticSuccess } from '../lib/haptics';
import { useAppStoreShallow } from '../store';
import type { CommandType, EvMode, EvState, HpMode, HpState } from '../types';

// ─── Lazy-load Floorplan (heavy SVG component) ──────────────────────
const Floorplan = lazy(() =>
  import('../components/Floorplan').then((m) => ({ default: m.Floorplan })),
);

type DeviceView = 'grid' | 'floorplan';

// ─── Device category filter ──────────────────────────────────────────

type DeviceCategory = 'all' | 'pv' | 'storage' | 'ev' | 'heatpump' | 'building';

interface DeviceDefinition {
  id: string;
  category: DeviceCategory;
  icon: React.ReactNode;
  titleKey: string;
  variant: EnergyCardVariant;
}

const DEVICES: DeviceDefinition[] = [
  {
    id: 'pv',
    category: 'pv',
    icon: <Sun size={20} />,
    titleKey: 'devicesAuto.pvTitle',
    variant: 'success',
  },
  {
    id: 'storage',
    category: 'storage',
    icon: <Battery size={20} />,
    titleKey: 'devicesAuto.storageTitle',
    variant: 'primary',
  },
  {
    id: 'ev',
    category: 'ev',
    icon: <Car size={20} />,
    titleKey: 'devicesAuto.evTitle',
    variant: 'warning',
  },
  {
    id: 'heatpump',
    category: 'heatpump',
    icon: <Thermometer size={20} />,
    titleKey: 'devicesAuto.heatpumpTitle',
    variant: 'danger',
  },
  {
    id: 'building',
    category: 'building',
    icon: <Building2 size={20} />,
    titleKey: 'devicesAuto.buildingTitle',
    variant: 'neutral',
  },
];

const CATEGORY_FILTERS: { key: DeviceCategory; labelKey: string; icon: React.ReactNode }[] = [
  { key: 'all', labelKey: 'devicesAuto.filterAll', icon: <Filter size={14} /> },
  { key: 'pv', labelKey: 'devicesAuto.filterPV', icon: <Sun size={14} /> },
  { key: 'storage', labelKey: 'devicesAuto.filterStorage', icon: <Battery size={14} /> },
  { key: 'ev', labelKey: 'devicesAuto.filterEV', icon: <Car size={14} /> },
  { key: 'heatpump', labelKey: 'devicesAuto.filterHeatpump', icon: <Thermometer size={14} /> },
  { key: 'building', labelKey: 'devicesAuto.filterBuilding', icon: <Building2 size={14} /> },
];

// ─── Tour steps ──────────────────────────────────────────────────────
const TOUR_STEPS: TourStep[] = [
  {
    icon: Zap,
    titleKey: 'tour.devices.overviewTitle',
    descKey: 'tour.devices.overviewDesc',
    color: '#00f0ff',
  },
  {
    icon: Filter,
    titleKey: 'tour.devices.filterTitle',
    descKey: 'tour.devices.filterDesc',
    color: '#22ff88',
  },
  {
    icon: ChevronRight,
    titleKey: 'tour.devices.detailTitle',
    descKey: 'tour.devices.detailDesc',
    color: '#ff8800',
  },
];

// ─── Main Page Component ─────────────────────────────────────────────

export default function DevicesAutomation() {
  const { t } = useTranslation();
  const { data: displayData, unified } = useEnergyContext();
  const { sendCommand } = useLegacySendCommand();
  const settings = useAppStoreShallow((s) => s.settings);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<DeviceCategory>('all');
  const [detailDevice, setDetailDevice] = useState<string | null>(null);
  const [view, setView] = useState<DeviceView>('grid');

  // Filter devices
  const filtered = DEVICES.filter((d) => {
    if (category !== 'all' && d.category !== category) return false;
    if (search.trim()) {
      const label = t(d.titleKey).toLowerCase();
      return label.includes(search.trim().toLowerCase());
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageTour tourId="devices-automation" steps={TOUR_STEPS} />
      <DemoBadge />
      <PageHeader
        title={t('devicesAuto.title')}
        subtitle={t('devicesAuto.subtitle')}
        icon={<Zap size={22} />}
        actions={
          <div
            className="flex gap-1 rounded-xl bg-(--color-surface)/50 p-1"
            role="tablist"
            aria-label={t('devicesAuto.viewToggle', 'Ansicht wechseln')}
          >
            <button
              type="button"
              role="tab"
              aria-selected={view === 'grid'}
              onClick={() => {
                hapticClick();
                setView('grid');
              }}
              className={`focus-ring flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-xs transition-all ${
                view === 'grid'
                  ? 'bg-(--color-primary)/15 text-(--color-primary)'
                  : 'text-(--color-muted) hover:text-(--color-text)'
              }`}
            >
              <LayoutGrid size={14} />
              {t('devicesAuto.viewGrid', 'Geräte')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'floorplan'}
              onClick={() => {
                hapticClick();
                setView('floorplan');
              }}
              className={`focus-ring flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-xs transition-all ${
                view === 'floorplan'
                  ? 'bg-(--color-primary)/15 text-(--color-primary)'
                  : 'text-(--color-muted) hover:text-(--color-text)'
              }`}
            >
              <MapIcon size={14} />
              {t('devicesAuto.viewFloorplan', 'Grundriss')}
            </button>
          </div>
        }
      />

      <AnimatePresence mode="wait">
        {view === 'floorplan' ? (
          <motion.div
            key="floorplan"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <section
              className="glass-panel-strong overflow-hidden rounded-2xl p-4 sm:p-6"
              aria-label={t('dashboard.floorplan')}
            >
              <Suspense
                fallback={
                  <div className="flex min-h-[40vh] items-center justify-center" role="status">
                    <div className="h-6 w-6 animate-spin rounded-full border-(--color-primary) border-2 border-t-transparent" />
                  </div>
                }
              >
                <Floorplan />
              </Suspense>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* ── Filter & Search Bar ── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Search */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search
                  size={16}
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-(--color-muted)"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('devicesAuto.searchPlaceholder')}
                  className="focus-ring w-full rounded-lg border border-(--color-border) bg-(--color-surface) py-2 pr-3 pl-9 text-(--color-text) text-sm placeholder:text-(--color-muted)"
                  aria-label={t('devicesAuto.searchPlaceholder')}
                />
              </div>

              {/* Category filters + help */}
              <div className="flex items-center gap-2">
                <HelpTooltip
                  content={t(
                    'tour.devices.filterHelp',
                    'Filtern Sie Geräte nach Kategorie oder nutzen Sie die Suche',
                  )}
                />
                <div
                  className="flex flex-wrap gap-1.5"
                  role="radiogroup"
                  aria-label={t('devicesAuto.filterLabel')}
                >
                  {CATEGORY_FILTERS.map((f) => (
                    // biome-ignore lint/a11y/useSemanticElements: radio-style button inside radiogroup, input[type=radio] would break styled layout
                    <button
                      key={f.key}
                      type="button"
                      role="radio"
                      aria-checked={category === f.key}
                      onClick={() => {
                        hapticClick();
                        setCategory(f.key);
                      }}
                      className={`focus-ring flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-medium text-xs transition-all ${
                        category === f.key
                          ? 'border-(--color-primary) bg-(--color-primary)/15 text-(--color-primary)'
                          : 'border-(--color-border) bg-(--color-surface) text-(--color-muted) hover:border-(--color-primary)/40'
                      }`}
                    >
                      <span aria-hidden="true">{f.icon}</span>
                      {t(f.labelKey)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* ── Device Grid ── */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((device) => (
                  <DeviceCard
                    key={device.id}
                    device={device}
                    data={displayData}
                    unified={unified}
                    settings={settings}
                    sendCommand={sendCommand}
                    onOpenDetail={() => setDetailDevice(device.id)}
                  />
                ))}
              </AnimatePresence>
            </div>

            {filtered.length === 0 && (
              <EmptyState
                icon={Search}
                title={t('devicesAuto.noResults')}
                description={t(
                  'tour.devices.emptyDesc',
                  'Versuchen Sie einen anderen Suchbegriff oder setzen Sie den Filter zurück.',
                )}
                pulse
                action={
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setCategory('all');
                    }}
                    className="focus-ring rounded-xl bg-(--color-primary)/15 px-4 py-2 font-semibold text-(--color-primary) text-xs transition-colors hover:bg-(--color-primary)/25"
                  >
                    {t('devicesAuto.filterAll')}
                  </button>
                }
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Detail Dialog (portal, available from both views) ── */}
      <DeviceDetailDialog
        deviceId={detailDevice}
        onClose={() => setDetailDevice(null)}
        data={displayData}
        unified={unified}
        settings={settings}
        sendCommand={sendCommand}
      />
    </div>
  );
}

// ─── Device Card Component ───────────────────────────────────────────

interface DeviceCardProps {
  device: DeviceDefinition;
  data: import('../types').EnergyData;
  unified: import('../core/adapters/EnergyAdapter').UnifiedEnergyModel;
  settings: import('../types').StoredSettings;
  sendCommand: (type: CommandType, value: number) => void;
  onOpenDetail: () => void;
}

function DeviceCard({
  device,
  data,
  unified,
  settings,
  sendCommand,
  onOpenDetail,
}: DeviceCardProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
    >
      <EnergyCard variant={device.variant}>
        <div className="flex w-full flex-col gap-3">
          {/* Header row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-(--color-primary)">{device.icon}</span>
              <span className="font-medium text-(--color-text)">{t(device.titleKey)}</span>
            </div>
            <DeviceStatusBadge deviceId={device.id} data={data} unified={unified} />
          </div>

          {/* Metric row */}
          <DeviceMetricRow deviceId={device.id} data={data} unified={unified} settings={settings} />

          {/* Quick action + detail button */}
          <div className="flex items-center gap-2">
            <QuickAction
              deviceId={device.id}
              data={data}
              settings={settings}
              sendCommand={sendCommand}
            />
            <button
              type="button"
              onClick={onOpenDetail}
              className="focus-ring ml-auto flex items-center gap-1 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-1.5 font-medium text-(--color-muted) text-xs transition-colors hover:border-(--color-primary)/40 hover:text-(--color-primary)"
            >
              {t('devicesAuto.details')}
              <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </EnergyCard>
    </motion.div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────

function DeviceStatusBadge({
  deviceId,
  data,
  unified,
}: {
  deviceId: string;
  data: import('../types').EnergyData;
  unified: import('../core/adapters/EnergyAdapter').UnifiedEnergyModel;
}) {
  const { t } = useTranslation();

  const { label, color } = getDeviceStatus(deviceId, data, unified);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-xs ${color}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {t(label)}
    </span>
  );
}

function getDeviceStatus(
  deviceId: string,
  data: import('../types').EnergyData,
  unified: import('../core/adapters/EnergyAdapter').UnifiedEnergyModel,
): { label: string; color: string } {
  switch (deviceId) {
    case 'pv':
      return data.pvPower > 50
        ? { label: 'devicesAuto.statusProducing', color: 'bg-emerald-500/15 text-emerald-400' }
        : { label: 'devicesAuto.statusIdle', color: 'bg-(--color-muted)/15 text-(--color-muted)' };
    case 'storage':
      return data.batteryPower > 10
        ? { label: 'devicesAuto.statusCharging', color: 'bg-blue-500/15 text-blue-400' }
        : data.batteryPower < -10
          ? { label: 'devicesAuto.statusDischarging', color: 'bg-amber-500/15 text-amber-400' }
          : {
              label: 'devicesAuto.statusStandby',
              color: 'bg-(--color-muted)/15 text-(--color-muted)',
            };
    case 'ev':
      return data.evPower > 50
        ? { label: 'devicesAuto.statusCharging', color: 'bg-purple-500/15 text-purple-400' }
        : { label: 'devicesAuto.statusReady', color: 'bg-(--color-muted)/15 text-(--color-muted)' };
    case 'heatpump':
      return data.heatPumpPower > 50
        ? { label: 'devicesAuto.statusRunning', color: 'bg-orange-500/15 text-orange-400' }
        : { label: 'devicesAuto.statusIdle', color: 'bg-(--color-muted)/15 text-(--color-muted)' };
    case 'building': {
      const rooms = unified.knx?.rooms ?? [];
      const anyLightsOn = rooms.some((r) => r.lightsOn);
      return anyLightsOn
        ? { label: 'devicesAuto.statusActive', color: 'bg-sky-500/15 text-sky-400' }
        : { label: 'devicesAuto.statusIdle', color: 'bg-(--color-muted)/15 text-(--color-muted)' };
    }
    default:
      return {
        label: 'devicesAuto.statusIdle',
        color: 'bg-(--color-muted)/15 text-(--color-muted)',
      };
  }
}

// ─── Metric Row ──────────────────────────────────────────────────────

function DeviceMetricRow({
  deviceId,
  data,
  unified,
  settings,
}: {
  deviceId: string;
  data: import('../types').EnergyData;
  unified: import('../core/adapters/EnergyAdapter').UnifiedEnergyModel;
  settings: import('../types').StoredSettings;
}) {
  const { t } = useTranslation();

  switch (deviceId) {
    case 'pv':
      return (
        <div className="flex items-baseline justify-between gap-2">
          <LiveMetric value={data.pvPower / 1000} unit="kW" format="power" size="sm" />
          <span className="text-(--color-muted) text-xs">
            {t('devicesAuto.yieldToday')}: {data.pvYieldToday.toFixed(1)} kWh
          </span>
        </div>
      );
    case 'storage':
      return (
        <div className="flex items-center gap-3">
          <LiveMetric
            value={Math.abs(data.batteryPower) / 1000}
            unit="kW"
            format="power"
            size="sm"
          />
          <div className="flex flex-1 items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-(--color-surface)">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                initial={false}
                animate={{ width: `${Math.min(100, Math.max(0, data.batterySoC))}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="font-mono text-(--color-muted) text-xs">
              {data.batterySoC.toFixed(0)}%
            </span>
          </div>
        </div>
      );
    case 'ev':
      return (
        <div className="flex items-baseline justify-between gap-2">
          <LiveMetric value={data.evPower / 1000} unit="kW" format="power" size="sm" />
          <span className="text-(--color-muted) text-xs">
            {t('devicesAuto.maxPower')}: {settings.systemConfig.evCharger.maxPowerKW} kW
          </span>
        </div>
      );
    case 'heatpump':
      return (
        <div className="flex items-baseline justify-between gap-2">
          <LiveMetric value={data.heatPumpPower / 1000} unit="kW" format="power" size="sm" />
          <span className="flex items-center gap-1 text-(--color-muted) text-xs">
            <Gauge size={12} /> SG Ready
          </span>
        </div>
      );
    case 'building': {
      const rooms = unified.knx?.rooms ?? [];
      const lightsOn = rooms.filter((r) => r.lightsOn).length;
      return (
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono font-semibold text-(--color-text) text-lg tabular-nums">
            {rooms.length} {t('devicesAuto.rooms')}
          </span>
          <span className="text-(--color-muted) text-xs">
            {lightsOn} {t('devicesAuto.lightsOn')}
          </span>
        </div>
      );
    }
    default:
      return null;
  }
}

// ─── Quick Action (1-Click Control) ──────────────────────────────────

function QuickAction({
  deviceId,
  data,
  settings,
  sendCommand,
}: {
  deviceId: string;
  data: import('../types').EnergyData;
  settings: import('../types').StoredSettings;
  sendCommand: (type: CommandType, value: number) => void;
}) {
  const { t } = useTranslation();

  switch (deviceId) {
    case 'pv':
      return (
        <span className="flex items-center gap-1 text-(--color-muted) text-xs">
          <Leaf size={12} className="text-emerald-400" />
          {t('devicesAuto.pvAutoOptimized')}
        </span>
      );
    case 'storage':
      return <BatteryQuickAction data={data} sendCommand={sendCommand} />;
    case 'ev':
      return <EVQuickAction data={data} settings={settings} sendCommand={sendCommand} />;
    case 'heatpump':
      return <HeatPumpQuickAction sendCommand={sendCommand} />;
    case 'building':
      return <BuildingQuickAction sendCommand={sendCommand} />;
    default:
      return null;
  }
}

function BatteryQuickAction({
  data,
  sendCommand,
}: {
  data: import('../types').EnergyData;
  sendCommand: (type: CommandType, value: number) => void;
}) {
  const { t } = useTranslation();
  const isCharging = data.batteryPower > 10;

  return (
    <button
      type="button"
      onClick={() => {
        hapticModeChange();
        sendCommand('SET_BATTERY_POWER', isCharging ? 0 : 3000);
        hapticSuccess();
      }}
      className="focus-ring flex items-center gap-1.5 rounded-lg bg-(--color-primary)/10 px-3 py-1.5 font-medium text-(--color-primary) text-xs transition-colors hover:bg-(--color-primary)/20"
    >
      <ArrowUpDown size={12} aria-hidden="true" />
      {isCharging ? t('control.auto') : t('control.forceCharge')}
    </button>
  );
}

function EVQuickAction({
  data,
  settings,
  sendCommand,
}: {
  data: import('../types').EnergyData;
  settings: import('../types').StoredSettings;
  sendCommand: (type: CommandType, value: number) => void;
}) {
  const { t } = useTranslation();
  const isCharging = data.evPower > 50;

  return (
    <button
      type="button"
      onClick={() => {
        hapticModeChange();
        if (isCharging) {
          sendCommand('SET_EV_POWER', 0);
        } else {
          const pvSurplus = Math.max(0, data.pvPower - data.houseLoad);
          sendCommand(
            'SET_EV_POWER',
            pvSurplus > 1500 ? pvSurplus : settings.systemConfig.evCharger.maxPowerKW * 1000,
          );
        }
        hapticSuccess();
      }}
      className="focus-ring flex items-center gap-1.5 rounded-lg bg-(--color-primary)/10 px-3 py-1.5 font-medium text-(--color-primary) text-xs transition-colors hover:bg-(--color-primary)/20"
    >
      <PlugZap size={12} aria-hidden="true" />
      {isCharging ? t('control.evOff') : t('devicesAuto.startCharging')}
    </button>
  );
}

function HeatPumpQuickAction({
  sendCommand,
}: {
  sendCommand: (type: CommandType, value: number) => void;
}) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={() => {
        hapticModeChange();
        sendCommand('SET_HEAT_PUMP_POWER', 1500);
        hapticSuccess();
      }}
      className="focus-ring flex items-center gap-1.5 rounded-lg bg-(--color-primary)/10 px-3 py-1.5 font-medium text-(--color-primary) text-xs transition-colors hover:bg-(--color-primary)/20"
    >
      <Power size={12} aria-hidden="true" />
      {t('devicesAuto.sgReadyBoost')}
    </button>
  );
}

function BuildingQuickAction({
  sendCommand,
}: {
  sendCommand: (type: CommandType, value: number) => void;
}) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={() => {
        hapticModeChange();
        sendCommand('TOGGLE_KNX_LIGHTS', 0);
        hapticSuccess();
      }}
      className="focus-ring flex items-center gap-1.5 rounded-lg bg-(--color-primary)/10 px-3 py-1.5 font-medium text-(--color-primary) text-xs transition-colors hover:bg-(--color-primary)/20"
    >
      <Power size={12} aria-hidden="true" />
      {t('devicesAuto.allLightsOff')}
    </button>
  );
}

// ─── Detail Dialog (ControlPanel in Modal) ───────────────────────────

interface DeviceDetailDialogProps {
  deviceId: string | null;
  onClose: () => void;
  data: import('../types').EnergyData;
  unified: import('../core/adapters/EnergyAdapter').UnifiedEnergyModel;
  settings: import('../types').StoredSettings;
  sendCommand: (type: CommandType, value: number) => void;
}

function DeviceDetailDialog({
  deviceId,
  onClose,
  data,
  unified,
  settings,
  sendCommand,
}: DeviceDetailDialogProps) {
  const { t } = useTranslation();
  const device = DEVICES.find((d) => d.id === deviceId);

  return (
    <Dialog.Root
      open={deviceId != null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        </Dialog.Overlay>
        <Dialog.Content asChild>
          <motion.div
            className="fixed top-1/2 left-1/2 z-50 max-h-[85vh] w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Dialog.Title asChild>
              <VisuallyHidden>{device ? t(device.titleKey) : ''}</VisuallyHidden>
            </Dialog.Title>
            <Dialog.Description asChild>
              <VisuallyHidden>{t('devicesAuto.detailDescription')}</VisuallyHidden>
            </Dialog.Description>

            <ControlPanelUI
              title={
                <span className="flex items-center gap-2">
                  {device?.icon}
                  {device ? t(device.titleKey) : ''}
                </span>
              }
              onClose={onClose}
              closeLabel={t('common.close')}
            >
              {deviceId && (
                <DeviceDetailContent
                  deviceId={deviceId}
                  data={data}
                  unified={unified}
                  settings={settings}
                  sendCommand={sendCommand}
                />
              )}
            </ControlPanelUI>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Detail Content per Device ───────────────────────────────────────

function DeviceDetailContent({
  deviceId,
  data,
  unified,
  settings,
  sendCommand,
}: {
  deviceId: string;
  data: import('../types').EnergyData;
  unified: import('../core/adapters/EnergyAdapter').UnifiedEnergyModel;
  settings: import('../types').StoredSettings;
  sendCommand: (type: CommandType, value: number) => void;
}) {
  switch (deviceId) {
    case 'pv':
      return <PVDetail data={data} settings={settings} />;
    case 'storage':
      return <StorageDetail data={data} sendCommand={sendCommand} />;
    case 'ev':
      return <EVDetail data={data} settings={settings} sendCommand={sendCommand} />;
    case 'heatpump':
      return <HeatPumpDetail data={data} sendCommand={sendCommand} />;
    case 'building':
      return <BuildingDetail unified={unified} sendCommand={sendCommand} />;
    default:
      return null;
  }
}

// ── PV Detail ────────────────────────────────────────────────────────

function PVDetail({
  data,
  settings,
}: {
  data: import('../types').EnergyData;
  settings: import('../types').StoredSettings;
}) {
  const { t } = useTranslation();
  const peakKWp = settings.systemConfig.pv.peakPowerKWp;
  const currentKW = data.pvPower / 1000;
  const utilizationPct = peakKWp > 0 ? (currentKW / peakKWp) * 100 : 0;

  return (
    <div className="space-y-4">
      <MetricRow label={t('devicesAuto.currentPower')} value={`${currentKW.toFixed(2)} kW`} />
      <MetricRow
        label={t('devicesAuto.yieldToday')}
        value={`${data.pvYieldToday.toFixed(1)} kWh`}
      />
      <MetricRow label={t('devicesAuto.peakPower')} value={`${peakKWp} kWp`} />
      <MetricRow label={t('devicesAuto.utilization')} value={`${utilizationPct.toFixed(0)}%`} />
      <MetricRow
        label={t('devicesAuto.orientation')}
        value={settings.systemConfig.pv.orientation}
      />
      <MetricRow
        label={t('devicesAuto.strings')}
        value={`${settings.systemConfig.pv.strings} × ${settings.systemConfig.pv.mpptCount} MPPT`}
      />
    </div>
  );
}

// ── Storage Detail ───────────────────────────────────────────────────

function StorageDetail({
  data,
  sendCommand,
}: {
  data: import('../types').EnergyData;
  sendCommand: (type: CommandType, value: number) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <MetricRow
        label={t('devicesAuto.currentPower')}
        value={`${(Math.abs(data.batteryPower) / 1000).toFixed(2)} kW`}
      />
      <MetricRow label={t('devicesAuto.soc')} value={`${data.batterySoC.toFixed(0)}%`} />
      <MetricRow label={t('devicesAuto.voltage')} value={`${data.batteryVoltage.toFixed(1)} V`} />
      <div className="h-3 overflow-hidden rounded-full bg-(--color-surface)">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
          initial={false}
          animate={{ width: `${Math.min(100, Math.max(0, data.batterySoC))}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <motion.button
          type="button"
          onClick={() => {
            hapticModeChange();
            sendCommand('SET_BATTERY_POWER', 3000);
            hapticSuccess();
          }}
          className="btn-primary focus-ring flex-1 text-sm"
          whileTap={{ scale: 0.97 }}
        >
          {t('control.forceCharge')}
        </motion.button>
        <motion.button
          type="button"
          onClick={() => {
            hapticModeChange();
            sendCommand('SET_BATTERY_POWER', 0);
            hapticSuccess();
          }}
          className="btn-secondary focus-ring flex-1 text-sm"
          whileTap={{ scale: 0.97 }}
        >
          {t('control.auto')}
        </motion.button>
      </div>
    </div>
  );
}

// ── EV Detail ────────────────────────────────────────────────────────

function EVDetail({
  data,
  settings,
  sendCommand,
}: {
  data: import('../types').EnergyData;
  settings: import('../types').StoredSettings;
  sendCommand: (type: CommandType, value: number) => void;
}) {
  const { t } = useTranslation();

  const [evState, evAction, isEvPending] = useActionState(
    async (_state: EvState, formData: FormData) => {
      hapticModeChange();
      const mode = (formData.get('evMode') ?? 'off') as EvMode;
      const power =
        mode === 'fast'
          ? settings.systemConfig.evCharger.maxPowerKW * 1000
          : mode === 'pv'
            ? Math.max(0, data.pvPower - data.houseLoad)
            : 0;
      await new Promise((resolve) => setTimeout(resolve, 800));
      sendCommand('SET_EV_POWER', power);
      hapticSuccess();
      return { mode, power, message: t('control.evUpdated') };
    },
    { mode: 'off' as EvMode, power: 0, message: '' },
  );

  return (
    <div className="space-y-4">
      <MetricRow
        label={t('devicesAuto.currentPower')}
        value={`${(data.evPower / 1000).toFixed(2)} kW`}
      />
      <MetricRow
        label={t('devicesAuto.maxPower')}
        value={`${settings.systemConfig.evCharger.maxPowerKW} kW`}
      />
      <MetricRow
        label={t('devicesAuto.model')}
        value={settings.systemConfig.evCharger.model || '—'}
      />

      <form action={evAction} className="space-y-3 pt-2">
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('control.evTitle')}>
          {(['off', 'pv', 'fast'] as const).map((mode) => (
            <label
              key={mode}
              className={`cursor-pointer rounded-lg border px-2 py-2 text-center font-medium text-xs transition-all focus-within:ring-(--color-primary)/40 focus-within:ring-2 sm:text-sm ${
                evState.mode === mode
                  ? 'border-(--color-primary) bg-(--color-primary)/20 text-(--color-primary)'
                  : 'border-(--color-border) bg-(--color-surface) text-(--color-muted) hover:border-(--color-primary)/40'
              }`}
            >
              <input
                type="radio"
                name="evMode"
                value={mode}
                className="sr-only"
                checked={evState.mode === mode}
                onChange={hapticClick}
              />
              {t(`control.ev${mode.charAt(0).toUpperCase() + mode.slice(1)}`)}
            </label>
          ))}
        </div>
        {evState.message && (
          <p className="text-(--color-primary) text-sm" role="status" aria-live="polite">
            ✓ {evState.message}
          </p>
        )}
        <motion.button
          type="submit"
          disabled={isEvPending}
          className="btn-primary focus-ring w-full"
          whileTap={{ scale: 0.97 }}
        >
          {isEvPending ? t('common.saving') : t('common.apply')}
        </motion.button>
      </form>
    </div>
  );
}

// ── Heat Pump Detail ─────────────────────────────────────────────────

function HeatPumpDetail({
  data,
  sendCommand,
}: {
  data: import('../types').EnergyData;
  sendCommand: (type: CommandType, value: number) => void;
}) {
  const { t } = useTranslation();

  const [hpState, hpAction, isHpPending] = useActionState(
    async (_state: HpState, formData: FormData) => {
      hapticModeChange();
      const mode = (formData.get('hpMode') ?? '2') as HpMode;
      const powerMap: Record<string, number> = { '1': 0, '2': 800, '3': 1500, '4': 2500 };
      const power = powerMap[mode] ?? 800;
      await new Promise((resolve) => setTimeout(resolve, 600));
      sendCommand('SET_HEAT_PUMP_POWER', power);
      hapticSuccess();
      return { mode, power, message: t('control.hpUpdated') };
    },
    { mode: '2' as HpMode, power: 800, message: '' },
  );

  return (
    <div className="space-y-4">
      <MetricRow
        label={t('devicesAuto.currentPower')}
        value={`${(data.heatPumpPower / 1000).toFixed(2)} kW`}
      />
      <MetricRow label={t('devicesAuto.sgReadyMode')} value={`${t('control.hpMode2')}`} />

      <form action={hpAction} className="space-y-3 pt-2">
        <select
          name="hpMode"
          defaultValue={hpState.mode}
          onChange={hapticClick}
          aria-label={t('control.hpTitle')}
          className="focus-ring w-full rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2 text-(--color-text) text-sm"
        >
          <option value="1">{t('control.hpMode1')}</option>
          <option value="2">{t('control.hpMode2')}</option>
          <option value="3">{t('control.hpMode3')}</option>
          <option value="4">{t('control.hpMode4')}</option>
        </select>
        {hpState.message && (
          <p className="text-(--color-primary) text-sm" role="status" aria-live="polite">
            ✓ {hpState.message}
          </p>
        )}
        <motion.button
          type="submit"
          disabled={isHpPending}
          className="btn-primary focus-ring w-full"
          whileTap={{ scale: 0.97 }}
        >
          {isHpPending ? t('common.saving') : t('common.apply')}
        </motion.button>
      </form>
    </div>
  );
}

// ── Building / KNX Detail ────────────────────────────────────────────

function BuildingDetail({
  unified,
  sendCommand,
}: {
  unified: import('../core/adapters/EnergyAdapter').UnifiedEnergyModel;
  sendCommand: (type: CommandType, value: number) => void;
}) {
  const { t } = useTranslation();
  const rooms = unified.knx?.rooms ?? [];

  return (
    <div className="space-y-3">
      {rooms.length === 0 && (
        <p className="text-(--color-muted) text-sm">{t('devicesAuto.noKnxRooms')}</p>
      )}
      {rooms.map((room) => (
        <div
          key={room.name}
          className="flex items-center justify-between rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2"
        >
          <div>
            <span className="font-medium text-(--color-text) text-sm">{room.name}</span>
            <span className="ml-2 text-(--color-muted) text-xs">
              {room.temperature.toFixed(1)} °C
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                hapticClick();
                sendCommand('TOGGLE_KNX_LIGHTS', room.lightsOn ? 0 : 1);
              }}
              className={`focus-ring rounded-md px-2 py-1 font-medium text-xs transition-colors ${
                room.lightsOn
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-(--color-surface) text-(--color-muted) hover:text-(--color-text)'
              }`}
              aria-label={`${t('floorplan.lights')} ${room.name}`}
            >
              {t('floorplan.lights')} {room.lightsOn ? '●' : '○'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Shared Helpers ──────────────────────────────────────────────────

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-(--color-muted)">{label}</span>
      <span className="font-medium font-mono text-(--color-text)">{value}</span>
    </div>
  );
}
