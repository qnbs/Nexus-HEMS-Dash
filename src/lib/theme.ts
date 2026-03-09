/**
 * Enhanced Theme System with System Preference Detection
 */

export type ThemeName = 'cyber-energy-dark' | 'solar-light' | 'night-mode';
export type ThemePreference = ThemeName | 'system';

/**
 * Detects the user's system theme preference
 */
export function detectSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  return mediaQuery.matches ? 'dark' : 'light';
}

/**
 * Maps system preference to theme name
 */
export function getThemeFromSystemPreference(): ThemeName {
  const systemTheme = detectSystemTheme();
  return systemTheme === 'dark' ? 'cyber-energy-dark' : 'solar-light';
}

/**
 * Resolves theme preference to actual theme
 */
export function resolveTheme(preference: ThemePreference): ThemeName {
  if (preference === 'system') {
    return getThemeFromSystemPreference();
  }
  return preference;
}

/**
 * Listens for system theme changes
 */
export function watchSystemTheme(callback: (theme: 'dark' | 'light') => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  };

  mediaQuery.addEventListener('change', handler);

  return () => {
    mediaQuery.removeEventListener('change', handler);
  };
}

/**
 * Applies theme to document with smooth transition
 */
export function applyTheme(theme: ThemeName, enableTransition = true): void {
  if (typeof document === 'undefined') return;

  // Enable transitions
  if (enableTransition) {
    document.documentElement.style.setProperty('--theme-transition-duration', '450ms');
  }

  // Set theme attribute
  document.documentElement.setAttribute('data-theme', theme);

  // Disable transitions after change
  if (enableTransition) {
    setTimeout(() => {
      document.documentElement.style.setProperty('--theme-transition-duration', '0ms');
    }, 450);
  }
}

/**
 * Saves theme preference to localStorage
 */
export function saveThemePreference(preference: ThemePreference): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('nexus-hems-theme-preference', preference);
}

/**
 * Loads theme preference from localStorage
 */
export function loadThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return 'cyber-energy-dark';

  const stored = localStorage.getItem('nexus-hems-theme-preference');
  if (stored && ['cyber-energy-dark', 'solar-light', 'night-mode', 'system'].includes(stored)) {
    return stored as ThemePreference;
  }

  return 'cyber-energy-dark';
}
