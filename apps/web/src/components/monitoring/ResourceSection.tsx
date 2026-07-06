import { Activity, Cpu, HardDrive, MemoryStick, Server } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ResourceGauge } from './ResourceGauge';

export function ResourceSection({
  cpuUsage,
  memUsage,
  diskUsage,
  networkIO,
}: {
  cpuUsage: number;
  memUsage: number;
  diskUsage: number;
  networkIO: number;
}) {
  const { t } = useTranslation();
  return (
    <motion.section
      className="glass-panel-strong hover-lift cv-auto-sm p-6"
      aria-labelledby="resources-title"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.38 }}
    >
      <h2 id="resources-title" className="fluid-text-lg mb-4 flex items-center gap-2 font-medium">
        <Server size={20} className="text-(--color-secondary)" aria-hidden="true" />
        {t('monitoring.resources')}
      </h2>
      <div className="space-y-4">
        <ResourceGauge
          icon={<Cpu size={16} className="text-purple-400" aria-hidden="true" />}
          label={t('monitoring.cpu')}
          value={cpuUsage}
          color={
            cpuUsage > 80
              ? 'bg-red-500/70'
              : cpuUsage > 60
                ? 'bg-yellow-500/70'
                : 'bg-emerald-500/70'
          }
        />
        <ResourceGauge
          icon={<MemoryStick size={16} className="text-blue-400" aria-hidden="true" />}
          label={t('monitoring.ram')}
          value={memUsage}
          color={
            memUsage > 85 ? 'bg-red-500/70' : memUsage > 70 ? 'bg-yellow-500/70' : 'bg-blue-500/70'
          }
        />
        <ResourceGauge
          icon={<HardDrive size={16} className="text-cyan-400" aria-hidden="true" />}
          label={t('monitoring.disk')}
          value={diskUsage}
          color="bg-cyan-500/70"
        />
        <div className="rounded-xl bg-white/5 px-3 py-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-(--color-muted)">
              <Activity size={14} className="text-emerald-400" aria-hidden="true" />
              {t('monitoring.networkIO')}
            </span>
            <span className="font-medium text-(--color-text)">{networkIO} KB/s</span>
          </div>
        </div>
      </div>
      {/* System info */}
      <div className="mt-4 space-y-1.5 text-(--color-muted) text-[10px]">
        <div className="flex justify-between">
          <span>{t('monitoring.nodeJs')}</span>
          <span className="font-mono">{t('monitoring.nodeJsVersion')}</span>
        </div>
        <div className="flex justify-between">
          <span>{t('monitoring.runtime')}</span>
          <span className="font-mono">{t('monitoring.runtimeVersion')}</span>
        </div>
        <div className="flex justify-between">
          <span>{t('monitoring.os')}</span>
          <span className="font-mono">{t('monitoring.osVersion')}</span>
        </div>
      </div>
    </motion.section>
  );
}
