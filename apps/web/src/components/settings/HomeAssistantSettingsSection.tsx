import { Home, RefreshCw, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { HAConnectionMode } from '../../core/adapters/contrib/homeassistant-mqtt';
import { saveHomeAssistantSettings } from '../../core/homeassistant-settings-save';
import { useEnergyStore } from '../../core/useEnergyStore';
import { isReadOnlyModeActive } from '../../lib/adapter-mode';
import { ignorePromiseRejection } from '../../lib/ignore-promise-rejection';
import { useAppStoreShallow } from '../../store';
import { ChoiceCardGroup } from '../ui/ChoiceCardGroup';
import { HaWsApiFields, MqttBrokerFields } from './HaConnectionFields';
import { ToggleSwitch } from './ToggleSwitch';

export const HomeAssistantSettingsSection = () => {
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

  const sectionClass = 'glass-panel-strong space-y-6 rounded-2xl p-6';
  const sectionHeaderClass =
    'flex items-center gap-2 border-b border-(--color-border) pb-4 text-lg font-medium fluid-text-lg';

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

  return (
    <section className={sectionClass}>
      <h2 className={sectionHeaderClass}>
        <Home size={20} className="text-orange-400" />
        {t('settings.haTitle')}
      </h2>
      <p className="text-(--color-muted) text-sm">{t('settings.haDescription')}</p>

      <ChoiceCardGroup
        key={haMode}
        name="ha-connection-mode"
        value={haMode}
        onChange={(v) => setHaMode(v as HAConnectionMode)}
        disabled={isReadOnly}
        aria-label={t('settings.haConnectionMode')}
        options={[
          {
            value: 'ha-ws-api',
            label: t('settings.haModeWsApi'),
            description: t('settings.haModeWsApiDesc'),
          },
          {
            value: 'mqtt-broker',
            label: t('settings.haModeMqtt'),
            description: t('settings.haModeMqttDesc'),
          },
        ]}
      />

      {haMode === 'ha-ws-api' ? (
        <HaWsApiFields
          haBaseUrl={haBaseUrl}
          haToken={haToken}
          isReadOnly={isReadOnly}
          onBaseUrlChange={setHaBaseUrl}
          onTokenChange={setHaToken}
          t={t}
        />
      ) : (
        <MqttBrokerFields
          mqttHost={mqttHost}
          mqttPort={mqttPort}
          mqttUser={mqttUser}
          mqttPassword={mqttPassword}
          isReadOnly={isReadOnly}
          onHostChange={setMqttHost}
          onPortChange={setMqttPort}
          onUserChange={setMqttUser}
          onPasswordChange={setMqttPassword}
          t={t}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-(--color-border) border-t pt-4">
        <div className="flex items-center gap-4">
          <ToggleSwitch
            id="ha-adapter-enabled"
            checked={enabled}
            onChange={(v) => !isReadOnly && setEnabled(v)}
            label={t('settings.haEnableAdapter')}
          />
          <ToggleSwitch
            id="mqtt-auto"
            checked={settings.mqttAutoDiscovery ?? true}
            onChange={(v) => !isReadOnly && updateSettings({ mqttAutoDiscovery: v })}
            label={t('mqtt.autoDiscovery')}
          />
        </div>
        <motion.button
          type="button"
          onClick={() => {
            handleSave().catch(ignorePromiseRejection);
          }}
          disabled={isReadOnly || saving}
          className="focus-ring flex items-center gap-2 rounded-xl bg-(--color-text) px-4 py-2 font-medium text-(--color-background) text-sm disabled:cursor-not-allowed disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? t('common.saving') : t('common.save')}
        </motion.button>
      </div>
    </section>
  );
};
