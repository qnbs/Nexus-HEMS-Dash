import { describe, it, expect, vi } from 'vitest';
import {
  resolveTheme,
  detectSystemTheme,
  getThemeFromSystemPreference,
  watchSystemTheme,
} from '../lib/theme';
import type { ThemeName } from '../lib/theme';

describe('Theme System', () => {
  it('should resolve system theme to actual theme', () => {
    const resolved = resolveTheme('system');
    expect(['energy-dark', 'solar-light', 'ocean-dark', 'nature-green', 'minimal-white']).toContain(
      resolved,
    );
  });

  it('should pass through non-system themes', () => {
    expect(resolveTheme('energy-dark')).toBe('energy-dark');
    expect(resolveTheme('solar-light')).toBe('solar-light');
    expect(resolveTheme('ocean-dark')).toBe('ocean-dark');
    expect(resolveTheme('nature-green')).toBe('nature-green');
    expect(resolveTheme('minimal-white')).toBe('minimal-white');
  });

  it('should detect system theme', () => {
    const detected = detectSystemTheme();
    expect(['dark', 'light']).toContain(detected);
  });

  it('should map system preference to theme name', () => {
    const theme = getThemeFromSystemPreference();
    const validNames: ThemeName[] = [
      'energy-dark',
      'solar-light',
      'ocean-dark',
      'nature-green',
      'minimal-white',
    ];
    expect(validNames).toContain(theme);
  });

  it('should return a cleanup function from watchSystemTheme', () => {
    const callback = vi.fn();
    const cleanup = watchSystemTheme(callback);
    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  it('should accept all valid theme preference values', () => {
    const preferences = [
      'energy-dark',
      'solar-light',
      'ocean-dark',
      'nature-green',
      'minimal-white',
      'system',
    ] as const;
    for (const pref of preferences) {
      const resolved = resolveTheme(pref);
      expect(typeof resolved).toBe('string');
    }
  });
});
