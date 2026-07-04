import { useTranslation } from 'react-i18next';

type GatewayType = 'cerbo-gx' | 'cerbo-gx-mk2' | 'raspberry-pi';

const GATEWAY_OPTIONS: { value: GatewayType; label: string; hintKey: string }[] = [
  { value: 'cerbo-gx', label: 'Cerbo GX', hintKey: 'settings.gatewayTypeCerboHint' },
  { value: 'cerbo-gx-mk2', label: 'Cerbo GX MK2', hintKey: 'settings.gatewayTypeMk2Hint' },
  { value: 'raspberry-pi', label: 'Raspberry Pi', hintKey: 'settings.gatewayTypeRpiHint' },
];

export const GatewayTypeSelector = ({
  value,
  onChange,
}: {
  value: GatewayType;
  onChange: (gatewayType: GatewayType) => void;
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2 md:col-span-2">
      <p className="font-medium text-sm">{t('settings.gatewayType')}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {GATEWAY_OPTIONS.map((gw) => (
          <button
            key={gw.value}
            type="button"
            onClick={() => onChange(gw.value)}
            className={`rounded-xl border-2 p-3 text-left transition-all ${
              value === gw.value
                ? 'border-(--color-primary) bg-(--color-primary)/10'
                : 'border-(--color-border) bg-(--color-surface) hover:border-(--color-primary)/40'
            }`}
            aria-pressed={value === gw.value}
          >
            <span className="font-medium text-sm">{gw.label}</span>
            <p className="mt-1 text-(--color-muted) text-xs">{t(gw.hintKey)}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
