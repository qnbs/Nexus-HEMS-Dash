import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clearAllData, getLocalStorageStats } from '../../lib/db';
import { ignorePromiseRejection } from '../../lib/ignore-promise-rejection';
import { useAppStoreShallow } from '../../store';
import { ConfirmDialog, useConfirmDialog } from '../ConfirmDialog';
import { InfluxDbSettingsSection } from './InfluxDbSettingsSection';
import { LocalStorageSection } from './LocalStorageSection';
import { SettingsFeatureBar } from './SettingsFeatureBar';

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
      <InfluxDbSettingsSection
        influxUrl={settings.influxUrl}
        influxToken={settings.influxToken}
        historyDays={settings.historyDays}
        showInfluxToken={showInfluxToken}
        onInfluxUrlChange={(value) => updateSettings({ influxUrl: value })}
        onInfluxTokenChange={(value) => updateSettings({ influxToken: value })}
        onHistoryDaysChange={(value) => updateSettings({ historyDays: value })}
        onToggleShowToken={() => setShowInfluxToken((v) => !v)}
      />
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
