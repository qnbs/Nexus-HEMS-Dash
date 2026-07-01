import { Database, Eye, EyeOff, HardDrive, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStoreShallow } from '../../store';
import { SettingsFeatureBar } from './SettingsFeatureBar';
import { inputClass, sectionClass, sectionHeaderClass } from './styles';

/** Settings → Storage tab: InfluxDB connection, retention and local-storage info. */
export function StorageTab() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useAppStoreShallow((s) => ({
    settings: s.settings,
    updateSettings: s.updateSettings,
  }));
  const [showInfluxToken, setShowInfluxToken] = useState(false);

  return (
    <>
      <SettingsFeatureBar tabId="storage" />
      <section className={sectionClass}>
        <h2 className={sectionHeaderClass}>
          <Database size={20} className="text-purple-400" />
          {t('settings.storage')}
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="settings-influx-url" className="font-medium text-sm">
              {t('settings.influxUrl')}
            </label>
            <input
              id="settings-influx-url"
              type="text"
              value={settings.influxUrl}
              onChange={(e) => updateSettings({ influxUrl: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-influx-token" className="font-medium text-sm">
              {t('settings.influxToken')}
            </label>
            <div className="relative">
              <input
                id="settings-influx-token"
                type={showInfluxToken ? 'text' : 'password'}
                value={settings.influxToken}
                onChange={(e) => updateSettings({ influxToken: e.target.value })}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowInfluxToken((v) => !v)}
                className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-(--color-muted) hover:text-(--color-text)"
                aria-label={showInfluxToken ? t('settings.hideToken') : t('settings.showToken')}
              >
                {showInfluxToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-history-days" className="font-medium text-sm">
              {t('settings.historyDays')}
            </label>
            <input
              id="settings-history-days"
              type="number"
              value={settings.historyDays}
              onChange={(e) => updateSettings({ historyDays: Number(e.target.value) })}
              className={inputClass}
              min={1}
              max={365}
            />
            <p className="text-(--color-muted) text-xs">{t('settings.historyHint')}</p>
          </div>
        </div>
      </section>

      {/* Local Storage Info */}
      <section className={sectionClass}>
        <h2 className={sectionHeaderClass}>
          <HardDrive size={20} className="text-cyan-400" />
          {t('settings.localStorage', 'Local Storage')}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center">
            <p className="font-bold text-(--color-primary) text-2xl">~2.4</p>
            <p className="text-(--color-muted) text-xs">MB IndexedDB</p>
          </div>
          <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center">
            <p className="font-bold text-(--color-secondary) text-2xl">847</p>
            <p className="text-(--color-muted) text-xs">{t('settings.snapshots', 'Snapshots')}</p>
          </div>
          <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center">
            <p className="font-bold text-2xl text-amber-400">30</p>
            <p className="text-(--color-muted) text-xs">
              {t('settings.daysRetention', 'Days retention')}
            </p>
          </div>
        </div>
        <motion.button
          type="button"
          className="flex items-center gap-2 text-rose-400 text-sm transition-colors hover:text-rose-300"
          whileHover={{ x: 4 }}
        >
          <Trash2 size={16} />
          {t('settings.clearCache', 'Clear local cache')}
        </motion.button>
      </section>
    </>
  );
}
