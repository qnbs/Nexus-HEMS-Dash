import { memo } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Car } from 'lucide-react';
import { useAppStore } from '../store';
import { useLegacySendCommand } from '../core/useLegacySendCommand';
import { PageHeader } from '../components/layout/PageHeader';
import { ControlPanel } from '../components/ControlPanel';

function EVPageComponent() {
  const { t } = useTranslation();
  const energyData = useAppStore((s) => s.energyData);
  const { sendCommand } = useLegacySendCommand();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.ev', 'EV Charging')}
        subtitle={t('ev.subtitle', 'Wallbox control & charging strategy')}
        icon={<Car size={22} />}
      />

      {/* EV Status */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <motion.div
          className="metric-card rounded-3xl hover-lift"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <p className="text-xs text-[color:var(--color-muted)]">
            {t('ev.chargingPower', 'Charging Power')}
          </p>
          <p className="mt-1 text-2xl font-light text-green-400">
            {(energyData.evPower / 1000).toFixed(2)}{' '}
            <span className="text-sm text-[color:var(--color-muted)]">kW</span>
          </p>
        </motion.div>
        <motion.div
          className="metric-card rounded-3xl hover-lift"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <p className="text-xs text-[color:var(--color-muted)]">{t('ev.maxPower', 'Max Power')}</p>
          <p className="mt-1 text-2xl font-light text-cyan-400">
            11.0 <span className="text-sm text-[color:var(--color-muted)]">kW</span>
          </p>
        </motion.div>
        <motion.div
          className="metric-card rounded-3xl hover-lift"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <p className="text-xs text-[color:var(--color-muted)]">
            {t('ev.currentTariff', 'Current Tariff')}
          </p>
          <p className="mt-1 text-2xl font-light text-orange-400">
            {energyData.priceCurrent.toFixed(3)}{' '}
            <span className="text-sm text-[color:var(--color-muted)]">€/kWh</span>
          </p>
        </motion.div>
      </div>

      {/* Charging Strategy Controls */}
      <motion.section
        className="glass-panel-strong rounded-3xl p-6 hover-lift"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        <h2 className="mb-4 text-lg font-medium fluid-text-lg">{t('control.evTitle')}</h2>
        <ControlPanel sendCommand={sendCommand} data={energyData} />
      </motion.section>

      {/* §14a EnWG Info */}
      <motion.div
        className="glass-panel rounded-2xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-400 text-xs font-bold">
            §
          </div>
          <div>
            <p className="text-sm font-medium text-[color:var(--color-text)]">{t('help.enwg')}</p>
            <p className="mt-1 text-xs text-[color:var(--color-muted)]">{t('help.enwgDesc')}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default memo(EVPageComponent);
