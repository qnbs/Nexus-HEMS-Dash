import { describe, expect, it } from 'vitest';
import { parseStoredSettingsImport } from '../core/stored-settings-schema';

describe('stored-settings-schema', () => {
  it('accepts a partial settings object with known keys', () => {
    expect(
      parseStoredSettingsImport({
        victronIp: '10.0.0.5',
        historyDays: 14,
        mqttAutoDiscovery: false,
      }),
    ).toEqual({
      victronIp: '10.0.0.5',
      historyDays: 14,
      mqttAutoDiscovery: false,
    });
  });

  it('rejects unknown top-level keys', () => {
    expect(parseStoredSettingsImport({ evil: true, victronIp: '10.0.0.1' })).toBeNull();
  });

  it('rejects invalid field types', () => {
    expect(parseStoredSettingsImport({ wsPort: 'not-a-number' })).toBeNull();
  });

  it('accepts partial settings with multiple known keys', () => {
    expect(
      parseStoredSettingsImport({
        victronIp: '10.0.0.5',
        knxIp: '10.0.0.6',
        mqttAutoDiscovery: false,
      }),
    ).toEqual({
      victronIp: '10.0.0.5',
      knxIp: '10.0.0.6',
      mqttAutoDiscovery: false,
    });
  });

  it('rejects null imports', () => {
    expect(parseStoredSettingsImport(null)).toBeNull();
  });
});
