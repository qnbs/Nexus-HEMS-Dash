import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { getMetricFromSnapshot, useMetrics } from '../core/useMetrics';
import { NeonCard } from './ui/NeonCard';

interface MetricCardProps {
  label: string;
  value: string;
  unit: string;
  status?: 'normal' | 'warning' | 'critical';
}

function MetricCard({ label, value, unit, status = 'normal' }: MetricCardProps) {
  const variant = status === 'critical' ? 'danger' : status === 'warning' ? 'warning' : 'default';

  return (
    <NeonCard variant={variant} className="p-3 sm:p-4">
      <h3 className="truncate text-(--color-muted) text-xs sm:text-sm">{label}</h3>
      <p className="mt-1 font-bold text-(--color-text) text-lg">
        {value}
        <span className="ml-1 font-normal text-(--color-muted) text-xs sm:text-sm">{unit}</span>
      </p>
    </NeonCard>
  );
}

interface AdapterRowProps {
  name: string;
  protocol: string;
  connected: boolean;
  latencyMs: number;
}

function AdapterRow({ name, protocol, connected, latencyMs }: AdapterRowProps) {
  const { t } = useTranslation();
  return (
    <tr className="border-(--color-border)/20 border-b last:border-b-0">
      <td className="px-3 py-2 text-(--color-text) text-sm">{name}</td>
      <td className="px-3 py-2 text-(--color-muted) text-xs">{protocol}</td>
      <td className="px-3 py-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium text-xs ${
            connected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`}
            aria-hidden="true"
          />
          {connected ? t('common.connected') : t('common.disconnected')}
        </span>
      </td>
      <td className="px-3 py-2 text-right text-(--color-muted) text-xs">
        {latencyMs > 0 ? `${latencyMs.toFixed(0)}ms` : '—'}
      </td>
    </tr>
  );
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: metrics dashboard with multiple data paths
export default function MonitoringPanel() {
  const { t } = useTranslation();
  const { families, health, lastUpdated, error } = useMetrics(5000);

  const get = (name: string, labels?: Record<string, string>) =>
    getMetricFromSnapshot(families, name, labels);

  // Extract key metrics
  const pvPower = get('hems_pv_power_watts') ?? 0;
  const gridPower = get('hems_grid_power_watts') ?? 0;
  const batteryPower = get('hems_battery_power_watts') ?? 0;
  const batterySoC = get('hems_battery_soc_percent') ?? 0;
  const houseLoad = get('hems_house_load_watts') ?? 0;
  const evPower = get('hems_ev_charger_power_watts') ?? 0;
  const heatPump = get('hems_heat_pump_power_watts') ?? 0;
  const voltage = get('hems_grid_voltage_volts') ?? 0;
  const price = get('hems_tariff_price_eur_per_kwh') ?? 0;
  const uptime = get('hems_uptime_seconds') ?? health.uptime;

  // Derive statuses
  const gridStatus = gridPower > 4200 ? 'critical' : gridPower > 3000 ? 'warning' : 'normal';
  const batteryStatus = batterySoC < 10 ? 'critical' : batterySoC < 20 ? 'warning' : 'normal';
  const voltageStatus =
    voltage < 210 || voltage > 250
      ? 'critical'
      : voltage < 220 || voltage > 240
        ? 'warning'
        : 'normal';
  const priceStatus = price > 0.4 ? 'critical' : price > 0.3 ? 'warning' : 'normal';

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  };

  const adapters = [
    { name: 'Victron MQTT', protocol: 'MQTT', id: 'victron-mqtt' },
    { name: 'Modbus SunSpec', protocol: 'Modbus TCP', id: 'modbus-sunspec' },
    { name: 'KNX', protocol: 'KNXnet/IP', id: 'knx' },
    { name: 'OCPP 2.1', protocol: 'OCPP/WS', id: 'ocpp' },
    { name: 'EEBUS', protocol: 'SPINE/SHIP', id: 'eebus' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-w-0 space-y-4 sm:space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h2 className="fluid-text-lg font-bold text-(--color-text)">
            {t('monitoring.title', 'System Monitoring')}
          </h2>
          <p className="text-(--color-muted) text-xs sm:text-sm">
            Prometheus / Grafana · {t('monitoring.uptime', 'Uptime')}: {formatUptime(uptime)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium text-xs ${
              error ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
            }`}
          >
            <span
              className={`h-2 w-2 animate-pulse rounded-full ${error ? 'bg-red-400' : 'bg-emerald-400'}`}
            />
            {error ? t('monitoring.error', 'Error') : t('monitoring.live', 'Live')}
          </span>
          {lastUpdated > 0 && (
            <span className="text-(--color-muted) text-xs">
              {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Scrape Endpoint Info */}
      <NeonCard variant="primary" className="p-3 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-(--color-primary) text-xs">Prometheus Scrape Endpoint</p>
            <code className="mt-0.5 block truncate font-mono text-(--color-text) text-xs sm:text-sm">
              GET /metrics
            </code>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-(--color-primary) text-xs">JSON API</p>
            <code className="mt-0.5 block truncate font-mono text-(--color-text) text-xs sm:text-sm">
              GET /api/metrics/json
            </code>
          </div>
          <div className="text-(--color-muted) text-xs">
            {t('monitoring.interval', 'Scrape Interval')}: 5s
          </div>
        </div>
      </NeonCard>

      {/* Key Metric Cards */}
      <div className="@container grid @sm:grid-cols-3 @xl:grid-cols-4 grid-cols-2 @sm:gap-3 gap-2">
        <MetricCard
          label={t('monitoring.pvPower', 'PV Power')}
          value={pvPower.toFixed(0)}
          unit="W"
        />
        <MetricCard
          label={t('monitoring.gridPower', 'Grid Power')}
          value={gridPower.toFixed(0)}
          unit="W"
          status={gridStatus}
        />
        <MetricCard
          label={t('monitoring.batteryPower', 'Battery')}
          value={batteryPower.toFixed(0)}
          unit="W"
        />
        <MetricCard
          label={t('monitoring.batterySoC', 'Battery SoC')}
          value={batterySoC.toFixed(0)}
          unit="%"
          status={batteryStatus}
        />
        <MetricCard
          label={t('monitoring.houseLoad', 'House Load')}
          value={houseLoad.toFixed(0)}
          unit="W"
        />
        <MetricCard
          label={t('monitoring.evCharger', 'EV Charger')}
          value={evPower.toFixed(0)}
          unit="W"
        />
        <MetricCard
          label={t('monitoring.heatPump', 'Heat Pump')}
          value={heatPump.toFixed(0)}
          unit="W"
        />
        <MetricCard
          label={t('monitoring.gridVoltage', 'Grid Voltage')}
          value={voltage.toFixed(1)}
          unit="V"
          status={voltageStatus}
        />
        <MetricCard
          label={t('monitoring.price', 'Price')}
          value={price.toFixed(3)}
          unit="€/kWh"
          status={priceStatus}
        />
        <MetricCard
          label={t('monitoring.connections', 'WS Connections')}
          value={String(health.connections)}
          unit=""
        />
      </div>

      {/* Adapter Health Table */}
      <NeonCard className="overflow-x-auto p-3 sm:p-4">
        <h3 className="mb-3 font-semibold text-(--color-text) text-sm">
          {t('monitoring.adapterHealth', 'Adapter Health')}
        </h3>
        <table
          className="w-full text-left"
          aria-label={t('monitoring.adapterHealth', 'Adapter Health')}
        >
          <thead>
            <tr className="border-(--color-border)/30 border-b">
              <th scope="col" className="px-3 py-2 font-medium text-(--color-muted) text-xs">
                Adapter
              </th>
              <th scope="col" className="px-3 py-2 font-medium text-(--color-muted) text-xs">
                Protocol
              </th>
              <th scope="col" className="px-3 py-2 font-medium text-(--color-muted) text-xs">
                Status
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-right font-medium text-(--color-muted) text-xs"
              >
                Latency
              </th>
            </tr>
          </thead>
          <tbody>
            {adapters.map((adapter) => {
              const connected = (get('hems_adapter_connected', { adapter: adapter.id }) ?? 0) > 0;
              const lat = get('hems_adapter_latency_seconds', { adapter: adapter.id }) ?? 0;
              return (
                <AdapterRow
                  key={adapter.id}
                  name={adapter.name}
                  protocol={adapter.protocol}
                  connected={connected}
                  latencyMs={lat * 1000}
                />
              );
            })}
          </tbody>
        </table>
      </NeonCard>

      {/* Alert Rules Reference */}
      <NeonCard variant="warning" className="p-3 sm:p-4">
        <h3 className="mb-2 font-semibold text-(--color-text) text-sm">
          {t('monitoring.alertRules', 'Active Alert Rules')}
        </h3>
        <div className="@container grid @lg:grid-cols-3 @sm:grid-cols-2 grid-cols-1 gap-2">
          {[
            { name: 'HighGridImport', threshold: '> 4200W / 5m', severity: 'warning' },
            { name: 'BatteryLow', threshold: '< 10% / 10m', severity: 'critical' },
            { name: 'AdapterDisconnected', threshold: '0 / 2m', severity: 'warning' },
            { name: 'HighElectricityPrice', threshold: '> 0.40€', severity: 'info' },
            { name: 'GridVoltageAnomaly', threshold: '<210V or >250V', severity: 'critical' },
            { name: 'NoSolarGeneration', threshold: '0W daytime / 30m', severity: 'warning' },
          ].map((rule) => (
            <div
              key={rule.name}
              className="flex items-center justify-between gap-2 rounded-lg border border-(--color-border)/20 bg-(--color-surface)/50 p-2"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-(--color-text) text-xs">{rule.name}</p>
                <p className="text-(--color-muted) text-xs">{rule.threshold}</p>
              </div>
              <span
                className={`rounded px-1.5 py-0.5 text-xs ${
                  rule.severity === 'critical'
                    ? 'bg-red-500/10 text-red-400'
                    : rule.severity === 'warning'
                      ? 'bg-orange-500/10 text-orange-400'
                      : 'bg-blue-500/10 text-blue-400'
                }`}
              >
                {rule.severity}
              </span>
            </div>
          ))}
        </div>
      </NeonCard>

      {/* Grafana Integration Hint */}
      <NeonCard className="p-3 sm:p-4">
        <h3 className="mb-2 font-semibold text-(--color-text) text-sm">Grafana Dashboard</h3>
        <p className="mb-2 text-(--color-muted) text-xs">
          {t(
            'monitoring.grafanaHint',
            'Import the pre-configured Grafana dashboard from the API or use the template UID:',
          )}
        </p>
        <code className="block rounded border border-(--color-border)/20 bg-(--color-surface) p-2 font-mono text-(--color-primary) text-xs">
          Dashboard UID: nexus-hems-overview
        </code>
      </NeonCard>
    </motion.div>
  );
}
