import { Server, Wifi } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { useEnergyStore } from '../../core/useEnergyStore';
import { useAppStoreShallow } from '../../store';
import { ConnectionStatusCards } from './ConnectionStatusCards';
import { GatewayTypeSelector } from './GatewayTypeSelector';
import { HomeAssistantSettingsSection } from './HomeAssistantSettingsSection';
import { SettingsFeatureBar } from './SettingsFeatureBar';
import { inputClass, sectionClass, sectionHeaderClass } from './styles';

/** Settings → System tab: gateway type, device IPs/ports, connection status, MQTT. */
export const SystemTab = () => {
  const { t } = useTranslation();
  const { settings, updateSettings, wsConnected } = useAppStoreShallow((s) => ({
    settings: s.settings,
    updateSettings: s.updateSettings,
    wsConnected: s.connected,
  }));
  const { victronStatus, knxStatus } = useEnergyStore(
    useShallow((s) => ({
      victronStatus: s.adapters['victron-mqtt']?.status,
      knxStatus: s.adapters.knx?.status,
    })),
  );

  const connectionDevices = [
    { name: t('devices.cerboGx'), status: victronStatus === 'connected' },
    { name: t('devices.knxRouter'), status: knxStatus === 'connected' },
    { name: 'Node-RED', status: wsConnected },
  ];

  return (
    <>
      <SettingsFeatureBar tabId="system" />
      <section className={sectionClass}>
        <h2 className={sectionHeaderClass}>
          <Server size={20} className="text-blue-400" />
          {t('settings.system')}
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <GatewayTypeSelector
            value={settings.gatewayType}
            onChange={(gatewayType) => updateSettings({ gatewayType })}
          />

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

      <section className={sectionClass}>
        <h2 className={sectionHeaderClass}>
          <Wifi size={20} className="text-emerald-400" />
          {t('settings.connectionStatus', 'Connection Status')}
        </h2>
        <ConnectionStatusCards devices={connectionDevices} />
      </section>

      <HomeAssistantSettingsSection />
    </>
  );
};
