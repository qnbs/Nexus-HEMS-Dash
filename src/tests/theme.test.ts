import { describe, it, expect } from 'vitest';
import { resolveTheme, detectSystemTheme } from '../lib/theme';

describe('Theme System', () => {
  it('should resolve system theme to actual theme', () => {
    const resolved = resolveTheme('system');
    expect(['cyber-energy-dark', 'solar-light', 'night-mode']).toContain(resolved);
  });

  it('should pass through non-system themes', () => {
    expect(resolveTheme('cyber-energy-dark')).toBe('cyber-energy-dark');
    expect(resolveTheme('solar-light')).toBe('solar-light');
    expect(resolveTheme('night-mode')).toBe('night-mode');
  });

  it('should detect system theme', () => {
    const detected = detectSystemTheme();
    expect(['dark', 'light']).toContain(detected);
  });
});
