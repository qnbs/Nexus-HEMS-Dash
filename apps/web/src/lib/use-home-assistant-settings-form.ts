import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { HAConnectionMode } from '../core/adapters/contrib/homeassistant-mqtt';
import { saveHomeAssistantSettings } from '../core/homeassistant-settings-save';
import { useEnergyStore } from '../core/useEnergyStore';
import { useAppStoreShallow } from '../store';
import { isReadOnlyModeActive } from './adapter-mode';

export const useHomeAssistantSettingsForm = () => {
  const { t } = useTranslation();
  const isReadOnly = isReadOnlyModeActive();
  const haEnabled = useEnergyStore((s) => s.adapters['homeassistant-mqtt']?.enabled ?? false);
  const { settings, updateSettings } = useAppStoreShallow((s) => ({
    settings: s.settings,
    updateSettings: s.updateSettings,
  }));

  const [haMode, setHaMode] = useState<HAConnectionMode>('ha-ws-api');
  const [haBaseUrl, setHaBaseUrl] = useState('http://homeassistant.local:8123');
  const [haToken, setHaToken] = useState('');
  const [mqttHost, setMqttHost] = useState('');
  const [mqttPort, setMqttPort] = useState(1883);
  const [mqttUser, setMqttUser] = useState('');
  const [mqttPassword, setMqttPassword] = useState('');
  const [enabled, setEnabled] = useState(haEnabled);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (isReadOnly) {
      toast.error(t('mode.readOnlyBlocked'));
      return;
    }

    setSaving(true);
    try {
      const result = await saveHomeAssistantSettings({
        enabled,
        haMode,
        haBaseUrl,
        haToken,
        mqttHost,
        mqttPort,
        mqttUser,
        mqttPassword,
        mqttAutoDiscovery: settings.mqttAutoDiscovery ?? true,
      });
      if (!result.ok) {
        toast.error(t('settings.haSaveFailed', { error: result.error }));
        return;
      }
      toast.success(t('settings.haSaveSuccess'));
    } catch {
      toast.error(t('settings.haSaveFailed', { error: t('common.error') }));
    } finally {
      setSaving(false);
    }
  };

  return {
    isReadOnly,
    haMode,
    setHaMode,
    haBaseUrl,
    setHaBaseUrl,
    haToken,
    setHaToken,
    mqttHost,
    setMqttHost,
    mqttPort,
    setMqttPort,
    mqttUser,
    setMqttUser,
    mqttPassword,
    setMqttPassword,
    enabled,
    setEnabled,
    saving,
    handleSave,
    mqttAutoDiscovery: settings.mqttAutoDiscovery ?? true,
    updateMqttAutoDiscovery: (value: boolean) => updateSettings({ mqttAutoDiscovery: value }),
    t,
  };
};
