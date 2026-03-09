import { memo, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { useLegacySendCommand } from '../core/useLegacySendCommand';
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
  const { sendCommand } = useLegacySendCommand();
  const energyData = useAppStore((s) => s.energyData);

  return (
    <motion.div
      className="grid grid-cols-1 gap-6 space-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, staggerChildren: 0.1 }}
    >
      {/* AI Optimizer Banner */}
      <motion.div
        id="ai-optimizer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <AIOptimizerPanel />
      </motion.div>

      {/* Live Price Widget + Voice Control */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="lg:col-span-2">
          <LivePriceWidget />
        </div>
        <VoiceControlPanel />
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 space-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {/* Main Energy Flow (Sankey) */}
        <section
          className="lg:col-span-2 glass-panel-strong p-6 rounded-3xl flex flex-col hover-lift"
          aria-labelledby="energy-flow-title"
        >
          <h2
            id="energy-flow-title"
            className="text-lg font-medium mb-4 flex items-center gap-2 fluid-text-lg"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            >
              <Activity
                size={20}
                className="text-[color:var(--color-secondary)]"
                aria-hidden="true"
              />
            </motion.div>
            {t('dashboard.realtimeFlow')}
          </h2>
          <div className="flex-1 min-h-[320px] sm:min-h-[400px] relative">
            <SankeyDiagram data={energyData} />
          </div>
        </section>

        {/* Key Metrics */}
        <section
          className="grid grid-cols-2 lg:grid-cols-1 gap-4 space-md"
          aria-label="Energy metrics"
          aria-live="polite"
          aria-atomic="false"
        >
          <MetricCard
            icon={<Sun className="text-yellow-400" aria-hidden="true" />}
            label={t('metrics.pvGeneration')}
            value={`${(energyData.pvPower / 1000).toFixed(2)} ${t('units.kilowatt')}`}
            subValue={`${energyData.pvYieldToday.toFixed(1)} ${t('units.kilowattHour')} ${t('common.today')}`}
            delay={0.4}
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
            delay={0.5}
          />
          <MetricCard
            icon={<Home className="text-blue-400" aria-hidden="true" />}
            label={t('metrics.houseLoad')}
            value={`${(energyData.houseLoad / 1000).toFixed(2)} ${t('units.kilowatt')}`}
            subValue={t('metrics.baseLoad')}
            delay={0.6}
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
            delay={0.7}
          />
        </section>

        {/* Floorplan & KNX Integration */}
        <motion.section
          className="lg:col-span-2 glass-panel-strong p-6 rounded-3xl hover-lift"
          aria-labelledby="floorplan-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <h2
            id="floorplan-title"
            className="text-lg font-medium mb-4 flex items-center gap-2 fluid-text-lg"
          >
            <Home size={20} className="text-[color:var(--color-secondary)]" aria-hidden="true" />
            {t('dashboard.automation')}
          </h2>
          <div className="h-[300px] w-full bg-slate-800/50 rounded-xl overflow-hidden border border-[color:var(--color-border)]">
            <Floorplan />
          </div>
        </motion.section>

        {/* Control Panel */}
        <motion.section
          className="glass-panel-strong p-6 rounded-3xl hover-lift"
          aria-labelledby="control-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <h2
            id="control-title"
            className="text-lg font-medium mb-4 flex items-center gap-2 fluid-text-lg"
          >
            <Thermometer
              size={20}
              className="text-[color:var(--color-secondary)]"
              aria-hidden="true"
            />
            {t('dashboard.control')}
          </h2>
          <ControlPanel sendCommand={sendCommand} data={energyData} />
        </motion.section>

        {/* Export & Sharing */}
        <motion.section
          className="lg:col-span-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          <ExportAndSharing />
        </motion.section>
      </motion.div>

      {/* Predictive Forecast - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.1 }}
      >
        <PredictiveForecast />
      </motion.div>
    </motion.div>
  );
}

const MetricCard = memo(function MetricCard({
  icon,
  label,
  value,
  subValue,
  className,
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue: string;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.article
      className={`metric-card rounded-3xl hover-lift hover-glow ${className || ''}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.5,
        delay,
        type: 'spring',
        stiffness: 260,
        damping: 20,
      }}
      whileHover={{
        y: -6,
        scale: 1.02,
        transition: { duration: 0.3, type: 'spring', stiffness: 400, damping: 17 },
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <motion.div
          className="p-2.5 bg-white/6 rounded-xl border border-[color:var(--color-border)]"
          whileHover={{ rotate: 10, scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          {icon}
        </motion.div>
        <span className="text-sm font-medium text-[color:var(--color-text)] fluid-text-sm">
          {label}
        </span>
      </div>
      <div>
        <div className="text-2xl font-light tracking-tight text-[color:var(--color-text)] fluid-text-2xl">
          {value}
        </div>
        <div className="text-xs text-[color:var(--color-muted)] mt-1.5 fluid-text-xs">
          {subValue}
        </div>
      </div>
    </motion.article>
  );
});
