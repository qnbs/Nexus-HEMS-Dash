import { Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { themeDefinitions, themeOrder, type ThemeName } from '../design-tokens';
import { useAppStore } from '../store';

export function ThemeSwitcher() {
  const { t } = useTranslation();
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);

  return (
    <div className="flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-3 py-1.5 backdrop-blur-3xl">
      <Palette className="h-4 w-4 text-[color:var(--color-muted)]" aria-hidden="true" />
      <label htmlFor="theme-select" className="sr-only">
        {t('common.theme')}
      </label>
      <select
        id="theme-select"
        value={theme}
        onChange={(event) => setTheme(event.target.value as ThemeName)}
        className="bg-transparent text-sm font-medium text-[color:var(--color-text)] outline-none focus-visible:focus-ring rounded"
        aria-label={t('common.theme')}
      >
        {themeOrder.map((entry) => (
          <option key={entry} value={entry} className="bg-slate-900 text-slate-100">
            {themeDefinitions[entry].label}
          </option>
        ))}
      </select>
    </div>
  );
}
