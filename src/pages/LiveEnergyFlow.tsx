import { useState, useRef, useActionState, type PointerEvent as RPointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  Battery,
  Car,
  Thermometer,
  Home,
  Sun,
  Zap,
  Leaf,
  Gauge,
  Maximize2,
  Minimize2,
  GripHorizontal,
  Lightbulb,
  Blinds,
  ThermometerSun,
} from 'lucide-react';

import { useEnergyContext } from '../core/EnergyContext';
import { useLegacySendCommand } from '../core/useLegacySendCommand';
import { SankeyDiagram } from '../components/SankeyDiagram';
import { DemoBadge } from '../components/DemoBadge';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { EmptyState } from '../components/ui/EmptyState';
import { PageTour, type TourStep } from '../components/ui/PageTour';
import { WifiOff } from 'lucide-react';
import {
  ControlPanel as ControlPanelUI,
  ControlPanelSection,
  ControlPanelDivider,
} from '../components/ui/ControlPanel';
import { formatPower, formatPercent } from '../lib/format';
import { hapticClick, hapticModeChange, hapticSuccess } from '../lib/haptics';
import { useAppStore } from '../store';

import type { CommandType, EvState, HpState, EvMode, HpMode } from '../types';

// ─── Draggable position hook ──────────────────────────────────────────
type Position = { x: number; y: number };

function useDraggable(initial: Position) {
  const [pos, setPos] = useState(initial);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const onPointerDown = (e: RPointerEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('[data-drag-handle]')) return;
    dragging.current = true;
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: RPointerEvent) => {
    if (!dragging.current) return;
    setPos({
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y,
    });
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  return { pos, handlers: { onPointerDown, onPointerMove, onPointerUp } };
}

// ─── Panel IDs ────────────────────────────────────────────────────────
type PanelId = 'ev' | 'heatpump' | 'battery' | 'knx' | 'stats';

const PANEL_DEFAULTS: Record<PanelId, Position> = {
  ev: { x: 16, y: 80 },
  heatpump: { x: 16, y: 320 },
  battery: { x: 16, y: 560 },
  knx: { x: -380, y: 80 }, // right-aligned via CSS
  stats: { x: -380, y: 400 }, // right-aligned via CSS
};

// ─── Tour steps ───────────────────────────────────────────────────────
const TOUR_STEPS: TourStep[] = [
  {
    icon: Activity,
    titleKey: 'tour.liveEnergy.overviewTitle',
    descKey: 'tour.liveEnergy.overviewDesc',
    color: '#00f0ff',
  },
  {
    icon: GripHorizontal,
    titleKey: 'tour.liveEnergy.panelsTitle',
    descKey: 'tour.liveEnergy.panelsDesc',
    color: '#22ff88',
  },
  {
    icon: Maximize2,
    titleKey: 'tour.liveEnergy.fullscreenTitle',
    descKey: 'tour.liveEnergy.fullscreenDesc',
    color: '#ff8800',
  },
];

// ─── Main Component ────────────────────────────────────────────────────
function LiveEnergyFlowComponent() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const { data: energyData, connected, selfSufficiencyPercent, isExporting } = useEnergyContext();
  const { sendCommand } = useLegacySendCommand();
  const isDemo = !connected;

  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [openPanels, setOpenPanels] = useState<Set<PanelId>>(new Set());

  // ─── Fullscreen ─────────────────────────────────────────────────
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  // ─── Panel toggle ───────────────────────────────────────────────
  const togglePanel = (id: PanelId) => {
    setOpenPanels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const closePanel = (id: PanelId) => {
    setOpenPanels((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // ─── Derived metrics ───────────────────────────────────────────
  const selfConsumption = Math.min(energyData.pvPower, energyData.houseLoad);
  const selfConsumptionRate =
    energyData.pvPower > 0 ? (selfConsumption / energyData.pvPower) * 100 : 0;
  const gridImport = energyData.gridPower > 0 ? energyData.gridPower : 0;
  const gridExport = energyData.gridPower < 0 ? Math.abs(energyData.gridPower) : 0;
  const batteryCharging = energyData.batteryPower < 0;

  // ─── Quick-access node buttons ──────────────────────────────────
  const nodeButtons: {
    id: PanelId;
    icon: typeof Car;
    label: string;
    color: string;
    value: string;
  }[] = [
    {
      id: 'ev',
      icon: Car,
      label: t('control.evTitle'),
      color: 'text-violet-400',
      value: formatPower(energyData.evPower, locale),
    },
    {
      id: 'heatpump',
      icon: Thermometer,
      label: t('control.hpTitle'),
      color: 'text-orange-400',
      value: formatPower(energyData.heatPumpPower, locale),
    },
    {
      id: 'battery',
      icon: Battery,
      label: t('control.batteryTitle'),
      color: 'text-emerald-400',
      value: `${energyData.batterySoC.toFixed(0)}% · ${formatPower(Math.abs(energyData.batteryPower), locale)}`,
    },
    {
      id: 'knx',
      icon: Home,
      label: t('liveEnergy.knxRooms'),
      color: 'text-cyan-400',
      value: t('liveEnergy.knxToggle'),
    },
    {
      id: 'stats',
      icon: Gauge,
      label: t('liveEnergy.statistics'),
      color: 'text-(--color-primary)',
      value: formatPercent(selfSufficiencyPercent, locale),
    },
  ];

  const hasData = energyData.pvPower > 0 || energyData.houseLoad > 0 || energyData.gridPower !== 0;

  return (
    <div
      ref={containerRef}
      className={`relative flex h-[calc(100dvh-8rem)] flex-col overflow-hidden ${isFullscreen ? 'h-screen bg-(--color-background)' : ''}`}
    >
      <PageTour tourId="live-energy-flow" steps={TOUR_STEPS} />

      {/* ─── Top Bar ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-4 py-2">
        <div className="flex items-center gap-3">
          <Activity size={18} className="text-(--color-primary)" aria-hidden="true" />
          <h1 className="fluid-text-lg font-semibold text-(--color-text)">
            {t('liveEnergy.title')}
          </h1>
          <HelpTooltip
            content={t(
              'tour.liveEnergy.help',
              'Echtzeit-Energiefluss mit Sankey-Diagramm und Gerätesteuerung',
            )}
          />
          {isDemo && <DemoBadge />}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${connected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}
          >
            <span
              className={`h-2 w-2 rounded-full ${connected ? 'energy-pulse bg-emerald-400' : 'bg-rose-400'}`}
            />
            {connected ? t('common.live') : t('common.disconnected')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Live metrics strip */}
          <div className="hidden items-center gap-3 text-xs lg:flex">
            <span className="flex items-center gap-1 text-yellow-400">
              <Sun size={14} aria-hidden="true" /> {formatPower(energyData.pvPower, locale)}
            </span>
            <span className="flex items-center gap-1 text-cyan-400">
              <Home size={14} aria-hidden="true" /> {formatPower(energyData.houseLoad, locale)}
            </span>
            <span
              className={`flex items-center gap-1 ${energyData.gridPower > 0 ? 'text-red-400' : 'text-emerald-400'}`}
            >
              <Zap size={14} aria-hidden="true" />{' '}
              {formatPower(Math.abs(energyData.gridPower), locale)}
            </span>
            <span className="price-pill">
              {energyData.priceCurrent.toFixed(3)} {t('units.euroPerKwh', '€/kWh')}
            </span>
          </div>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-(--color-muted) transition-colors hover:bg-(--color-surface) hover:text-(--color-text)"
            aria-label={
              isFullscreen
                ? t('sankey.exitFullscreen', 'Vollbild beenden')
                : t('sankey.enterFullscreen', 'Vollbild')
            }
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* ─── Device toggle bar ─────────────────────────────────── */}
      <div
        className="scrollbar-hide flex gap-2 overflow-x-auto px-4 pb-2"
        role="toolbar"
        aria-label={t('liveEnergy.devicePanels')}
      >
        {nodeButtons.map((btn) => {
          const Icon = btn.icon;
          const isOpen = openPanels.has(btn.id);
          return (
            <button
              key={btn.id}
              type="button"
              onClick={() => togglePanel(btn.id)}
              className={`focus-ring flex shrink-0 items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
                isOpen
                  ? 'border-(--color-primary)/40 bg-(--color-primary)/10 text-(--color-primary)'
                  : 'border-(--color-border) bg-(--color-surface)/50 text-(--color-muted) hover:border-(--color-primary)/30'
              }`}
              aria-pressed={isOpen}
            >
              <Icon size={14} className={btn.color} aria-hidden="true" />
              <span className="hidden sm:inline">{btn.label}</span>
              <span className="font-mono tabular-nums">{btn.value}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Sankey canvas (full remaining space) ──────────────── */}
      <div className="relative flex-1 overflow-hidden">
        {!connected && !hasData ? (
          <EmptyState
            icon={WifiOff}
            title={t('tour.liveEnergy.emptyTitle', 'Keine Verbindung')}
            description={t(
              'tour.liveEnergy.emptyDesc',
              'Verbinden Sie Ihren Wechselrichter oder Cerbo GX, um den Live-Energiefluss zu sehen.',
            )}
            pulse
          />
        ) : (
          <SankeyDiagram data={energyData} />
        )}

        {/* ─── Floating Draggable Panels ─────────────────────── */}
        <AnimatePresence>
          {openPanels.has('ev') && (
            <FloatingDevicePanel key="ev" id="ev" initial={PANEL_DEFAULTS.ev} onClose={closePanel}>
              <EVPanel sendCommand={sendCommand} data={energyData} />
            </FloatingDevicePanel>
          )}
          {openPanels.has('heatpump') && (
            <FloatingDevicePanel
              key="heatpump"
              id="heatpump"
              initial={PANEL_DEFAULTS.heatpump}
              onClose={closePanel}
            >
              <HeatPumpPanel sendCommand={sendCommand} data={energyData} />
            </FloatingDevicePanel>
          )}
          {openPanels.has('battery') && (
            <FloatingDevicePanel
              key="battery"
              id="battery"
              initial={PANEL_DEFAULTS.battery}
              onClose={closePanel}
            >
              <BatteryPanel sendCommand={sendCommand} data={energyData} />
            </FloatingDevicePanel>
          )}
          {openPanels.has('knx') && (
            <FloatingDevicePanel
              key="knx"
              id="knx"
              initial={PANEL_DEFAULTS.knx}
              onClose={closePanel}
              anchorRight
            >
              <KNXPanel sendCommand={sendCommand} />
            </FloatingDevicePanel>
          )}
          {openPanels.has('stats') && (
            <FloatingDevicePanel
              key="stats"
              id="stats"
              initial={PANEL_DEFAULTS.stats}
              onClose={closePanel}
              anchorRight
            >
              <StatsPanel
                energyData={energyData}
                selfSufficiency={selfSufficiencyPercent}
                selfConsumptionRate={selfConsumptionRate}
                gridImport={gridImport}
                gridExport={gridExport}
                batteryCharging={batteryCharging}
                isExporting={isExporting}
                locale={locale}
              />
            </FloatingDevicePanel>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Floating Draggable Panel Shell ───────────────────────────────────
function FloatingDevicePanel({
  id,
  initial,
  onClose,
  anchorRight = false,
  children,
}: {
  id: PanelId;
  initial: Position;
  onClose: (id: PanelId) => void;
  anchorRight?: boolean;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { pos, handlers } = useDraggable(initial);

  const posStyle: React.CSSProperties = anchorRight
    ? { right: Math.abs(pos.x), top: pos.y }
    : { left: pos.x, top: pos.y };

  return (
    <motion.div
      className="absolute z-10 w-80 touch-none select-none"
      style={posStyle as React.CSSProperties}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.25 }}
      {...handlers}
    >
      <ControlPanelUI
        title={
          <span className="flex items-center gap-2">
            <span
              data-drag-handle
              className="cursor-grab text-(--color-muted) active:cursor-grabbing"
              aria-hidden="true"
            >
              <GripHorizontal size={16} />
            </span>
            <PanelTitle id={id} />
          </span>
        }
        onClose={() => onClose(id)}
        closeLabel={t('common.close')}
      >
        {children}
      </ControlPanelUI>
    </motion.div>
  );
}

function PanelTitle({ id }: { id: PanelId }) {
  const { t } = useTranslation();
  const titles: Record<PanelId, string> = {
    ev: t('control.evTitle'),
    heatpump: t('control.hpTitle'),
    battery: t('control.batteryTitle'),
    knx: t('liveEnergy.knxRooms'),
    stats: t('liveEnergy.statistics'),
  };
  return <>{titles[id]}</>;
}

// ─── EV Charging Panel ────────────────────────────────────────────────
function EVPanel({
  sendCommand,
  data,
}: {
  sendCommand: (type: CommandType, value: number) => void;
  data: { evPower: number; pvPower: number; houseLoad: number };
}) {
  const { t } = useTranslation();
  const maxEvPowerKW = useAppStore((s) => s.settings.systemConfig.evCharger.maxPowerKW);

  const [evState, evAction, isEvPending] = useActionState(
    async (_state: EvState, formData: FormData) => {
      hapticModeChange();
      const mode = (formData.get('evMode') ?? 'off') as EvMode;
      const power =
        mode === 'fast'
          ? maxEvPowerKW * 1000
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
    <div className="space-y-3">
      <ControlPanelSection title={t('liveEnergy.currentPower')}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-(--color-muted)">
            <Car size={14} className="inline text-violet-400" /> {t('dashboard.evCharging')}
          </span>
          <span className="font-mono text-violet-400">{(data.evPower / 1000).toFixed(1)} kW</span>
        </div>
      </ControlPanelSection>
      <ControlPanelDivider />
      <form action={evAction} className="space-y-3">
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('control.evTitle')}>
          {(['off', 'pv', 'fast'] as EvMode[]).map((mode) => (
            <label
              key={mode}
              className={`cursor-pointer rounded-lg border px-2 py-2 text-center text-xs font-medium transition-all focus-within:ring-2 focus-within:ring-(--color-primary)/40 ${
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
              {mode === 'off'
                ? t('control.evOff')
                : mode === 'pv'
                  ? t('control.evPv')
                  : t('control.evFast')}
            </label>
          ))}
        </div>
        {evState.message && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-(--color-primary)"
            role="status"
            aria-live="polite"
          >
            ✓ {evState.message}
          </motion.p>
        )}
        <button
          type="submit"
          disabled={isEvPending}
          className="btn-primary focus-ring w-full text-sm"
        >
          {isEvPending ? t('common.saving') : t('common.apply')}
        </button>
      </form>
    </div>
  );
}

// ─── Heat Pump Panel ──────────────────────────────────────────────────
function HeatPumpPanel({
  sendCommand,
  data,
}: {
  sendCommand: (type: CommandType, value: number) => void;
  data: { heatPumpPower: number };
}) {
  const { t } = useTranslation();

  const [hpState, hpAction, isHpPending] = useActionState(
    async (_state: HpState, formData: FormData) => {
      hapticModeChange();
      const mode = (formData.get('hpMode') ?? '2') as HpMode;
      const powerMap: Record<HpMode, number> = { '1': 0, '2': 800, '3': 1500, '4': 2500 };
      const power = powerMap[mode] ?? 800;
      await new Promise((resolve) => setTimeout(resolve, 600));
      sendCommand('SET_HEAT_PUMP_POWER', power);
      hapticSuccess();
      return { mode, power, message: t('control.hpUpdated') };
    },
    { mode: '2' as HpMode, power: 800, message: '' },
  );

  return (
    <div className="space-y-3">
      <ControlPanelSection title={t('liveEnergy.currentPower')}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-(--color-muted)">
            <Thermometer size={14} className="inline text-orange-400" /> {t('dashboard.heatPump')}
          </span>
          <span className="font-mono text-orange-400">
            {(data.heatPumpPower / 1000).toFixed(1)} kW
          </span>
        </div>
      </ControlPanelSection>
      <ControlPanelDivider />
      <form action={hpAction} className="space-y-3">
        <select
          name="hpMode"
          defaultValue={hpState.mode}
          onChange={hapticClick}
          aria-label={t('control.hpTitle')}
          className="focus-ring w-full rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm text-(--color-text)"
        >
          <option value="1">{t('control.hpMode1')}</option>
          <option value="2">{t('control.hpMode2')}</option>
          <option value="3">{t('control.hpMode3')}</option>
          <option value="4">{t('control.hpMode4')}</option>
        </select>
        {hpState.message && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-(--color-primary)"
            role="status"
            aria-live="polite"
          >
            ✓ {hpState.message}
          </motion.p>
        )}
        <button
          type="submit"
          disabled={isHpPending}
          className="btn-primary focus-ring w-full text-sm"
        >
          {isHpPending ? t('common.saving') : t('common.apply')}
        </button>
      </form>
    </div>
  );
}

// ─── Battery Panel ────────────────────────────────────────────────────
function BatteryPanel({
  sendCommand,
  data,
}: {
  sendCommand: (type: CommandType, value: number) => void;
  data: { batteryPower: number; batterySoC: number };
}) {
  const { t } = useTranslation();
  const maxBatteryChargeRateKW = useAppStore(
    (s) => s.settings.systemConfig.battery.maxChargeRateKW,
  );
  const charging = data.batteryPower < 0;

  return (
    <div className="space-y-3">
      <ControlPanelSection title={t('liveEnergy.batteryStatus')}>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-(--color-muted)">{t('metrics.battery')}</span>
            <span className="font-mono text-emerald-400">
              {(Math.abs(data.batteryPower) / 1000).toFixed(1)} kW
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-(--color-muted)">SoC</span>
            <span className="font-mono text-emerald-400">{data.batterySoC.toFixed(0)}%</span>
          </div>
          {/* SoC bar */}
          <div className="h-2 overflow-hidden rounded-full bg-(--color-border)">
            <motion.div
              className="h-full rounded-full bg-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${data.batterySoC}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-(--color-muted)">
            {charging
              ? t('metrics.batteryCharging')
              : data.batteryPower > 0
                ? t('metrics.batteryDischarging')
                : t('metrics.batteryIdle')}
          </p>
        </div>
      </ControlPanelSection>
      <ControlPanelDivider />
      <ControlPanelSection title={t('control.batteryMode')}>
        <div className="flex gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              hapticModeChange();
              sendCommand('SET_BATTERY_POWER', -(maxBatteryChargeRateKW * 1000));
            }}
            className="btn-secondary focus-ring flex-1 text-sm"
          >
            {t('control.forceCharge')}
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              hapticModeChange();
              sendCommand('SET_BATTERY_POWER', 0);
            }}
            className="btn-secondary focus-ring flex-1 text-sm"
          >
            {t('control.auto')}
          </motion.button>
        </div>
      </ControlPanelSection>
    </div>
  );
}

// ─── KNX Rooms Panel ──────────────────────────────────────────────────
function KNXPanel({ sendCommand }: { sendCommand: (type: CommandType, value: number) => void }) {
  const { t } = useTranslation();
  const { unified } = useEnergyContext();
  const rooms = unified?.knx?.rooms ?? [];

  return (
    <div className="space-y-3">
      {rooms.length === 0 && (
        <p className="text-xs text-(--color-muted)">{t('liveEnergy.noKnxRooms')}</p>
      )}
      {rooms.length > 0 ? (
        rooms.map((room, i) => (
          <ControlPanelSection key={room.name ?? i} title={room.name ?? `Room ${i + 1}`}>
            <div className="space-y-2">
              {room.temperature !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-(--color-muted)">
                    <ThermometerSun size={14} className="text-orange-400" />{' '}
                    {t('liveEnergy.temperature')}
                  </span>
                  <span className="font-mono">{room.temperature.toFixed(1)}°C</span>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    hapticClick();
                    sendCommand('TOGGLE_KNX_LIGHTS', 1);
                  }}
                  className="btn-secondary focus-ring flex flex-1 items-center justify-center gap-1 text-xs"
                >
                  <Lightbulb size={12} /> {t('liveEnergy.lightsOn')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    hapticClick();
                    sendCommand('TOGGLE_KNX_LIGHTS', 0);
                  }}
                  className="btn-secondary focus-ring flex flex-1 items-center justify-center gap-1 text-xs"
                >
                  <Lightbulb size={12} /> {t('liveEnergy.lightsOff')}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    hapticClick();
                    sendCommand('TOGGLE_KNX_WINDOW', 1);
                  }}
                  className="btn-secondary focus-ring flex flex-1 items-center justify-center gap-1 text-xs"
                >
                  <Blinds size={12} /> {t('liveEnergy.blindsUp')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    hapticClick();
                    sendCommand('TOGGLE_KNX_WINDOW', 0);
                  }}
                  className="btn-secondary focus-ring flex flex-1 items-center justify-center gap-1 text-xs"
                >
                  <Blinds size={12} /> {t('liveEnergy.blindsDown')}
                </button>
              </div>
            </div>
          </ControlPanelSection>
        ))
      ) : (
        <ControlPanelSection>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                hapticClick();
                sendCommand('TOGGLE_KNX_LIGHTS', 1);
              }}
              className="btn-secondary focus-ring flex flex-1 items-center justify-center gap-1 text-xs"
            >
              <Lightbulb size={12} /> {t('liveEnergy.lightsOn')}
            </button>
            <button
              type="button"
              onClick={() => {
                hapticClick();
                sendCommand('TOGGLE_KNX_LIGHTS', 0);
              }}
              className="btn-secondary focus-ring flex flex-1 items-center justify-center gap-1 text-xs"
            >
              <Lightbulb size={12} /> {t('liveEnergy.lightsOff')}
            </button>
          </div>
        </ControlPanelSection>
      )}
    </div>
  );
}

// ─── Stats Panel (replaces Production/Storage/Consumption pages) ──────
function StatsPanel({
  energyData,
  selfSufficiency,
  selfConsumptionRate,
  gridImport,
  gridExport,
  batteryCharging,
  isExporting,
  locale,
}: {
  energyData: {
    pvPower: number;
    houseLoad: number;
    batteryPower: number;
    batterySoC: number;
    gridPower: number;
    heatPumpPower: number;
    evPower: number;
    pvYieldToday: number;
    priceCurrent: number;
  };
  selfSufficiency: number;
  selfConsumptionRate: number;
  gridImport: number;
  gridExport: number;
  batteryCharging: boolean;
  isExporting: boolean;
  locale: string;
}) {
  const { t } = useTranslation();

  const rows = [
    {
      icon: Sun,
      label: t('metrics.pvGeneration'),
      value: formatPower(energyData.pvPower, locale),
      color: 'text-yellow-400',
    },
    {
      icon: Home,
      label: t('metrics.houseLoad'),
      value: formatPower(energyData.houseLoad, locale),
      color: 'text-cyan-400',
    },
    {
      icon: Battery,
      label: t('metrics.battery'),
      value: `${energyData.batterySoC.toFixed(0)}% · ${formatPower(Math.abs(energyData.batteryPower), locale)}`,
      color: 'text-emerald-400',
      sub: batteryCharging
        ? t('metrics.batteryCharging')
        : energyData.batteryPower > 0
          ? t('metrics.batteryDischarging')
          : t('metrics.batteryIdle'),
    },
    {
      icon: Zap,
      label: t('metrics.grid'),
      value: formatPower(Math.abs(energyData.gridPower), locale),
      color: energyData.gridPower > 0 ? 'text-red-400' : 'text-emerald-400',
      sub: energyData.gridPower > 0 ? t('metrics.import') : isExporting ? t('metrics.export') : '—',
    },
    {
      icon: Thermometer,
      label: t('dashboard.heatPump'),
      value: formatPower(energyData.heatPumpPower, locale),
      color: 'text-orange-400',
    },
    {
      icon: Car,
      label: t('dashboard.evCharging'),
      value: formatPower(energyData.evPower, locale),
      color: 'text-violet-400',
    },
  ];

  return (
    <div className="space-y-3">
      <ControlPanelSection title={t('liveEnergy.overview')}>
        <div className="space-y-2">
          {rows.map(({ icon: Icon, label, value, color, sub }) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-(--color-muted)">
                <Icon size={14} className={color} /> {label}
              </span>
              <div className="text-right">
                <span className={`font-mono ${color}`}>{value}</span>
                {sub && <span className="block text-[10px] text-(--color-muted)">{sub}</span>}
              </div>
            </div>
          ))}
        </div>
      </ControlPanelSection>
      <ControlPanelDivider />
      <ControlPanelSection title={t('liveEnergy.efficiency')}>
        <div className="space-y-2">
          <GaugeBar
            label={t('energyFlow.selfSufficiency')}
            value={selfSufficiency}
            color="#22ff88"
          />
          <GaugeBar
            label={t('energyFlow.selfConsumptionRate')}
            value={selfConsumptionRate}
            color="#00f0ff"
          />
        </div>
      </ControlPanelSection>
      <ControlPanelDivider />
      <ControlPanelSection title={t('liveEnergy.gridExchange')}>
        <div className="flex gap-3 text-sm">
          <div className="flex-1 rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-center">
            <p className="text-[10px] text-red-400">{t('metrics.import')}</p>
            <p className="font-mono text-sm font-semibold text-red-400">
              {formatPower(gridImport, locale)}
            </p>
          </div>
          <div className="flex-1 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 text-center">
            <p className="text-[10px] text-emerald-400">{t('metrics.export')}</p>
            <p className="font-mono text-sm font-semibold text-emerald-400">
              {formatPower(gridExport, locale)}
            </p>
          </div>
        </div>
      </ControlPanelSection>
      <ControlPanelDivider />
      <div className="flex items-center justify-between text-xs text-(--color-muted)">
        <span className="flex items-center gap-1">
          <Leaf size={12} className="text-emerald-400" />
          {t('dashboard.pvYieldToday')}: {energyData.pvYieldToday.toFixed(1)} kWh
        </span>
        <span>
          {energyData.priceCurrent.toFixed(3)} {t('units.euroPerKwh', '€/kWh')}
        </span>
      </div>
    </div>
  );
}

// ─── Gauge Bar (inline progress) ──────────────────────────────────────
function GaugeBar({ label, value, color }: { label: string; value: number; color: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-(--color-muted)">{label}</span>
        <span className="font-mono font-medium" style={{ color }}>
          {clamped.toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-(--color-border)">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export default LiveEnergyFlowComponent;
