import type { TFunction } from 'i18next';
import packageJson from '../../package.json';

/** Help center tab identifiers used for search and deep-linking. */
export type HelpTab =
  | 'getting-started'
  | 'integration'
  | 'features'
  | 'lexicon'
  | 'faq'
  | 'shortcuts'
  | 'troubleshooting'
  | 'about';

/** Canonical tab order for Help navigation and search indexing. */
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

/** Glossary term keys indexed for Help search (mirrors HelpLexiconPanel). */
const GLOSSARY_SEARCH_KEYS = [
  { term: 'help.hems', desc: 'help.hemsDesc' },
  { term: 'help.ess', desc: 'help.essDesc' },
  { term: 'help.sgReady', desc: 'help.sgReadyDesc' },
  { term: 'help.enwg', desc: 'help.enwgDesc' },
  { term: 'help.knx', desc: 'help.knxDesc' },
  { term: 'help.soc', desc: 'help.socDesc' },
  { term: 'help.glossMppt', desc: 'help.glossMpptDesc' },
  { term: 'help.glossEms', desc: 'help.glossEmsDesc' },
  { term: 'help.glossModbus', desc: 'help.glossModbusDesc' },
  { term: 'help.glossOcpp', desc: 'help.glossOcppDesc' },
  { term: 'help.glossEebus', desc: 'help.glossEebusDesc' },
  { term: 'help.glossHomeAssistant', desc: 'help.glossHomeAssistantDesc' },
  { term: 'help.glossMatter', desc: 'help.glossMatterDesc' },
  { term: 'help.glossEvcc', desc: 'help.glossEvccDesc' },
  { term: 'help.glossOpenEms', desc: 'help.glossOpenEmsDesc' },
  { term: 'help.glossOpenAdr', desc: 'help.glossOpenAdrDesc' },
] as const;

/** Contrib protocol setup hints indexed for Help search. */
const CONTRIB_INTEGRATION_KEYS = [
  { title: 'help.protocolHa', body: 'help.contribSetupHa' },
  { title: 'help.protocolEebus', body: 'help.contribSetupEebus' },
  { title: 'help.protocolEvcc', body: 'help.contribSetupEvcc' },
  { title: 'help.protocolOpenEms', body: 'help.contribSetupOpenEms' },
  { title: 'help.protocolOpenAdr', body: 'help.contribSetupOpenAdr' },
  { title: 'help.protocolMatter', body: 'help.contribSetupMatter' },
  { title: 'help.protocolZigbee', body: 'help.contribSetupZigbee' },
  { title: 'help.protocolShelly', body: 'help.contribSetupShelly' },
] as const;

export const buildHelpSearchEntries = (t: TFunction) => {
  const appVersion = packageJson.version;
  return [
    { tab: 'getting-started' as const, title: t('help.quickStart'), body: t('help.welcomeIntro') },
    { tab: 'getting-started' as const, title: t('help.step1Title'), body: t('help.step1Desc') },
    {
      tab: 'faq' as const,
      title: t('help.faqWhatIs'),
      body: t('help.faqWhatIsAnswer', { version: appVersion }),
    },
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
    {
      tab: 'integration' as const,
      title: t('help.contribProtocolsTitle'),
      body: t('help.contribProtocolsIntro'),
    },
    ...CONTRIB_INTEGRATION_KEYS.map((entry) => ({
      tab: 'integration' as const,
      title: t(entry.title),
      body: t(entry.body),
    })),
    ...GLOSSARY_SEARCH_KEYS.map((entry) => ({
      tab: 'lexicon' as const,
      title: t(entry.term),
      body: t(entry.desc),
    })),
    { tab: 'about' as const, title: t('help.aboutTitle'), body: t('help.aboutDesc') },
  ];
};

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
