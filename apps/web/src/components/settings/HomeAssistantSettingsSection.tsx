import { Home, RefreshCw, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { HAConnectionMode } from '../../core/adapters/contrib/homeassistant-mqtt';
import { saveHomeAssistantSettings } from '../../core/homeassistant-settings-save';
import { useEnergyStore } from '../../core/useEnergyStore';
import { isReadOnlyModeActive } from '../../lib/adapter-mode';
import { useAppStoreShallow } from '../../store';
import { ChoiceCardGroup } from '../ui/ChoiceCardGroup';
import { ToggleSwitch } from './ToggleSwitch';

export function HomeAssistantSettingsSection() {
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

  const inputClass =
    'w-full rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-2.5 text-(--color-text) focus:border-(--color-primary)/70 focus:outline-none focus:ring-2 focus:ring-(--color-primary)/20';

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
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="settings-ha-base-url" className="font-medium text-sm">
              {t('settings.haBaseUrl')}
            </label>
            <input
              id="settings-ha-base-url"
              type="url"
              value={haBaseUrl}
              onChange={(e) => setHaBaseUrl(e.target.value)}
              className={inputClass}
              placeholder="http://homeassistant.local:8123"
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="settings-ha-token" className="font-medium text-sm">
              {t('settings.haToken')}
            </label>
            <input
              id="settings-ha-token"
              type="password"
              value={haToken}
              onChange={(e) => setHaToken(e.target.value)}
              className={inputClass}
              autoComplete="off"
              disabled={isReadOnly}
            />
            <p className="text-(--color-muted) text-xs">{t('settings.haTokenHint')}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="settings-mqtt-broker-host" className="font-medium text-sm">
              {t('mqtt.brokerUrl')}
            </label>
            <input
              id="settings-mqtt-broker-host"
              type="text"
              value={mqttHost}
              onChange={(e) => setMqttHost(e.target.value)}
              className={inputClass}
              placeholder="192.168.1.50"
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-mqtt-broker-port" className="font-medium text-sm">
              {t('mqtt.port')}
            </label>
            <input
              id="settings-mqtt-broker-port"
              type="number"
              value={mqttPort}
              onChange={(e) => setMqttPort(Number(e.target.value))}
              className={inputClass}
              min={1}
              max={65535}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-mqtt-username" className="font-medium text-sm">
              {t('mqtt.username')}
            </label>
            <input
              id="settings-mqtt-username"
              type="text"
              value={mqttUser}
              onChange={(e) => setMqttUser(e.target.value)}
              className={inputClass}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-mqtt-password" className="font-medium text-sm">
              {t('mqtt.password')}
            </label>
            <input
              id="settings-mqtt-password"
              type="password"
              value={mqttPassword}
              onChange={(e) => setMqttPassword(e.target.value)}
              className={inputClass}
              disabled={isReadOnly}
            />
          </div>
        </div>
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
          onClick={() => void handleSave()}
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
}
