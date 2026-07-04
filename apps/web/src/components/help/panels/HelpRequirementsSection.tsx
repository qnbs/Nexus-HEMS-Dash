import { Globe, Monitor } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HelpRequirementCard } from './HelpRequirementCard';

/** Hardware and software requirement cards on the getting-started tab. */
export const HelpRequirementsSection = () => {
  const { t } = useTranslation();

  return (
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
  );
};
