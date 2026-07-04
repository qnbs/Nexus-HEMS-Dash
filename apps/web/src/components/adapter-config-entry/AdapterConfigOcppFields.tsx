import { AlertTriangle, Plug, Shield } from 'lucide-react';
import { AdapterHelpItem, ToggleSwitch } from '../adapter-config-shared';
import { Disclosure } from '../ui/Disclosure';
import { SelectField } from '../ui/SelectField';
import type { AdapterConfigFieldProps } from './adapter-config-field-types';

/** OCPP 2.1 station ID, security profile, ISO 15118, and mTLS fields. */
export const AdapterConfigOcppFields = ({
  adapter,
  onUpdate,
  inputClass,
  t,
}: AdapterConfigFieldProps) => (
  <div>
    <h3 className="mb-3 flex items-center gap-2 font-medium text-sm">
      <Plug size={14} className="text-cyan-400" />
      {t('adapterConfig.ocppSpecific')}
    </h3>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <label
          htmlFor={`adapter-station-${adapter.id}`}
          className="font-medium text-(--color-muted) text-xs"
        >
          {t('adapterConfig.stationId')}
        </label>
        <input
          id={`adapter-station-${adapter.id}`}
          type="text"
          value={adapter.stationId ?? ''}
          onChange={(e) => onUpdate({ stationId: e.target.value })}
          className={inputClass}
          placeholder="CP001"
        />
      </div>
      <SelectField
        id={`adapter-secprofile-${adapter.id}`}
        label={t('adapterConfig.securityProfile')}
        value={String(adapter.securityProfile ?? 2)}
        onChange={(e) =>
          onUpdate({
            securityProfile: Number(e.target.value) as 0 | 1 | 2 | 3,
          })
        }
      >
        <option value="0">{t('adapterConfig.secProfile0')}</option>
        <option value="1">{t('adapterConfig.secProfile1')}</option>
        <option value="2">{t('adapterConfig.secProfile2')}</option>
        <option value="3">{t('adapterConfig.secProfile3')}</option>
      </SelectField>
      <div className="flex items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface) p-3 md:col-span-2">
        <div>
          <p className="font-medium text-xs">ISO 15118 Plug & Charge</p>
          <p className="text-(--color-muted) text-[10px]">{t('adapterConfig.iso15118Hint')}</p>
        </div>
        <ToggleSwitch
          id={`iso15118-${adapter.id}`}
          checked={adapter.iso15118 ?? false}
          onChange={(v) => onUpdate({ iso15118: v })}
          label="ISO 15118"
        />
      </div>
      {adapter.securityProfile === 3 && (
        <AdapterConfigOcppMtlsFields
          adapter={adapter}
          onUpdate={onUpdate}
          inputClass={inputClass}
          t={t}
        />
      )}
      <div className="md:col-span-2">
        <Disclosure
          variant="nested"
          title={t('adapterConfig.ocppV2xSection')}
          subtitle={t('adapterConfig.ocppV2xIntro')}
          icon={<Shield size={14} className="text-cyan-400" aria-hidden />}
        >
          <ul className="space-y-2">
            <AdapterHelpItem
              titleKey="adapterConfig.ocppV2xS14a"
              descKey="adapterConfig.ocppV2xS14aDesc"
            />
            <AdapterHelpItem
              titleKey="adapterConfig.ocppPhaseConfig"
              descKey="adapterConfig.ocppPhaseConfigDesc"
            />
            <AdapterHelpItem
              titleKey="adapterConfig.ocppTargetSoc"
              descKey="adapterConfig.ocppTargetSocDesc"
            />
            <AdapterHelpItem
              titleKey="adapterConfig.ocppSmartCost"
              descKey="adapterConfig.ocppSmartCostDesc"
            />
            <AdapterHelpItem
              titleKey="adapterConfig.ocppMinCurrent"
              descKey="adapterConfig.ocppMinCurrentDesc"
            />
            <AdapterHelpItem
              titleKey="adapterConfig.ocppV2xV2h"
              descKey="adapterConfig.ocppV2xV2hDesc"
            />
            <AdapterHelpItem
              titleKey="adapterConfig.ocppV2xV2g"
              descKey="adapterConfig.ocppV2xV2gDesc"
            />
          </ul>
        </Disclosure>
      </div>
    </div>
  </div>
);

const AdapterConfigOcppMtlsFields = ({
  adapter,
  onUpdate,
  inputClass,
  t,
}: AdapterConfigFieldProps) => (
  <div className="space-y-3 md:col-span-2">
    <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-amber-400 text-xs">
      <AlertTriangle size={14} />
      {t('adapterConfig.mtlsRequired')}
    </div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <label
          htmlFor={`adapter-cert-ocpp-${adapter.id}`}
          className="font-medium text-(--color-muted) text-xs"
        >
          {t('adapterConfig.clientCert')}
        </label>
        <textarea
          id={`adapter-cert-ocpp-${adapter.id}`}
          value={adapter.clientCert ?? ''}
          onChange={(e) => onUpdate({ clientCert: e.target.value })}
          className={`${inputClass} h-20 resize-none font-mono text-xs`}
          placeholder="-----BEGIN CERTIFICATE-----"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor={`adapter-key-ocpp-${adapter.id}`}
          className="font-medium text-(--color-muted) text-xs"
        >
          {t('adapterConfig.clientKey')}
        </label>
        <textarea
          id={`adapter-key-ocpp-${adapter.id}`}
          value={adapter.clientKey ?? ''}
          onChange={(e) => onUpdate({ clientKey: e.target.value })}
          className={`${inputClass} h-20 resize-none font-mono text-xs`}
          placeholder="-----BEGIN PRIVATE KEY-----"
        />
      </div>
    </div>
  </div>
);
