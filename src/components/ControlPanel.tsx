import { useActionState } from 'react';
import { Battery, Car, Thermometer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';

import {
  type CommandType,
  type EnergyData,
  type EvState,
  type HpState,
  type EvMode,
  type HpMode,
} from '../types';
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
    async (_state: EvState, formData: FormData) => {
      hapticModeChange();
      const mode = (formData.get('evMode') ?? 'off') as EvMode;
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
    { mode: 'off' as EvMode, power: 0, message: '' },
  );

  // Mock action for Heat Pump SG Ready
  const [hpState, hpAction, isHpPending] = useActionState(
    async (_state: HpState, formData: FormData) => {
      hapticModeChange();
      const mode = (formData.get('hpMode') ?? '2') as HpMode;
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
    { mode: '2' as HpMode, power: 800, message: '' },
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
        <div className="mb-4 flex min-w-0 items-center justify-between gap-2">
          <h3 className="flex min-w-0 items-center gap-2 truncate font-medium text-(--color-text)">
            <Car size={18} className="shrink-0 text-purple-400" aria-hidden="true" />
            {t('control.evTitle')}
          </h3>
          <span className="shrink-0 font-mono text-sm text-(--color-muted)">
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
              className={`min-w-0 cursor-pointer overflow-hidden rounded-lg border px-2 py-2 text-center transition-all duration-300 focus-within:ring-2 focus-within:ring-(--color-primary)/40 ${evState.mode === 'off' ? 'border-(--color-primary) bg-(--color-primary)/20 text-(--color-primary)' : 'border-(--color-border) bg-(--color-surface) text-(--color-muted) hover:border-(--color-primary)/40'}`}
            >
              <input
                type="radio"
                name="evMode"
                value="off"
                className="sr-only"
                checked={evState.mode === 'off'}
                onChange={hapticClick}
              />
              <span className="block truncate text-xs font-medium sm:text-sm">
                {t('control.evOff')}
              </span>
            </label>
            <label
              className={`min-w-0 cursor-pointer overflow-hidden rounded-lg border px-2 py-2 text-center transition-all duration-300 focus-within:ring-2 focus-within:ring-(--color-primary)/40 ${evState.mode === 'pv' ? 'border-(--color-primary) bg-(--color-primary)/20 text-(--color-primary)' : 'border-(--color-border) bg-(--color-surface) text-(--color-muted) hover:border-(--color-primary)/40'}`}
              title={t('control.evPv')}
            >
              <input
                type="radio"
                name="evMode"
                value="pv"
                className="sr-only"
                checked={evState.mode === 'pv'}
                onChange={hapticClick}
              />
              <span className="block truncate text-xs font-medium sm:text-sm">
                {t('control.evPv')}
              </span>
            </label>
            <label
              className={`min-w-0 cursor-pointer overflow-hidden rounded-lg border px-2 py-2 text-center transition-all duration-300 focus-within:ring-2 focus-within:ring-(--color-primary)/40 ${evState.mode === 'fast' ? 'border-(--color-primary) bg-(--color-primary)/20 text-(--color-primary)' : 'border-(--color-border) bg-(--color-surface) text-(--color-muted) hover:border-(--color-primary)/40'}`}
            >
              <input
                type="radio"
                name="evMode"
                value="fast"
                className="sr-only"
                checked={evState.mode === 'fast'}
                onChange={hapticClick}
              />
              <span className="block truncate text-xs font-medium sm:text-sm">
                {t('control.evFast')}
              </span>
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
          <motion.button
            type="submit"
            disabled={isEvPending}
            className="btn-primary focus-ring w-full"
            whileTap={{ scale: 0.97 }}
          >
            {isEvPending ? t('common.saving') : t('common.apply')}
          </motion.button>
        </form>
      </motion.div>

      {/* Heat Pump SG Ready */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel p-5"
      >
        <div className="mb-4 flex min-w-0 items-center justify-between gap-2">
          <h3 className="flex min-w-0 items-center gap-2 truncate font-medium text-(--color-text)">
            <Thermometer size={18} className="shrink-0 text-orange-400" aria-hidden="true" />
            {t('control.hpTitle')}
          </h3>
          <span className="shrink-0 font-mono text-sm text-(--color-muted)">
            {(data.heatPumpPower / 1000).toFixed(1)} {t('units.kilowatt')}
          </span>
        </div>

        <form action={hpAction} className="space-y-3">
          <select
            name="hpMode"
            defaultValue={hpState.mode}
            onChange={hapticClick}
            aria-label={t('control.hpTitle')}
            className="focus-ring w-full rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm text-(--color-text) focus:outline-none"
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
          <motion.button
            type="submit"
            disabled={isHpPending}
            className="btn-primary focus-ring w-full"
            whileTap={{ scale: 0.97 }}
          >
            {isHpPending ? t('common.saving') : t('common.apply')}
          </motion.button>
        </form>
      </motion.div>

      {/* Battery Strategy */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-panel p-5"
      >
        <div className="mb-2 flex min-w-0 items-center justify-between">
          <h3 className="flex min-w-0 items-center gap-2 truncate font-medium text-(--color-text)">
            <Battery size={18} className="shrink-0 text-emerald-400" aria-hidden="true" />
            {t('control.batteryTitle')}
          </h3>
        </div>
        <div className="mb-3 text-sm text-(--color-muted)">
          {t('control.batteryMode')}:{' '}
          <span className="text-(--color-primary)">{t('control.selfConsumption')}</span>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              hapticModeChange();
              sendCommand(
                'SET_BATTERY_POWER',
                -(settings.systemConfig.battery.maxChargeRateKW * 1000),
              );
            }}
            className="btn-secondary focus-ring flex-1"
          >
            {t('control.forceCharge')}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              hapticModeChange();
              sendCommand('SET_BATTERY_POWER', 0);
            }}
            className="btn-secondary focus-ring flex-1"
          >
            {t('control.auto')}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
