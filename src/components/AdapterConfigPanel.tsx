/**
 * AdapterConfigPanel — Settings UI for all 5 protocol adapters
 *
 * Provides per-adapter configuration for:
 *   - Victron MQTT (host, port, gateway type, auth)
 *   - Modbus SunSpec (host, port, polling interval, auth)
 *   - KNX/IP (host, port, transport, GA mapping)
 *   - OCPP 2.1 (endpoint, security profile, station ID, mTLS)
 *   - EEBUS SPINE/SHIP (host, port, SKI, mTLS)
 */
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import {
  Server,
  Wifi,
  Shield,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  Cable,
  Gauge,
  Plug,
  Radio,
  Activity,
  ShieldCheck,
  CircleCheck,
  CircleAlert,
  CircleMinus,
  Circle,
  Download,
  Package,
} from 'lucide-react';
import { loadAllContribAdapters, listRegisteredAdapters } from '../core/adapters/adapter-registry';

// ─── Types ───────────────────────────────────────────────────────────

type AdapterType = 'victron' | 'modbus' | 'knx' | 'ocpp' | 'eebus';

interface AdapterEntry {
  id: string;
  type: AdapterType;
  name: string;
  enabled: boolean;
  host: string;
  port: number;
  tls: boolean;
  authToken: string;
  pollIntervalMs: number;
  // Victron
  gatewayType?: 'cerbo-gx' | 'venus-gx' | 'rpi-victron';
  // OCPP
  securityProfile?: 0 | 1 | 2 | 3;
  stationId?: string;
  iso15118?: boolean;
  clientCert?: string;
  clientKey?: string;
  // EEBUS
  skiFingerprint?: string;
  // KNX
  knxTransport?: 'websocket' | 'mqtt';
  gaMapping?: GAMappingEntry[];
}

interface GAMappingEntry {
  roomId: string;
  roomName: string;
  lightGA: string;
  dimmerGA: string;
  temperatureGA: string;
  setpointGA: string;
  windowGA: string;
  humidityGA: string;
}

const ADAPTER_DEFAULTS: Record<AdapterType, Partial<AdapterEntry>> = {
  victron: { port: 1880, tls: false, gatewayType: 'cerbo-gx', pollIntervalMs: 3000 },
  modbus: { port: 502, tls: false, pollIntervalMs: 5000 },
  knx: { port: 3671, tls: false, knxTransport: 'websocket', gaMapping: [], pollIntervalMs: 3000 },
  ocpp: {
    port: 9000,
    tls: true,
    securityProfile: 2,
    stationId: 'CP001',
    iso15118: false,
    pollIntervalMs: 5000,
  },
  eebus: { port: 4712, tls: true, skiFingerprint: '', pollIntervalMs: 5000 },
};

const ADAPTER_META: Record<
  AdapterType,
  { icon: typeof Server; color: string; capabilities: string[] }
> = {
  victron: {
    icon: Activity,
    color: 'text-blue-400',
    capabilities: ['pv', 'battery', 'grid', 'load'],
  },
  modbus: { icon: Gauge, color: 'text-amber-400', capabilities: ['pv', 'battery', 'grid'] },
  knx: { icon: Radio, color: 'text-green-400', capabilities: ['knx'] },
  ocpp: { icon: Plug, color: 'text-cyan-400', capabilities: ['evCharger'] },
  eebus: { icon: Cable, color: 'text-purple-400', capabilities: ['evCharger', 'load', 'grid'] },
};

// ─── Helper: ToggleSwitch ────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  id: string;
}) {
  return (
    <label htmlFor={id} className="relative inline-flex cursor-pointer items-center">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span className="sr-only">{label}</span>
      <div className="h-6 w-11 rounded-full border border-(--color-border) bg-(--color-surface) transition-colors duration-300 peer-checked:bg-(--color-primary) peer-focus:ring-2 peer-focus:ring-(--color-primary)/30 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:duration-300 peer-checked:after:translate-x-5" />
    </label>
  );
}

// ─── Compliance Matrix Data ──────────────────────────────────────────

type ComplianceStatus = 'compliant' | 'partial' | 'na';

interface ComplianceItem {
  key: string;
  descKey: string;
  adapters: Record<AdapterType, ComplianceStatus>;
}

const COMPLIANCE_MATRIX: ComplianceItem[] = [
  // §14a EnWG
  {
    key: 'c14a_gridCurtailment',
    descKey: 'c14a_gridCurtailmentDesc',
    adapters: {
      victron: 'compliant',
      modbus: 'compliant',
      knx: 'na',
      ocpp: 'compliant',
      eebus: 'compliant',
    },
  },
  {
    key: 'c14a_smartMeterGateway',
    descKey: 'c14a_smartMeterGatewayDesc',
    adapters: {
      victron: 'partial',
      modbus: 'partial',
      knx: 'na',
      ocpp: 'partial',
      eebus: 'compliant',
    },
  },
  {
    key: 'c14a_loadManagement',
    descKey: 'c14a_loadManagementDesc',
    adapters: {
      victron: 'compliant',
      modbus: 'compliant',
      knx: 'partial',
      ocpp: 'compliant',
      eebus: 'compliant',
    },
  },
  {
    key: 'c14a_reducedTariff',
    descKey: 'c14a_reducedTariffDesc',
    adapters: {
      victron: 'partial',
      modbus: 'partial',
      knx: 'na',
      ocpp: 'compliant',
      eebus: 'compliant',
    },
  },
  // VDE-AR-N 4105
  {
    key: 'vde_activePowerCurtail',
    descKey: 'vde_activePowerCurtailDesc',
    adapters: {
      victron: 'compliant',
      modbus: 'compliant',
      knx: 'na',
      ocpp: 'na',
      eebus: 'partial',
    },
  },
  {
    key: 'vde_reactivePowerControl',
    descKey: 'vde_reactivePowerControlDesc',
    adapters: {
      victron: 'compliant',
      modbus: 'compliant',
      knx: 'na',
      ocpp: 'na',
      eebus: 'partial',
    },
  },
  {
    key: 'vde_frequencyProtection',
    descKey: 'vde_frequencyProtectionDesc',
    adapters: { victron: 'compliant', modbus: 'compliant', knx: 'na', ocpp: 'na', eebus: 'na' },
  },
  {
    key: 'vde_voltageProtection',
    descKey: 'vde_voltageProtectionDesc',
    adapters: { victron: 'compliant', modbus: 'compliant', knx: 'na', ocpp: 'na', eebus: 'na' },
  },
  {
    key: 'vde_gridCodeCompliant',
    descKey: 'vde_gridCodeCompliantDesc',
    adapters: { victron: 'compliant', modbus: 'partial', knx: 'na', ocpp: 'na', eebus: 'na' },
  },
];

const STATUS_CONFIG: Record<
  ComplianceStatus,
  { icon: typeof CircleCheck; color: string; labelKey: string }
> = {
  compliant: { icon: CircleCheck, color: 'text-emerald-400', labelKey: 'adapterConfig.compliant' },
  partial: { icon: CircleAlert, color: 'text-amber-400', labelKey: 'adapterConfig.partial' },
  na: { icon: CircleMinus, color: 'text-(--color-muted)', labelKey: 'adapterConfig.notApplicable' },
};

// ─── Contrib Adapter Section ─────────────────────────────────────────

const CONTRIB_ADAPTERS = [
  {
    id: 'homeassistant-mqtt',
    nameKey: 'monitoring.contribHomeAssistantMqtt',
    descKey: 'monitoring.contribHomeAssistantMqttDesc',
    icon: Server,
    color: 'text-cyan-400',
    capabilities: ['pv', 'battery', 'grid', 'load', 'evCharger'],
  },
  {
    id: 'matter-thread',
    nameKey: 'monitoring.contribMatterThread',
    descKey: 'monitoring.contribMatterThreadDesc',
    icon: Radio,
    color: 'text-violet-400',
    capabilities: ['pv', 'grid', 'load'],
  },
  {
    id: 'zigbee2mqtt',
    nameKey: 'monitoring.contribZigbee2mqtt',
    descKey: 'monitoring.contribZigbee2mqttDesc',
    icon: Wifi,
    color: 'text-amber-400',
    capabilities: ['load', 'grid'],
  },
  {
    id: 'shelly-rest',
    nameKey: 'monitoring.contribShellyRest',
    descKey: 'monitoring.contribShellyRestDesc',
    icon: Gauge,
    color: 'text-emerald-400',
    capabilities: ['grid', 'load'],
  },
] as const;

function ContribAdapterSection() {
  const { t } = useTranslation();
  const [loadedIds, setLoadedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleLoadAll = async () => {
    setLoading(true);
    try {
      const ids = await loadAllContribAdapters();
      setLoadedIds(ids);
    } catch {
      // Error handled by registry
    } finally {
      setLoading(false);
    }
  };

  const registeredAdapters = listRegisteredAdapters();
  const contribRegistered = registeredAdapters.filter((a) => a.source === 'contrib');

  return (
    <section className="glass-panel-strong space-y-6 rounded-2xl p-6">
      <div className="flex items-center justify-between border-b border-(--color-border) pb-4">
        <h2 className="fluid-text-lg flex items-center gap-2 font-medium">
          <Package size={20} className="text-(--color-primary)" />
          {t('monitoring.contribAdapters')}
        </h2>
        <motion.button
          type="button"
          onClick={handleLoadAll}
          disabled={loading}
          className="focus-ring flex items-center gap-2 rounded-xl border border-(--color-border) bg-(--color-surface-strong) px-3 py-2 text-xs transition-colors hover:border-(--color-primary)/30 hover:bg-(--color-primary)/5 disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Download size={14} />
          {t('monitoring.loadAllContrib')}
        </motion.button>
      </div>
      <p className="text-sm text-(--color-muted)">{t('monitoring.contribAdaptersDesc')}</p>

      {loadedIds.length > 0 && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-400">
          {t('monitoring.contribLoaded', { ids: loadedIds.join(', ') })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CONTRIB_ADAPTERS.map((adapter) => {
          const Icon = adapter.icon;
          const isRegistered =
            contribRegistered.some((r) => r.id === adapter.id) || loadedIds.includes(adapter.id);
          return (
            <div
              key={adapter.id}
              className="flex items-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface)/50 p-4 transition-colors hover:bg-(--color-surface)"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-lg bg-(--color-surface-strong) ${adapter.color}`}
              >
                <Icon size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-(--color-text)">
                    {t(adapter.nameKey)}
                  </span>
                  {isRegistered && <Check size={14} className="shrink-0 text-emerald-400" />}
                </div>
                <p className="truncate text-[10px] text-(--color-muted)">{t(adapter.descKey)}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {adapter.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="rounded bg-(--color-primary)/10 px-1.5 py-0.5 text-[9px] text-(--color-primary)"
                    >
                      {t(`adapterConfig.cap_${cap}`)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-(--color-primary)/20 bg-(--color-primary)/5 p-3 text-xs text-(--color-muted)">
        <span className="font-medium text-(--color-primary)">💡 </span>
        {t('monitoring.pluginDynamicLoad')} · {t('monitoring.pluginNpmFormat')}
      </div>
    </section>
  );
}

// ─── ComplianceChecklist ─────────────────────────────────────────────

function ComplianceChecklist({ activeAdapters }: { activeAdapters: AdapterType[] }) {
  const { t } = useTranslation();
  const displayAdapters: AdapterType[] =
    activeAdapters.length > 0
      ? activeAdapters
      : (['victron', 'modbus', 'knx', 'ocpp', 'eebus'] as AdapterType[]);

  return (
    <section className="glass-panel-strong space-y-5 rounded-2xl p-6">
      <h2 className="fluid-text-lg flex items-center gap-2 border-b border-(--color-border) pb-4 text-lg font-medium">
        <ShieldCheck size={20} className="text-emerald-400" />
        {t('adapterConfig.complianceTitle')}
      </h2>
      <p className="text-sm text-(--color-muted)">{t('adapterConfig.complianceDescription')}</p>

      <div className="-mx-2 overflow-x-auto px-2">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-(--color-border)">
              <th className="py-2 pr-4 text-left font-medium text-(--color-muted)">
                {t('adapterConfig.complianceTitle')}
              </th>
              {displayAdapters.map((type) => {
                const meta = ADAPTER_META[type];
                const Icon = meta.icon;
                return (
                  <th key={type} className="px-2 py-2 text-center font-medium">
                    <div className="flex flex-col items-center gap-1">
                      <Icon size={14} className={meta.color} />
                      <span className="text-[10px]">{t(`adapterConfig.type_${type}`)}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {COMPLIANCE_MATRIX.map((item) => (
              <tr
                key={item.key}
                className="border-b border-(--color-border)/50 transition-colors hover:bg-(--color-surface)/50"
              >
                <td className="py-2.5 pr-4">
                  <p className="font-medium text-(--color-text)">
                    {t(`adapterConfig.${item.key}`)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-(--color-muted)">
                    {t(`adapterConfig.${item.descKey}`)}
                  </p>
                </td>
                {displayAdapters.map((type) => {
                  const status = item.adapters[type];
                  const cfg = STATUS_CONFIG[status];
                  const StatusIcon = cfg.icon;
                  return (
                    <td key={type} className="px-2 py-2.5 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <StatusIcon size={16} className={cfg.color} />
                        <span className={`text-[9px] ${cfg.color}`}>{t(cfg.labelKey)}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary counts */}
      <div className="flex flex-wrap gap-4 pt-2">
        {displayAdapters.map((type) => {
          const meta = ADAPTER_META[type];
          const Icon = meta.icon;
          const counts = COMPLIANCE_MATRIX.reduce(
            (acc, item) => {
              acc[item.adapters[type]]++;
              return acc;
            },
            { compliant: 0, partial: 0, na: 0 } as Record<ComplianceStatus, number>,
          );
          return (
            <div
              key={type}
              className="flex items-center gap-2 rounded-lg border border-(--color-border) bg-(--color-surface)/50 px-3 py-2"
            >
              <Icon size={14} className={meta.color} />
              <span className="text-xs font-medium">{t(`adapterConfig.type_${type}`)}</span>
              <div className="ml-1 flex items-center gap-1.5">
                <span className="flex items-center gap-0.5 text-emerald-400">
                  <Circle size={6} fill="currentColor" />
                  {counts.compliant}
                </span>
                <span className="flex items-center gap-0.5 text-amber-400">
                  <Circle size={6} fill="currentColor" />
                  {counts.partial}
                </span>
                <span className="flex items-center gap-0.5 text-(--color-muted)">
                  <Circle size={6} fill="currentColor" />
                  {counts.na}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── GA Mapping Sub-Panel ────────────────────────────────────────────

function GAMappingPanel({
  mapping,
  onChange,
}: {
  mapping: GAMappingEntry[];
  onChange: (m: GAMappingEntry[]) => void;
}) {
  const { t } = useTranslation();
  const inputClass =
    'w-full bg-(--color-surface) border border-(--color-border) rounded-lg px-3 py-1.5 text-xs text-(--color-text) focus:outline-none focus:border-(--color-primary)/70 focus:ring-1 focus:ring-(--color-primary)/20 transition-all placeholder:text-(--color-muted) font-mono';

  const addRoom = () => {
    onChange([
      ...mapping,
      {
        roomId: `room-${mapping.length + 1}`,
        roomName: '',
        lightGA: '',
        dimmerGA: '',
        temperatureGA: '',
        setpointGA: '',
        windowGA: '',
        humidityGA: '',
      },
    ]);
  };

  const removeRoom = (idx: number) => {
    onChange(mapping.filter((_, i) => i !== idx));
  };

  const updateRoom = (idx: number, field: keyof GAMappingEntry, value: string) => {
    const updated = [...mapping];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{t('adapterConfig.gaMapping')}</p>
        <motion.button
          type="button"
          onClick={addRoom}
          className="focus-ring flex items-center gap-1 rounded-lg border border-(--color-border) bg-(--color-surface-strong) px-2.5 py-1.5 text-xs text-(--color-muted) transition-colors hover:border-(--color-primary)/30 hover:text-(--color-primary)"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={12} />
          {t('adapterConfig.addRoom')}
        </motion.button>
      </div>
      <p className="text-xs text-(--color-muted)">{t('adapterConfig.gaMappingHint')}</p>

      {mapping.length === 0 && (
        <div className="rounded-lg border border-dashed border-(--color-border) p-4 text-center text-xs text-(--color-muted)">
          {t('adapterConfig.noRooms')}
        </div>
      )}

      <AnimatePresence>
        {mapping.map((room, idx) => (
          <motion.div
            key={room.roomId}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-(--color-border) bg-(--color-surface)/50 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-(--color-primary)/15 text-xs font-medium text-(--color-primary)">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={room.roomName}
                  onChange={(e) => updateRoom(idx, 'roomName', e.target.value)}
                  placeholder={t('adapterConfig.roomName')}
                  className="border-b border-transparent bg-transparent px-1 py-0.5 text-sm font-medium text-(--color-text) transition-colors focus:border-(--color-primary) focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => removeRoom(idx)}
                className="p-1 text-(--color-muted) transition-colors hover:text-rose-400"
                aria-label={t('common.cancel')}
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(
                [
                  ['lightGA', 'adapterConfig.lightGA'],
                  ['dimmerGA', 'adapterConfig.dimmerGA'],
                  ['temperatureGA', 'adapterConfig.temperatureGA'],
                  ['setpointGA', 'adapterConfig.setpointGA'],
                  ['windowGA', 'adapterConfig.windowGA'],
                  ['humidityGA', 'adapterConfig.humidityGA'],
                ] as [keyof GAMappingEntry, string][]
              ).map(([field, labelKey]) => (
                <div key={field} className="space-y-1">
                  <label className="text-[10px] font-medium tracking-wider text-(--color-muted) uppercase">
                    {t(labelKey)}
                  </label>
                  <input
                    type="text"
                    value={room[field]}
                    onChange={(e) => updateRoom(idx, field, e.target.value)}
                    placeholder="x/y/z"
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── AdapterConfigPanel ──────────────────────────────────────────────

export function AdapterConfigPanel() {
  const { t } = useTranslation();
  const [adapters, setAdapters] = useState<AdapterEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [savedId, setSavedId] = useState<string | null>(null);
  const adapterCounter = useRef(0);

  const inputClass =
    'w-full bg-(--color-surface) border border-(--color-border) rounded-xl px-4 py-2.5 text-(--color-text) focus:outline-none focus:border-(--color-primary)/70 focus:ring-2 focus:ring-(--color-primary)/20 transition-all duration-300 placeholder:text-(--color-muted)';

  const addAdapter = (type: AdapterType) => {
    adapterCounter.current += 1;
    const id = `${type}-${adapterCounter.current}`;
    const defaults = ADAPTER_DEFAULTS[type];
    const entry: AdapterEntry = {
      id,
      type,
      name: t(`adapterConfig.defaultName_${type}`),
      enabled: true,
      host: '',
      port: defaults.port ?? 1880,
      tls: defaults.tls ?? false,
      authToken: '',
      pollIntervalMs: defaults.pollIntervalMs ?? 3000,
      ...defaults,
    };
    setAdapters((prev) => [...prev, entry]);
    setExpandedId(id);
  };

  const removeAdapter = (id: string) => {
    setAdapters((prev) => prev.filter((a) => a.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const updateAdapter = (id: string, patch: Partial<AdapterEntry>) => {
    setAdapters((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  const handleSave = (id: string) => {
    setSavedId(id);
    setTimeout(() => setSavedId(null), 2000);
  };

  const toggleToken = (id: string) => {
    setShowTokens((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const sectionClass = 'glass-panel-strong p-6 rounded-2xl space-y-6';
  const sectionHeaderClass =
    'text-lg fluid-text-lg font-medium flex items-center gap-2 border-b border-(--color-border) pb-4';

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className={sectionClass}>
        <h2 className={sectionHeaderClass}>
          <Server size={20} className="text-(--color-primary)" />
          {t('adapterConfig.title')}
        </h2>
        <p className="text-sm text-(--color-muted)">{t('adapterConfig.description')}</p>

        {/* Add Adapter Buttons */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ADAPTER_META) as AdapterType[]).map((type) => {
            const meta = ADAPTER_META[type];
            const Icon = meta.icon;
            return (
              <motion.button
                key={type}
                type="button"
                onClick={() => addAdapter(type)}
                className="focus-ring flex items-center gap-2 rounded-xl border border-(--color-border) bg-(--color-surface-strong) px-3 py-2 text-sm transition-colors hover:border-(--color-primary)/30 hover:bg-(--color-primary)/5"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon size={16} className={meta.color} />
                <span>{t(`adapterConfig.type_${type}`)}</span>
                <Plus size={14} className="text-(--color-muted)" />
              </motion.button>
            );
          })}
        </div>

        {/* Capability Legend */}
        <div className="flex flex-wrap gap-3 rounded-lg border border-(--color-border) bg-(--color-surface)/50 px-3 py-2 text-xs text-(--color-muted)">
          {['pv', 'battery', 'grid', 'load', 'evCharger', 'knx'].map((cap) => (
            <span key={cap} className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-(--color-primary)/60" />
              {t(`adapterConfig.cap_${cap}`)}
            </span>
          ))}
        </div>
      </section>

      {/* Adapter List */}
      {adapters.length === 0 && (
        <div className="rounded-2xl border border-dashed border-(--color-border) p-8 text-center">
          <Server size={32} className="mx-auto mb-3 text-(--color-muted)" />
          <p className="text-sm font-medium text-(--color-muted)">
            {t('adapterConfig.noAdapters')}
          </p>
          <p className="mt-1 text-xs text-(--color-muted)">{t('adapterConfig.noAdaptersHint')}</p>
        </div>
      )}

      <AnimatePresence>
        {adapters.map((adapter) => {
          const meta = ADAPTER_META[adapter.type];
          const Icon = meta.icon;
          const isExpanded = expandedId === adapter.id;

          return (
            <motion.section
              key={adapter.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={sectionClass}
            >
              {/* Adapter Header */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : adapter.id)}
                className="flex w-full items-center justify-between"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl bg-(--color-surface-strong) ${meta.color}`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">{adapter.name}</p>
                    <p className="text-xs text-(--color-muted)">
                      {t(`adapterConfig.type_${adapter.type}`)}
                      {adapter.host && ` · ${adapter.host}:${adapter.port}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Capabilities badges */}
                  <div className="hidden gap-1 sm:flex">
                    {meta.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="rounded-full border border-(--color-border) bg-(--color-surface) px-2 py-0.5 text-[10px] text-(--color-muted)"
                      >
                        {t(`adapterConfig.cap_${cap}`)}
                      </span>
                    ))}
                  </div>
                  <ToggleSwitch
                    id={`enable-${adapter.id}`}
                    checked={adapter.enabled}
                    onChange={(v) => updateAdapter(adapter.id, { enabled: v })}
                    label={t('adapterConfig.enabled')}
                  />
                  {isExpanded ? (
                    <ChevronDown size={18} className="text-(--color-muted)" />
                  ) : (
                    <ChevronRight size={18} className="text-(--color-muted)" />
                  )}
                </div>
              </button>

              {/* Expanded Config Form */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5 overflow-hidden"
                  >
                    <div className="border-t border-(--color-border) pt-5" />

                    {/* Connection */}
                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
                        <Wifi size={14} className="text-emerald-400" />
                        {t('adapterConfig.connection')}
                      </h3>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-(--color-muted)">
                            {t('adapterConfig.adapterName')}
                          </label>
                          <input
                            type="text"
                            value={adapter.name}
                            onChange={(e) => updateAdapter(adapter.id, { name: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-(--color-muted)">
                            {t('adapterConfig.host')}
                          </label>
                          <input
                            type="text"
                            value={adapter.host}
                            onChange={(e) => updateAdapter(adapter.id, { host: e.target.value })}
                            className={inputClass}
                            placeholder="192.168.1.100"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-(--color-muted)">
                            {t('adapterConfig.port')}
                          </label>
                          <input
                            type="number"
                            value={adapter.port}
                            onChange={(e) =>
                              updateAdapter(adapter.id, { port: Number(e.target.value) })
                            }
                            className={inputClass}
                            min={1}
                            max={65535}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-(--color-muted)">
                            {t('adapterConfig.pollInterval')}
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={adapter.pollIntervalMs}
                              onChange={(e) =>
                                updateAdapter(adapter.id, {
                                  pollIntervalMs: Number(e.target.value),
                                })
                              }
                              className={inputClass}
                              min={500}
                              max={60000}
                              step={500}
                            />
                            <span className="text-xs whitespace-nowrap text-(--color-muted)">
                              ms
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Security */}
                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
                        <Shield size={14} className="text-orange-400" />
                        {t('adapterConfig.security')}
                      </h3>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="flex items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface) p-3">
                          <div>
                            <p className="text-xs font-medium">TLS / SSL</p>
                            <p className="text-[10px] text-(--color-muted)">
                              {t('adapterConfig.tlsHint')}
                            </p>
                          </div>
                          <ToggleSwitch
                            id={`tls-${adapter.id}`}
                            checked={adapter.tls}
                            onChange={(v) => updateAdapter(adapter.id, { tls: v })}
                            label="TLS"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-(--color-muted)">
                            {t('adapterConfig.authToken')}
                          </label>
                          <div className="relative">
                            <input
                              type={showTokens[adapter.id] ? 'text' : 'password'}
                              value={adapter.authToken}
                              onChange={(e) =>
                                updateAdapter(adapter.id, { authToken: e.target.value })
                              }
                              className={inputClass + ' pr-10'}
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => toggleToken(adapter.id)}
                              className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-(--color-muted) hover:text-(--color-text)"
                              aria-label={
                                showTokens[adapter.id] ? t('common.hideKey') : t('common.showKey')
                              }
                            >
                              {showTokens[adapter.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Victron-specific */}
                    {adapter.type === 'victron' && (
                      <div>
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
                          <Activity size={14} className="text-blue-400" />
                          {t('adapterConfig.victronSpecific')}
                        </h3>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-(--color-muted)">
                            {t('adapterConfig.gatewayType')}
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {(['cerbo-gx', 'venus-gx', 'rpi-victron'] as const).map((gw) => (
                              <button
                                key={gw}
                                type="button"
                                onClick={() => updateAdapter(adapter.id, { gatewayType: gw })}
                                className={`rounded-lg border-2 p-2 text-left text-xs transition-all ${
                                  adapter.gatewayType === gw
                                    ? 'border-(--color-primary) bg-(--color-primary)/10'
                                    : 'border-(--color-border) bg-(--color-surface) hover:border-(--color-primary)/40'
                                }`}
                                aria-pressed={adapter.gatewayType === gw}
                              >
                                <span className="font-medium">{t(`adapterConfig.gw_${gw}`)}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* OCPP-specific */}
                    {adapter.type === 'ocpp' && (
                      <div>
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
                          <Plug size={14} className="text-cyan-400" />
                          {t('adapterConfig.ocppSpecific')}
                        </h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-(--color-muted)">
                              {t('adapterConfig.stationId')}
                            </label>
                            <input
                              type="text"
                              value={adapter.stationId ?? ''}
                              onChange={(e) =>
                                updateAdapter(adapter.id, { stationId: e.target.value })
                              }
                              className={inputClass}
                              placeholder="CP001"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-(--color-muted)">
                              {t('adapterConfig.securityProfile')}
                            </label>
                            <select
                              className={inputClass}
                              value={adapter.securityProfile ?? 2}
                              onChange={(e) =>
                                updateAdapter(adapter.id, {
                                  securityProfile: Number(e.target.value) as 0 | 1 | 2 | 3,
                                })
                              }
                            >
                              <option value={0}>{t('adapterConfig.secProfile0')}</option>
                              <option value={1}>{t('adapterConfig.secProfile1')}</option>
                              <option value={2}>{t('adapterConfig.secProfile2')}</option>
                              <option value={3}>{t('adapterConfig.secProfile3')}</option>
                            </select>
                          </div>
                          <div className="flex items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface) p-3 md:col-span-2">
                            <div>
                              <p className="text-xs font-medium">ISO 15118 Plug & Charge</p>
                              <p className="text-[10px] text-(--color-muted)">
                                {t('adapterConfig.iso15118Hint')}
                              </p>
                            </div>
                            <ToggleSwitch
                              id={`iso15118-${adapter.id}`}
                              checked={adapter.iso15118 ?? false}
                              onChange={(v) => updateAdapter(adapter.id, { iso15118: v })}
                              label="ISO 15118"
                            />
                          </div>
                          {adapter.securityProfile === 3 && (
                            <div className="space-y-3 md:col-span-2">
                              <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-400">
                                <AlertTriangle size={14} />
                                {t('adapterConfig.mtlsRequired')}
                              </div>
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                  <label className="text-xs font-medium text-(--color-muted)">
                                    {t('adapterConfig.clientCert')}
                                  </label>
                                  <textarea
                                    value={adapter.clientCert ?? ''}
                                    onChange={(e) =>
                                      updateAdapter(adapter.id, { clientCert: e.target.value })
                                    }
                                    className={inputClass + ' h-20 resize-none font-mono text-xs'}
                                    placeholder="-----BEGIN CERTIFICATE-----"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-medium text-(--color-muted)">
                                    {t('adapterConfig.clientKey')}
                                  </label>
                                  <textarea
                                    value={adapter.clientKey ?? ''}
                                    onChange={(e) =>
                                      updateAdapter(adapter.id, { clientKey: e.target.value })
                                    }
                                    className={inputClass + ' h-20 resize-none font-mono text-xs'}
                                    placeholder="-----BEGIN PRIVATE KEY-----"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* EEBUS-specific */}
                    {adapter.type === 'eebus' && (
                      <div>
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
                          <Cable size={14} className="text-purple-400" />
                          {t('adapterConfig.eebusSpecific')}
                        </h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-(--color-muted)">
                              {t('adapterConfig.skiFingerprint')}
                            </label>
                            <input
                              type="text"
                              value={adapter.skiFingerprint ?? ''}
                              onChange={(e) =>
                                updateAdapter(adapter.id, { skiFingerprint: e.target.value })
                              }
                              className={inputClass + ' font-mono'}
                              placeholder="0123456789abcdef..."
                              maxLength={40}
                            />
                            <p className="text-[10px] text-(--color-muted)">
                              {t('adapterConfig.skiFingerprintHint')}
                            </p>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2 text-xs text-purple-300">
                              <Shield size={14} />
                              {t('adapterConfig.eebusRequiresTls')}
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-(--color-muted)">
                                {t('adapterConfig.clientCert')}
                              </label>
                              <textarea
                                value={adapter.clientCert ?? ''}
                                onChange={(e) =>
                                  updateAdapter(adapter.id, { clientCert: e.target.value })
                                }
                                className={inputClass + ' h-20 resize-none font-mono text-xs'}
                                placeholder="-----BEGIN CERTIFICATE-----"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-(--color-muted)">
                                {t('adapterConfig.clientKey')}
                              </label>
                              <textarea
                                value={adapter.clientKey ?? ''}
                                onChange={(e) =>
                                  updateAdapter(adapter.id, { clientKey: e.target.value })
                                }
                                className={inputClass + ' h-20 resize-none font-mono text-xs'}
                                placeholder="-----BEGIN PRIVATE KEY-----"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* KNX-specific: GA Mapping */}
                    {adapter.type === 'knx' && (
                      <div>
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
                          <Radio size={14} className="text-green-400" />
                          {t('adapterConfig.knxSpecific')}
                        </h3>
                        <div className="mb-4 space-y-2">
                          <label className="text-xs font-medium text-(--color-muted)">
                            {t('adapterConfig.knxTransport')}
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {(['websocket', 'mqtt'] as const).map((tr) => (
                              <button
                                key={tr}
                                type="button"
                                onClick={() => updateAdapter(adapter.id, { knxTransport: tr })}
                                className={`rounded-lg border-2 p-2 text-center text-xs font-medium transition-all ${
                                  adapter.knxTransport === tr
                                    ? 'border-(--color-primary) bg-(--color-primary)/10 text-(--color-primary)'
                                    : 'border-(--color-border) bg-(--color-surface) text-(--color-muted) hover:border-(--color-primary)/40'
                                }`}
                                aria-pressed={adapter.knxTransport === tr}
                              >
                                {tr === 'websocket' ? 'WebSocket (knxd)' : 'MQTT Bridge'}
                              </button>
                            ))}
                          </div>
                        </div>
                        <GAMappingPanel
                          mapping={adapter.gaMapping ?? []}
                          onChange={(m) => updateAdapter(adapter.id, { gaMapping: m })}
                        />
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between border-t border-(--color-border) pt-4">
                      <motion.button
                        type="button"
                        onClick={() => removeAdapter(adapter.id)}
                        className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-xs text-rose-400 transition-colors hover:bg-rose-500/10"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Trash2 size={14} />
                        {t('adapterConfig.remove')}
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => handleSave(adapter.id)}
                        className="flex items-center gap-2 rounded-xl bg-(--color-primary) px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {savedId === adapter.id ? <Check size={16} /> : <Server size={16} />}
                        {savedId === adapter.id ? t('common.saved') : t('common.save')}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          );
        })}
      </AnimatePresence>

      {/* Contrib / Community Adapters */}
      <ContribAdapterSection />

      {/* §14a EnWG + VDE-AR-N 4105 Compliance Checklist */}
      <ComplianceChecklist activeAdapters={adapters.map((a) => a.type)} />
    </div>
  );
}
