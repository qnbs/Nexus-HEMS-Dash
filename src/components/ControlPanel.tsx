import { useActionState } from 'react';
import { Battery, Car, Thermometer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';

import { type CommandType, type EnergyData, type EvState, type HpState } from '../types';
import { hapticClick, hapticModeChange, hapticSuccess } from '../lib/haptics';
import { useAppStore } from '../store';

export function ControlPanel({
  sendCommand,
  data,
}: {
  sendCommand: (type: CommandType, value: number) => void;
  data: EnergyData;
}) {
  const { t } = useTranslation();
  const settings = useAppStore((s) => s.settings);

  // Mock action for EV charging
  const [evState, evAction, isEvPending] = useActionState(
    async (state: EvState, formData: FormData) => {
      hapticModeChange();
      const mode = formData.get('evMode') as string;
      const power =
        mode === 'fast'
          ? settings.systemConfig.evCharger.maxPowerKW * 1000
          : mode === 'pv'
            ? Math.max(0, data.pvPower - data.houseLoad)
            : 0;

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      sendCommand('SET_EV_POWER', power);
      hapticSuccess();

      return { mode, power, message: t('control.evUpdated') };
    },
    { mode: 'off', power: 0, message: '' },
  );

  // Mock action for Heat Pump SG Ready
  const [hpState, hpAction, isHpPending] = useActionState(
    async (state: HpState, formData: FormData) => {
      hapticModeChange();
      const mode = formData.get('hpMode') as string;
      // SG Ready Modes: 1=Sperre(0W), 2=Normal(800W), 3=Empfehlung(1500W), 4=Befehl(2500W)
      let power = 800;
      if (mode === '1') power = 0;
      if (mode === '3') power = 1500;
      if (mode === '4') power = 2500;

      await new Promise((resolve) => setTimeout(resolve, 600));
      sendCommand('SET_HEAT_PUMP_POWER', power);
      hapticSuccess();

      return { mode, power, message: t('control.hpUpdated') };
    },
    { mode: '2', power: 800, message: '' },
  );

  return (
    <div className="space-y-6">
      {/* EV Charging Control */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium flex items-center gap-2 text-(--color-text)">
            <Car size={18} className="text-purple-400" aria-hidden="true" />
            {t('control.evTitle')}
          </h3>
          <span className="text-sm font-mono text-(--color-muted)">
            {(data.evPower / 1000).toFixed(1)} {t('units.kilowatt')}
          </span>
        </div>

        <form action={evAction} className="space-y-3">
          <div
            className="grid grid-cols-3 gap-2"
            role="radiogroup"
            aria-label={t('control.evTitle')}
          >
            <label
              className={`cursor-pointer text-center py-2 px-3 rounded-lg border transition-all duration-300 focus-within:ring-2 focus-within:ring-(--color-primary)/40 ${evState.mode === 'off' ? 'bg-(--color-primary)/20 border-(--color-primary) text-(--color-primary)' : 'bg-(--color-surface) border-(--color-border) text-(--color-muted) hover:border-(--color-primary)/40'}`}
            >
              <input
                type="radio"
                name="evMode"
                value="off"
                className="sr-only"
                checked={evState.mode === 'off'}
                onChange={hapticClick}
              />
              <span className="text-sm font-medium">{t('control.evOff')}</span>
            </label>
            <label
              className={`cursor-pointer text-center py-2 px-3 rounded-lg border transition-all duration-300 focus-within:ring-2 focus-within:ring-(--color-primary)/40 ${evState.mode === 'pv' ? 'bg-(--color-primary)/20 border-(--color-primary) text-(--color-primary)' : 'bg-(--color-surface) border-(--color-border) text-(--color-muted) hover:border-(--color-primary)/40'}`}
            >
              <input
                type="radio"
                name="evMode"
                value="pv"
                className="sr-only"
                checked={evState.mode === 'pv'}
                onChange={hapticClick}
              />
              <span className="text-sm font-medium">{t('control.evPv')}</span>
            </label>
            <label
              className={`cursor-pointer text-center py-2 px-3 rounded-lg border transition-all duration-300 focus-within:ring-2 focus-within:ring-(--color-primary)/40 ${evState.mode === 'fast' ? 'bg-(--color-primary)/20 border-(--color-primary) text-(--color-primary)' : 'bg-(--color-surface) border-(--color-border) text-(--color-muted) hover:border-(--color-primary)/40'}`}
            >
              <input
                type="radio"
                name="evMode"
                value="fast"
                className="sr-only"
                checked={evState.mode === 'fast'}
                onChange={hapticClick}
              />
              <span className="text-sm font-medium">{t('control.evFast')}</span>
            </label>
          </div>
          {evState.message && (
            <motion.p
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-sm text-(--color-primary)"
              role="status"
              aria-live="polite"
            >
              ✓ {evState.message}
            </motion.p>
          )}
          <button type="submit" disabled={isEvPending} className="btn-primary w-full focus-ring">
            {isEvPending ? t('common.saving') : t('common.apply')}
          </button>
        </form>
      </motion.div>

      {/* Heat Pump SG Ready */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium flex items-center gap-2 text-(--color-text)">
            <Thermometer size={18} className="text-orange-400" aria-hidden="true" />
            {t('control.hpTitle')}
          </h3>
          <span className="text-sm font-mono text-(--color-muted)">
            {(data.heatPumpPower / 1000).toFixed(1)} {t('units.kilowatt')}
          </span>
        </div>

        <form action={hpAction} className="space-y-3">
          <select
            name="hpMode"
            defaultValue={hpState.mode}
            onChange={hapticClick}
            aria-label={t('control.hpTitle')}
            className="w-full bg-(--color-surface) border border-(--color-border) rounded-lg px-3 py-2 text-sm text-(--color-text) focus:outline-none focus-ring"
          >
            <option value="1">{t('control.hpMode1')}</option>
            <option value="2">{t('control.hpMode2')}</option>
            <option value="3">{t('control.hpMode3')}</option>
            <option value="4">{t('control.hpMode4')}</option>
          </select>
          {hpState.message && (
            <motion.p
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-sm text-(--color-primary)"
              role="status"
              aria-live="polite"
            >
              ✓ {hpState.message}
            </motion.p>
          )}
          <button type="submit" disabled={isHpPending} className="btn-primary w-full focus-ring">
            {isHpPending ? t('common.saving') : t('common.apply')}
          </button>
        </form>
      </motion.div>

      {/* Battery Strategy */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-panel p-5"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium flex items-center gap-2 text-(--color-text)">
            <Battery size={18} className="text-emerald-400" aria-hidden="true" />
            {t('control.batteryTitle')}
          </h3>
        </div>
        <div className="text-sm text-(--color-muted) mb-3">
          {t('control.batteryMode')}:{' '}
          <span className="text-(--color-primary)">{t('control.selfConsumption')}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              hapticModeChange();
              sendCommand(
                'SET_BATTERY_POWER',
                -(settings.systemConfig.battery.maxChargeRateKW * 1000),
              );
            }}
            className="btn-secondary flex-1 focus-ring"
          >
            {t('control.forceCharge')}
          </button>
          <button
            onClick={() => {
              hapticModeChange();
              sendCommand('SET_BATTERY_POWER', 0);
            }}
            className="btn-secondary flex-1 focus-ring"
          >
            {t('control.auto')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
