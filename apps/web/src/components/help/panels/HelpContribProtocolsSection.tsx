import { Plug } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HelpSectionShell } from './HelpSectionShell';

const CONTRIB_PROTOCOLS = [
  { titleKey: 'help.protocolHa', setupKey: 'help.contribSetupHa' },
  { titleKey: 'help.protocolEebus', setupKey: 'help.contribSetupEebus' },
  { titleKey: 'help.protocolEvcc', setupKey: 'help.contribSetupEvcc' },
  { titleKey: 'help.protocolOpenEms', setupKey: 'help.contribSetupOpenEms' },
  { titleKey: 'help.protocolOpenAdr', setupKey: 'help.contribSetupOpenAdr' },
  { titleKey: 'help.protocolMatter', setupKey: 'help.contribSetupMatter' },
  { titleKey: 'help.protocolZigbee', setupKey: 'help.contribSetupZigbee' },
  { titleKey: 'help.protocolShelly', setupKey: 'help.contribSetupShelly' },
] as const;

/** Contrib protocol integration section in the Help integration guide. */
export const HelpContribProtocolsSection = () => {
  const { t } = useTranslation();

  return (
    <HelpSectionShell
      icon={Plug}
      iconClassName="bg-violet-500/15 text-violet-400"
      title={t('help.contribProtocolsTitle')}
    >
      <p className="mb-4 text-(--color-muted) text-sm leading-relaxed">
        {t('help.contribProtocolsIntro')}
      </p>
      <ul className="space-y-4">
        {CONTRIB_PROTOCOLS.map((protocol) => (
          <li
            key={protocol.titleKey}
            className="border-(--color-border) border-b pb-4 last:border-0"
          >
            <h4 className="font-medium text-(--color-primary) text-sm">{t(protocol.titleKey)}</h4>
            <p className="mt-1 text-(--color-muted) text-sm leading-relaxed">
              {t(protocol.setupKey)}
            </p>
          </li>
        ))}
      </ul>
    </HelpSectionShell>
  );
};
