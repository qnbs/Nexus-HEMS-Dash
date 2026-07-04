import { Database, Eye, EyeOff, HardDrive, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clearAllData, getLocalStorageStats } from '../../lib/db';
import { useAppStoreShallow } from '../../store';
import { ConfirmDialog, useConfirmDialog } from '../ConfirmDialog';
import { SettingsFeatureBar } from './SettingsFeatureBar';
import { StorageStatsCards } from './StorageStatsCards';
import { inputClass, sectionClass, sectionHeaderClass } from './styles';

/** Settings → Storage tab: InfluxDB connection, retention and local-storage info. */
export function StorageTab() {
  const { t } = useTranslation();
  const confirm = useConfirmDialog();
  const { settings, updateSettings } = useAppStoreShallow((s) => ({
    settings: s.settings,
    updateSettings: s.updateSettings,
  }));
  const [showInfluxToken, setShowInfluxToken] = useState(false);
  const [usageMb, setUsageMb] = useState(0);
  const [snapshots, setSnapshots] = useState(0);
  const [statsTick, setStatsTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void getLocalStorageStats().then((stats) => {
      if (!cancelled) {
        setUsageMb(stats.usageMb);
        setSnapshots(stats.snapshots);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [statsTick]);

  const handleClearCache = () => {
    confirm.openDialog({
      title: t('settings.clearCacheConfirmTitle', 'Clear local cache'),
      message: t(
        'settings.clearCacheConfirmMessage',
        'This removes cached snapshots and offline data from this device. Settings are kept.',
      ),
      confirmText: t('settings.clearCacheConfirmAction', 'Clear cache'),
      variant: 'warning',
      onConfirm: async () => {
        await clearAllData();
        setStatsTick((n) => n + 1);
      },
    });
  };

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

      <section className={sectionClass}>
        <h2 className={sectionHeaderClass}>
          <HardDrive size={20} className="text-cyan-400" />
          {t('settings.localStorage', 'Local Storage')}
        </h2>
        <StorageStatsCards
          usageMb={usageMb}
          snapshots={snapshots}
          historyDays={settings.historyDays}
        />
        <motion.button
          type="button"
          onClick={handleClearCache}
          className="flex items-center gap-2 text-rose-400 text-sm transition-colors hover:text-rose-300"
          whileHover={{ x: 4 }}
        >
          <Trash2 size={16} />
          {t('settings.clearCache', 'Clear local cache')}
        </motion.button>
      </section>

      <ConfirmDialog {...confirm.dialogProps} />
    </>
  );
}
