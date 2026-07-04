import { useTranslation } from 'react-i18next';
import packageJson from '../../../../package.json';
import { HelpTabPanelShell } from '../HelpTabPanelShell';
import { HelpAboutGithubLink } from './HelpAboutGithubLink';
import { HelpAboutHero } from './HelpAboutHero';
import { HelpAboutTechStackGrid } from './HelpAboutTechStackGrid';
import { HelpAiProviderCard } from './HelpAiProviderCard';

/** About tab: version, tech stack, license, credits, and AI acknowledgments. */
export const HelpAboutPanel = () => {
  const appVersion = packageJson.version;
  const { t } = useTranslation();

  const techStack = [
    { category: t('help.aboutTechFrontend'), items: t('help.aboutTechFrontendItems') },
    { category: t('help.aboutTechState'), items: t('help.aboutTechStateItems') },
    { category: t('help.visualization'), items: t('help.aboutTechVisualizationItems') },
    { category: t('help.aboutTechBackend'), items: t('help.aboutTechBackendItems') },
    { category: t('help.aboutTechAi'), items: t('help.aboutTechAiItems') },
    { category: t('help.aboutTechPwa'), items: t('help.aboutTechPwaItems') },
    { category: t('help.protocols'), items: t('help.aboutTechProtocolsItems') },
    { category: t('help.testing'), items: t('help.aboutTechTestingItems') },
  ];

  const aiProviders = [
    {
      name: 'Gemini 2.5 Pro',
      provider: 'Google AI Studio',
      desc: t('help.aiGeminiDesc'),
      color: '#4285F4',
    },
    {
      name: t('help.aiClaudeName'),
      provider: 'GitHub Copilot',
      desc: t('help.aiClaudeDesc'),
      color: '#D97706',
    },
    {
      name: 'Grok',
      provider: 'xAI',
      desc: t('help.aiGrokDesc'),
      color: '#10B981',
    },
  ];

  return (
    <HelpTabPanelShell tabKey="about">
      <div className="glass-panel-strong rounded-2xl p-6">
        <HelpAboutHero />

        <p className="mb-6 text-(--color-muted) leading-relaxed">
          {t('help.aboutDesc', { version: appVersion })}
        </p>

        <HelpAboutGithubLink />

        <HelpAboutTechStackGrid techStack={techStack} />

        <div className="mt-6 border-(--color-border) border-t pt-6">
          <h3 className="mb-3 font-medium">{t('help.a11yTitle')}</h3>
          <p className="text-(--color-muted) text-sm leading-relaxed">{t('help.a11yDesc')}</p>
        </div>

        <div className="mt-6 border-(--color-border) border-t pt-6">
          <h3 className="mb-3 font-medium">{t('help.license')}</h3>
          <p className="text-(--color-muted) text-sm leading-relaxed">{t('help.licenseDesc')}</p>
        </div>

        <div className="mt-6 border-(--color-border) border-t pt-6">
          <h3 className="mb-3 font-medium">{t('help.credits')}</h3>
          <div className="space-y-1 text-(--color-muted) text-sm">
            <p>• {t('help.creditVictron')}</p>
            <p>• {t('help.creditKnx')}</p>
            <p>• {t('help.creditTariffs')}</p>
            <p>• {t('help.creditD3')}</p>
            <p>• {t('help.creditGoogle')}</p>
            <p>• {t('help.creditEmhass')}</p>
            <p>• {t('help.creditOpenEms')}</p>
            <p>• {t('help.creditContrib')}</p>
          </div>
        </div>

        <div className="mt-6 border-(--color-border) border-t pt-6">
          <h3 className="mb-3 font-medium">{t('help.aiAcknowledgments')}</h3>
          <p className="mb-4 text-(--color-muted) text-sm leading-relaxed">
            {t('help.aiAcknowledgmentsDesc')}
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {aiProviders.map((ai) => (
              <HelpAiProviderCard key={ai.name} {...ai} />
            ))}
          </div>
        </div>
      </div>
    </HelpTabPanelShell>
  );
};
