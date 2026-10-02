import { validateSettingsSyncPatch } from '@nexus-hems/shared-types';
import { describe, expect, it } from 'vitest';

describe('validateSettingsSyncPatch', () => {
  it('accepts known user preference keys', () => {
    const result = validateSettingsSyncPatch({ compactMode: true });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.patch.compactMode).toBe(true);
  });

  it('rejects unknown keys', () => {
    const result = validateSettingsSyncPatch({ evilKey: true });
    expect(result.ok).toBe(false);
  });

  it('rejects credential keys', () => {
    const result = validateSettingsSyncPatch({ influxToken: 'secret' });
    expect(result.ok).toBe(false);
  });

  it('allows ext.* primitive extension namespace', () => {
    const result = validateSettingsSyncPatch({ 'ext.labFlag': true });
    expect(result.ok).toBe(true);
  });

  it('rejects prototype pollution keys', () => {
    const result = validateSettingsSyncPatch({ __proto__: { polluted: true } });
    expect(result.ok).toBe(false);
  });

  it('strips blocked nested keys from systemConfig', () => {
    const result = validateSettingsSyncPatch({
      systemConfig: { presetId: 'home', influxToken: 'must-not-persist' },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const cfg = result.patch.systemConfig as Record<string, unknown>;
      expect(cfg.presetId).toBe('home');
      expect(cfg.influxToken).toBeUndefined();
    }
  });
});
