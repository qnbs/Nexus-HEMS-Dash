import { ArrowRight, Cpu, Gauge, HardDrive, Info, Shield, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAppStoreShallow } from '../../store';
import { SettingsFeatureBar } from './SettingsFeatureBar';
import { inputClass, sectionClass, sectionHeaderClass } from './styles';

/** Settings → Controllers tab: MPC optimizer, battery/PV/EV/heat-pump params, command safety. */
export function ControllersTab() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useAppStoreShallow((s) => ({
    settings: s.settings,
    updateSettings: s.updateSettings,
  }));

  return (
    <>
      <SettingsFeatureBar tabId="controllers" />

      {/* Controller Pipeline Overview */}
      <section className={sectionClass}>
        <h2 className={sectionHeaderClass}>
          <Cpu size={20} className="text-cyan-400" />
          {t('settings.controllerPipeline', 'Controller Pipeline')}
        </h2>
        <p className="text-(--color-muted) text-xs">
          {t(
            'settings.controllerPipelineHint',
            'Seven real-time energy control loops inspired by EMHASS, OpenEMS & evcc. Controllers run in priority order (critical → low) and merge their outputs.',
          )}
        </p>

        <div className="space-y-3">
          {[
            {
              id: 'ess-symmetric',
              name: t('settings.ctrl_essSym', 'ESS Symmetric Controller'),
              desc: t('settings.ctrl_essSymDesc', 'PID grid-balance, zero-grid-power target'),
              priority: 'high' as const,
              icon: '⚡',
            },
            {
              id: 'peak-shaving',
              name: t('settings.ctrl_peakShaving', 'Peak Shaving Controller'),
              desc: t('settings.ctrl_peakShavingDesc', 'Grid import capping with hysteresis band'),
              priority: 'critical' as const,
              icon: '📉',
            },
            {
              id: 'grid-optimized-charge',
              name: t('settings.ctrl_gridCharge', 'Grid-Optimized Charge'),
              desc: t(
                'settings.ctrl_gridChargeDesc',
                'Tariff-based battery charge/discharge scheduling',
              ),
              priority: 'normal' as const,
              icon: '💰',
            },
            {
              id: 'self-consumption',
              name: t('settings.ctrl_selfConsumption', 'Self-Consumption'),
              desc: t(
                'settings.ctrl_selfConsumptionDesc',
                'Maximize PV self-consumption, absorb surplus',
              ),
              priority: 'normal' as const,
              icon: '\u2600',
            },
            {
              id: 'emergency-capacity',
              name: t('settings.ctrl_emergency', 'Emergency Capacity'),
              desc: t('settings.ctrl_emergencyDesc', 'Reserve SoC backup for grid outages'),
              priority: 'critical' as const,
              icon: '🔋',
            },
            {
              id: 'heatpump-sg-ready',
              name: t('settings.ctrl_heatpump', 'Heat Pump SG Ready'),
              desc: t(
                'settings.ctrl_heatpumpDesc',
                'SG Ready mode 1–4 based on PV surplus & tariff',
              ),
              priority: 'normal' as const,
              icon: '\uD83C\uDF21',
            },
            {
              id: 'ev-smart-charge',
              name: t('settings.ctrl_evSmart', 'EV Smart Charge'),
              desc: t(
                'settings.ctrl_evSmartDesc',
                'PV surplus charging, tariff optimization, §14a EnWG',
              ),
              priority: 'normal' as const,
              icon: '🚗',
            },
          ].map((ctrl) => (
            <div
              key={ctrl.id}
              className="flex items-center gap-4 rounded-xl border border-(--color-border) bg-(--color-surface) p-4 transition-all hover:border-(--color-primary)/30"
            >
              <span className="text-xl" aria-hidden="true">
                {ctrl.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{ctrl.name}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 font-semibold text-[10px] uppercase tracking-wider ${
                      ctrl.priority === 'critical'
                        ? 'bg-rose-500/15 text-rose-400'
                        : ctrl.priority === 'high'
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-blue-500/15 text-blue-400'
                    }`}
                  >
                    {ctrl.priority}
                  </span>
                </div>
                <p className="mt-0.5 text-(--color-muted) text-xs">{ctrl.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-(--color-primary)/20 bg-(--color-primary)/5 px-4 py-3 text-sm">
          <Info size={16} className="shrink-0 text-(--color-primary)" />
          <span>
            {t(
              'settings.controllerManageHint',
              'Manage controller states, enable/disable, and view live outputs on the',
            )}{' '}
            <Link
              to="/devices"
              className="font-medium text-(--color-primary) underline-offset-2 hover:underline"
            >
              {t('nav.controllers', 'Controllers')}
            </Link>{' '}
            {t('common.page', 'page')}.
          </span>
        </div>
      </section>

      {/* MPC Optimizer */}
      <section className={sectionClass}>
        <h2 className={sectionHeaderClass}>
          <Gauge size={20} className="text-emerald-400" />
          {t('settings.mpcOptimizer', 'MPC Day-Ahead Optimizer')}
        </h2>
        <p className="text-(--color-muted) text-xs">
          {t(
            'settings.mpcOptimizerHint',
            'Greedy LP day-ahead optimization over a 24-hour horizon with 15-minute resolution. Multi-objective: minimize cost, maximize self-consumption, minimize CO₂.',
          )}
        </p>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="settings-pv-peak-kw-mpc" className="font-medium text-sm">
              {t('settings.pvPeakKw', 'PV peak power (kW)')}
            </label>
            <input
              id="settings-pv-peak-kw-mpc"
              type="number"
              step={0.1}
              min={0}
              max={100}
              value={settings.pvPeakKw}
              onChange={(e) => updateSettings({ pvPeakKw: Number(e.target.value) })}
              className={inputClass}
            />
            <p className="text-(--color-muted) text-xs">
              {t('settings.pvPeakKwHint', 'Used by MPC for PV generation forecast scaling')}
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-battery-capacity-kwh-mpc" className="font-medium text-sm">
              {t('settings.batteryCapacityKWhMpc', 'Battery capacity (kWh)')}
            </label>
            <input
              id="settings-battery-capacity-kwh-mpc"
              type="number"
              step={0.1}
              min={0}
              max={200}
              value={settings.batteryCapacityKWh}
              onChange={(e) => updateSettings({ batteryCapacityKWh: Number(e.target.value) })}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-battery-max-charge-kw-mpc" className="font-medium text-sm">
              {t('settings.batteryMaxChargeKW', 'Max charge rate (kW)')}
            </label>
            <input
              id="settings-battery-max-charge-kw-mpc"
              type="number"
              step={0.1}
              min={0}
              max={50}
              value={settings.batteryMaxChargeKW}
              onChange={(e) => updateSettings({ batteryMaxChargeKW: Number(e.target.value) })}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-battery-min-soc-mpc" className="font-medium text-sm">
              {t('settings.batteryMinSoCMpc', 'Min SoC (%)')}
            </label>
            <input
              id="settings-battery-min-soc-mpc"
              type="number"
              min={5}
              max={50}
              value={settings.batteryMinSoC}
              onChange={(e) => updateSettings({ batteryMinSoC: Number(e.target.value) })}
              className={inputClass}
            />
            <p className="text-(--color-muted) text-xs">
              {t('settings.batteryMinSoCHint', 'MPC will not discharge below this SoC level')}
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-ev-max-power-kw-mpc" className="font-medium text-sm">
              {t('settings.evMaxPowerKW', 'EV max charge (kW)')}
            </label>
            <input
              id="settings-ev-max-power-kw-mpc"
              type="number"
              step={0.1}
              min={1}
              max={50}
              value={settings.evMaxPowerKW}
              onChange={(e) => updateSettings({ evMaxPowerKW: Number(e.target.value) })}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-heat-pump-power-kw-mpc" className="font-medium text-sm">
              {t('settings.heatPumpPowerKW', 'Heat pump power (kW)')}
            </label>
            <input
              id="settings-heat-pump-power-kw-mpc"
              type="number"
              step={0.1}
              min={0}
              max={30}
              value={settings.heatPumpPowerKW}
              onChange={(e) => updateSettings({ heatPumpPowerKW: Number(e.target.value) })}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-feed-in-tariff" className="font-medium text-sm">
              {t('settings.feedInTariffEurKWh', 'Feed-in tariff (€/kWh)')}
            </label>
            <div className="flex items-center gap-3">
              <input
                id="settings-feed-in-tariff"
                type="range"
                min={0.0}
                max={0.15}
                step={0.001}
                value={settings.feedInTariffEurKWh}
                onChange={(e) => updateSettings({ feedInTariffEurKWh: Number(e.target.value) })}
                className="flex-1 accent-(--color-primary)"
                aria-label={t('settings.feedInTariffEurKWh', 'Feed-in tariff (€/kWh)')}
                aria-valuetext={`${settings.feedInTariffEurKWh.toFixed(3)} €/kWh`}
              />
              <span className="w-20 text-right font-mono text-sm">
                {settings.feedInTariffEurKWh.toFixed(3)} €
              </span>
            </div>
            <p className="text-(--color-muted) text-xs">
              {t('settings.feedInTariffEurKWhHint', 'EEG compensation used by MPC cost function')}
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-max-grid-import-mpc" className="font-medium text-sm">
              {t('settings.maxGridImportKwMpc', 'Max grid import (kW)')}
            </label>
            <div className="flex items-center gap-3">
              <input
                id="settings-max-grid-import-mpc"
                type="range"
                min={1.0}
                max={15.0}
                step={0.1}
                value={settings.maxGridImportKw}
                onChange={(e) => updateSettings({ maxGridImportKw: Number(e.target.value) })}
                className="flex-1 accent-(--color-primary)"
                aria-label={t('settings.maxGridImportKwMpc', 'Max grid import (kW)')}
                aria-valuetext={`${settings.maxGridImportKw.toFixed(1)} kW`}
              />
              <span className="w-16 text-right font-mono text-sm">
                {settings.maxGridImportKw.toFixed(1)} kW
              </span>
            </div>
            <p className="text-(--color-muted) text-xs">
              {t(
                'settings.maxGridMpcHint',
                '§14a EnWG constraint for MPC & peak shaving controller',
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Command Safety */}
      <section className={sectionClass}>
        <h2 className={sectionHeaderClass}>
          <Shield size={20} className="text-amber-400" />
          {t('settings.commandSafety', 'Command Safety Layer')}
        </h2>
        <p className="text-(--color-muted) text-xs">
          {t(
            'settings.commandSafetyHint',
            'All 18 adapter command types are validated with Zod schemas and IEC/EN safety limits. Dangerous commands require user confirmation via dialog.',
          )}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { label: t('settings.safetyEvPower', 'EV Power'), range: '0–50 kW' },
            {
              label: t('settings.safetyEvCurrent', 'EV Current (IEC 61851)'),
              range: '0–80 A',
            },
            { label: t('settings.safetyBattPower', 'Battery Power'), range: '±25 kW' },
            { label: t('settings.safetySgReady', 'SG Ready Mode'), range: '1–4' },
            {
              label: t('settings.safetyGridLimit', 'Grid Limit (§14a)'),
              range: '0–25 kW',
            },
            { label: t('settings.safetyKnxTemp', 'KNX Temperature'), range: '5–35 °C' },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-3"
            >
              <span className="text-sm">{item.label}</span>
              <span className="font-mono text-(--color-primary) text-xs">{item.range}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Links to Feature Pages */}
      <section className={sectionClass}>
        <h2 className={sectionHeaderClass}>
          <ArrowRight size={20} className="text-violet-400" />
          {t('settings.featurePages', 'Feature Pages')}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            to="/devices"
            className="flex items-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-4 transition-all hover:border-(--color-primary)/40 hover:bg-(--color-primary)/5"
          >
            <Cpu size={20} className="text-cyan-400" />
            <div>
              <p className="font-medium text-sm">{t('nav.controllers', 'Controllers')}</p>
              <p className="text-(--color-muted) text-xs">
                {t('settings.controllersLinkDesc', 'Live controller states & outputs')}
              </p>
            </div>
          </Link>
          <Link
            to="/plugins"
            className="flex items-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-4 transition-all hover:border-(--color-primary)/40 hover:bg-(--color-primary)/5"
          >
            <Sparkles size={20} className="text-purple-400" />
            <div>
              <p className="font-medium text-sm">{t('nav.plugins', 'Plugins')}</p>
              <p className="text-(--color-muted) text-xs">
                {t('settings.pluginsLinkDesc', 'Plugin lifecycle & services')}
              </p>
            </div>
          </Link>
          <Link
            to="/devices"
            className="flex items-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-4 transition-all hover:border-(--color-primary)/40 hover:bg-(--color-primary)/5"
          >
            <HardDrive size={20} className="text-orange-400" />
            <div>
              <p className="font-medium text-sm">{t('nav.hardware', 'Hardware')}</p>
              <p className="text-(--color-muted) text-xs">
                {t('settings.hardwareLinkDesc', '120+ supported devices')}
              </p>
            </div>
          </Link>
        </div>
      </section>
    </>
  );
}
