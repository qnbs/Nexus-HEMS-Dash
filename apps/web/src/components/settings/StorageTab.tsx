import { Database } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clearAllData, getLocalStorageStats } from '../../lib/db';
import { ignorePromiseRejection } from '../../lib/ignore-promise-rejection';
import { useAppStoreShallow } from '../../store';
import { ConfirmDialog, useConfirmDialog } from '../ConfirmDialog';
import { InfluxTokenField } from './InfluxTokenField';
import { LocalStorageSection } from './LocalStorageSection';
import { SettingsFeatureBar } from './SettingsFeatureBar';
import { inputClass, sectionClass, sectionHeaderClass } from './styles';

/** Settings → Storage tab: InfluxDB connection, retention and local-storage info. */
export const StorageTab = () => {
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
    getLocalStorageStats()
      .then((stats) => {
        if (!cancelled) {
          setUsageMb(stats.usageMb);
          setSnapshots(stats.snapshots);
        }
      })
      .catch(ignorePromiseRejection);
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
          <InfluxTokenField
            value={settings.influxToken}
            showToken={showInfluxToken}
            onToggleShow={() => setShowInfluxToken((v) => !v)}
            onChange={(value) => updateSettings({ influxToken: value })}
          />
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

      <LocalStorageSection
        usageMb={usageMb}
        snapshots={snapshots}
        historyDays={settings.historyDays}
        onClearCache={handleClearCache}
      />

      <ConfirmDialog {...confirm.dialogProps} />
    </>
  );
};
