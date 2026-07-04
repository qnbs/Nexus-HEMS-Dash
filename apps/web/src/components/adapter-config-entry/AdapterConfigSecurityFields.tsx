import { Eye, EyeOff, Shield } from 'lucide-react';
import { ToggleSwitch } from '../adapter-config-shared';
import type { AdapterConfigSecurityFieldProps } from './adapter-config-field-types';

/** TLS toggle and auth-token field for one adapter entry. */
export const AdapterConfigSecurityFields = ({
  adapter,
  onUpdate,
  showToken,
  onToggleToken,
  inputClass,
  t,
}: AdapterConfigSecurityFieldProps) => (
  <div>
    <h3 className="mb-3 flex items-center gap-2 font-medium text-sm">
      <Shield size={14} className="text-orange-400" />
      {t('adapterConfig.security')}
    </h3>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
      <div className="space-y-2">
        <label
          htmlFor={`adapter-token-${adapter.id}`}
          className="font-medium text-(--color-muted) text-xs"
        >
          {t('adapterConfig.authToken')}
        </label>
        <div className="relative">
          <input
            id={`adapter-token-${adapter.id}`}
            type={showToken ? 'text' : 'password'}
            value={adapter.authToken}
            onChange={(e) => onUpdate({ authToken: e.target.value })}
            className={`${inputClass} pr-10`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={onToggleToken}
            className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-(--color-muted) hover:text-(--color-text)"
            aria-label={showToken ? t('common.hideKey') : t('common.showKey')}
          >
            {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
    </div>
  </div>
);
