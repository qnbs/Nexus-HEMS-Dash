import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import {
  HardDrive,
  Search,
  Filter,
  Zap,
  Battery,
  Car,
  Gauge,
  ThermometerSun,
  Sun,
  ChevronDown,
  ExternalLink,
  Cpu,
  Wifi,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { NeonCard, NeonCardBody } from '../components/ui/NeonCard';
import { PageCrossLinks } from '../components/ui/PageCrossLinks';
import {
  getAllDevices,
  getDevicesByCategory,
  searchDevices,
  getManufacturers,
  getDeviceStats,
  type DeviceDefinition,
  type DeviceCategory,
} from '../core/hardware-registry';

// ─── Category config ────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  DeviceCategory,
  { Icon: typeof Sun; color: string; i18nKey: string }
> = {
  inverter: {
    Icon: Sun,
    color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    i18nKey: 'hardware.inverters',
  },
  wallbox: {
    Icon: Car,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    i18nKey: 'hardware.wallboxes',
  },
  meter: {
    Icon: Gauge,
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    i18nKey: 'hardware.meters',
  },
  battery: {
    Icon: Battery,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    i18nKey: 'hardware.batteries',
  },
  heatpump: {
    Icon: ThermometerSun,
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    i18nKey: 'hardware.heatPumps',
  },
};

// ─── Stats overview ─────────────────────────────────────────────────

function StatsOverview() {
  const { t } = useTranslation();
  const stats = getDeviceStats();
  const total = Object.values(stats).reduce((s, v) => s + v, 0);
  const manufacturers = getManufacturers();

  return (
    <NeonCard variant="primary" glow>
      <NeonCardBody>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-(--color-primary)/10">
              <HardDrive className="h-6 w-6 text-(--color-primary)" />
            </div>
            <div>
              <h2 className="fluid-text-lg font-semibold">{t('hardware.title')}</h2>
              <p className="fluid-text-sm text-(--color-muted)">
                {total} {t('hardware.devices', 'Geräte')} • {manufacturers.length}{' '}
                {t('hardware.manufacturers', 'Hersteller')}
              </p>
            </div>
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-2">
            {(Object.entries(stats) as [DeviceCategory, number][]).map(([cat, count]) => {
              const cfg = CATEGORY_CONFIG[cat];
              const CatIcon = cfg.Icon;
              return (
                <span
                  key={cat}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${cfg.color}`}
                >
                  <CatIcon className="h-3.5 w-3.5" />
                  {count}
                </span>
              );
            })}
          </div>
        </div>
      </NeonCardBody>
    </NeonCard>
  );
}

// ─── Device Card ────────────────────────────────────────────────────

function DeviceCard({ device }: { device: DeviceDefinition }) {
  const cfg = CATEGORY_CONFIG[device.category];
  const CatIcon = cfg.Icon;

  return (
    <NeonCard variant="default" hover>
      <NeonCardBody className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${cfg.color}`}
            >
              <CatIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="fluid-text-sm truncate font-semibold">{device.model}</h3>
              <p className="fluid-text-xs truncate text-(--color-muted)">{device.manufacturer}</p>
            </div>
          </div>
          {device.docsUrl && (
            <a
              href={device.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring shrink-0 rounded-lg p-1 text-(--color-muted) hover:text-(--color-primary)"
              aria-label={`${device.model} Docs`}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>

        {/* Specs */}
        <div className="fluid-text-xs flex flex-wrap gap-x-4 gap-y-1 text-(--color-muted)">
          {device.ratedPowerW && (
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {device.ratedPowerW >= 1000
                ? `${(device.ratedPowerW / 1000).toFixed(1)} kW`
                : `${device.ratedPowerW} W`}
            </span>
          )}
          {device.capacityKWh && (
            <span className="flex items-center gap-1">
              <Battery className="h-3 w-3" />
              {device.capacityKWh} kWh
            </span>
          )}
          {device.phases && (
            <span className="flex items-center gap-1">
              <Cpu className="h-3 w-3" />
              {device.phases}P
            </span>
          )}
          {device.maxCurrentA && <span>{device.maxCurrentA} A</span>}
        </div>

        {/* Protocols */}
        <div className="flex flex-wrap gap-1">
          {device.protocols.map((proto) => (
            <span
              key={proto}
              className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] text-(--color-muted)"
            >
              <Wifi className="h-2.5 w-2.5" />
              {proto}
            </span>
          ))}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1">
          {device.sgReady && (
            <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-medium text-orange-400">
              SG Ready
            </span>
          )}
          {device.v2x && (
            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
              V2X
            </span>
          )}
          {device.evccTemplate && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              evcc
            </span>
          )}
          {device.openEmsFactoryId && (
            <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-400">
              OpenEMS
            </span>
          )}
        </div>
      </NeonCardBody>
    </NeonCard>
  );
}

// ─── Page Component ─────────────────────────────────────────────────

function HardwarePageComponent() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DeviceCategory | 'all'>('all');
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('all');

  const allManufacturers = getManufacturers();

  // Filter devices
  let devices: DeviceDefinition[];
  if (searchQuery.trim()) {
    devices = searchDevices(searchQuery.trim());
  } else if (selectedCategory !== 'all') {
    devices = getDevicesByCategory(selectedCategory);
  } else {
    devices = getAllDevices();
  }

  if (selectedManufacturer !== 'all') {
    devices = devices.filter((d) => d.manufacturer === selectedManufacturer);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('hardware.title')}
        subtitle={t('hardware.subtitle', 'evcc-inspirierte Gerätedatenbank mit 120+ Geräten')}
        icon={<HardDrive className="h-5 w-5" />}
      />

      {/* Stats */}
      <StatsOverview />

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-(--color-muted)" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('hardware.search', 'Gerät suchen…')}
            className="focus-ring w-full rounded-xl border border-(--color-border) bg-(--color-surface) py-2.5 pr-4 pl-10 text-sm backdrop-blur-xl placeholder:text-(--color-muted)"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <Filter className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-(--color-muted)" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as DeviceCategory | 'all')}
            className="focus-ring appearance-none rounded-xl border border-(--color-border) bg-(--color-surface) py-2.5 pr-8 pl-10 text-sm backdrop-blur-xl"
          >
            <option value="all">{t('hardware.allCategories', 'Alle Kategorien')}</option>
            {(Object.keys(CATEGORY_CONFIG) as DeviceCategory[]).map((cat) => (
              <option key={cat} value={cat}>
                {t(CATEGORY_CONFIG[cat].i18nKey)}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-(--color-muted)" />
        </div>

        {/* Manufacturer Filter */}
        <div className="relative">
          <select
            value={selectedManufacturer}
            onChange={(e) => setSelectedManufacturer(e.target.value)}
            className="focus-ring appearance-none rounded-xl border border-(--color-border) bg-(--color-surface) py-2.5 pr-8 pl-4 text-sm backdrop-blur-xl"
          >
            <option value="all">{t('hardware.allManufacturers', 'Alle Hersteller')}</option>
            {allManufacturers.map((mfr) => (
              <option key={mfr} value={mfr}>
                {mfr}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-(--color-muted)" />
        </div>
      </div>

      {/* Results count */}
      <p className="fluid-text-sm text-(--color-muted)">
        {devices.length} {t('hardware.resultsFound', 'Ergebnisse')}
      </p>

      {/* Device Grid */}
      {devices.length > 0 ? (
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.03 } },
          }}
        >
          {devices.map((device) => (
            <DeviceCard key={device.id} device={device} />
          ))}
        </motion.div>
      ) : (
        <NeonCard variant="default">
          <NeonCardBody className="py-12 text-center">
            <HardDrive className="mx-auto mb-4 h-12 w-12 text-(--color-muted)" />
            <h3 className="fluid-text-lg mb-2 font-semibold">
              {t('hardware.noResults', 'Keine Geräte gefunden')}
            </h3>
            <p className="fluid-text-sm text-(--color-muted)">
              {t('hardware.noResultsHint', 'Versuchen Sie einen anderen Suchbegriff oder Filter.')}
            </p>
          </NeonCardBody>
        </NeonCard>
      )}

      <PageCrossLinks />
    </div>
  );
}

export default HardwarePageComponent;
