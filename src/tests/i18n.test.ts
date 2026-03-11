import { describe, it, expect, beforeAll } from 'vitest';
import i18n from '../i18n';
import { de } from '../locales/de';
import { en } from '../locales/en';

describe('i18n Configuration', () => {
  beforeAll(async () => {
    // Wait for i18n to finish initializing
    if (!i18n.isInitialized) {
      await new Promise<void>((resolve) => i18n.on('initialized', () => resolve()));
    }
  });

  it('should initialize with German as fallback', () => {
    expect(i18n.options.fallbackLng).toContain('de');
  });

  it('should support de and en', () => {
    expect(i18n.options.supportedLngs).toContain('de');
    expect(i18n.options.supportedLngs).toContain('en');
  });

  it('should translate a known key in German', async () => {
    await i18n.changeLanguage('de');
    const val = i18n.t('dashboard.realtimeFlow');
    expect(val).toBeTruthy();
    expect(val).not.toBe('dashboard.realtimeFlow');
  });

  it('should translate the same key in English', async () => {
    await i18n.changeLanguage('en');
    const val = i18n.t('dashboard.realtimeFlow');
    expect(val).toBeTruthy();
    expect(val).not.toBe('dashboard.realtimeFlow');
  });

  it('should have matching top-level keys between de and en', () => {
    const deKeys = Object.keys(de).sort();
    const enKeys = Object.keys(en).sort();
    expect(deKeys).toEqual(enKeys);
  });

  it('should not have empty translation values', () => {
    const check = (obj: Record<string, unknown>, path: string) => {
      for (const [key, val] of Object.entries(obj)) {
        if (typeof val === 'string') {
          expect(val.trim().length, `${path}.${key} is empty`).toBeGreaterThan(0);
        } else if (typeof val === 'object' && val !== null) {
          check(val as Record<string, unknown>, `${path}.${key}`);
        }
      }
    };
    check(de as unknown as Record<string, unknown>, 'de');
    check(en as unknown as Record<string, unknown>, 'en');
  });
});
