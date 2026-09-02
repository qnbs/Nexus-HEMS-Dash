import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

// Fallback locale is bundled statically so German is always available synchronously.
import { de } from './locales/de';

// i18next Inspector Mode — activate via localStorage:
//   localStorage.setItem('i18n-inspector', 'true')
// Shows translation keys instead of values (e.g. "settings.victronIp")
// and logs missing keys to console. Useful for verifying full coverage.
const inspectorMode =
  typeof window !== 'undefined' && window.localStorage.getItem('i18n-inspector') === 'true';

function resolveActiveLanguage(): 'de' | 'en' {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem('nexus-hems-language');
    if (stored?.startsWith('en')) return 'en';
    if (stored?.startsWith('de')) return 'de';
  }
  const lang = i18n.resolvedLanguage ?? i18n.language ?? 'de';
  return lang.startsWith('en') ? 'en' : 'de';
}

async function ensureLocaleBundle(lang: 'de' | 'en'): Promise<void> {
  if (i18n.hasResourceBundle(lang, 'translation')) return;

  if (lang === 'de') {
    i18n.addResourceBundle(
      'de',
      'translation',
      de as unknown as Record<string, unknown>,
      true,
      true,
    );
    return;
  }

  try {
    const { en } = await import('./locales/en');
    i18n.addResourceBundle(
      'en',
      'translation',
      en as unknown as Record<string, unknown>,
      true,
      true,
    );
  } catch (error: unknown) {
    console.error(
      '[i18n] failed to load English locale bundle; German fallback remains active',
      error,
    );
  }
}

/** Resolves when the detected active locale is loaded — gate first paint in `main.tsx`. */
export const i18nReady = i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de as unknown as Record<string, unknown> },
    },
    partialBundledLanguages: true,
    fallbackLng: 'de',
    supportedLngs: ['de', 'en'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'nexus-hems-language',
    },

    // Inspector: show raw keys instead of translated values
    ...(inspectorMode && {
      parseMissingKeyHandler: (key: string) => `[MISSING] ${key}`,
      appendNamespaceToMissingKey: true,
    }),

    // Debug: log missing keys + init info in development or inspector mode
    debug: inspectorMode || import.meta.env.DEV,
    saveMissing: inspectorMode,
    ...(inspectorMode && {
      missingKeyHandler: (_lngs: readonly string[], _ns: string, key: string) => {
        console.warn(`[i18n-inspector] Missing key: ${key}`);
      },
    }),
  })
  .then(async () => {
    const active = resolveActiveLanguage();
    const other = active === 'de' ? 'en' : 'de';
    await Promise.all([ensureLocaleBundle(active), ensureLocaleBundle(other)]);

    i18n.on('languageChanging', async (lng) => {
      const lang = lng.startsWith('en') ? 'en' : 'de';
      await ensureLocaleBundle(lang);
    });
  });

export default i18n;
