import {
  AlertTriangle,
  Bell,
  Cable,
  Check,
  Cpu,
  Database,
  Download,
  FlaskConical,
  Gauge,
  Keyboard,
  Monitor,
  OctagonX,
  Palette,
  RefreshCw,
  RotateCcw,
  Save,
  Server,
  Settings as SettingsIcon,
  Shield,
  Sparkles,
  Upload,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type FormEvent, lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { AdapterConfigPanel } from '../components/AdapterConfigPanel';
import { ConfirmDialog, useConfirmDialog } from '../components/ConfirmDialog';
import { EmergencyStop } from '../components/EmergencyStop';
import { AppearanceTab } from '../components/settings/AppearanceTab';
import { ControllersTab } from '../components/settings/ControllersTab';
import { EnergyTab } from '../components/settings/EnergyTab';
import { NotificationsTab } from '../components/settings/NotificationsTab';
import { PWASettingsSection } from '../components/settings/PWASettingsSection';
import { SecurityTab } from '../components/settings/SecurityTab';
import { SettingsFeatureBar } from '../components/settings/SettingsFeatureBar';
import { StorageTab } from '../components/settings/StorageTab';
import { SystemTab } from '../components/settings/SystemTab';
import { sectionClass, sectionHeaderClass } from '../components/settings/styles';
import { ToggleSwitch } from '../components/settings/ToggleSwitch';
import { isLiveSafetyMode } from '../lib/adapter-mode';
import { defaultSettings, useAppStoreShallow } from '../store';

const AISettingsPage = lazy(() => import('./AISettingsPage'));

type SettingsTab =
  | 'appearance'
  | 'system'
  | 'energy'
  | 'controllers'
  | 'adapters'
  | 'security'
  | 'storage'
  | 'notifications'
  | 'advanced'
  | 'ai';

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: settings page with multiple hardware config sections
export function Settings() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [saved, setSaved] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const validTabs: SettingsTab[] = [
    'appearance',
    'system',
    'energy',
    'controllers',
    'adapters',
    'security',
    'storage',
    'notifications',
    'advanced',
    'ai',
  ];
  const tabParam = searchParams.get('tab') as SettingsTab | null;
  const initialTab = tabParam && validTabs.includes(tabParam) ? tabParam : 'appearance';
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'appearance' ? {} : { tab }, { replace: true });
  };

  const confirm = useConfirmDialog();

  const { settings, updateSettings, adapterMode } = useAppStoreShallow((s) => ({
    settings: s.settings,
    updateSettings: s.updateSettings,
    adapterMode: s.adapterMode,
  }));

  const isLiveMode = isLiveSafetyMode(adapterMode);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleExportSettings = () => {
    confirm.openDialog({
      title: t('settings.confirmExportTitle', 'Export Settings'),
      message: t(
        'settings.confirmExportMessage',
        'Your current settings will be exported as a JSON file.',
      ),
      confirmText: t('settings.confirmExportAction', 'Export'),
      variant: 'info',
      onConfirm: () => {
        const data = JSON.stringify(settings, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nexus-hems-settings.json';
        a.click();
        URL.revokeObjectURL(url);
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 4000);
      },
    });
  };

  const handleImportSettings = () => {
    confirm.openDialog({
      title: t('settings.confirmImportTitle', 'Import Settings'),
      message: t(
        'settings.confirmImportMessage',
        'Importing settings will overwrite all current configurations.',
      ),
      confirmText: t('settings.confirmImportAction', 'Choose File'),
      variant: 'warning',
      onConfirm: () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;
          const maxSize = 1024 * 1024; // 1 MB
          if (file.size > maxSize) {
            confirm.openDialog({
              title: t('common.error'),
              message: t('settings.importFileTooLarge', 'File too large (max 1 MB).'),
              confirmText: t('common.dismiss'),
              variant: 'danger',
              onConfirm: () => {},
            });
            return;
          }
          const text = await file.text();
          try {
            const data = JSON.parse(text);
            if (typeof data !== 'object' || data === null || Array.isArray(data)) {
              throw new Error('invalid');
            }
            updateSettings(data);
            setImportSuccess(true);
            setTimeout(() => setImportSuccess(false), 4000);
          } catch {
            confirm.openDialog({
              title: t('common.error'),
              message: t('common.importError'),
              confirmText: t('common.dismiss'),
              variant: 'danger',
              onConfirm: () => {},
            });
          }
        };
        input.click();
      },
    });
  };

  const tabs: { key: SettingsTab; icon: React.ReactNode; label: string }[] = [
    {
      key: 'appearance',
      icon: <Palette size={18} />,
      label: t('settings.appearance', 'Appearance'),
    },
    { key: 'system', icon: <Server size={18} />, label: t('settings.system') },
    { key: 'energy', icon: <Zap size={18} />, label: t('settings.energyShort', 'Energy') },
    {
      key: 'controllers',
      icon: <Cpu size={18} />,
      label: t('settings.controllersTab', 'Controllers'),
    },
    {
      key: 'adapters',
      icon: <Cable size={18} />,
      label: t('adapterConfig.tabLabel', 'Adapters'),
    },
    { key: 'security', icon: <Shield size={18} />, label: t('settings.security') },
    { key: 'storage', icon: <Database size={18} />, label: t('settings.storageShort', 'Storage') },
    {
      key: 'notifications',
      icon: <Bell size={18} />,
      label: t('settings.notifications', 'Notifications'),
    },
    { key: 'advanced', icon: <Gauge size={18} />, label: t('settings.advanced', 'Advanced') },
    { key: 'ai', icon: <Sparkles size={18} />, label: t('settings.aiTab', 'AI Providers') },
  ];

  return (
    <motion.div
      className="mx-auto max-w-5xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Page Header */}
      <motion.div
        className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-(--color-border) bg-(--color-primary)/10"
            animate={{ rotate: [0, 90, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <SettingsIcon className="text-(--color-primary)" size={22} />
          </motion.div>
          <div>
            <h1 className="fluid-text-2xl font-semibold tracking-tight">{t('settings.title')}</h1>
            <p className="text-(--color-muted) text-sm">
              {t('settings.subtitle', 'Configure your HEMS dashboard')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <motion.button
            onClick={handleExportSettings}
            className="focus-ring inline-flex items-center gap-2 rounded-xl border border-(--color-border) bg-(--color-surface-strong) px-3 py-2 text-sm transition-all hover:bg-(--color-primary)/10"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title={t('settings.exportSettings', 'Export settings')}
          >
            <Download size={16} />
            <span className="hidden sm:inline">{t('settings.export', 'Export')}</span>
          </motion.button>
          <motion.button
            onClick={handleImportSettings}
            className="focus-ring inline-flex items-center gap-2 rounded-xl border border-(--color-border) bg-(--color-surface-strong) px-3 py-2 text-sm transition-all hover:bg-(--color-primary)/10"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title={t('settings.importSettings', 'Import settings')}
          >
            <Upload size={16} />
            <span className="hidden sm:inline">{t('settings.import', 'Import')}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Success Banners */}
      <AnimatePresence>
        {importSuccess && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-400 text-sm"
            role="status"
          >
            <Check size={16} className="shrink-0" aria-hidden="true" />
            {t('common.importSuccess')}
          </motion.div>
        )}
        {exportSuccess && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-400 text-sm"
            role="status"
          >
            <Check size={16} className="shrink-0" aria-hidden="true" />
            {t('settings.exportSuccess', 'Settings exported successfully')}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar Navigation */}
        <nav className="w-full shrink-0 lg:w-56">
          <div
            className="scrollbar-hide flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0"
            role="tablist"
            aria-label={t('settings.title')}
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                role="tab"
                aria-selected={activeTab === tab.key}
                aria-controls={`tabpanel-${tab.key}`}
                id={`tab-${tab.key}`}
                className={`flex items-center gap-2.5 whitespace-nowrap rounded-xl px-4 py-2.5 font-medium text-sm transition-all duration-200 active:scale-[0.97] ${
                  activeTab === tab.key
                    ? 'bg-(--color-primary)/15 text-(--color-primary) shadow-[inset_0_0_0_1px_var(--color-primary)/20]'
                    : 'text-(--color-muted) hover:bg-white/5 hover:text-(--color-text)'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Content Area */}
        <div className="min-w-0 flex-1">
          <form onSubmit={handleSave}>
            <AnimatePresence mode="wait">
              {/* === APPEARANCE === */}
              {activeTab === 'appearance' && (
                <motion.div
                  key="appearance"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                  role="tabpanel"
                  id="tabpanel-appearance"
                  aria-labelledby="tab-appearance"
                >
                  <AppearanceTab />
                </motion.div>
              )}

              {/* === SYSTEM CONFIGURATION === */}
              {activeTab === 'system' && (
                <motion.div
                  key="system"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                  role="tabpanel"
                  id="tabpanel-system"
                  aria-labelledby="tab-system"
                >
                  <SystemTab />
                </motion.div>
              )}

              {/* === ENERGY MANAGEMENT === */}
              {activeTab === 'energy' && (
                <motion.div
                  key="energy"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                  role="tabpanel"
                  id="tabpanel-energy"
                  aria-labelledby="tab-energy"
                >
                  <EnergyTab />
                </motion.div>
              )}

              {/* === CONTROLLERS & MPC OPTIMIZER === */}
              {activeTab === 'controllers' && (
                <motion.div
                  key="controllers"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                  role="tabpanel"
                  id="tabpanel-controllers"
                  aria-labelledby="tab-controllers"
                >
                  <ControllersTab />
                </motion.div>
              )}

              {/* === ADAPTER CONFIGURATION === */}
              {activeTab === 'adapters' && (
                <motion.div
                  key="adapters"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  role="tabpanel"
                  id="tabpanel-adapters"
                  aria-labelledby="tab-adapters"
                >
                  <AdapterConfigPanel />
                </motion.div>
              )}

              {/* === SECURITY & PRIVACY === */}
              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                  role="tabpanel"
                  id="tabpanel-security"
                  aria-labelledby="tab-security"
                >
                  <SecurityTab />
                </motion.div>
              )}

              {/* === DATABASE & STORAGE === */}
              {activeTab === 'storage' && (
                <motion.div
                  key="storage"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                  role="tabpanel"
                  id="tabpanel-storage"
                  aria-labelledby="tab-storage"
                >
                  <StorageTab />
                </motion.div>
              )}

              {/* === NOTIFICATIONS === */}
              {activeTab === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                  role="tabpanel"
                  id="tabpanel-notifications"
                  aria-labelledby="tab-notifications"
                >
                  <NotificationsTab />
                </motion.div>
              )}

              {/* === ADVANCED === */}
              {activeTab === 'advanced' && (
                <motion.div
                  key="advanced"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                  role="tabpanel"
                  id="tabpanel-advanced"
                  aria-labelledby="tab-advanced"
                >
                  <SettingsFeatureBar tabId="advanced" />
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <Gauge size={20} className="text-indigo-400" />
                      {t('settings.advanced', 'Advanced')}
                    </h2>
                    <div className="space-y-5">
                      <div className="flex items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                        <div>
                          <p className="font-medium text-sm">
                            {t('settings.debugMode', 'Debug mode')}
                          </p>
                          <p className="text-(--color-muted) text-xs">
                            {t('settings.debugHint', 'Show detailed logs and developer tools')}
                          </p>
                        </div>
                        <ToggleSwitch
                          id="debug"
                          checked={settings.debugMode ?? false}
                          onChange={(v) => updateSettings({ debugMode: v })}
                          label={t('settings.debugMode', 'Debug mode')}
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                        <div>
                          <p className="font-medium text-sm">
                            {t('settings.i18nInspector', 'i18n Inspector')}
                          </p>
                          <p className="text-(--color-muted) text-xs">
                            {t(
                              'settings.i18nInspectorHint',
                              'Show translation keys instead of values',
                            )}
                          </p>
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
                            ? t('settings.i18nInspectorDeactivate', 'Deactivate Inspector')
                            : t('settings.i18nInspectorActivate', 'Activate Inspector')}
                        </button>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                        <div>
                          <p className="font-medium text-sm">
                            {t('settings.experimentalFeatures', 'Experimental features')}
                          </p>
                          <p className="text-(--color-muted) text-xs">
                            {t(
                              'settings.experimentalHint',
                              'Enable beta features that may be unstable',
                            )}
                          </p>
                        </div>
                        <ToggleSwitch
                          id="experimental"
                          checked={settings.experimentalFeatures ?? false}
                          onChange={(v) => updateSettings({ experimentalFeatures: v })}
                          label={t('settings.experimentalFeatures', 'Experimental features')}
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                        <div>
                          <p className="font-medium text-sm">
                            {t('settings.performanceMode', 'Performance mode')}
                          </p>
                          <p className="text-(--color-muted) text-xs">
                            {t(
                              'settings.performanceHint',
                              'Reduce animations and effects for better performance',
                            )}
                          </p>
                        </div>
                        <ToggleSwitch
                          id="performance"
                          checked={settings.performanceMode ?? false}
                          onChange={(v) => updateSettings({ performanceMode: v })}
                          label={t('settings.performanceMode', 'Performance mode')}
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
                      {t('settings.dashboardPrefs', 'Dashboard Preferences')}
                    </h2>
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">
                              {t('settings.dashboardRefreshSec', 'Auto-refresh interval')}
                            </p>
                            <p className="text-(--color-muted) text-xs">
                              {t(
                                'settings.dashboardRefreshHint',
                                'How often the dashboard data refreshes automatically',
                              )}
                            </p>
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
                          onChange={(e) =>
                            updateSettings({ dashboardRefreshSec: Number(e.target.value) })
                          }
                          className="w-full accent-(--color-primary)"
                          aria-label={t('settings.dashboardRefreshSec', 'Auto-refresh interval')}
                          aria-valuetext={`${settings.dashboardRefreshSec ?? 5} ${t('common.seconds', 'seconds')}`}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            {t('settings.sidebarPosition', 'Sidebar position')}
                          </p>
                          <p className="text-(--color-muted) text-xs">
                            {t(
                              'settings.sidebarPositionHint',
                              'Place the navigation sidebar on the left or right side',
                            )}
                          </p>
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
                              {pos === 'left'
                                ? t('settings.sidebarLeft', 'Left')
                                : t('settings.sidebarRight', 'Right')}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            {t('settings.autoBackup', 'Automatic backup')}
                          </p>
                          <p className="text-(--color-muted) text-xs">
                            {t(
                              'settings.autoBackupHint',
                              'Periodically save settings to local storage',
                            )}
                          </p>
                        </div>
                        <ToggleSwitch
                          id="auto-backup"
                          checked={settings.autoBackup ?? false}
                          onChange={(v) => updateSettings({ autoBackup: v })}
                          label={t('settings.autoBackup', 'Automatic backup')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="flex items-center gap-2 font-medium text-sm">
                            <Keyboard size={14} className="text-(--color-muted)" />
                            {t('settings.keyboardShortcuts', 'Keyboard shortcuts')}
                          </p>
                          <p className="text-(--color-muted) text-xs">
                            {t(
                              'settings.keyboardShortcutsHint',
                              'Enable Cmd+K command palette and other keyboard shortcuts',
                            )}
                          </p>
                        </div>
                        <ToggleSwitch
                          id="keyboard-shortcuts"
                          checked={settings.keyboardShortcuts ?? true}
                          onChange={(v) => updateSettings({ keyboardShortcuts: v })}
                          label={t('settings.keyboardShortcuts', 'Keyboard shortcuts')}
                        />
                      </div>

                      {/* Keyboard Shortcuts Reference */}
                      {(settings.keyboardShortcuts ?? true) && (
                        <div className="mt-4 rounded-xl border border-(--color-border) bg-(--color-surface)/40 p-4">
                          <h3 className="mb-3 flex items-center gap-2 font-semibold text-(--color-text) text-sm">
                            <Keyboard size={16} className="text-(--color-primary)" />
                            {t('settings.shortcutsReference', 'Tastaturkürzel-Referenz')}
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <p className="mb-1.5 font-medium text-(--color-muted) text-xs uppercase tracking-wider">
                                {t('help.shortcutNav', 'Navigation')}
                              </p>
                              <div className="space-y-1">
                                {[
                                  {
                                    key: '⌘ K',
                                    label: t('help.shortcutCmdK', 'Befehlspalette öffnen'),
                                  },
                                  {
                                    key: '⌘ /',
                                    label: t('help.shortcutSearch', 'Suche fokussieren'),
                                  },
                                  {
                                    key: 'Esc',
                                    label: t('help.shortcutClose', 'Dialog schließen / zurück'),
                                  },
                                ].map((s) => (
                                  <div
                                    key={s.key}
                                    className="flex items-center justify-between text-xs"
                                  >
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
                                {t('help.shortcutActions', 'Aktionen')}
                              </p>
                              <div className="space-y-1">
                                {[
                                  {
                                    key: '⌘ S',
                                    label: t('help.shortcutSave', 'Einstellungen speichern'),
                                  },
                                  {
                                    key: '⌘ E',
                                    label: t('help.shortcutExport', 'Bericht exportieren'),
                                  },
                                  {
                                    key: '⌘ L',
                                    label: t('help.shortcutLang', 'Sprache umschalten'),
                                  },
                                ].map((s) => (
                                  <div
                                    key={s.key}
                                    className="flex items-center justify-between text-xs"
                                  >
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
                            {t(
                              'help.shortcutNote',
                              'Auf macOS wird ⌘ verwendet, auf Windows/Linux Strg.',
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Reset */}
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <AlertTriangle size={20} className="text-rose-400" />
                      {t('settings.dangerZone', 'Danger Zone')}
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
                          <FlaskConical
                            size={20}
                            className="text-(--color-muted)"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`font-medium text-sm ${
                            isLiveMode ? 'text-red-400' : 'text-(--color-text)'
                          }`}
                        >
                          {t('mode.settingsLabel', 'Adapter mode')}:{' '}
                          {isLiveMode
                            ? t('mode.liveBadge', 'Live hardware')
                            : t('mode.simulationBadge', 'Simulation')}
                        </p>
                        <p className="mt-1 text-(--color-muted) text-xs">
                          {isLiveMode
                            ? t('mode.settingsLive', 'Live hardware — controlling real equipment')
                            : adapterMode === 'unknown'
                              ? t(
                                  'mode.settingsUnknown',
                                  'Unknown — backend health endpoint not reachable',
                                )
                              : t(
                                  'mode.settingsSimulation',
                                  'Simulation (mock data) — safe, no hardware is controlled',
                                )}
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
                            <p className="font-medium text-red-400 text-sm">
                              {t('safety.emergencyStop', 'Notaus – Alle Geräte sofort abschalten')}
                            </p>
                            <p className="mt-1 text-(--color-muted) text-xs">
                              {t(
                                'safety.emergencyStopSettingsHint',
                                'Instantly disconnects all adapters and opens all circuit breakers. §14a EnWG compliant.',
                              )}
                            </p>
                          </div>
                        </div>
                        <EmergencyStop />
                      </div>
                    </div>

                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-rose-400 text-sm">
                            {t('settings.resetAll', 'Reset all settings')}
                          </p>
                          <p className="text-(--color-muted) text-xs">
                            {t(
                              'settings.resetHint',
                              'This will reset all settings to their default values',
                            )}
                          </p>
                        </div>
                        <motion.button
                          type="button"
                          onClick={() =>
                            confirm.openDialog({
                              title: t('settings.confirmResetTitle', 'Reset All Settings'),
                              message: t(
                                'settings.confirmResetMessage',
                                'This will permanently reset all settings to factory defaults.',
                              ),
                              confirmText: t('settings.confirmResetAction', 'Reset Everything'),
                              variant: 'danger',
                              onConfirm: () => {
                                updateSettings(defaultSettings);
                              },
                            })
                          }
                          className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-rose-400 text-sm transition-colors hover:bg-rose-500/20 sm:w-auto"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <RotateCcw size={16} />
                          {t('settings.reset', 'Reset')}
                        </motion.button>
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}

              {activeTab === 'ai' && (
                <motion.div
                  key="ai"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  role="tabpanel"
                  id="tabpanel-ai"
                  aria-labelledby="tab-ai"
                >
                  <SettingsFeatureBar tabId="ai" />
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center py-12">
                        <RefreshCw className="h-6 w-6 animate-spin text-(--color-primary)" />
                      </div>
                    }
                  >
                    <AISettingsPage />
                  </Suspense>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Save Button - always visible */}
            <motion.div
              className="flex justify-end pt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <motion.button
                type="submit"
                className="btn-primary flex items-center gap-2 px-8 py-3"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                {saved ? <Check size={20} className="animate-bounce-slow" /> : <Save size={20} />}
                {saved ? t('common.saved') : t('common.save')}
              </motion.button>
            </motion.div>
          </form>
        </div>
      </div>

      <ConfirmDialog {...confirm.dialogProps} />
    </motion.div>
  );
}
