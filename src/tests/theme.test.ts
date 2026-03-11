import { describe, it, expect } from 'vitest';
import { resolveTheme, detectSystemTheme } from '../lib/theme';

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
  });

  it('should detect system theme', () => {
    const detected = detectSystemTheme();
    expect(['dark', 'light']).toContain(detected);
  });
});
