import { memo } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Activity } from 'lucide-react';
import { useAppStore } from '../store';
import { PageHeader } from '../components/layout/PageHeader';
import { SankeyDiagram } from '../components/SankeyDiagram';
import { LivePriceWidget } from '../components/LivePriceWidget';

function EnergyFlowPageComponent() {
  const { t } = useTranslation();
  const energyData = useAppStore((s) => s.energyData);
  const connected = useAppStore((s) => s.connected);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.energyFlow', 'Energy Flow')}
        subtitle={t('dashboard.realtimeFlow')}
        icon={<Activity size={22} />}
        actions={
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${connected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-400 energy-pulse' : 'bg-rose-400'}`}
              />
              {connected ? t('common.live') : t('common.disconnected')}
            </span>
            <span className="price-pill">{energyData.priceCurrent.toFixed(3)} €/kWh</span>
          </div>
        }
      />

      {/* Full Sankey Diagram */}
      <motion.section
        className="glass-panel-strong rounded-3xl p-6 hover-lift"
        aria-labelledby="flow-sankey-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h2 id="flow-sankey-title" className="sr-only">
          {t('dashboard.realtimeFlow')}
        </h2>
        <div className="min-h-[400px] sm:min-h-[500px]">
          <SankeyDiagram data={energyData} />
        </div>
      </motion.section>

      {/* Live Price Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <LivePriceWidget />
      </motion.div>

      {/* Flow Statistics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <FlowStat
          label={t('metrics.pvGeneration')}
          value={`${(energyData.pvPower / 1000).toFixed(2)} kW`}
          color="text-yellow-400"
          delay={0.3}
        />
        <FlowStat
          label={t('metrics.battery')}
          value={`${(energyData.batteryPower / 1000).toFixed(2)} kW`}
          color="text-emerald-400"
          delay={0.35}
        />
        <FlowStat
          label={t('metrics.houseLoad')}
          value={`${(energyData.houseLoad / 1000).toFixed(2)} kW`}
          color="text-blue-400"
          delay={0.4}
        />
        <FlowStat
          label={t('metrics.grid')}
          value={`${(energyData.gridPower / 1000).toFixed(2)} kW`}
          color={energyData.gridPower > 0 ? 'text-red-400' : 'text-emerald-400'}
          delay={0.45}
        />
      </div>
    </div>
  );
}

const FlowStat = memo(function FlowStat({
  label,
  value,
  color,
  delay,
}: {
  label: string;
  value: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      className="glass-panel rounded-2xl p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <p className="text-xs text-[color:var(--color-muted)]">{label}</p>
      <p className={`mt-1 text-xl font-light ${color}`}>{value}</p>
    </motion.div>
  );
});

export default memo(EnergyFlowPageComponent);
