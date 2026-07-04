import { Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HelpMonoBlocks } from './HelpMonoBlocks';
import { HelpNumberedSteps } from './HelpNumberedSteps';
import { HelpSectionShell } from './HelpSectionShell';

const KNX_ARCH = ['knxArch1', 'knxArch2', 'knxArch3', 'knxArch4'] as const;
const KNX_GA = ['knxGA1', 'knxGA2', 'knxGA3', 'knxGA4', 'knxGA5'] as const;
const KNX_BP = ['knxBP1', 'knxBP2', 'knxBP3', 'knxBP4', 'knxBP5'] as const;

export const HelpKnxSection = () => {
  const { t } = useTranslation();

  return (
    <HelpSectionShell
      icon={Lightbulb}
      iconClassName="bg-amber-500/15 text-amber-400"
      title={t('help.knxTitle')}
    >
      <p className="mb-4 text-(--color-muted) text-sm leading-relaxed">{t('help.knxIntro')}</p>
      <h4 className="mb-2 font-medium text-sm">{t('help.knxArchitecture')}</h4>
      <HelpNumberedSteps keys={[...KNX_ARCH]} badgeClassName="bg-amber-500/15 text-amber-400" />
      <h4 className="mb-2 font-medium text-sm">{t('help.knxGroupAddresses')}</h4>
      <div className="mb-4">
        <HelpMonoBlocks keys={[...KNX_GA]} />
      </div>
      <h4 className="mb-2 font-medium text-sm">{t('help.knxBestPractices')}</h4>
      <KnxBestPracticesList />
    </HelpSectionShell>
  );
};

const KnxBestPracticesList = () => {
  const { t } = useTranslation();

  return (
    <ul className="ml-4 space-y-1.5 text-(--color-muted) text-xs">
      {KNX_BP.map((k) => (
        <li key={k}>• {t(`help.${k}`)}</li>
      ))}
    </ul>
  );
};
