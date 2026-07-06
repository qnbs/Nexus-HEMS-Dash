import { Activity, Cpu, HardDrive, MemoryStick, Server } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ResourceGauge } from './ResourceGauge';

function NetworkIORow({ networkIO }: { networkIO: number }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl bg-white/5 px-3 py-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-2 text-(--color-muted)">
          <Activity size={14} className="text-emerald-400" aria-hidden="true" />
          {t('monitoring.networkIO')}
        </span>
        <span className="font-medium text-(--color-text)">{networkIO} KB/s</span>
      </div>
    </div>
  );
}

function SystemInfoRows() {
  const { t } = useTranslation();
  const rows = [
    { label: t('monitoring.nodeJs'), value: t('monitoring.nodeJsVersion') },
    { label: t('monitoring.runtime'), value: t('monitoring.runtimeVersion') },
    { label: t('monitoring.os'), value: t('monitoring.osVersion') },
  ];

  return (
    <div className="mt-4 space-y-1.5 text-(--color-muted) text-[10px]">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex justify-between">
          <span>{label}</span>
          <span className="font-mono">{value}</span>
        </div>
      ))}
    </div>
  );
}

function cpuGaugeColor(cpuUsage: number): string {
  if (cpuUsage > 80) return 'bg-red-500/70';
  if (cpuUsage > 60) return 'bg-yellow-500/70';
  return 'bg-emerald-500/70';
}

function ramGaugeColor(memUsage: number): string {
  if (memUsage > 85) return 'bg-red-500/70';
  if (memUsage > 70) return 'bg-yellow-500/70';
  return 'bg-blue-500/70';
}

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
          color={cpuGaugeColor(cpuUsage)}
        />
        <ResourceGauge
          icon={<MemoryStick size={16} className="text-blue-400" aria-hidden="true" />}
          label={t('monitoring.ram')}
          value={memUsage}
          color={ramGaugeColor(memUsage)}
        />
        <ResourceGauge
          icon={<HardDrive size={16} className="text-cyan-400" aria-hidden="true" />}
          label={t('monitoring.disk')}
          value={diskUsage}
          color="bg-cyan-500/70"
        />
        <NetworkIORow networkIO={networkIO} />
      </div>
      <SystemInfoRows />
    </motion.section>
  );
}
