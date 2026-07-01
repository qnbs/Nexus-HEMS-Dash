import { RefreshCw, Server, Wifi } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStoreShallow } from '../../store';
import { SettingsFeatureBar } from './SettingsFeatureBar';
import { inputClass, sectionClass, sectionHeaderClass } from './styles';
import { ToggleSwitch } from './ToggleSwitch';

/** Settings → System tab: gateway type, device IPs/ports, connection status, MQTT. */
export function SystemTab() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useAppStoreShallow((s) => ({
    settings: s.settings,
    updateSettings: s.updateSettings,
  }));

  return (
    <>
      <SettingsFeatureBar tabId="system" />
      <section className={sectionClass}>
        <h2 className={sectionHeaderClass}>
          <Server size={20} className="text-blue-400" />
          {t('settings.system')}
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Gateway Type Selector */}
          <div className="space-y-2 md:col-span-2">
            <p className="font-medium text-sm">{t('settings.gatewayType')}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  value: 'cerbo-gx' as const,
                  label: 'Cerbo GX',
                  desc: t('settings.gatewayTypeCerboHint'),
                },
                {
                  value: 'cerbo-gx-mk2' as const,
                  label: 'Cerbo GX MK2',
                  desc: t('settings.gatewayTypeMk2Hint'),
                },
                {
                  value: 'raspberry-pi' as const,
                  label: 'Raspberry Pi',
                  desc: t('settings.gatewayTypeRpiHint'),
                },
              ].map((gw) => (
                <button
                  key={gw.value}
                  type="button"
                  onClick={() => updateSettings({ gatewayType: gw.value })}
                  className={`rounded-xl border-2 p-3 text-left transition-all ${
                    settings.gatewayType === gw.value
                      ? 'border-(--color-primary) bg-(--color-primary)/10'
                      : 'border-(--color-border) bg-(--color-surface) hover:border-(--color-primary)/40'
                  }`}
                  aria-pressed={settings.gatewayType === gw.value}
                >
                  <span className="font-medium text-sm">{gw.label}</span>
                  <p className="mt-1 text-(--color-muted) text-xs">{gw.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="settings-victron-ip" className="font-medium text-sm">
              {t('settings.victronIp')}
            </label>
            <input
              id="settings-victron-ip"
              type="text"
              value={settings.victronIp}
              onChange={(e) => updateSettings({ victronIp: e.target.value })}
              className={inputClass}
              placeholder="192.168.1.100"
            />
            <p className="text-(--color-muted) text-xs">
              {t('settings.victronIpHint', 'IP address of your Victron Cerbo GX')}
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-knx-ip" className="font-medium text-sm">
              {t('settings.knxIp')}
            </label>
            <input
              id="settings-knx-ip"
              type="text"
              value={settings.knxIp}
              onChange={(e) => updateSettings({ knxIp: e.target.value })}
              className={inputClass}
              placeholder="192.168.1.101"
            />
            <p className="text-(--color-muted) text-xs">
              {t('settings.knxIpHint', 'IP address of your KNX IP router')}
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-ws-port" className="font-medium text-sm">
              {t('settings.wsPort')}
            </label>
            <input
              id="settings-ws-port"
              type="number"
              value={settings.wsPort}
              onChange={(e) => updateSettings({ wsPort: Number(e.target.value) })}
              className={inputClass}
              min={1}
              max={65535}
            />
            <p className="text-(--color-muted) text-xs">
              {t('settings.wsPortHint', 'Node-RED WebSocket port (default: 1880)')}
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-refresh-rate" className="font-medium text-sm">
              {t('settings.refreshRate')}
            </label>
            <input
              id="settings-refresh-rate"
              type="number"
              value={settings.refreshRateMs}
              onChange={(e) => updateSettings({ refreshRateMs: Number(e.target.value) })}
              className={inputClass}
              min={500}
              max={30000}
              step={100}
            />
            <p className="text-(--color-muted) text-xs">
              {t('settings.refreshRateHint', 'Data polling interval in milliseconds')}
            </p>
          </div>
        </div>
      </section>

      {/* Connection Status */}
      <section className={sectionClass}>
        <h2 className={sectionHeaderClass}>
          <Wifi size={20} className="text-emerald-400" />
          {t('settings.connectionStatus', 'Connection Status')}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { name: t('devices.cerboGx'), status: true },
            { name: t('devices.knxRouter'), status: false },
            { name: 'Node-RED', status: true },
          ].map((device) => (
            <div
              key={device.name}
              className="flex items-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-3"
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${device.status ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-rose-400'}`}
              />
              <div>
                <p className="font-medium text-sm">{device.name}</p>
                <p className="text-(--color-muted) text-xs">
                  {device.status ? t('common.connected') : t('common.disconnected')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MQTT Configuration */}
      <section className={sectionClass}>
        <h2 className={sectionHeaderClass}>
          <RefreshCw size={20} className="text-orange-400" />
          {t('settings.mqttConfig', 'MQTT / Home Assistant')}
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="settings-mqtt-broker-url" className="font-medium text-sm">
              {t('mqtt.brokerUrl')}
            </label>
            <input
              id="settings-mqtt-broker-url"
              type="text"
              className={inputClass}
              placeholder="mqtt://192.168.1.50"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-mqtt-port" className="font-medium text-sm">
              {t('mqtt.port')}
            </label>
            <input
              id="settings-mqtt-port"
              type="number"
              defaultValue={1883}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-mqtt-username" className="font-medium text-sm">
              {t('mqtt.username')}
            </label>
            <input
              id="settings-mqtt-username"
              type="text"
              className={inputClass}
              placeholder="mqtt_user"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-mqtt-password" className="font-medium text-sm">
              {t('mqtt.password')}
            </label>
            <input
              id="settings-mqtt-password"
              type="password"
              className={inputClass}
              placeholder="••••••••"
            />
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="font-medium text-sm">{t('mqtt.autoDiscovery')}</p>
            <p className="text-(--color-muted) text-xs">
              {t('settings.mqttAutoHint', 'Automatically discover Home Assistant devices')}
            </p>
          </div>
          <ToggleSwitch
            id="mqtt-auto"
            checked={settings.mqttAutoDiscovery ?? true}
            onChange={(v) => updateSettings({ mqttAutoDiscovery: v })}
            label={t('mqtt.autoDiscovery')}
          />
        </div>
      </section>
    </>
  );
}
