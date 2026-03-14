import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

// Lazy-load locale bundles to keep them out of the main entry chunk.
// Each locale (~50 KB) loads on demand; the fallback (de) is fetched
// immediately, the other only when the user switches languages.
const localeLoaders: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  de: () =>
    import('./locales/de').then((m) => ({ default: m.de as unknown as Record<string, unknown> })),
  en: () =>
    import('./locales/en').then((m) => ({ default: m.en as unknown as Record<string, unknown> })),
};

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Start with empty resources — partialBundledLanguages allows lazy add
    resources: {},
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
    // Load detected/fallback language first
    const lang = i18n.resolvedLanguage ?? i18n.language ?? 'de';
    const primary = localeLoaders[lang] ?? localeLoaders.de;
    const bundle = await primary();
    i18n.addResourceBundle(lang, 'translation', bundle.default, true, true);

    // Pre-load the other locale in the background so switching is instant
    const other = lang === 'de' ? 'en' : 'de';
    localeLoaders[other]().then((b) => {
      i18n.addResourceBundle(other, 'translation', b.default, true, true);
    });
  });

export default i18n;
