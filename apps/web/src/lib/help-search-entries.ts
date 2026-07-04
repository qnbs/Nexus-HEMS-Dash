import type { TFunction } from 'i18next';

export type HelpTab =
  | 'getting-started'
  | 'integration'
  | 'features'
  | 'lexicon'
  | 'faq'
  | 'shortcuts'
  | 'troubleshooting'
  | 'about';

export const VALID_HELP_TABS: HelpTab[] = [
  'getting-started',
  'integration',
  'features',
  'lexicon',
  'faq',
  'shortcuts',
  'troubleshooting',
  'about',
];

export const buildHelpSearchEntries = (t: TFunction) => [
  { tab: 'getting-started' as const, title: t('help.quickStart'), body: t('help.welcomeIntro') },
  { tab: 'getting-started' as const, title: t('help.step1Title'), body: t('help.step1Desc') },
  { tab: 'faq' as const, title: t('help.faqWhatIs'), body: t('help.faqWhatIsAnswer') },
  { tab: 'faq' as const, title: t('help.faqMockMode'), body: t('help.faqMockModeAnswer') },
  { tab: 'faq' as const, title: t('help.faqReadOnly'), body: t('help.faqReadOnlyAnswer') },
  { tab: 'faq' as const, title: t('help.faqApi'), body: t('help.faqApiAnswer') },
  {
    tab: 'troubleshooting' as const,
    title: t('help.troubleConnection'),
    body: t('help.troubleConn1'),
  },
  {
    tab: 'troubleshooting' as const,
    title: t('help.troubleReadOnly'),
    body: t('help.troubleReadOnly1'),
  },
  {
    tab: 'features' as const,
    title: t('help.featureHardwareRegistry'),
    body: t('help.featureHardwareRegistryDesc'),
  },
  {
    tab: 'features' as const,
    title: t('help.featureMonitoring'),
    body: t('help.featureMonitoringDesc'),
  },
  {
    tab: 'integration' as const,
    title: t('help.integrationGuideTitle'),
    body: t('help.integrationGuideIntro'),
  },
  { tab: 'about' as const, title: t('help.aboutTitle'), body: t('help.aboutDesc') },
];

export const filterHelpSearchResults = (
  entries: ReturnType<typeof buildHelpSearchEntries>,
  normalizedQuery: string,
) => {
  if (normalizedQuery.length < 2) return [];
  return entries
    .filter(
      (e) =>
        e.title.toLowerCase().includes(normalizedQuery) ||
        e.body.toLowerCase().includes(normalizedQuery),
    )
    .slice(0, 8);
};
