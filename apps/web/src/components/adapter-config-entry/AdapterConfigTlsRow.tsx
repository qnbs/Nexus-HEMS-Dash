import { ToggleSwitch } from '../adapter-config-shared';
import type { AdapterConfigFieldProps } from './adapter-config-field-types';

/** TLS / SSL enable toggle with hint text. */
export const AdapterConfigTlsRow = ({
  adapter,
  onUpdate,
  t,
}: Pick<AdapterConfigFieldProps, 'adapter' | 'onUpdate' | 't'>) => (
  <div className="flex items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface) p-3">
    <div>
      <p className="font-medium text-xs">TLS / SSL</p>
      <p className="text-(--color-muted) text-[10px]">{t('adapterConfig.tlsHint')}</p>
    </div>
    <ToggleSwitch
      id={`tls-${adapter.id}`}
      checked={adapter.tls}
      onChange={(v) => onUpdate({ tls: v })}
      label="TLS"
    />
  </div>
);
