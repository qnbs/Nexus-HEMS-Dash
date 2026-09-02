import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

// Both locales are bundled synchronously so the first paint never mixes
// German fallback strings with English (or vice versa) while a lazy bundle loads.
import { de } from './locales/de';
import { en } from './locales/en';

// i18next Inspector Mode — activate via localStorage:
//   localStorage.setItem('i18n-inspector', 'true')
// Shows translation keys instead of values (e.g. "settings.victronIp")
// and logs missing keys to console. Useful for verifying full coverage.
const inspectorMode =
  typeof window !== 'undefined' && window.localStorage.getItem('i18n-inspector') === 'true';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de as unknown as Record<string, unknown> },
      en: { translation: en as unknown as Record<string, unknown> },
    },
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
  });

export default i18n;
