import {
  Activity,
  BarChart3,
  Eye,
  Gauge,
  Radio,
  Server,
  Shield,
  ThermometerSun,
  Wifi,
  Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/layout/PageHeader';
import {
  AdapterHealthSection,
  type AlertRule,
  AlertRulesSection,
  calculateStatuses,
  EventLogSection,
  GrafanaSection,
  generateSystemLoadHistory,
  LoadChartSection,
  type MetricCardItem,
  MetricCardsGrid,
  PageActions,
  ResourceSection,
  type Status,
  SystemHealthBanner,
  statusBg,
  statusColor,
} from '../components/monitoring';
import { PageCrossLinks } from '../components/ui/PageCrossLinks';
import { getMetricFromSnapshot, useMetrics } from '../core/useMetrics';
import { useAppStoreShallow } from '../store';

// ─── Static adapter definitions ───────────────────────────────────────

function buildCoreAdapters(t: (key: string) => string) {
  return [
    {
      name: 'Victron MQTT',
      protocol: 'MQTT/WS',
      id: 'victron-mqtt',
      icon: <Radio size={14} />,
      desc: t('monitoring.adapterVictronDesc'),
    },
    {
      name: 'Modbus SunSpec',
      protocol: 'Modbus TCP',
      id: 'modbus-sunspec',
      icon: <Zap size={14} />,
      desc: t('monitoring.adapterModbusDesc'),
    },
    {
      name: 'KNX/IP',
      protocol: 'KNXnet/IP',
      id: 'knx',
      icon: <Server size={14} />,
      desc: t('monitoring.adapterKnxDesc'),
    },
    {
      name: 'OCPP 2.1',
      protocol: 'OCPP/WS',
      id: 'ocpp',
      icon: <Zap size={14} />,
      desc: t('monitoring.adapterOcppDesc'),
    },
    {
      name: 'EEBUS',
      protocol: 'SPINE/SHIP',
      id: 'eebus',
      icon: <Shield size={14} />,
      desc: t('monitoring.adapterEebusDesc'),
    },
  ];
}

function buildContribAdapters(t: (key: string) => string) {
  return [
    {
      name: t('monitoring.contribHomeAssistantMqtt'),
      protocol: 'MQTT/WS',
      id: 'homeassistant-mqtt',
      icon: <Server size={14} />,
      desc: t('monitoring.contribHomeAssistantMqttDesc'),
    },
    {
      name: t('monitoring.contribMatterThread'),
      protocol: 'Matter/WS',
      id: 'matter-thread',
      icon: <Radio size={14} />,
      desc: t('monitoring.contribMatterThreadDesc'),
    },
    {
      name: t('monitoring.contribZigbee2mqtt'),
      protocol: 'MQTT/WS',
      id: 'zigbee2mqtt',
      icon: <Wifi size={14} />,
      desc: t('monitoring.contribZigbee2mqttDesc'),
    },
    {
      name: t('monitoring.contribShellyRest'),
      protocol: 'HTTP/REST',
      id: 'shelly-rest',
      icon: <Gauge size={14} />,
      desc: t('monitoring.contribShellyRestDesc'),
    },
  ];
}

function buildEventLog(t: (key: string) => string) {
  return [
    {
      time: '14:32:08',
      level: 'info' as const,
      source: 'victron-mqtt',
      msg: t('monitoring.evtMqttReconnect'),
    },
    {
      time: '14:15:22',
      level: 'warn' as const,
      source: 'prometheus',
      msg: t('monitoring.evtScrapeTimeout'),
    },
    { time: '13:48:03', level: 'info' as const, source: 'ocpp', msg: t('monitoring.evtEvSession') },
    {
      time: '13:12:45',
      level: 'info' as const,
      source: 'eebus',
      msg: t('monitoring.evtEebusHandshake'),
    },
    {
      time: '12:55:11',
      level: 'error' as const,
      source: 'knx',
      msg: t('monitoring.evtKnxTimeout'),
    },
    { time: '12:30:00', level: 'info' as const, source: 'system', msg: t('monitoring.evtStartup') },
  ];
}

function buildMetricCards(
  t: (key: string) => string,
  values: {
    pvPower: number;
    gridPower: number;
    batteryPower: number;
    batterySoC: number;
    houseLoad: number;
    evPower: number;
    heatPump: number;
    voltage: number;
    price: number;
    connections: number;
  },
  statuses: {
    gridStatus: Status;
    batteryStatus: Status;
    voltageStatus: Status;
    priceStatus: Status;
  },
): MetricCardItem[] {
  return [
    {
      label: t('monitoring.pvPower'),
      value: `${values.pvPower.toFixed(0)}`,
      unit: 'W',
      icon: <ThermometerSun size={16} />,
      status: 'ok',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
    },
    {
      label: t('monitoring.gridPower'),
      value: `${values.gridPower.toFixed(0)}`,
      unit: 'W',
      icon: <Zap size={16} />,
      status: statuses.gridStatus,
      color: statusColor(statuses.gridStatus),
      bg: statusBg(statuses.gridStatus),
    },
    {
      label: t('monitoring.batteryPower'),
      value: `${values.batteryPower.toFixed(0)}`,
      unit: 'W',
      icon: <Activity size={16} />,
      status: 'ok',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: t('monitoring.batterySoC'),
      value: `${values.batterySoC.toFixed(0)}`,
      unit: '%',
      icon: <Gauge size={16} />,
      status: statuses.batteryStatus,
      color: statusColor(statuses.batteryStatus),
      bg: statusBg(statuses.batteryStatus),
    },
    {
      label: t('monitoring.houseLoad'),
      value: `${values.houseLoad.toFixed(0)}`,
      unit: 'W',
      icon: <Activity size={16} />,
      status: 'ok',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      label: t('monitoring.evCharger'),
      value: `${values.evPower.toFixed(0)}`,
      unit: 'W',
      icon: <Zap size={16} />,
      status: 'ok',
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
    {
      label: t('monitoring.heatPump'),
      value: `${values.heatPump.toFixed(0)}`,
      unit: 'W',
      icon: <ThermometerSun size={16} />,
      status: 'ok',
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
    },
    {
      label: t('monitoring.gridVoltage'),
      value: `${values.voltage.toFixed(1)}`,
      unit: 'V',
      icon: <Gauge size={16} />,
      status: statuses.voltageStatus,
      color: statusColor(statuses.voltageStatus),
      bg: statusBg(statuses.voltageStatus),
    },
    {
      label: t('monitoring.price'),
      value: `${(values.price * 100).toFixed(1)}`,
      unit: 'ct/kWh',
      icon: <BarChart3 size={16} />,
      status: statuses.priceStatus,
      color: statusColor(statuses.priceStatus),
      bg: statusBg(statuses.priceStatus),
    },
    {
      label: t('monitoring.connections'),
      value: `${values.connections}`,
      unit: 'WS',
      icon: <Wifi size={16} />,
      status: 'ok',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
  ];
}

function buildAlertRules(
  t: (key: string) => string,
  values: {
    gridPower: number;
    batterySoC: number;
    connected: boolean;
    price: number;
    voltage: number;
    pvPower: number;
  },
): AlertRule[] {
  return [
    {
      name: 'HighGridImport',
      expr: 'hems_grid_power_watts > 4200',
      for: '5m',
      severity: 'warning',
      desc: t('monitoring.ruleHighGrid'),
      active: values.gridPower > 4200,
    },
    {
      name: 'BatteryLow',
      expr: 'hems_battery_soc_percent < 10',
      for: '10m',
      severity: 'critical',
      desc: t('monitoring.ruleBatteryLow'),
      active: values.batterySoC < 10,
    },
    {
      name: 'AdapterDisconnected',
      expr: 'hems_adapter_connected == 0',
      for: '2m',
      severity: 'warning',
      desc: t('monitoring.ruleAdapterDown'),
      active: !values.connected,
    },
    {
      name: 'HighElectricityPrice',
      expr: 'hems_tariff_price > 0.40',
      for: '0m',
      severity: 'info',
      desc: t('monitoring.ruleHighPrice'),
      active: values.price > 0.4,
    },
    {
      name: 'GridVoltageAnomaly',
      expr: 'hems_grid_voltage < 210 OR > 250',
      for: '1m',
      severity: 'critical',
      desc: t('monitoring.ruleVoltage'),
      active: values.voltage < 210 || values.voltage > 250,
    },
    {
      name: 'NoSolarGeneration',
      expr: 'hems_pv_power_watts == 0 AND daytime',
      for: '30m',
      severity: 'warning',
      desc: t('monitoring.ruleNoSolar'),
      active: values.pvPower === 0 && new Date().getHours() >= 7 && new Date().getHours() <= 19,
    },
  ];
}

type StoreEnergySlice = {
  pvPower: number;
  gridPower: number;
  batteryPower: number;
  batterySoC: number;
  houseLoad: number;
  evPower: number;
  heatPumpPower: number;
  gridVoltage: number;
  priceCurrent: number;
};

type EnergyMetrics = {
  pvPower: number;
  gridPower: number;
  batteryPower: number;
  batterySoC: number;
  houseLoad: number;
  evPower: number;
  heatPump: number;
  voltage: number;
  price: number;
  uptime: number;
};

function withFallback(value: number | null, fallback: number): number {
  return value ?? fallback;
}

// skipcq: JS-R1005
function extractEnergyMetrics(
  get: (name: string, labels?: Record<string, string>) => number | null,
  energyData: StoreEnergySlice,
  health: { uptime: number },
): EnergyMetrics {
  return {
    pvPower: withFallback(get('hems_pv_power_watts'), energyData.pvPower),
    gridPower: withFallback(get('hems_grid_power_watts'), energyData.gridPower),
    batteryPower: withFallback(get('hems_battery_power_watts'), energyData.batteryPower),
    batterySoC: withFallback(get('hems_battery_soc_percent'), energyData.batterySoC),
    houseLoad: withFallback(get('hems_house_load_watts'), energyData.houseLoad),
    evPower: withFallback(get('hems_ev_charger_power_watts'), energyData.evPower),
    heatPump: withFallback(get('hems_heat_pump_power_watts'), energyData.heatPumpPower),
    voltage: withFallback(get('hems_grid_voltage_volts'), energyData.gridVoltage),
    price: withFallback(get('hems_tariff_price_eur_per_kwh'), energyData.priceCurrent),
    uptime: withFallback(get('hems_uptime_seconds'), health.uptime),
  };
}

// skipcq: JS-R1005
function useMonitoringData() {
  const { t } = useTranslation();
  const { energyData, connected } = useAppStoreShallow((s) => ({
    energyData: {
      pvPower: s.energyData.pvPower,
      gridPower: s.energyData.gridPower,
      batteryPower: s.energyData.batteryPower,
      batterySoC: s.energyData.batterySoC,
      houseLoad: s.energyData.houseLoad,
      evPower: s.energyData.evPower,
      heatPumpPower: s.energyData.heatPumpPower,
      gridVoltage: s.energyData.gridVoltage,
      priceCurrent: s.energyData.priceCurrent,
    },
    connected: s.connected,
  }));
  const { families, health, lastUpdated, error } = useMetrics(5000);

  const get = (name: string, labels?: Record<string, string>) =>
    getMetricFromSnapshot(families, name, labels);

  const metrics = extractEnergyMetrics(get, energyData, health);
  const statuses = calculateStatuses(
    metrics.gridPower,
    metrics.batterySoC,
    metrics.voltage,
    metrics.price,
  );
  const adapters = buildCoreAdapters(t);
  const contribAdapters = buildContribAdapters(t);
  const metricCards = buildMetricCards(
    t,
    {
      pvPower: metrics.pvPower,
      gridPower: metrics.gridPower,
      batteryPower: metrics.batteryPower,
      batterySoC: metrics.batterySoC,
      houseLoad: metrics.houseLoad,
      evPower: metrics.evPower,
      heatPump: metrics.heatPump,
      voltage: metrics.voltage,
      price: metrics.price,
      connections: health.connections,
    },
    statuses,
  );
  const alertRules = buildAlertRules(t, {
    gridPower: metrics.gridPower,
    batterySoC: metrics.batterySoC,
    connected,
    price: metrics.price,
    voltage: metrics.voltage,
    pvPower: metrics.pvPower,
  });

  return {
    t,
    error,
    uptime: metrics.uptime,
    lastUpdated,
    connected,
    activeAlerts: alertRules.filter((rule) => rule.active).length,
    metricCards,
    loadHistory: generateSystemLoadHistory(metrics.houseLoad),
    cpuUsage: 18 + (metrics.houseLoad % 30),
    memUsage: 52 + (metrics.pvPower % 15),
    diskUsage: 34,
    networkIO: Math.round(metrics.pvPower / 100 + metrics.gridPower / 200),
    adapters,
    contribAdapters,
    get,
    alertRules,
    eventLog: buildEventLog(t),
  };
}

// ─── Main component ───────────────────────────────────────────────────

/**
 * @param embedded When rendered as a tab panel inside the unified Monitoring
 *   wrapper, the wrapper supplies the page header + cross-links footer; this
 *   page suppresses its own to avoid a duplicate <h1> and duplicate panels.
 */
export default function MonitoringPageComponent({ embedded = false }: { embedded?: boolean }) {
  const {
    t,
    error,
    uptime,
    lastUpdated,
    connected,
    activeAlerts,
    metricCards,
    loadHistory,
    cpuUsage,
    memUsage,
    diskUsage,
    networkIO,
    adapters,
    contribAdapters,
    get,
    alertRules,
    eventLog,
  } = useMonitoringData();

  return (
    <div className="space-y-6">
      {!embedded && (
        <PageHeader
          title={t('monitoring.pageTitle', 'Monitoring')}
          subtitle={t('monitoring.pageDescription')}
          icon={<Eye size={22} aria-hidden="true" />}
          actions={<PageActions error={error} activeAlerts={activeAlerts} />}
        />
      )}

      <SystemHealthBanner
        error={error}
        uptime={uptime}
        lastUpdated={lastUpdated}
        connected={connected}
      />
      <MetricCardsGrid cards={metricCards} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <LoadChartSection loadHistory={loadHistory} />
        <ResourceSection
          cpuUsage={cpuUsage}
          memUsage={memUsage}
          diskUsage={diskUsage}
          networkIO={networkIO}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdapterHealthSection adapters={adapters} contribAdapters={contribAdapters} get={get} />
        <AlertRulesSection alertRules={alertRules} />
      </div>

      <EventLogSection eventLog={eventLog} />
      <GrafanaSection />

      {!embedded && <PageCrossLinks />}
    </div>
  );
}
