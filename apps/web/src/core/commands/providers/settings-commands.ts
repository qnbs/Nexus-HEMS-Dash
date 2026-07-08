import { Globe, SunMoon } from 'lucide-react';
import { type ThemeName, themeOrder } from '../../../design-tokens';
import i18n from '../../../i18n';
import { useAppStore } from '../../../store';
import type { LocaleCode } from '../../../types';
import type { CommandDefinition } from '../types';

export function createSettingsCommands(): CommandDefinition[] {
  return [
    {
      id: 'settings.toggleTheme',
      labelKey: 'command.toggleTheme',
      icon: SunMoon,
      category: 'settings',
      risk: 'safe',
      keywords: ['theme', 'dark', 'light', 'design', 'darstellung'],
      source: 'core',
      execute: (ctx) => {
        const currentIdx = themeOrder.indexOf(ctx.theme);
        const next: ThemeName = themeOrder[(currentIdx + 1) % themeOrder.length] ?? 'ocean-dark';
        useAppStore.getState().setTheme(next);
        ctx.actions.closePalette();
      },
    },
    {
      id: 'settings.toggleLocale',
      labelKey: 'command.toggleLocale',
      icon: Globe,
      category: 'settings',
      risk: 'safe',
      keywords: ['language', 'locale', 'deutsch', 'english', 'sprache'],
      source: 'core',
      execute: (ctx) => {
        const next: LocaleCode = ctx.locale === 'de' ? 'en' : 'de';
        // Mirror the working LanguageSwitcher path: drive the store, i18next, and
        // the i18next localStorage cache together so the toggle works both ways
        // (relying on the bootstrap effect alone desynced after one switch).
        useAppStore.getState().setLocale(next);
        void i18n.changeLanguage(next);
        localStorage.setItem('nexus-hems-language', next);
        ctx.actions.closePalette();
      },
    },
  ];
}
