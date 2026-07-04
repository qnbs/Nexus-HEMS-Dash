import { useTranslation } from 'react-i18next';

/** Hardware requirement bullets for the getting-started tab. */
export const HelpHardwareRequirementsList = () => {
  const { t } = useTranslation();

  return (
    <ul className="space-y-1.5 text-(--color-muted) text-xs">
      <li>• Victron Cerbo GX / MK2 / Venus OS</li>
      <li>• Raspberry Pi 4/5 ({t('help.optional')})</li>
      <li>• KNX IP Router ({t('help.optional')})</li>
      <li>• Node-RED {t('help.onCerbo')}</li>
      <li>• WiFi / Ethernet</li>
    </ul>
  );
};
