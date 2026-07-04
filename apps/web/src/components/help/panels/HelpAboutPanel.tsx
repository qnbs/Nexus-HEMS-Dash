import { ExternalLink, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import packageJson from '../../../../package.json';
import { BrandGithubIcon } from '../../icons/BrandGithubIcon';
import { HelpTabPanelShell } from '../HelpTabPanelShell';

export const HelpAboutPanel = () => {
  const appVersion = packageJson.version;
  const { t } = useTranslation();

  return (
    <HelpTabPanelShell tabKey="about">
      <div className="glass-panel-strong rounded-2xl p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-(--color-primary)/30 bg-(--color-primary)/15">
            <Zap size={32} className="text-(--color-primary)" />
          </div>
          <div>
            <h2 className="font-semibold text-xl">{t('common.appName')}</h2>
            <p className="text-(--color-muted) text-sm">
              {t('help.versionFull', { version: appVersion })}
            </p>
          </div>
        </div>

        <p className="mb-6 text-(--color-muted) leading-relaxed">
          {t('help.aboutDesc', { version: appVersion })}
        </p>

        {/* GitHub Repository */}
        <a
          href="https://github.com/qnbs/Nexus-HEMS-Dash"
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring mb-6 inline-flex items-center gap-2 rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-2.5 font-medium text-sm transition-all duration-200 hover:border-(--color-primary)/40 hover:bg-(--color-primary)/10 hover:text-(--color-primary)"
        >
          <BrandGithubIcon size={18} aria-hidden="true" />
          <span>{t('help.githubRepo')}</span>
          <ExternalLink size={14} className="text-(--color-muted)" aria-hidden="true" />
        </a>

        {/* Tech Stack */}
        <div className="border-(--color-border) border-t pt-6">
          <h3 className="mb-4 font-medium">{t('help.techStack')}</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              {
                category: t('help.aboutTechFrontend'),
                items: t('help.aboutTechFrontendItems'),
              },
              {
                category: t('help.aboutTechState'),
                items: t('help.aboutTechStateItems'),
              },
              {
                category: t('help.visualization'),
                items: t('help.aboutTechVisualizationItems'),
              },
              {
                category: t('help.aboutTechBackend'),
                items: t('help.aboutTechBackendItems'),
              },
              {
                category: t('help.aboutTechAi'),
                items: t('help.aboutTechAiItems'),
              },
              {
                category: t('help.aboutTechPwa'),
                items: t('help.aboutTechPwaItems'),
              },
              {
                category: t('help.protocols'),
                items: t('help.aboutTechProtocolsItems'),
              },
              {
                category: t('help.testing'),
                items: t('help.aboutTechTestingItems'),
              },
            ].map((tech) => (
              <div
                key={tech.category}
                className="rounded-xl border border-(--color-border) bg-(--color-surface) p-3"
              >
                <p className="mb-1 font-semibold text-(--color-primary) text-xs uppercase tracking-wider">
                  {tech.category}
                </p>
                <p className="text-(--color-muted) text-xs">{tech.items}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Accessibility */}
        <div className="mt-6 border-(--color-border) border-t pt-6">
          <h3 className="mb-3 font-medium">{t('help.a11yTitle')}</h3>
          <p className="text-(--color-muted) text-sm leading-relaxed">{t('help.a11yDesc')}</p>
        </div>

        {/* License */}
        <div className="mt-6 border-(--color-border) border-t pt-6">
          <h3 className="mb-3 font-medium">{t('help.license')}</h3>
          <p className="text-(--color-muted) text-sm leading-relaxed">{t('help.licenseDesc')}</p>
        </div>

        {/* Credits */}
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

        {/* AI Acknowledgments */}
        <div className="mt-6 border-(--color-border) border-t pt-6">
          <h3 className="mb-3 font-medium">{t('help.aiAcknowledgments')}</h3>
          <p className="mb-4 text-(--color-muted) text-sm leading-relaxed">
            {t('help.aiAcknowledgmentsDesc')}
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
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
            ].map((ai) => (
              <div
                key={ai.name}
                className="rounded-xl border border-(--color-border) bg-(--color-surface) p-3"
              >
                <p className="mb-0.5 font-semibold text-sm" style={{ color: ai.color }}>
                  {ai.name}
                </p>
                <p className="mb-1 font-medium text-(--color-muted) text-xs">{ai.provider}</p>
                <p className="text-(--color-muted) text-xs">{ai.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </HelpTabPanelShell>
  );
};
