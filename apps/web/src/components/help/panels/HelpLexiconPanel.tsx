import { useTranslation } from 'react-i18next';
import { HelpTabPanelShell } from '../HelpTabPanelShell';

export const HelpLexiconPanel = () => {
  const { t } = useTranslation();

  return (
    <HelpTabPanelShell tabKey="lexicon">
      <div className="glass-panel-strong rounded-2xl p-6">
        <h2 className="mb-6 font-semibold text-xl">{t('help.glossaryTitle')}</h2>
        <dl className="space-y-4">
          {[
            { term: t('help.hems'), desc: t('help.hemsDesc') },
            { term: t('help.ess'), desc: t('help.essDesc') },
            { term: t('help.sgReady'), desc: t('help.sgReadyDesc') },
            { term: t('help.enwg'), desc: t('help.enwgDesc') },
            { term: t('help.knx'), desc: t('help.knxDesc') },
            { term: t('help.soc'), desc: t('help.socDesc') },
            { term: t('help.glossMppt'), desc: t('help.glossMpptDesc') },
            { term: t('help.glossEms'), desc: t('help.glossEmsDesc') },
            { term: t('help.glossFeedIn'), desc: t('help.glossFeedInDesc') },
            { term: t('help.glossSector'), desc: t('help.glossSectorDesc') },
            { term: t('help.glossModbus'), desc: t('help.glossModbusDesc') },
            { term: t('help.glossOcpp'), desc: t('help.glossOcppDesc') },
            { term: t('help.glossPwa'), desc: t('help.glossPwaDesc') },
            { term: t('help.glossVenusOs'), desc: t('help.glossVenusOsDesc') },
            { term: t('help.glossDbus'), desc: t('help.glossDbusDesc') },
            { term: t('help.glossNodeRed'), desc: t('help.glossNodeRedDesc') },
            { term: t('help.glossCerboGx'), desc: t('help.glossCerboGxDesc') },
            { term: t('help.glossV2x'), desc: t('help.glossV2xDesc') },
            { term: t('help.glossEebus'), desc: t('help.glossEebusDesc') },
            { term: t('help.glossHomeAssistant'), desc: t('help.glossHomeAssistantDesc') },
            { term: t('help.glossMatter'), desc: t('help.glossMatterDesc') },
            { term: t('help.glossEvcc'), desc: t('help.glossEvccDesc') },
            { term: t('help.glossOpenEms'), desc: t('help.glossOpenEmsDesc') },
            { term: t('help.glossOpenAdr'), desc: t('help.glossOpenAdrDesc') },
          ].map((item) => (
            <div key={item.term} className="border-(--color-border) border-b pb-4 last:border-0">
              <dt className="font-medium text-(--color-primary) text-sm">{item.term}</dt>
              <dd className="mt-1 text-(--color-muted) text-sm leading-relaxed">{item.desc}</dd>
            </div>
          ))}
        </dl>
      </div>
    </HelpTabPanelShell>
  );
};
