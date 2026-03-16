import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

// Import the fallback locale statically — this ensures translations are
// available synchronously at init time, preventing "missing key" flashes
// in the sidebar, header, and every component that renders on first paint.
import { de } from './locales/de';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Fallback locale is bundled statically; the secondary locale is
    // lazy-loaded below so that `en` stays out of the critical path.
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
  })
  .then(async () => {
    const lang = i18n.resolvedLanguage ?? i18n.language ?? 'de';

    // If the detected language is English, load it now
    if (lang === 'en') {
      const { en } = await import('./locales/en');
      i18n.addResourceBundle(
        'en',
        'translation',
        en as unknown as Record<string, unknown>,
        true,
        true,
      );
    }

    // Pre-load the other locale in the background so switching is instant
    const other = lang === 'de' ? 'en' : 'de';
    if (!i18n.hasResourceBundle(other, 'translation')) {
      if (other === 'en') {
        import('./locales/en').then(({ en }) => {
          i18n.addResourceBundle(
            'en',
            'translation',
            en as unknown as Record<string, unknown>,
            true,
            true,
          );
        });
      }
    }
  });

export default i18n;
