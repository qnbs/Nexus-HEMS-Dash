import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { StatusPill } from './StatusPill';
import { formatUptime } from './utils';

export function SystemHealthBanner({
  error,
  uptime,
  lastUpdated,
  connected,
}: {
  error: string | null;
  uptime: number;
  lastUpdated: number;
  connected: boolean;
}) {
  const { t } = useTranslation();
  return (
    <motion.section
      className="glass-panel-strong hover-lift p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {error ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15">
              <ShieldAlert size={24} className="text-red-400" />
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15">
              <ShieldCheck size={24} className="text-emerald-400" />
            </div>
          )}
          <div>
            <h2 className="font-medium text-(--color-text) text-lg">
              {error ? t('monitoring.systemDegraded') : t('monitoring.systemHealthy')}
            </h2>
            <p className="text-(--color-muted) text-xs">
              {t('monitoring.uptime')}: {formatUptime(uptime)} · {t('monitoring.interval')}: 5s
              {lastUpdated > 0 && (
                <>
                  {' '}
                  · {t('monitoring.lastScrape')}: {new Date(lastUpdated).toLocaleTimeString()}
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill label="Prometheus" ok={!error} />
          <StatusPill label="Grafana" ok />
          <StatusPill label="MQTT" ok={connected} />
          <StatusPill label="KNX/IP" ok />
        </div>
      </div>
      {/* Scrape Endpoints */}
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-xl bg-white/5 px-3 py-2">
          <p className="text-(--color-muted) text-[10px]">Prometheus Scrape</p>
          <code className="truncate font-mono text-(--color-primary) text-xs">GET /metrics</code>
        </div>
        <div className="rounded-xl bg-white/5 px-3 py-2">
          <p className="text-(--color-muted) text-[10px]">JSON API</p>
          <code className="truncate font-mono text-(--color-primary) text-xs">
            GET /api/metrics/json
          </code>
        </div>
        <div className="rounded-xl bg-white/5 px-3 py-2">
          <p className="text-(--color-muted) text-[10px]">Health Check</p>
          <code className="truncate font-mono text-(--color-primary) text-xs">GET /health</code>
        </div>
      </div>
    </motion.section>
  );
}
