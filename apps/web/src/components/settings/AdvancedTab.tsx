import {
  AlertTriangle,
  FlaskConical,
  Gauge,
  Keyboard,
  Monitor,
  OctagonX,
  RotateCcw,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { isLiveSafetyMode } from '../../lib/adapter-mode';
import { useReadOnlyModeActive } from '../../lib/use-read-only-mode';
import { defaultSettings, useAppStoreShallow } from '../../store';
import { ConfirmDialog, useConfirmDialog } from '../ConfirmDialog';
import { EmergencyStop } from '../EmergencyStop';
import { PWASettingsSection } from './PWASettingsSection';
import { SettingsFeatureBar } from './SettingsFeatureBar';
import { sectionClass, sectionHeaderClass } from './styles';
import { ToggleSwitch } from './ToggleSwitch';

/** Settings → Advanced tab: dashboard prefs, performance/debug/experimental, PWA, danger zone. */
export function AdvancedTab() {
  const { t } = useTranslation();
  const { settings, updateSettings, adapterMode } = useAppStoreShallow((s) => ({
    settings: s.settings,
    updateSettings: s.updateSettings,
    adapterMode: s.adapterMode,
  }));
  const isLiveMode = isLiveSafetyMode(adapterMode);
  const isReadOnly = useReadOnlyModeActive();
  const confirm = useConfirmDialog();

  return (
    <>
      <SettingsFeatureBar tabId="advanced" />
      <section className={sectionClass}>
        <h2 className={sectionHeaderClass}>
          <Gauge size={20} className="text-indigo-400" />
          {t('settings.advanced')}
        </h2>
        <div className="space-y-5">
          <div className="flex items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
            <div>
              <p className="font-medium text-sm">{t('settings.debugMode')}</p>
              <p className="text-(--color-muted) text-xs">{t('settings.debugHint')}</p>
            </div>
            <ToggleSwitch
              id="debug"
              checked={settings.debugMode ?? false}
              onChange={(v) => updateSettings({ debugMode: v })}
              label={t('settings.debugMode')}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
            <div>
              <p className="font-medium text-sm">{t('settings.i18nInspector')}</p>
              <p className="text-(--color-muted) text-xs">{t('settings.i18nInspectorHint')}</p>
            </div>
            <button
              type="button"
              className="rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-1.5 font-medium text-xs transition-colors hover:bg-(--color-surface-hover)"
              onClick={() => {
                const current = localStorage.getItem('i18n-inspector');
                if (current === 'true') {
                  localStorage.removeItem('i18n-inspector');
                } else {
                  localStorage.setItem('i18n-inspector', 'true');
                }
                window.location.reload();
              }}
            >
              {localStorage.getItem('i18n-inspector') === 'true'
                ? t('settings.i18nInspectorDeactivate')
                : t('settings.i18nInspectorActivate')}
            </button>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
            <div>
              <p className="font-medium text-sm">{t('settings.experimentalFeatures')}</p>
              <p className="text-(--color-muted) text-xs">{t('settings.experimentalHint')}</p>
            </div>
            <ToggleSwitch
              id="experimental"
              checked={settings.experimentalFeatures ?? false}
              onChange={(v) => updateSettings({ experimentalFeatures: v })}
              label={t('settings.experimentalFeatures')}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
            <div>
              <p className="font-medium text-sm">{t('settings.performanceMode')}</p>
              <p className="text-(--color-muted) text-xs">{t('settings.performanceHint')}</p>
            </div>
            <ToggleSwitch
              id="performance"
              checked={settings.performanceMode ?? false}
              onChange={(v) => updateSettings({ performanceMode: v })}
              label={t('settings.performanceMode')}
            />
          </div>
        </div>
      </section>

      {/* PWA / App Installation */}
      <PWASettingsSection />

      {/* Dashboard Preferences */}
      <section className={sectionClass}>
        <h2 className={sectionHeaderClass}>
          <Monitor size={20} className="text-cyan-400" />
          {t('settings.dashboardPrefs')}
        </h2>
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{t('settings.dashboardRefreshSec')}</p>
                <p className="text-(--color-muted) text-xs">{t('settings.dashboardRefreshHint')}</p>
              </div>
              <span className="font-mono text-(--color-primary) text-sm tabular-nums">
                {settings.dashboardRefreshSec ?? 5}s
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={settings.dashboardRefreshSec ?? 5}
              onChange={(e) => updateSettings({ dashboardRefreshSec: Number(e.target.value) })}
              className="w-full accent-(--color-primary)"
              aria-label={t('settings.dashboardRefreshSec')}
              aria-valuetext={`${settings.dashboardRefreshSec ?? 5} ${t('common.seconds')}`}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{t('settings.sidebarPosition')}</p>
              <p className="text-(--color-muted) text-xs">{t('settings.sidebarPositionHint')}</p>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-(--color-border) bg-(--color-surface) p-1">
              {(['left', 'right'] as const).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => updateSettings({ sidebarPosition: pos })}
                  className={`rounded-lg px-3 py-1.5 font-medium text-xs transition-all ${
                    (settings.sidebarPosition ?? 'left') === pos
                      ? 'bg-(--color-primary)/15 text-(--color-primary)'
                      : 'text-(--color-muted) hover:text-(--color-text)'
                  }`}
                  aria-pressed={(settings.sidebarPosition ?? 'left') === pos}
                >
                  {pos === 'left' ? t('settings.sidebarLeft') : t('settings.sidebarRight')}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{t('settings.autoBackup')}</p>
              <p className="text-(--color-muted) text-xs">{t('settings.autoBackupHint')}</p>
            </div>
            <ToggleSwitch
              id="auto-backup"
              checked={settings.autoBackup ?? false}
              onChange={(v) => updateSettings({ autoBackup: v })}
              label={t('settings.autoBackup')}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="flex items-center gap-2 font-medium text-sm">
                <Keyboard size={14} className="text-(--color-muted)" />
                {t('settings.keyboardShortcuts')}
              </p>
              <p className="text-(--color-muted) text-xs">{t('settings.keyboardShortcutsHint')}</p>
            </div>
            <ToggleSwitch
              id="keyboard-shortcuts"
              checked={settings.keyboardShortcuts ?? true}
              onChange={(v) => updateSettings({ keyboardShortcuts: v })}
              label={t('settings.keyboardShortcuts')}
            />
          </div>

          {/* Keyboard Shortcuts Reference */}
          {(settings.keyboardShortcuts ?? true) && (
            <div className="mt-4 rounded-xl border border-(--color-border) bg-(--color-surface)/40 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-(--color-text) text-sm">
                <Keyboard size={16} className="text-(--color-primary)" />
                {t('settings.shortcutsReference')}
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="mb-1.5 font-medium text-(--color-muted) text-xs uppercase tracking-wider">
                    {t('help.shortcutNav')}
                  </p>
                  <div className="space-y-1">
                    {[
                      { key: '⌘ K', label: t('help.shortcutCmdK') },
                      { key: '⌘ /', label: t('help.shortcutSearch') },
                      { key: 'Esc', label: t('help.shortcutClose') },
                    ].map((s) => (
                      <div key={s.key} className="flex items-center justify-between text-xs">
                        <span className="text-(--color-muted)">{s.label}</span>
                        <kbd className="rounded-md border border-(--color-border) bg-(--color-surface) px-2 py-0.5 font-mono text-(--color-text) text-xs">
                          {s.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="section-divider" />
                <div>
                  <p className="mb-1.5 font-medium text-(--color-muted) text-xs uppercase tracking-wider">
                    {t('help.shortcutActions')}
                  </p>
                  <div className="space-y-1">
                    {[
                      { key: '⌘ S', label: t('help.shortcutSave') },
                      { key: '⌘ E', label: t('help.shortcutExport') },
                      { key: '⌘ L', label: t('help.shortcutLang') },
                    ].map((s) => (
                      <div key={s.key} className="flex items-center justify-between text-xs">
                        <span className="text-(--color-muted)">{s.label}</span>
                        <kbd className="rounded-md border border-(--color-border) bg-(--color-surface) px-2 py-0.5 font-mono text-(--color-text) text-xs">
                          {s.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-(--color-muted) text-[10px] leading-relaxed">
                {t('help.shortcutNote')}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Reset */}
      <section className={sectionClass}>
        <h2 className={sectionHeaderClass}>
          <AlertTriangle size={20} className="text-rose-400" />
          {t('settings.dangerZone')}
        </h2>

        {/* Adapter mode indicator */}
        <div
          className={`mb-4 flex items-start gap-3 rounded-xl border p-4 ${
            isLiveMode
              ? 'border-red-500/40 bg-red-500/10'
              : 'border-(--color-border) bg-(--color-surface-strong)'
          }`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isLiveMode ? 'bg-red-500/20' : 'bg-(--color-surface)'
            }`}
          >
            {isLiveMode ? (
              <AlertTriangle size={20} className="text-red-400" aria-hidden="true" />
            ) : (
              <FlaskConical size={20} className="text-(--color-muted)" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0">
            <p
              className={`font-medium text-sm ${
                isLiveMode ? 'text-red-400' : 'text-(--color-text)'
              }`}
            >
              {t('mode.settingsLabel')}:{' '}
              {isLiveMode ? t('mode.liveBadge') : t('mode.simulationBadge')}
            </p>
            <p className="mt-1 text-(--color-muted) text-xs">
              {isLiveMode
                ? t('mode.settingsLive')
                : adapterMode === 'unknown'
                  ? t('mode.settingsUnknown')
                  : t('mode.settingsSimulation')}
            </p>
          </div>
        </div>

        {/* Emergency Stop */}
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15">
                <OctagonX size={20} className="text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-red-400 text-sm">{t('safety.emergencyStop')}</p>
                <p className="mt-1 text-(--color-muted) text-xs">
                  {t('safety.emergencyStopSettingsHint')}
                </p>
              </div>
            </div>
            <EmergencyStop disabled={isReadOnly} />
          </div>
        </div>

        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-rose-400 text-sm">{t('settings.resetAll')}</p>
              <p className="text-(--color-muted) text-xs">{t('settings.resetHint')}</p>
            </div>
            <motion.button
              type="button"
              disabled={isReadOnly}
              onClick={() =>
                confirm.openDialog({
                  title: t('settings.confirmResetTitle'),
                  message: t('settings.confirmResetMessage'),
                  confirmText: t('settings.confirmResetAction'),
                  variant: 'danger',
                  onConfirm: () => {
                    updateSettings(defaultSettings);
                  },
                })
              }
              className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-rose-400 text-sm transition-colors hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RotateCcw size={16} />
              {t('settings.reset')}
            </motion.button>
          </div>
        </div>
      </section>
      <ConfirmDialog {...confirm.dialogProps} />
    </>
  );
}
