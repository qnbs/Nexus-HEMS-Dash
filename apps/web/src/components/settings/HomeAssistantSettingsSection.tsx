import { Home } from 'lucide-react';
import type { HAConnectionMode } from '../../core/adapters/contrib/homeassistant-mqtt';
import { useHomeAssistantSettingsForm } from '../../lib/use-home-assistant-settings-form';
import { ChoiceCardGroup } from '../ui/ChoiceCardGroup';
import { HaWsApiFields, MqttBrokerFields } from './HaConnectionFields';
import { HaSettingsFooter } from './HaSettingsFooter';

export const HomeAssistantSettingsSection = () => {
  const form = useHomeAssistantSettingsForm();

  const sectionClass = 'glass-panel-strong space-y-6 rounded-2xl p-6';
  const sectionHeaderClass =
    'flex items-center gap-2 border-b border-(--color-border) pb-4 text-lg font-medium fluid-text-lg';

  return (
    <section className={sectionClass}>
      <h2 className={sectionHeaderClass}>
        <Home size={20} className="text-orange-400" aria-hidden="true" />
        {form.t('settings.haTitle')}
      </h2>
      <p className="text-(--color-muted) text-sm">{form.t('settings.haDescription')}</p>

      <ChoiceCardGroup
        key={form.haMode}
        name="ha-connection-mode"
        value={form.haMode}
        onChange={(v) => form.setHaMode(v as HAConnectionMode)}
        disabled={form.isReadOnly}
        aria-label={form.t('settings.haConnectionMode')}
        options={[
          {
            value: 'ha-ws-api',
            label: form.t('settings.haModeWsApi'),
            description: form.t('settings.haModeWsApiDesc'),
          },
          {
            value: 'mqtt-broker',
            label: form.t('settings.haModeMqtt'),
            description: form.t('settings.haModeMqttDesc'),
          },
        ]}
      />

      {form.haMode === 'ha-ws-api' ? (
        <HaWsApiFields
          haBaseUrl={form.haBaseUrl}
          haToken={form.haToken}
          isReadOnly={form.isReadOnly}
          onBaseUrlChange={form.setHaBaseUrl}
          onTokenChange={form.setHaToken}
          t={form.t}
        />
      ) : (
        <MqttBrokerFields
          mqttHost={form.mqttHost}
          mqttPort={form.mqttPort}
          mqttUser={form.mqttUser}
          mqttPassword={form.mqttPassword}
          isReadOnly={form.isReadOnly}
          onHostChange={form.setMqttHost}
          onPortChange={form.setMqttPort}
          onUserChange={form.setMqttUser}
          onPasswordChange={form.setMqttPassword}
          t={form.t}
        />
      )}

      <HaSettingsFooter
        enabled={form.enabled}
        mqttAutoDiscovery={form.mqttAutoDiscovery}
        isReadOnly={form.isReadOnly}
        saving={form.saving}
        onEnabledChange={form.setEnabled}
        onMqttAutoDiscoveryChange={form.updateMqttAutoDiscovery}
        onSave={form.handleSave}
      />
    </section>
  );
};
