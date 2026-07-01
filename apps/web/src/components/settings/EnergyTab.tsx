import { Eye, EyeOff, Gauge, HardDrive, MapPin, Server, Zap } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStoreShallow } from '../../store';
import { type PVConfig, SYSTEM_PRESETS } from '../../types';
import { SettingsFeatureBar } from './SettingsFeatureBar';
import { inputClass, sectionClass, sectionHeaderClass } from './styles';

/** Settings → Energy tab: tariff provider/token, system presets, PV strings, grid limits, feed-in. */
export function EnergyTab() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useAppStoreShallow((s) => ({
    settings: s.settings,
    updateSettings: s.updateSettings,
  }));
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const toggleTokenVisibility = (key: string) =>
    setShowTokens((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <>
      <SettingsFeatureBar tabId="energy" />
      <section className={sectionClass}>
        <h2 className={sectionHeaderClass}>
          <Zap size={20} className="text-yellow-400" />
          {t('settings.energy')}
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="settings-tariff" className="font-medium text-sm">
              {t('settings.tariffProvider')}
            </label>
            <select
              id="settings-tariff"
              className={inputClass}
              value={settings.tariffProvider}
              onChange={(e) =>
                updateSettings({
                  tariffProvider: e.target.value as import('../../types').TariffProvider,
                })
              }
            >
              <option value="tibber">{t('settings.tibber')}</option>
              <option value="tibber-pulse">{t('settings.tibberPulse')}</option>
              <option value="awattar-de">{t('settings.awattarDE')}</option>
              <option value="awattar-at">{t('settings.awattarAT')}</option>
              <option value="octopus">{t('settings.octopus')}</option>
              <option value="awattar">{t('settings.awattar')}</option>
              <option value="none">{t('settings.none')}</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-api-token" className="font-medium text-sm">
              {t('settings.apiTokenLabel')}
            </label>
            <div className="relative">
              <input
                id="settings-api-token"
                type={showTokens.tariff ? 'text' : 'password'}
                className={`${inputClass} pr-10`}
                placeholder="••••••••••••••••"
              />
              <button
                type="button"
                onClick={() => toggleTokenVisibility('tariff')}
                className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-(--color-muted) hover:text-(--color-text)"
                aria-label={showTokens.tariff ? t('settings.hideToken') : t('settings.showToken')}
              >
                {showTokens.tariff ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-charge-threshold" className="font-medium text-sm">
              {t('settings.chargeThreshold')}
            </label>
            <div className="flex items-center gap-3">
              <input
                id="settings-charge-threshold"
                type="range"
                step={0.01}
                value={settings.chargeThreshold}
                onChange={(e) => updateSettings({ chargeThreshold: Number(e.target.value) })}
                className="flex-1 accent-(--color-primary)"
                aria-valuetext={`${settings.chargeThreshold.toFixed(2)} €/kWh`}
              />
              <span className="w-16 text-right font-mono text-sm">
                {settings.chargeThreshold.toFixed(2)} €
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-max-grid" className="font-medium text-sm">
              {t('settings.maxGrid')}
            </label>
            <div className="flex items-center gap-3">
              <input
                id="settings-max-grid"
                type="range"
                step={0.1}
                value={settings.maxGridImportKw}
                onChange={(e) => updateSettings({ maxGridImportKw: Number(e.target.value) })}
                className="flex-1 accent-(--color-primary)"
                aria-valuetext={`${settings.maxGridImportKw.toFixed(1)} kW`}
              />
              <span className="w-16 text-right font-mono text-sm">
                {settings.maxGridImportKw.toFixed(1)} kW
              </span>
            </div>
            <p className="text-(--color-muted) text-xs">
              {t('settings.maxGridHint', '§14a EnWG limit: 4.2 kW for controllable consumers')}
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-sm">{t('settings.dynamicGridFees')}</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={settings.dynamicGridFees}
                onClick={() => updateSettings({ dynamicGridFees: !settings.dynamicGridFees })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${settings.dynamicGridFees ? 'bg-(--color-primary)' : 'bg-(--color-border)'}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${settings.dynamicGridFees ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`}
                />
              </button>
              <span className="text-sm">
                {settings.dynamicGridFees
                  ? t('settings.dynamicGridFeesActive')
                  : t('settings.dynamicGridFeesInactive')}
              </span>
            </div>
            <p className="text-(--color-muted) text-xs">{t('settings.dynamicGridFeesHint')}</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-grid-operator" className="font-medium text-sm">
              {t('settings.gridOperatorLabel')}
            </label>
            <input
              id="settings-grid-operator"
              type="text"
              className={inputClass}
              value={settings.gridOperatorName}
              onChange={(e) => updateSettings({ gridOperatorName: e.target.value })}
              placeholder={t('settings.gridOperatorInputPlaceholder')}
            />
          </div>
        </div>
      </section>

      {/* System Preset */}
      <section className={sectionClass}>
        <h2 className={sectionHeaderClass}>
          <Server size={20} className="text-cyan-400" />
          {t('settings.systemPreset')}
        </h2>
        <p className="mb-4 text-(--color-muted) text-xs">{t('settings.systemPresetHint')}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Object.values(SYSTEM_PRESETS).map((preset) => (
            <button
              key={preset.presetId}
              type="button"
              onClick={() => updateSettings({ systemConfig: { ...preset } })}
              className={`rounded-xl border-2 p-3 text-left transition-all ${
                settings.systemConfig.presetId === preset.presetId
                  ? 'border-(--color-primary) bg-(--color-primary)/10'
                  : 'border-(--color-border) bg-(--color-surface) hover:border-(--color-primary)/40'
              }`}
              aria-pressed={settings.systemConfig.presetId === preset.presetId}
            >
              <span className="font-medium text-sm">{preset.presetName}</span>
              {preset.presetId !== 'custom' && (
                <p className="mt-1 text-(--color-muted) text-xs">
                  {preset.inverter.count}× {preset.inverter.ratedPowerW / 1000} kW ·{' '}
                  {preset.pv.peakPowerKWp} kWp · {preset.battery.capacityKWh} kWh
                </p>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Inverter Configuration */}
      <section className={sectionClass}>
        <h2 className={sectionHeaderClass}>
          <Zap size={20} className="text-amber-400" />
          {t('settings.inverterConfig')}
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="settings-inverter-model" className="font-medium text-sm">
              {t('settings.inverterModel')}
            </label>
            <input
              id="settings-inverter-model"
              type="text"
              value={settings.systemConfig.inverter.model}
              onChange={(e) =>
                updateSettings({
                  systemConfig: {
                    ...settings.systemConfig,
                    presetId: 'custom',
                    presetName: 'Custom',
                    inverter: {
                      ...settings.systemConfig.inverter,
                      model: e.target.value,
                    },
                  },
                })
              }
              className={inputClass}
              placeholder="Victron MultiPlus-II 48/5000/70-50"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-inverter-count" className="font-medium text-sm">
              {t('settings.inverterCount')}
            </label>
            <input
              id="settings-inverter-count"
              type="number"
              min={1}
              max={12}
              value={settings.systemConfig.inverter.count}
              onChange={(e) =>
                updateSettings({
                  systemConfig: {
                    ...settings.systemConfig,
                    presetId: 'custom',
                    presetName: 'Custom',
                    inverter: {
                      ...settings.systemConfig.inverter,
                      count: Number(e.target.value),
                    },
                  },
                })
              }
              className={inputClass}
            />
            <p className="text-(--color-muted) text-xs">{t('settings.inverterCountHint')}</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-inverter-power" className="font-medium text-sm">
              {t('settings.inverterPower')}
            </label>
            <input
              id="settings-inverter-power"
              type="number"
              step={100}
              min={500}
              max={15000}
              value={settings.systemConfig.inverter.ratedPowerW}
              onChange={(e) =>
                updateSettings({
                  systemConfig: {
                    ...settings.systemConfig,
                    presetId: 'custom',
                    presetName: 'Custom',
                    inverter: {
                      ...settings.systemConfig.inverter,
                      ratedPowerW: Number(e.target.value),
                    },
                  },
                })
              }
              className={inputClass}
            />
            <p className="text-(--color-muted) text-xs">
              {t('settings.totalPower')}:{' '}
              {(
                (settings.systemConfig.inverter.count *
                  settings.systemConfig.inverter.ratedPowerW) /
                1000
              ).toFixed(1)}{' '}
              kW
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-inv-mode" className="font-medium text-sm">
              {t('settings.inverterMode')}
            </label>
            <select
              id="settings-inv-mode"
              className={inputClass}
              value={settings.systemConfig.inverter.mode}
              onChange={(e) =>
                updateSettings({
                  systemConfig: {
                    ...settings.systemConfig,
                    presetId: 'custom',
                    presetName: 'Custom',
                    inverter: {
                      ...settings.systemConfig.inverter,
                      mode: e.target.value as 'single' | 'parallel' | 'three-phase',
                    },
                  },
                })
              }
            >
              <option value="single">{t('settings.modeSingle')}</option>
              <option value="parallel">{t('settings.modeParallel')}</option>
              <option value="three-phase">{t('settings.modeThreePhase')}</option>
            </select>
          </div>
        </div>
      </section>

      {/* PV System */}
      <section className={sectionClass}>
        <h2 className={sectionHeaderClass}>
          <Zap size={20} className="text-yellow-400" />
          {t('settings.pvSystem', 'PV System')}
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="settings-pv-peak-power" className="font-medium text-sm">
              {t('settings.pvPeakPower', 'Peak power (kWp)')}
            </label>
            <input
              id="settings-pv-peak-power"
              type="number"
              step={0.1}
              value={settings.systemConfig.pv.peakPowerKWp}
              onChange={(e) =>
                updateSettings({
                  systemConfig: {
                    ...settings.systemConfig,
                    presetId: 'custom',
                    presetName: 'Custom',
                    pv: {
                      ...settings.systemConfig.pv,
                      peakPowerKWp: Number(e.target.value),
                    },
                  },
                })
              }
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-orientation" className="font-medium text-sm">
              {t('settings.pvOrientation', 'Orientation')}
            </label>
            <select
              id="settings-orientation"
              className={inputClass}
              value={settings.systemConfig.pv.orientation}
              onChange={(e) =>
                updateSettings({
                  systemConfig: {
                    ...settings.systemConfig,
                    presetId: 'custom',
                    presetName: 'Custom',
                    pv: {
                      ...settings.systemConfig.pv,
                      orientation: e.target.value as PVConfig['orientation'],
                    },
                  },
                })
              }
            >
              <option value="south">{t('settings.south', 'South')}</option>
              <option value="east-west">{t('settings.eastWest', 'East/West')}</option>
              <option value="east">{t('settings.east', 'East')}</option>
              <option value="west">{t('settings.west', 'West')}</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-pv-tilt" className="font-medium text-sm">
              {t('settings.pvTilt', 'Tilt angle (°)')}
            </label>
            <input
              id="settings-pv-tilt"
              type="number"
              min={0}
              max={90}
              value={settings.systemConfig.pv.tiltDeg}
              onChange={(e) =>
                updateSettings({
                  systemConfig: {
                    ...settings.systemConfig,
                    presetId: 'custom',
                    presetName: 'Custom',
                    pv: {
                      ...settings.systemConfig.pv,
                      tiltDeg: Number(e.target.value),
                    },
                  },
                })
              }
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-pv-strings" className="font-medium text-sm">
              {t('settings.pvStrings')}
            </label>
            <input
              id="settings-pv-strings"
              type="number"
              min={1}
              max={20}
              value={settings.systemConfig.pv.strings}
              onChange={(e) =>
                updateSettings({
                  systemConfig: {
                    ...settings.systemConfig,
                    presetId: 'custom',
                    presetName: 'Custom',
                    pv: {
                      ...settings.systemConfig.pv,
                      strings: Number(e.target.value),
                    },
                  },
                })
              }
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="pv-mppt-count" className="font-medium text-sm">
              {t('settings.mpptCount')}
            </label>
            <input
              id="pv-mppt-count"
              type="number"
              min={1}
              max={8}
              value={settings.systemConfig.pv.mpptCount}
              onChange={(e) =>
                updateSettings({
                  systemConfig: {
                    ...settings.systemConfig,
                    presetId: 'custom',
                    presetName: 'Custom',
                    pv: {
                      ...settings.systemConfig.pv,
                      mpptCount: Number(e.target.value),
                    },
                  },
                })
              }
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Battery Config */}
      <section className={sectionClass}>
        <h2 className={sectionHeaderClass}>
          <HardDrive size={20} className="text-purple-400" />
          {t('settings.batteryConfig', 'Battery Configuration')}
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="settings-battery-model" className="font-medium text-sm">
              {t('settings.batteryModel')}
            </label>
            <input
              id="settings-battery-model"
              type="text"
              value={settings.systemConfig.battery.model}
              onChange={(e) =>
                updateSettings({
                  systemConfig: {
                    ...settings.systemConfig,
                    presetId: 'custom',
                    presetName: 'Custom',
                    battery: {
                      ...settings.systemConfig.battery,
                      model: e.target.value,
                    },
                  },
                })
              }
              className={inputClass}
              placeholder="BYD Battery-Box Premium HVS"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-battery-capacity" className="font-medium text-sm">
              {t('settings.batteryCapacity', 'Capacity (kWh)')}
            </label>
            <input
              id="settings-battery-capacity"
              type="number"
              step={0.1}
              value={settings.systemConfig.battery.capacityKWh}
              onChange={(e) =>
                updateSettings({
                  systemConfig: {
                    ...settings.systemConfig,
                    presetId: 'custom',
                    presetName: 'Custom',
                    battery: {
                      ...settings.systemConfig.battery,
                      capacityKWh: Number(e.target.value),
                    },
                  },
                })
              }
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-battery-modules" className="font-medium text-sm">
              {t('settings.batteryModules')}
            </label>
            <input
              id="settings-battery-modules"
              type="number"
              min={1}
              onChange={(e) =>
                updateSettings({
                  systemConfig: {
                    ...settings.systemConfig,
                    presetId: 'custom',
                    presetName: 'Custom',
                    battery: {
                      ...settings.systemConfig.battery,
                      modules: Number(e.target.value),
                    },
                  },
                })
              }
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-battery-voltage" className="font-medium text-sm">
              {t('settings.batteryVoltage')}
            </label>
            <input
              id="settings-battery-voltage"
              type="number"
              step={0.1}
              value={settings.systemConfig.battery.nominalVoltageV}
              onChange={(e) =>
                updateSettings({
                  systemConfig: {
                    ...settings.systemConfig,
                    presetId: 'custom',
                    presetName: 'Custom',
                    battery: {
                      ...settings.systemConfig.battery,
                      nominalVoltageV: Number(e.target.value),
                    },
                  },
                })
              }
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-battery-max-charge" className="font-medium text-sm">
              {t('settings.batteryMaxCharge', 'Max charge rate (kW)')}
            </label>
            <input
              id="settings-battery-max-charge"
              type="number"
              step={0.1}
              value={settings.systemConfig.battery.maxChargeRateKW}
              onChange={(e) =>
                updateSettings({
                  systemConfig: {
                    ...settings.systemConfig,
                    presetId: 'custom',
                    presetName: 'Custom',
                    battery: {
                      ...settings.systemConfig.battery,
                      maxChargeRateKW: Number(e.target.value),
                    },
                  },
                })
              }
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-battery-max-discharge" className="font-medium text-sm">
              {t('settings.batteryMaxDischarge')}
            </label>
            <input
              id="settings-battery-max-discharge"
              type="number"
              step={0.1}
              value={settings.systemConfig.battery.maxDischargeRateKW}
              onChange={(e) =>
                updateSettings({
                  systemConfig: {
                    ...settings.systemConfig,
                    presetId: 'custom',
                    presetName: 'Custom',
                    battery: {
                      ...settings.systemConfig.battery,
                      maxDischargeRateKW: Number(e.target.value),
                    },
                  },
                })
              }
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-battery-min-soc" className="font-medium text-sm">
              {t('settings.batteryMinSoC', 'Minimum SoC (%)')}
            </label>
            <input
              id="settings-battery-min-soc"
              type="number"
              min={5}
              max={50}
              value={settings.systemConfig.battery.minSoCPercent}
              onChange={(e) =>
                updateSettings({
                  systemConfig: {
                    ...settings.systemConfig,
                    presetId: 'custom',
                    presetName: 'Custom',
                    battery: {
                      ...settings.systemConfig.battery,
                      minSoCPercent: Number(e.target.value),
                    },
                  },
                })
              }
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-strategy" className="font-medium text-sm">
              {t('settings.batteryStrategy', 'Default strategy')}
            </label>
            <select
              id="settings-strategy"
              className={inputClass}
              value={settings.systemConfig.battery.strategy}
              onChange={(e) =>
                updateSettings({
                  systemConfig: {
                    ...settings.systemConfig,
                    presetId: 'custom',
                    presetName: 'Custom',
                    battery: {
                      ...settings.systemConfig.battery,
                      strategy: e.target.value as
                        | 'self-consumption'
                        | 'force-charge'
                        | 'time-of-use'
                        | 'auto',
                    },
                  },
                })
              }
            >
              <option value="self-consumption">{t('control.selfConsumption')}</option>
              <option value="force-charge">{t('control.forceCharge')}</option>
              <option value="time-of-use">{t('settings.timeOfUse')}</option>
              <option value="auto">{t('control.auto')}</option>
            </select>
          </div>
        </div>
      </section>

      {/* EV Charger & Heat Pump */}
      <section className={sectionClass}>
        <h2 className={sectionHeaderClass}>
          <Gauge size={20} className="text-emerald-400" />
          {t('settings.consumersConfig')}
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="settings-ev-charger-model" className="font-medium text-sm">
              {t('settings.evChargerModel')}
            </label>
            <input
              id="settings-ev-charger-model"
              type="text"
              value={settings.systemConfig.evCharger.model}
              onChange={(e) =>
                updateSettings({
                  systemConfig: {
                    ...settings.systemConfig,
                    presetId: 'custom',
                    presetName: 'Custom',
                    evCharger: {
                      ...settings.systemConfig.evCharger,
                      model: e.target.value,
                    },
                  },
                })
              }
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-ev-max-power" className="font-medium text-sm">
              {t('settings.evMaxPower')}
            </label>
            <input
              id="settings-ev-max-power"
              type="number"
              step={0.1}
              min={1}
              max={50}
              value={settings.systemConfig.evCharger.maxPowerKW}
              onChange={(e) =>
                updateSettings({
                  systemConfig: {
                    ...settings.systemConfig,
                    presetId: 'custom',
                    presetName: 'Custom',
                    evCharger: {
                      ...settings.systemConfig.evCharger,
                      maxPowerKW: Number(e.target.value),
                    },
                  },
                })
              }
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-heat-pump-model" className="font-medium text-sm">
              {t('settings.heatPumpModel')}
            </label>
            <input
              id="settings-heat-pump-model"
              type="text"
              value={settings.systemConfig.heatPump.model}
              onChange={(e) =>
                updateSettings({
                  systemConfig: {
                    ...settings.systemConfig,
                    presetId: 'custom',
                    presetName: 'Custom',
                    heatPump: {
                      ...settings.systemConfig.heatPump,
                      model: e.target.value,
                    },
                  },
                })
              }
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-heat-pump-power" className="font-medium text-sm">
              {t('settings.heatPumpPower')}
            </label>
            <input
              id="settings-heat-pump-power"
              type="number"
              step={0.1}
              min={1}
              max={30}
              value={settings.systemConfig.heatPump.ratedPowerKW}
              onChange={(e) =>
                updateSettings({
                  systemConfig: {
                    ...settings.systemConfig,
                    presetId: 'custom',
                    presetName: 'Custom',
                    heatPump: {
                      ...settings.systemConfig.heatPump,
                      ratedPowerKW: Number(e.target.value),
                    },
                  },
                })
              }
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Location & Weather */}
      <section className={sectionClass}>
        <h2 className={sectionHeaderClass}>
          <MapPin size={20} className="text-rose-400" />
          {t('settings.locationTitle', 'Location & Weather')}
        </h2>
        <p className="-mt-2 text-(--color-muted) text-xs">
          {t(
            'settings.locationHint',
            'Used for solar forecast, weather data, and sunrise/sunset calculations',
          )}
        </p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="settings-lat" className="font-medium text-sm">
              {t('settings.latitude', 'Latitude')}
            </label>
            <input
              id="settings-lat"
              type="number"
              step={0.0001}
              min={-90}
              max={90}
              value={settings.location.lat}
              onChange={(e) =>
                updateSettings({
                  location: { ...settings.location, lat: Number(e.target.value) },
                })
              }
              className={inputClass}
              placeholder="53.5511"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-lon" className="font-medium text-sm">
              {t('settings.longitude', 'Longitude')}
            </label>
            <input
              id="settings-lon"
              type="number"
              step={0.0001}
              min={-180}
              max={180}
              value={settings.location.lon}
              onChange={(e) =>
                updateSettings({
                  location: { ...settings.location, lon: Number(e.target.value) },
                })
              }
              className={inputClass}
              placeholder="9.9937"
            />
          </div>
        </div>
      </section>

      {/* Grid & Tariff Extras */}
      <section className={sectionClass}>
        <h2 className={sectionHeaderClass}>
          <Zap size={20} className="text-orange-400" />
          {t('settings.gridExtrasTitle', 'Grid & Tariff Details')}
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="settings-grid-price" className="font-medium text-sm">
              {t('settings.gridPriceAvg', 'Avg. grid price (€/kWh)')}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0.1}
                max={0.6}
                step={0.01}
                value={settings.gridPriceAvg}
                onChange={(e) => updateSettings({ gridPriceAvg: Number(e.target.value) })}
                className="flex-1 accent-(--color-primary)"
                aria-label={t('settings.gridPriceAvg', 'Avg. grid price (€/kWh)')}
                aria-valuetext={`${settings.gridPriceAvg.toFixed(2)} €/kWh`}
              />
              <span className="w-20 text-right font-mono text-sm">
                {settings.gridPriceAvg.toFixed(2)} €
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-feedin" className="font-medium text-sm">
              {t('settings.feedInTariff', 'Feed-in tariff (€/kWh)')}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0.0}
                max={0.2}
                step={0.001}
                value={settings.feedInTariff ?? 0.082}
                onChange={(e) => updateSettings({ feedInTariff: Number(e.target.value) })}
                className="flex-1 accent-(--color-primary)"
                aria-label={t('settings.feedInTariff', 'Feed-in tariff (€/kWh)')}
                aria-valuetext={`${(settings.feedInTariff ?? 0.082).toFixed(3)} €/kWh`}
              />
              <span className="w-20 text-right font-mono text-sm">
                {(settings.feedInTariff ?? 0.082).toFixed(3)} €
              </span>
            </div>
            <p className="text-(--color-muted) text-xs">
              {t('settings.feedInTariffHint', 'EEG feed-in compensation per kWh')}
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-grid-operator" className="font-medium text-sm">
              {t('settings.gridOperator', 'Grid operator')}
            </label>
            <input
              id="settings-grid-operator"
              type="text"
              value={settings.gridOperator ?? ''}
              onChange={(e) => updateSettings({ gridOperator: e.target.value })}
              className={inputClass}
              placeholder={t('settings.gridOperatorPlaceholder', 'e.g. Stromnetz Hamburg')}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-budget" className="font-medium text-sm">
              {t('settings.monthlyBudget', 'Monthly energy budget (€)')}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={20}
                max={500}
                step={5}
                value={settings.monthlyBudget ?? 80}
                onChange={(e) => updateSettings({ monthlyBudget: Number(e.target.value) })}
                className="flex-1 accent-(--color-primary)"
                aria-label={t('settings.monthlyBudget', 'Monthly energy budget (€)')}
                aria-valuetext={`${settings.monthlyBudget ?? 80} €`}
              />
              <span className="w-16 text-right font-mono text-sm">
                {settings.monthlyBudget ?? 80} €
              </span>
            </div>
            <p className="text-(--color-muted) text-xs">
              {t(
                'settings.monthlyBudgetHint',
                'Target monthly electricity cost for budget tracking',
              )}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
