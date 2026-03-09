import { memo } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Battery } from 'lucide-react';
import { useAppStore } from '../store';
import { useLegacySendCommand } from '../core/useLegacySendCommand';
import { PageHeader } from '../components/layout/PageHeader';

function StoragePageComponent() {
  const { t } = useTranslation();
  const { energyData } = useAppStore();
  const { sendCommand } = useLegacySendCommand();

  const batteryStatus =
    energyData.batteryPower < -50
      ? 'charging'
      : energyData.batteryPower > 50
        ? 'discharging'
        : 'idle';

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.storage', 'Storage')}
        subtitle={t('storage.subtitle', 'Battery management & strategy')}
        icon={<Battery size={22} />}
      />

      {/* Battery Visual */}
      <motion.section
        className="glass-panel-strong rounded-3xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-around">
          {/* Battery Visual */}
          <div className="relative flex flex-col items-center">
            <div className="relative h-48 w-24 overflow-hidden rounded-2xl border-2 border-[color:var(--color-border)]">
              <motion.div
                className={`absolute bottom-0 left-0 right-0 ${
                  batteryStatus === 'charging'
                    ? 'bg-gradient-to-t from-emerald-500 to-emerald-400'
                    : batteryStatus === 'discharging'
                      ? 'bg-gradient-to-t from-orange-500 to-yellow-400'
                      : 'bg-gradient-to-t from-blue-500 to-cyan-400'
                }`}
                animate={{ height: `${energyData.batterySoC}%` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-white drop-shadow-lg">
                  {energyData.batterySoC.toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="mt-1 h-1.5 w-10 rounded-full bg-[color:var(--color-border)]" />
            <span
              className={`mt-3 rounded-full px-3 py-1 text-xs font-medium ${
                batteryStatus === 'charging'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : batteryStatus === 'discharging'
                    ? 'bg-orange-500/10 text-orange-400'
                    : 'bg-blue-500/10 text-blue-400'
              }`}
            >
              {batteryStatus === 'charging'
                ? t('metrics.batteryCharging')
                : batteryStatus === 'discharging'
                  ? t('metrics.batteryDischarging')
                  : 'Idle'}
            </span>
          </div>

          {/* Battery Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel rounded-2xl p-4">
              <p className="text-xs text-[color:var(--color-muted)]">
                {t('storage.power', 'Power')}
              </p>
              <p className="mt-1 text-xl font-light text-[color:var(--color-text)]">
                {(Math.abs(energyData.batteryPower) / 1000).toFixed(2)} kW
              </p>
            </div>
            <div className="glass-panel rounded-2xl p-4">
              <p className="text-xs text-[color:var(--color-muted)]">
                {t('storage.voltage', 'Voltage')}
              </p>
              <p className="mt-1 text-xl font-light text-[color:var(--color-text)]">
                {energyData.batteryVoltage.toFixed(1)} V
              </p>
            </div>
            <div className="glass-panel rounded-2xl p-4">
              <p className="text-xs text-[color:var(--color-muted)]">{t('units.soc')}</p>
              <p className="mt-1 text-xl font-light text-emerald-400">
                {energyData.batterySoC.toFixed(1)}%
              </p>
            </div>
            <div className="glass-panel rounded-2xl p-4">
              <p className="text-xs text-[color:var(--color-muted)]">
                {t('storage.capacity', 'Capacity')}
              </p>
              <p className="mt-1 text-xl font-light text-[color:var(--color-text)]">10.0 kWh</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Battery Strategy Controls */}
      <motion.section
        className="glass-panel-strong rounded-3xl p-6 hover-lift"
        aria-labelledby="battery-strategy-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 id="battery-strategy-title" className="mb-4 text-lg font-medium fluid-text-lg">
          {t('control.batteryTitle')}
        </h2>
        <div className="flex flex-wrap gap-3">
          {['selfConsumption', 'forceCharge', 'auto'].map((mode) => (
            <button
              key={mode}
              onClick={() => sendCommand('SET_BATTERY_POWER', mode === 'forceCharge' ? 5000 : 0)}
              className="btn-secondary rounded-xl px-4 py-2.5 text-sm font-medium focus-ring"
            >
              {t(`control.${mode}`)}
            </button>
          ))}
        </div>
      </motion.section>
    </div>
  );
}

export default memo(StoragePageComponent);
