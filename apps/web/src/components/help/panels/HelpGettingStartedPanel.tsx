import { Activity, Download, Globe, Monitor, Server, Sparkles, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { HelpTabPanelShell } from '../HelpTabPanelShell';

export const HelpGettingStartedPanel = () => {
  const { t } = useTranslation();

  return (
    <HelpTabPanelShell tabKey="getting-started">
      <div className="glass-panel-strong rounded-2xl p-6">
        <h2 className="fluid-text-xl mb-4 font-semibold">{t('help.welcomeTitle')}</h2>
        <p className="mb-6 text-(--color-muted) leading-relaxed">{t('help.welcomeIntro')}</p>

        {/* Quick Start Steps */}
        <h3 className="fluid-text-lg mb-4 font-medium">{t('help.quickStart')}</h3>
        <div className="space-y-4">
          {[
            {
              step: 1,
              title: t('help.step1Title'),
              desc: t('help.step1Desc'),
              icon: <Server size={18} />,
              link: '/settings?tab=adapters',
            },
            {
              step: 2,
              title: t('help.step2Title'),
              desc: t('help.step2Desc'),
              icon: <Zap size={18} />,
              link: '/settings?tab=energy',
            },
            {
              step: 3,
              title: t('help.step3Title'),
              desc: t('help.step3Desc'),
              icon: <Activity size={18} />,
              link: '/monitoring',
            },
            {
              step: 4,
              title: t('help.step4Title'),
              desc: t('help.step4Desc'),
              icon: <Sparkles size={18} />,
              link: '/settings/ai',
            },
            {
              step: 5,
              title: t('help.step5Title'),
              desc: t('help.step5Desc'),
              icon: <Download size={18} />,
              link: '/',
            },
          ].map((item) => (
            <Link
              key={item.step}
              to={item.link}
              className="focus-ring flex gap-4 rounded-xl border border-(--color-border) bg-(--color-surface) p-4 transition-colors hover:border-(--color-primary)/40 hover:bg-white/5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--color-primary)/15 font-bold text-(--color-primary) text-sm">
                {item.step}
              </div>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-(--color-primary)">{item.icon}</span>
                  <h4 className="font-medium text-sm">{item.title}</h4>
                </div>
                <p className="text-(--color-muted) text-xs leading-relaxed">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* System Requirements */}
      <div className="glass-panel-strong rounded-2xl p-6">
        <h3 className="fluid-text-lg mb-4 font-medium">{t('help.requirements')}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
            <div className="mb-2 flex items-center gap-2">
              <Monitor size={16} className="text-blue-400" />
              <h4 className="font-medium text-sm">{t('help.hardware')}</h4>
            </div>
            <ul className="space-y-1.5 text-(--color-muted) text-xs">
              <li>• Victron Cerbo GX / MK2 / Venus OS</li>
              <li>• Raspberry Pi 4/5 ({t('help.optional')})</li>
              <li>• KNX IP Router ({t('help.optional')})</li>
              <li>• Node-RED {t('help.onCerbo')}</li>
              <li>• WiFi / Ethernet</li>
            </ul>
          </div>
          <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
            <div className="mb-2 flex items-center gap-2">
              <Globe size={16} className="text-cyan-400" />
              <h4 className="font-medium text-sm">{t('help.software')}</h4>
            </div>
            <ul className="space-y-1.5 text-(--color-muted) text-xs">
              <li>• {t('help.modernBrowser')}</li>
              <li>• {t('help.pwaSupport')}</li>
              <li>
                • Tibber / aWATTar {t('help.account')} ({t('help.optional')})
              </li>
              <li>• AI API Key ({t('help.optional')})</li>
            </ul>
          </div>
        </div>
      </div>
    </HelpTabPanelShell>
  );
};
