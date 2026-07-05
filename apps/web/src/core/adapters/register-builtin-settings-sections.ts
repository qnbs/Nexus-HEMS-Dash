import { HomeAssistantSettingsSection } from '../../components/settings/HomeAssistantSettingsSection';
import { registerAdapterSettingsSection } from './settings-section-registry';

/** Register built-in adapter settings sections. Called once during store init. */
export function registerBuiltinAdapterSettingsSections(): void {
  registerAdapterSettingsSection({
    adapterId: 'homeassistant-mqtt',
    order: 10,
    Component: HomeAssistantSettingsSection,
  });
}
