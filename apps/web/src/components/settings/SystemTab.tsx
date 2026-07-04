import { Server, Wifi } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { useEnergyStore } from '../../core/useEnergyStore';
import { useAppStoreShallow } from '../../store';
import { ConnectionStatusCards } from './ConnectionStatusCards';
import { GatewayTypeSelector } from './GatewayTypeSelector';
import { HomeAssistantSettingsSection } from './HomeAssistantSettingsSection';
import { SettingsFeatureBar } from './SettingsFeatureBar';
import { SystemNetworkFields } from './SystemNetworkFields';
import { sectionClass, sectionHeaderClass } from './styles';

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
          <Server size={20} className="text-blue-400" aria-hidden="true" />
          {t('settings.system')}
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <GatewayTypeSelector
            value={settings.gatewayType}
            onChange={(gatewayType) => updateSettings({ gatewayType })}
          />
          <SystemNetworkFields
            victronIp={settings.victronIp}
            knxIp={settings.knxIp}
            wsPort={settings.wsPort}
            refreshRateMs={settings.refreshRateMs}
            onVictronIpChange={(value) => updateSettings({ victronIp: value })}
            onKnxIpChange={(value) => updateSettings({ knxIp: value })}
            onWsPortChange={(value) => updateSettings({ wsPort: value })}
            onRefreshRateChange={(value) => updateSettings({ refreshRateMs: value })}
          />
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className={sectionHeaderClass}>
          <Wifi size={20} className="text-emerald-400" aria-hidden="true" />
          {t('settings.connectionStatus', 'Connection Status')}
        </h2>
        <ConnectionStatusCards devices={connectionDevices} />
      </section>

      <HomeAssistantSettingsSection />
    </>
  );
};
