import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('registerBuiltinAdapterSettingsSections', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('registers the Home Assistant section exactly once per module load', async () => {
    const registry = await import('../core/adapters/settings-section-registry');
    registry.clearAdapterSettingsSections();

    const { registerBuiltinAdapterSettingsSections } = await import(
      '../core/adapters/register-builtin-settings-sections'
    );

    registerBuiltinAdapterSettingsSections();
    registerBuiltinAdapterSettingsSections();

    expect(registry.getAdapterSettingsSection('homeassistant-mqtt')?.adapterId).toBe(
      'homeassistant-mqtt',
    );
  });
});
