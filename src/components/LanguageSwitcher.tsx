import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '../store';
import type { LocaleCode } from '../types';

const locales: LocaleCode[] = ['de', 'en'];

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const locale = useAppStore((state) => state.locale);
  const setLocale = useAppStore((state) => state.setLocale);

  const handleLocaleChange = (nextLocale: LocaleCode) => {
    setLocale(nextLocale);
    void i18n.changeLanguage(nextLocale);
    localStorage.setItem('nexus-hems-language', nextLocale);
  };

  return (
    <div
      role="group"
      aria-label={t('common.language')}
      className="flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-2 py-1.5 backdrop-blur-3xl"
    >
      <Languages className="h-4 w-4 text-[color:var(--color-muted)]" aria-hidden="true" />
      <span className="sr-only">{t('common.language')}</span>
      {locales.map((entry) => (
        <button
          key={entry}
          type="button"
          onClick={() => handleLocaleChange(entry)}
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] transition focus-visible:focus-ring ${
            locale === entry
              ? 'bg-[color:var(--color-primary)] text-slate-950 shadow-[0_0_20px_var(--color-glow)]'
              : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]'
          }`}
          aria-pressed={locale === entry}
          aria-label={`Switch to ${entry.toUpperCase()}`}
        >
          {entry}
        </button>
      ))}
    </div>
  );
}
