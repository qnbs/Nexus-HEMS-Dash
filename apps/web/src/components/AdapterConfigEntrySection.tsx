import type { TFunction } from 'i18next';
import {
  Activity,
  AlertTriangle,
  Cable,
  Check,
  Eye,
  EyeOff,
  Plug,
  Radio,
  Server,
  Shield,
  Trash2,
  Wifi,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AdapterHelpItem, GAMappingPanel, ToggleSwitch } from './adapter-config-shared';
import { ADAPTER_META, type AdapterEntry } from './adapter-config-types';
import { Disclosure } from './ui/Disclosure';
import { SelectField } from './ui/SelectField';

export interface AdapterConfigEntrySectionProps {
  adapter: AdapterEntry;
  isExpanded: boolean;
  onExpandChange: (open: boolean) => void;
  onUpdate: (patch: Partial<AdapterEntry>) => void;
  showToken: boolean;
  onToggleToken: () => void;
  onRemove: () => void;
  onSave: () => void;
  isReadOnly: boolean;
  isSaving: boolean;
  isSaved: boolean;
  inputClass: string;
  sectionClass: string;
  t: TFunction;
}

export const AdapterConfigEntrySection = ({
  adapter,
  isExpanded,
  onExpandChange,
  onUpdate,
  showToken,
  onToggleToken,
  onRemove,
  onSave,
  isReadOnly,
  isSaving,
  isSaved,
  inputClass,
  sectionClass,
  t,
}: AdapterConfigEntrySectionProps) => {
  const meta = ADAPTER_META[adapter.type];
  const Icon = meta.icon;

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={sectionClass}
    >
      <Disclosure
        variant="nested"
        className="border-0 bg-transparent shadow-none"
        open={isExpanded}
        onOpenChange={onExpandChange}
        title={adapter.name}
        subtitle={
          <>
            {t(`adapterConfig.type_${adapter.type}`)}
            {adapter.host ? ` · ${adapter.host}:${adapter.port}` : ''}
          </>
        }
        icon={
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl bg-(--color-surface-strong) ${meta.color}`}
          >
            <Icon size={18} />
          </div>
        }
        actions={
          <>
            <div className="hidden gap-1 sm:flex">
              {meta.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="rounded-full border border-(--color-border) bg-(--color-surface) px-2 py-0.5 text-(--color-muted) text-[10px]"
                >
                  {t(`adapterConfig.cap_${cap}`)}
                </span>
              ))}
            </div>
            <ToggleSwitch
              id={`enable-${adapter.id}`}
              checked={adapter.enabled}
              onChange={(v) => onUpdate({ enabled: v })}
              label={t('adapterConfig.enabled')}
            />
          </>
        }
      >
        <div className="space-y-5">
          {/* Connection */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 font-medium text-sm">
              <Wifi size={14} className="text-emerald-400" />
              {t('adapterConfig.connection')}
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor={`adapter-name-${adapter.id}`}
                  className="font-medium text-(--color-muted) text-xs"
                >
                  {t('adapterConfig.adapterName')}
                </label>
                <input
                  id={`adapter-name-${adapter.id}`}
                  type="text"
                  value={adapter.name}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor={`adapter-host-${adapter.id}`}
                  className="font-medium text-(--color-muted) text-xs"
                >
                  {t('adapterConfig.host')}
                </label>
                <input
                  id={`adapter-host-${adapter.id}`}
                  type="text"
                  value={adapter.host}
                  onChange={(e) => onUpdate({ host: e.target.value })}
                  className={inputClass}
                  placeholder="192.168.1.100"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor={`adapter-port-${adapter.id}`}
                  className="font-medium text-(--color-muted) text-xs"
                >
                  {t('adapterConfig.port')}
                </label>
                <input
                  id={`adapter-port-${adapter.id}`}
                  type="number"
                  value={adapter.port}
                  onChange={(e) => onUpdate({ port: Number(e.target.value) })}
                  className={inputClass}
                  min={1}
                  max={65535}
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor={`adapter-poll-${adapter.id}`}
                  className="font-medium text-(--color-muted) text-xs"
                >
                  {t('adapterConfig.pollInterval')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={`adapter-poll-${adapter.id}`}
                    type="number"
                    value={adapter.pollIntervalMs}
                    onChange={(e) => onUpdate({ pollIntervalMs: Number(e.target.value) })}
                    className={inputClass}
                    min={500}
                    max={60000}
                    step={500}
                  />
                  <span className="whitespace-nowrap text-(--color-muted) text-xs">ms</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security */}
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

          {/* Victron-specific */}
          {adapter.type === 'victron' && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-medium text-sm">
                <Activity size={14} className="text-blue-400" />
                {t('adapterConfig.victronSpecific')}
              </h3>
              <div className="space-y-2">
                <p className="font-medium text-(--color-muted) text-xs">
                  {t('adapterConfig.gatewayType')}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(['cerbo-gx', 'venus-gx', 'rpi-victron'] as const).map((gw) => (
                    <button
                      key={gw}
                      type="button"
                      onClick={() => onUpdate({ gatewayType: gw })}
                      className={`rounded-lg border-2 p-2 text-left text-xs transition-all ${
                        adapter.gatewayType === gw
                          ? 'border-(--color-primary) bg-(--color-primary)/10'
                          : 'border-(--color-border) bg-(--color-surface) hover:border-(--color-primary)/40'
                      }`}
                      aria-pressed={adapter.gatewayType === gw}
                    >
                      <span className="font-medium">{t(`adapterConfig.gw_${gw}`)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* OCPP-specific */}
          {adapter.type === 'ocpp' && (
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
                    <p className="text-(--color-muted) text-[10px]">
                      {t('adapterConfig.iso15118Hint')}
                    </p>
                  </div>
                  <ToggleSwitch
                    id={`iso15118-${adapter.id}`}
                    checked={adapter.iso15118 ?? false}
                    onChange={(v) => onUpdate({ iso15118: v })}
                    label="ISO 15118"
                  />
                </div>
                {adapter.securityProfile === 3 && (
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
          )}

          {/* EEBUS-specific */}
          {adapter.type === 'eebus' && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-medium text-sm">
                <Cable size={14} className="text-purple-400" />
                {t('adapterConfig.eebusSpecific')}
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor={`adapter-ski-${adapter.id}`}
                    className="font-medium text-(--color-muted) text-xs"
                  >
                    {t('adapterConfig.skiFingerprint')}
                  </label>
                  <input
                    id={`adapter-ski-${adapter.id}`}
                    type="text"
                    value={adapter.skiFingerprint ?? ''}
                    onChange={(e) => onUpdate({ skiFingerprint: e.target.value })}
                    className={`${inputClass} font-mono`}
                    placeholder="0123456789abcdef..."
                    maxLength={40}
                  />
                  <p className="text-(--color-muted) text-[10px]">
                    {t('adapterConfig.skiFingerprintHint')}
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2 text-purple-300 text-xs">
                    <Shield size={14} />
                    {t('adapterConfig.eebusRequiresTls')}
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor={`adapter-cert-eebus-${adapter.id}`}
                      className="font-medium text-(--color-muted) text-xs"
                    >
                      {t('adapterConfig.clientCert')}
                    </label>
                    <textarea
                      id={`adapter-cert-eebus-${adapter.id}`}
                      value={adapter.clientCert ?? ''}
                      onChange={(e) => onUpdate({ clientCert: e.target.value })}
                      className={`${inputClass} h-20 resize-none font-mono text-xs`}
                      placeholder="-----BEGIN CERTIFICATE-----"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor={`adapter-key-eebus-${adapter.id}`}
                      className="font-medium text-(--color-muted) text-xs"
                    >
                      {t('adapterConfig.clientKey')}
                    </label>
                    <textarea
                      id={`adapter-key-eebus-${adapter.id}`}
                      value={adapter.clientKey ?? ''}
                      onChange={(e) => onUpdate({ clientKey: e.target.value })}
                      className={`${inputClass} h-20 resize-none font-mono text-xs`}
                      placeholder="-----BEGIN PRIVATE KEY-----"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* KNX-specific: GA Mapping */}
          {adapter.type === 'knx' && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 font-medium text-sm">
                <Radio size={14} className="text-green-400" />
                {t('adapterConfig.knxSpecific')}
              </h3>
              <div className="mb-4 space-y-2">
                <p className="font-medium text-(--color-muted) text-xs">
                  {t('adapterConfig.knxTransport')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(['websocket', 'mqtt'] as const).map((tr) => (
                    <button
                      key={tr}
                      type="button"
                      onClick={() => onUpdate({ knxTransport: tr })}
                      className={`rounded-lg border-2 p-2 text-center font-medium text-xs transition-all ${
                        adapter.knxTransport === tr
                          ? 'border-(--color-primary) bg-(--color-primary)/10 text-(--color-primary)'
                          : 'border-(--color-border) bg-(--color-surface) text-(--color-muted) hover:border-(--color-primary)/40'
                      }`}
                      aria-pressed={adapter.knxTransport === tr}
                    >
                      {tr === 'websocket' ? 'WebSocket (knxd)' : 'MQTT Bridge'}
                    </button>
                  ))}
                </div>
              </div>
              <GAMappingPanel
                mapping={adapter.gaMapping ?? []}
                onChange={(m) => onUpdate({ gaMapping: m })}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-(--color-border) border-t pt-4">
            <motion.button
              type="button"
              onClick={onRemove}
              className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-rose-400 text-xs transition-colors hover:bg-rose-500/10"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Trash2 size={14} />
              {t('adapterConfig.remove')}
            </motion.button>
            <motion.button
              type="button"
              onClick={onSave}
              disabled={isReadOnly || isSaving}
              className="flex items-center gap-2 rounded-xl bg-(--color-text) px-4 py-2 font-medium text-(--color-background) text-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSaved ? <Check size={16} /> : <Server size={16} />}
              {isSaved ? t('common.saved') : isSaving ? t('common.saving') : t('common.save')}
            </motion.button>
          </div>
        </div>
      </Disclosure>
    </motion.section>
  );
};
