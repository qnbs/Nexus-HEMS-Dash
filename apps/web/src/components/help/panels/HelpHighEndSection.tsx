import { CheckCircle2, HardDrive, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HelpChecklist } from './HelpChecklist';
import { HelpSectionShell } from './HelpSectionShell';

const HIGH_END_HW = [
  'highEndHW1',
  'highEndHW2',
  'highEndHW3',
  'highEndHW4',
  'highEndHW5',
  'highEndHW6',
  'highEndHW7',
  'highEndHW8',
  'highEndHW9',
] as const;
const HIGH_END_SW = ['highEndSW1', 'highEndSW2', 'highEndSW3', 'highEndSW4', 'highEndSW5'] as const;
const HIGH_END_NET = [
  'highEndNet1',
  'highEndNet2',
  'highEndNet3',
  'highEndNet4',
  'highEndNet5',
] as const;

export const HelpHighEndSection = () => {
  const { t } = useTranslation();

  return (
    <HelpSectionShell
      icon={HardDrive}
      iconClassName="bg-rose-500/15 text-rose-400"
      title={t('help.highEndTitle')}
    >
      <p className="mb-4 text-(--color-muted) text-sm leading-relaxed">{t('help.highEndIntro')}</p>
      <h4 className="mb-2 font-medium text-sm">{t('help.highEndHardware')}</h4>
      <HelpChecklist keys={[...HIGH_END_HW]} iconClassName="text-rose-400" />
      <h4 className="mb-2 font-medium text-sm">{t('help.highEndSoftware')}</h4>
      <HighEndSoftwareList />
      <h4 className="mb-2 font-medium text-sm">{t('help.highEndNetwork')}</h4>
      <HighEndNetworkList />
    </HelpSectionShell>
  );
};

const HighEndSoftwareList = () => {
  const { t } = useTranslation();

  return (
    <ul className="mb-4 ml-4 space-y-1.5 text-(--color-muted) text-xs">
      {HIGH_END_SW.map((k) => (
        <li key={k} className="flex gap-2">
          <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-purple-400" />
          {t(`help.${k}`)}
        </li>
      ))}
    </ul>
  );
};

const HighEndNetworkList = () => {
  const { t } = useTranslation();

  return (
    <ul className="ml-4 space-y-1.5 text-(--color-muted) text-xs">
      {HIGH_END_NET.map((k) => (
        <li key={k} className="flex gap-2">
          <Shield size={12} className="mt-0.5 shrink-0 text-cyan-400" />
          {t(`help.${k}`)}
        </li>
      ))}
    </ul>
  );
};
