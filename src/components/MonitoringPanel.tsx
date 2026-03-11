import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { useMetrics, getMetricFromSnapshot } from '../core/useMetrics';
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
      <h3 className="text-xs sm:text-sm text-(--color-text-secondary) truncate">{label}</h3>
      <p className="text-lg sm:text-2xl font-bold text-(--color-text) mt-1">
        {value}
        <span className="text-xs sm:text-sm font-normal text-(--color-text-secondary) ml-1">
          {unit}
        </span>
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
    <tr className="border-b border-(--color-border)/20 last:border-b-0">
      <td className="py-2 px-3 text-sm text-(--color-text)">{name}</td>
      <td className="py-2 px-3 text-xs text-(--color-text-secondary)">{protocol}</td>
      <td className="py-2 px-3">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
            connected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`}
            aria-hidden="true"
          />
          {connected ? t('common.connected') : t('common.disconnected')}
        </span>
      </td>
      <td className="py-2 px-3 text-xs text-(--color-text-secondary) text-right">
        {latencyMs > 0 ? `${latencyMs.toFixed(0)}ms` : '—'}
      </td>
    </tr>
  );
}

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
      className="space-y-4 sm:space-y-6 min-w-0"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-(--color-text)">
            {t('monitoring.title', 'System Monitoring')}
          </h2>
          <p className="text-xs sm:text-sm text-(--color-text-secondary)">
            Prometheus / Grafana · {t('monitoring.uptime', 'Uptime')}: {formatUptime(uptime)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
              error ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${error ? 'bg-red-400' : 'bg-emerald-400'}`}
            />
            {error ? t('monitoring.error', 'Error') : t('monitoring.live', 'Live')}
          </span>
          {lastUpdated > 0 && (
            <span className="text-xs text-(--color-text-secondary)">
              {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Scrape Endpoint Info */}
      <NeonCard variant="primary" className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-(--color-primary)">Prometheus Scrape Endpoint</p>
            <code className="text-xs sm:text-sm text-(--color-text) font-mono block truncate mt-0.5">
              GET /metrics
            </code>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-(--color-primary)">JSON API</p>
            <code className="text-xs sm:text-sm text-(--color-text) font-mono block truncate mt-0.5">
              GET /api/metrics/json
            </code>
          </div>
          <div className="text-xs text-(--color-text-secondary)">
            {t('monitoring.interval', 'Scrape Interval')}: 5s
          </div>
        </div>
      </NeonCard>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
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
      <NeonCard className="p-3 sm:p-4 overflow-x-auto">
        <h3 className="text-sm font-semibold text-(--color-text) mb-3">
          {t('monitoring.adapterHealth', 'Adapter Health')}
        </h3>
        <table
          className="w-full text-left"
          role="table"
          aria-label={t('monitoring.adapterHealth', 'Adapter Health')}
        >
          <thead>
            <tr className="border-b border-(--color-border)/30">
              <th className="py-2 px-3 text-xs font-medium text-(--color-text-secondary)">
                Adapter
              </th>
              <th className="py-2 px-3 text-xs font-medium text-(--color-text-secondary)">
                Protocol
              </th>
              <th className="py-2 px-3 text-xs font-medium text-(--color-text-secondary)">
                Status
              </th>
              <th className="py-2 px-3 text-xs font-medium text-(--color-text-secondary) text-right">
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
        <h3 className="text-sm font-semibold text-(--color-text) mb-2">
          {t('monitoring.alertRules', 'Active Alert Rules')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
              className="flex items-center justify-between gap-2 p-2 rounded-lg bg-(--color-surface)/50 border border-(--color-border)/20"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-(--color-text) truncate">{rule.name}</p>
                <p className="text-xs text-(--color-text-secondary)">{rule.threshold}</p>
              </div>
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
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
        <h3 className="text-sm font-semibold text-(--color-text) mb-2">Grafana Dashboard</h3>
        <p className="text-xs text-(--color-text-secondary) mb-2">
          {t(
            'monitoring.grafanaHint',
            'Import the pre-configured Grafana dashboard from the API or use the template UID:',
          )}
        </p>
        <code className="text-xs font-mono text-(--color-primary) block p-2 bg-(--color-surface) rounded border border-(--color-border)/20">
          Dashboard UID: nexus-hems-overview
        </code>
      </NeonCard>
    </motion.div>
  );
}
