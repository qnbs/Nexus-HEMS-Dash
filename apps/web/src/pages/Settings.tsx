import {
  Bell,
  Cable,
  Check,
  Cpu,
  Database,
  Download,
  FileKey,
  Gauge,
  Palette,
  RefreshCw,
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
import { CertificateManagement } from '../components/CertificateManagement';
import { ConfirmDialog, useConfirmDialog } from '../components/ConfirmDialog';
import { AdvancedTab } from '../components/settings/AdvancedTab';
import { AppearanceTab } from '../components/settings/AppearanceTab';
import { ControllersTab } from '../components/settings/ControllersTab';
import { EnergyTab } from '../components/settings/EnergyTab';
import { NotificationsTab } from '../components/settings/NotificationsTab';
import { SecurityTab } from '../components/settings/SecurityTab';
import { SettingsFeatureBar } from '../components/settings/SettingsFeatureBar';
import { StorageTab } from '../components/settings/StorageTab';
import { SystemTab } from '../components/settings/SystemTab';
import { useAppStoreShallow } from '../store';

const AISettingsPage = lazy(() => import('./AISettingsPage'));

type SettingsTab =
  | 'appearance'
  | 'system'
  | 'energy'
  | 'controllers'
  | 'adapters'
  | 'security'
  | 'certificates'
  | 'storage'
  | 'notifications'
  | 'advanced'
  | 'ai';

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
    'certificates',
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

  const { settings, updateSettings } = useAppStoreShallow((s) => ({
    settings: s.settings,
    updateSettings: s.updateSettings,
  }));

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
    {
      key: 'certificates',
      icon: <FileKey size={18} />,
      label: t('settings.certificatesTab', 'EEBUS Certs'),
    },
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

              {/* === EEBUS CERTIFICATES & PAIRING === */}
              {activeTab === 'certificates' && (
                <motion.div
                  key="certificates"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                  role="tabpanel"
                  id="tabpanel-certificates"
                  aria-labelledby="tab-certificates"
                >
                  <CertificateManagement />
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
                  <AdvancedTab />
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
