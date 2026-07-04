import { Wifi } from 'lucide-react';
import type { AdapterConfigFieldProps } from './adapter-config-field-types';

/** Connection settings block (name, host, port, poll interval) for one adapter entry. */
export const AdapterConfigConnectionFields = ({
  adapter,
  onUpdate,
  inputClass,
  t,
}: AdapterConfigFieldProps) => (
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
);
