import { Activity, Download, Globe, Monitor, Server, Sparkles, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HelpTabPanelShell } from '../HelpTabPanelShell';
import { HelpQuickStartStep } from './HelpQuickStartStep';
import { HelpRequirementCard } from './HelpRequirementCard';

export const HelpGettingStartedPanel = () => {
  const { t } = useTranslation();

  const quickStartSteps = [
    {
      step: 1,
      title: t('help.step1Title'),
      desc: t('help.step1Desc'),
      icon: <Server size={18} aria-hidden="true" />,
      link: '/settings?tab=adapters',
    },
    {
      step: 2,
      title: t('help.step2Title'),
      desc: t('help.step2Desc'),
      icon: <Zap size={18} aria-hidden="true" />,
      link: '/settings?tab=energy',
    },
    {
      step: 3,
      title: t('help.step3Title'),
      desc: t('help.step3Desc'),
      icon: <Activity size={18} aria-hidden="true" />,
      link: '/monitoring',
    },
    {
      step: 4,
      title: t('help.step4Title'),
      desc: t('help.step4Desc'),
      icon: <Sparkles size={18} aria-hidden="true" />,
      link: '/settings/ai',
    },
    {
      step: 5,
      title: t('help.step5Title'),
      desc: t('help.step5Desc'),
      icon: <Download size={18} aria-hidden="true" />,
      link: '/',
    },
  ];

  return (
    <HelpTabPanelShell tabKey="getting-started">
      <div className="glass-panel-strong rounded-2xl p-6">
        <h2 className="fluid-text-xl mb-4 font-semibold">{t('help.welcomeTitle')}</h2>
        <p className="mb-6 text-(--color-muted) leading-relaxed">{t('help.welcomeIntro')}</p>

        <h3 className="fluid-text-lg mb-4 font-medium">{t('help.quickStart')}</h3>
        <div className="space-y-4">
          {quickStartSteps.map((item) => (
            <HelpQuickStartStep key={item.step} {...item} />
          ))}
        </div>
      </div>

      <div className="glass-panel-strong rounded-2xl p-6">
        <h3 className="fluid-text-lg mb-4 font-medium">{t('help.requirements')}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <HelpRequirementCard
            icon={<Monitor size={16} className="text-blue-400" aria-hidden="true" />}
            title={t('help.hardware')}
          >
            <ul className="space-y-1.5 text-(--color-muted) text-xs">
              <li>• Victron Cerbo GX / MK2 / Venus OS</li>
              <li>• Raspberry Pi 4/5 ({t('help.optional')})</li>
              <li>• KNX IP Router ({t('help.optional')})</li>
              <li>• Node-RED {t('help.onCerbo')}</li>
              <li>• WiFi / Ethernet</li>
            </ul>
          </HelpRequirementCard>
          <HelpRequirementCard
            icon={<Globe size={16} className="text-cyan-400" aria-hidden="true" />}
            title={t('help.software')}
          >
            <ul className="space-y-1.5 text-(--color-muted) text-xs">
              <li>• {t('help.modernBrowser')}</li>
              <li>• {t('help.pwaSupport')}</li>
              <li>
                • Tibber / aWATTar {t('help.account')} ({t('help.optional')})
              </li>
              <li>• AI API Key ({t('help.optional')})</li>
            </ul>
          </HelpRequirementCard>
        </div>
      </div>
    </HelpTabPanelShell>
  );
};
