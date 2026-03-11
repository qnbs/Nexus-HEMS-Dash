import { memo, useMemo } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Car, TrendingDown, TrendingUp, Zap, Leaf } from 'lucide-react';
import { useAppStore } from '../store';
import { useLegacySendCommand } from '../core/useLegacySendCommand';
import { PageHeader } from '../components/layout/PageHeader';
import { ControlPanel } from '../components/ControlPanel';

function EVPageComponent() {
  const { t } = useTranslation();
  const energyData = useAppStore((s) => s.energyData);
  const { sendCommand } = useLegacySendCommand();
  const settings = useAppStore((s) => s.settings);

  const chargeStrategy = useMemo(() => {
    const price = energyData.priceCurrent;
    const threshold = settings.chargeThreshold;
    const pvSurplus = Math.max(
      0,
      energyData.pvPower - energyData.houseLoad - energyData.heatPumpPower,
    );
    const hasPvSurplus = pvSurplus > 1400;

    if (hasPvSurplus) {
      return {
        mode: 'pv-surplus' as const,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        icon: Leaf,
        surplus: pvSurplus,
      };
    }
    if (price <= threshold) {
      return {
        mode: 'low-price' as const,
        color: 'text-cyan-400',
        bg: 'bg-cyan-500/10 border-cyan-500/30',
        icon: TrendingDown,
        surplus: 0,
      };
    }
    if (price > threshold * 1.5) {
      return {
        mode: 'expensive' as const,
        color: 'text-red-400',
        bg: 'bg-red-500/10 border-red-500/30',
        icon: TrendingUp,
        surplus: 0,
      };
    }
    return {
      mode: 'normal' as const,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10 border-orange-500/30',
      icon: Zap,
      surplus: 0,
    };
  }, [energyData, settings.chargeThreshold]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.ev', 'EV Charging')}
        subtitle={t('ev.subtitle', 'Wallbox control & charging strategy')}
        icon={<Car size={22} aria-hidden="true" />}
      />

      {/* EV Status */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <motion.div
          className="metric-card rounded-3xl hover-lift"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <p className="text-xs text-(--color-muted)">{t('ev.chargingPower', 'Charging Power')}</p>
          <p className="mt-1 text-2xl font-light text-green-400">
            {(energyData.evPower / 1000).toFixed(2)}{' '}
            <span className="text-sm text-(--color-muted)">kW</span>
          </p>
        </motion.div>
        <motion.div
          className="metric-card rounded-3xl hover-lift"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <p className="text-xs text-(--color-muted)">{t('ev.maxPower', 'Max Power')}</p>
          <p className="mt-1 text-2xl font-light text-cyan-400">
            {settings.systemConfig.evCharger.maxPowerKW.toFixed(1)}{' '}
            <span className="text-sm text-(--color-muted)">kW</span>
          </p>
        </motion.div>
        <motion.div
          className="metric-card rounded-3xl hover-lift"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <p className="text-xs text-(--color-muted)">{t('ev.currentTariff', 'Current Tariff')}</p>
          <p className="mt-1 text-2xl font-light text-orange-400">
            {energyData.priceCurrent.toFixed(3)}{' '}
            <span className="text-sm text-(--color-muted)">{t('units.euroPerKwh', '€/kWh')}</span>
          </p>
        </motion.div>
      </div>

      {/* Dynamic Pricing Strategy */}
      <motion.div
        className={`rounded-2xl border p-4 ${chargeStrategy.bg}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.22 }}
      >
        <div className="flex items-center gap-3">
          <chargeStrategy.icon className={`h-6 w-6 ${chargeStrategy.color}`} />
          <div className="flex-1">
            <p className={`font-medium ${chargeStrategy.color}`}>
              {t(`ev.strategy.${chargeStrategy.mode}`)}
            </p>
            <p className="mt-0.5 text-xs text-(--color-muted)">
              {t(`ev.strategy.${chargeStrategy.mode}Desc`, {
                price: energyData.priceCurrent.toFixed(3),
                threshold: settings.chargeThreshold.toFixed(3),
                surplus: (chargeStrategy.surplus / 1000).toFixed(1),
              })}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-lg font-semibold tabular-nums ${chargeStrategy.color}`}>
              {energyData.priceCurrent.toFixed(3)}
            </p>
            <p className="text-xs text-(--color-muted)">{t('units.euroPerKwh', '€/kWh')}</p>
          </div>
        </div>
      </motion.div>

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
          <div
            className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-400 text-xs font-bold"
            aria-hidden="true"
          >
            §
          </div>
          <div>
            <p className="text-sm font-medium text-(--color-text)">{t('help.enwg')}</p>
            <p className="mt-1 text-xs text-(--color-muted)">{t('help.enwgDesc')}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default memo(EVPageComponent);
