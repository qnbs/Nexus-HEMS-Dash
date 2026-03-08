import { Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { themeDefinitions, themeOrder, type ThemeName } from '../design-tokens';
import { useAppStore } from '../store';
import { resolveTheme, type ThemePreference } from '../lib/theme';

export function ThemeSwitcher() {
  const { t } = useTranslation();
  const theme = useAppStore((state) => state.theme);
  const themePreference = useAppStore((state) => state.themePreference);
  const setThemePreference = useAppStore((state) => state.setThemePreference);
  const setTheme = useAppStore((state) => state.setTheme);

  const handleThemeChange = (preference: ThemePreference) => {
    setThemePreference(preference);
    const resolvedTheme = resolveTheme(preference);
    setTheme(resolvedTheme);
  };

  return (
    <div className="flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-3 py-1.5 backdrop-blur-3xl">
      <Palette className="h-4 w-4 text-[color:var(--color-muted)]" aria-hidden="true" />
      <label htmlFor="theme-select" className="sr-only">
        {t('common.theme')}
      </label>
      <select
        id="theme-select"
        value={themePreference}
        onChange={(event) => handleThemeChange(event.target.value as ThemePreference)}
        className="bg-transparent text-sm font-medium text-[color:var(--color-text)] outline-none focus-visible:focus-ring rounded"
        aria-label={t('common.theme')}
      >
        <option value="system" className="bg-slate-900 text-slate-100">
          {t('common.systemTheme', '🌐 System')}
        </option>
        {themeOrder.map((entry) => (
          <option key={entry} value={entry} className="bg-slate-900 text-slate-100">
            {themeDefinitions[entry].label}
          </option>
        ))}
      </select>
      {themePreference === 'system' && (
        <span className="text-xs text-[color:var(--color-muted)]">
          ({themeDefinitions[theme].label})
        </span>
      )}
    </div>
  );
}
