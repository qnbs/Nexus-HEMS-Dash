import { describe, expect, it } from 'vitest';
import { sanitizeSettingsForClientSync } from '../data/settings-sync-export.js';

describe('sanitizeSettingsForClientSync', () => {
  it('strips userinfo from influxUrl', () => {
    const out = sanitizeSettingsForClientSync({
      influxUrl: 'http://user:secret@influx.local:8086',
      animations: true,
    });
    expect(out.influxUrl).toBe('http://influx.local:8086/');
    expect(out.animations).toBe(true);
  });

  it('omits blocked credential keys', () => {
    const out = sanitizeSettingsForClientSync({
      influxToken: 'must-not-leak',
      victronIp: '10.0.0.1',
    });
    expect(out.influxToken).toBeUndefined();
    expect(out.victronIp).toBe('10.0.0.1');
  });
});
