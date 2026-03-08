import { useTranslation } from 'react-i18next';
import { useWebSocket } from '../useWebSocket';
import { useAppStore } from '../store';
import { Activity, Battery, Home, Sun, Thermometer, Zap } from 'lucide-react';
import { SankeyDiagram } from '../components/SankeyDiagram';
import { Floorplan } from '../components/Floorplan';
import { ControlPanel } from '../components/ControlPanel';
import { AIOptimizerPanel } from '../components/AIOptimizerPanel';
import { PredictiveForecast } from '../components/PredictiveForecast';
import { LivePriceWidget } from '../components/LivePriceWidget';
import { VoiceControlPanel } from '../components/VoiceControlPanel';
import { ExportAndSharing } from '../components/ExportAndSharing';

export function Dashboard() {
  const { t } = useTranslation();
  const { sendCommand } = useWebSocket();
  const { energyData } = useAppStore();

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* AI Optimizer Banner */}
      <div id="ai-optimizer">
        <AIOptimizerPanel />
      </div>

      {/* Live Price Widget + Voice Control */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LivePriceWidget />
        </div>
        <VoiceControlPanel />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Energy Flow (Sankey) */}
        <section
          className="lg:col-span-2 glass-panel p-6 rounded-3xl flex flex-col"
          aria-labelledby="energy-flow-title"
        >
          <h2 id="energy-flow-title" className="text-lg font-medium mb-4 flex items-center gap-2">
            <Activity
              size={20}
              className="text-[color:var(--color-secondary)]"
              aria-hidden="true"
            />
            {t('dashboard.realtimeFlow')}
          </h2>
          <div className="flex-1 min-h-[320px] sm:min-h-[400px] relative">
            <SankeyDiagram data={energyData} />
          </div>
        </section>

        {/* Key Metrics */}
        <section className="grid grid-cols-2 lg:grid-cols-1 gap-4" aria-label="Energy metrics">
          <MetricCard
            icon={<Sun className="text-yellow-400" aria-hidden="true" />}
            label={t('metrics.pvGeneration')}
            value={`${(energyData.pvPower / 1000).toFixed(2)} ${t('units.kilowatt')}`}
            subValue={`${energyData.pvYieldToday.toFixed(1)} ${t('units.kilowattHour')} ${t('common.today')}`}
          />
          <MetricCard
            icon={
              <Battery
                className={energyData.batterySoC > 20 ? 'text-emerald-400' : 'text-red-400'}
                aria-hidden="true"
              />
            }
            label={t('metrics.battery')}
            value={`${energyData.batterySoC.toFixed(1)} ${t('units.percent')}`}
            subValue={`${(energyData.batteryPower / 1000).toFixed(2)} ${t('units.kilowatt')}`}
            className={
              energyData.batteryPower < -50
                ? 'battery-charging'
                : energyData.batteryPower > 50
                  ? 'battery-discharging'
                  : ''
            }
          />
          <MetricCard
            icon={<Home className="text-blue-400" aria-hidden="true" />}
            label={t('metrics.houseLoad')}
            value={`${(energyData.houseLoad / 1000).toFixed(2)} ${t('units.kilowatt')}`}
            subValue={t('metrics.baseLoad')}
          />
          <MetricCard
            icon={
              <Zap
                className={energyData.gridPower > 0 ? 'text-red-400' : 'text-emerald-400'}
                aria-hidden="true"
              />
            }
            label={t('metrics.grid')}
            value={`${(energyData.gridPower / 1000).toFixed(2)} ${t('units.kilowatt')}`}
            subValue={energyData.gridPower > 0 ? t('metrics.import') : t('metrics.export')}
          />
        </section>

        {/* Floorplan & KNX Integration */}
        <section
          className="lg:col-span-2 glass-panel p-6 rounded-3xl"
          aria-labelledby="floorplan-title"
        >
          <h2 id="floorplan-title" className="text-lg font-medium mb-4 flex items-center gap-2">
            <Home size={20} className="text-[color:var(--color-secondary)]" aria-hidden="true" />
            {t('dashboard.automation')}
          </h2>
          <div className="h-[300px] w-full bg-slate-800/50 rounded-xl overflow-hidden border border-[color:var(--color-border)]">
            <Floorplan />
          </div>
        </section>

        {/* Control Panel */}
        <section className="glass-panel p-6 rounded-3xl" aria-labelledby="control-title">
          <h2 id="control-title" className="text-lg font-medium mb-4 flex items-center gap-2">
            <Thermometer
              size={20}
              className="text-[color:var(--color-secondary)]"
              aria-hidden="true"
            />
            {t('dashboard.control')}
          </h2>
          <ControlPanel sendCommand={sendCommand} data={energyData} />
        </section>

        {/* Export & Sharing */}
        <section className="lg:col-span-1">
          <ExportAndSharing />
        </section>
      </div>

      {/* Predictive Forecast - Full Width */}
      <PredictiveForecast />
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  subValue,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue: string;
  className?: string;
}) {
  return (
    <article className={`metric-card rounded-3xl ${className || ''}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-white/5 rounded-lg border border-[color:var(--color-border)]">
          {icon}
        </div>
        <span className="text-sm font-medium text-[color:var(--color-text)]">{label}</span>
      </div>
      <div>
        <div className="text-2xl font-light tracking-tight text-[color:var(--color-text)]">
          {value}
        </div>
        <div className="text-xs text-[color:var(--color-muted)] mt-1">{subValue}</div>
      </div>
    </article>
  );
}
