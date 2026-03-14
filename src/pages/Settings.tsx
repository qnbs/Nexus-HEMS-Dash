import { useState, useEffect, type FormEvent, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings as SettingsIcon,
  Save,
  Server,
  Shield,
  Zap,
  Database,
  Check,
  Palette,
  Monitor,
  Bell,
  Gauge,
  Globe,
  Download,
  Upload,
  Eye,
  EyeOff,
  Info,
  Wifi,
  RefreshCw,
  Trash2,
  HardDrive,
  Lock,
  RotateCcw,
  AlertTriangle,
  Sparkles,
  Smartphone,
  CheckCircle2,
  MapPin,
  Type,
  Clock,
  Keyboard,
  Moon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { themeDefinitions, themeOrder, type ThemeName } from '../design-tokens';
import { useAppStore, defaultSettings } from '../store';
import { SYSTEM_PRESETS, type PVConfig } from '../types';
import { resolveTheme, type ThemePreference } from '../lib/theme';
import { ConfirmDialog, useConfirmDialog } from '../components/ConfirmDialog';
import { usePWAInstall } from '../lib/pwa-install';

const AISettingsPage = lazy(() => import('./AISettingsPage'));

type SettingsTab =
  | 'appearance'
  | 'system'
  | 'energy'
  | 'security'
  | 'storage'
  | 'notifications'
  | 'advanced'
  | 'ai';

function ThemePreviewCard({
  def,
  isActive,
  onClick,
}: {
  def: (typeof themeDefinitions)[ThemeName];
  isActive: boolean;
  onClick: () => void;
}) {
  const [c1, c2, c3] = def.previewColors;
  return (
    <motion.button
      onClick={onClick}
      className={`focus-ring relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all duration-300 ${
        isActive
          ? 'border-(--color-primary) bg-(--color-primary)/10 shadow-[0_0_20px_var(--color-primary)/15]'
          : 'border-(--color-border) bg-(--color-surface) hover:border-(--color-primary)/40'
      }`}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      aria-label={def.label}
      aria-pressed={isActive}
    >
      <div className="flex gap-1.5">
        <span className="h-6 w-6 rounded-full border border-white/20" style={{ background: c1 }} />
        <span className="h-6 w-6 rounded-full border border-white/20" style={{ background: c2 }} />
        <span className="h-6 w-6 rounded-full border border-white/20" style={{ background: c3 }} />
      </div>
      <span className="text-xs font-medium">{def.label}</span>
      {isActive && (
        <motion.div
          layoutId="theme-check"
          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-(--color-primary) text-white"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <Check className="h-3 w-3" />
        </motion.div>
      )}
    </motion.button>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  id: string;
}) {
  return (
    <label htmlFor={id} className="relative inline-flex cursor-pointer items-center">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span className="sr-only">{label}</span>
      <div className="h-6 w-11 rounded-full border border-(--color-border) bg-(--color-surface) transition-colors duration-300 peer-checked:bg-(--color-primary) peer-focus:ring-2 peer-focus:ring-(--color-primary)/30 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:duration-300 peer-checked:after:translate-x-5" />
    </label>
  );
}

function PWASettingsSection() {
  const { t } = useTranslation();
  const { canInstall, isIOSDevice, isInstalled, install } = usePWAInstall();
  const confirm = useConfirmDialog();
  const [swStatus, setSWStatus] = useState<'active' | 'waiting' | 'none'>('none');
  const [cacheSize, setCacheSize] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'found' | 'none'>('idle');
  const [persistedStorage, setPersistedStorage] = useState<boolean | null>(null);

  useEffect(() => {
    // Check service worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg?.active) setSWStatus(reg.waiting ? 'waiting' : 'active');
      });
    }
    // Estimate cache size
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then((estimate) => {
        if (estimate.usage) {
          const mb = (estimate.usage / (1024 * 1024)).toFixed(1);
          setCacheSize(`${mb} MB`);
        }
      });
    }
    // Check persistent storage
    if (navigator.storage?.persisted) {
      navigator.storage.persisted().then(setPersistedStorage);
    }
  }, []);

  const handleInstall = async () => {
    setInstalling(true);
    await install();
    setInstalling(false);
  };

  const handleClearCache = () => {
    confirm.openDialog({
      title: t('settings_pwa.clearCacheConfirmTitle', 'Clear App Cache'),
      message: t(
        'settings_pwa.clearCacheConfirmMessage',
        'This will clear all cached data and reload the app. Your settings will be preserved.',
      ),
      confirmText: t('settings_pwa.clearCacheConfirmAction', 'Clear & Reload'),
      variant: 'warning',
      onConfirm: async () => {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (const r of regs) await r.unregister();
          const names = await caches.keys();
          await Promise.all(names.map((n) => caches.delete(n)));
          window.location.reload();
        }
      },
    });
  };

  const handleForceUpdate = async () => {
    setUpdateStatus('checking');
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update();
          // Check if a new SW is waiting after the update
          await new Promise((r) => setTimeout(r, 1500));
          const regAfter = await navigator.serviceWorker.getRegistration();
          if (regAfter?.waiting) {
            setUpdateStatus('found');
            setSWStatus('waiting');
            setTimeout(() => window.location.reload(), 1500);
          } else {
            setUpdateStatus('none');
            setTimeout(() => setUpdateStatus('idle'), 3000);
          }
        } else {
          setUpdateStatus('none');
          setTimeout(() => setUpdateStatus('idle'), 3000);
        }
      }
    } catch {
      setUpdateStatus('none');
      setTimeout(() => setUpdateStatus('idle'), 3000);
    }
  };

  const handleRequestPersistence = async () => {
    if (navigator.storage?.persist) {
      const granted = await navigator.storage.persist();
      setPersistedStorage(granted);
    }
  };

  const sectionClass =
    'rounded-2xl border border-(--color-border) bg-(--color-surface)/50 p-6 backdrop-blur-sm';
  const sectionHeaderClass =
    'mb-5 flex items-center gap-3 text-lg fluid-text-lg font-semibold text-(--color-text)';
  const rowClass =
    'flex items-center justify-between p-4 rounded-xl border border-(--color-border) bg-(--color-surface)';

  return (
    <>
      <section className={sectionClass}>
        <h2 className={sectionHeaderClass}>
          <Smartphone size={20} className="text-sky-400" />
          {t('settings_pwa.title', 'Progressive Web App')}
        </h2>
        <div className="space-y-4">
          {/* Install status */}
          <div className={rowClass}>
            <div>
              <p className="text-sm font-medium">
                {t('settings_pwa.installStatus', 'Installation')}
              </p>
              <p className="text-xs text-(--color-muted)">
                {isInstalled
                  ? t('settings_pwa.installed', 'App is installed on this device')
                  : isIOSDevice
                    ? t(
                        'settings_pwa.iosHint',
                        'Use Safari Share → "Add to Home Screen" to install',
                      )
                    : canInstall
                      ? t('settings_pwa.canInstall', 'App can be installed as native app')
                      : t(
                          'settings_pwa.notAvailable',
                          'Install not available (already installed or unsupported browser)',
                        )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isInstalled ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
                  <CheckCircle2 size={14} />
                  {t('settings_pwa.installedBadge', 'Installed')}
                </span>
              ) : canInstall ? (
                <motion.button
                  onClick={handleInstall}
                  disabled={installing}
                  className="focus-ring flex items-center gap-2 rounded-xl bg-(--color-primary) px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download size={16} />
                  {installing
                    ? t('settings_pwa.installing', 'Installing…')
                    : t('pwa.install', 'Install')}
                </motion.button>
              ) : null}
            </div>
          </div>

          {/* Service Worker status */}
          <div className={rowClass}>
            <div>
              <p className="text-sm font-medium">
                {t('settings_pwa.serviceWorker', 'Service Worker')}
              </p>
              <p className="text-xs text-(--color-muted)">
                {swStatus === 'active'
                  ? t('settings_pwa.swActive', 'Active — offline mode enabled')
                  : swStatus === 'waiting'
                    ? t('settings_pwa.swWaiting', 'Update waiting — restart to apply')
                    : t('settings_pwa.swNone', 'Not registered')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                  swStatus === 'active'
                    ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : swStatus === 'waiting'
                      ? 'border border-amber-500/30 bg-amber-500/10 text-amber-400'
                      : 'border border-(--color-border) bg-(--color-surface-strong) text-(--color-muted)'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    swStatus === 'active'
                      ? 'bg-emerald-400'
                      : swStatus === 'waiting'
                        ? 'bg-amber-400'
                        : 'bg-(--color-muted)'
                  }`}
                  aria-hidden="true"
                />
                {swStatus === 'active'
                  ? t('common.active', 'Active')
                  : swStatus === 'waiting'
                    ? t('common.waiting', 'Waiting')
                    : t('common.inactive', 'Inactive')}
              </span>
            </div>
          </div>

          {/* Force update check */}
          <div className={rowClass}>
            <div>
              <p className="text-sm font-medium">
                {t('settings_pwa.forceUpdate', 'Check for Update')}
              </p>
              <p className="text-xs text-(--color-muted)">
                {updateStatus === 'checking'
                  ? t('settings_pwa.forceUpdateChecking', 'Checking…')
                  : updateStatus === 'found'
                    ? t('settings_pwa.forceUpdateFound', 'Update found — restarting…')
                    : updateStatus === 'none'
                      ? t('settings_pwa.forceUpdateNone', 'Already up to date')
                      : t('settings_pwa.appVersion', 'App Version') + ' 4.1.0'}
              </p>
            </div>
            <motion.button
              onClick={handleForceUpdate}
              disabled={updateStatus === 'checking' || updateStatus === 'found'}
              className="focus-ring flex items-center gap-2 rounded-xl border border-(--color-border) bg-(--color-surface-strong) px-3 py-2 text-xs text-(--color-muted) transition-colors hover:border-(--color-primary)/30 hover:text-(--color-primary) disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw size={14} className={updateStatus === 'checking' ? 'animate-spin' : ''} />
              {updateStatus === 'checking'
                ? t('settings_pwa.forceUpdateChecking', 'Checking…')
                : t('settings_pwa.forceUpdate', 'Check for Update')}
            </motion.button>
          </div>

          {/* Cache info */}
          <div className={rowClass}>
            <div>
              <p className="text-sm font-medium">{t('settings_pwa.cache', 'Cache Storage')}</p>
              <p className="text-xs text-(--color-muted)">
                {cacheSize
                  ? t('settings_pwa.cacheSize', 'Using {{size}} of device storage', {
                      size: cacheSize,
                    })
                  : t('settings_pwa.cacheUnknown', 'Storage usage unavailable')}
              </p>
            </div>
            <motion.button
              onClick={handleClearCache}
              className="focus-ring flex items-center gap-2 rounded-xl border border-(--color-border) bg-(--color-surface-strong) px-3 py-2 text-xs text-(--color-muted) transition-colors hover:border-rose-500/30 hover:text-rose-400"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Trash2 size={14} />
              {t('settings_pwa.clearCache', 'Clear Cache')}
            </motion.button>
          </div>

          {/* Persistent storage */}
          <div className={rowClass}>
            <div>
              <p className="text-sm font-medium">
                {t('settings_pwa.persistentStorage', 'Persistent Storage')}
              </p>
              <p className="text-xs text-(--color-muted)">
                {persistedStorage === true
                  ? t(
                      'settings_pwa.persistentStorageGranted',
                      'Data protected from browser cleanup',
                    )
                  : t(
                      'settings_pwa.persistentStorageDenied',
                      'Browser may clear data when storage is low',
                    )}
              </p>
            </div>
            {persistedStorage === true ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
                <Lock size={12} />
                {t('common.active', 'Active')}
              </span>
            ) : (
              <motion.button
                onClick={handleRequestPersistence}
                className="focus-ring flex items-center gap-2 rounded-xl border border-(--color-border) bg-(--color-surface-strong) px-3 py-2 text-xs text-(--color-muted) transition-colors hover:border-(--color-primary)/30 hover:text-(--color-primary)"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <HardDrive size={14} />
                {t('settings_pwa.persistentStorageRequest', 'Request persistent storage')}
              </motion.button>
            )}
          </div>
        </div>
      </section>
      <ConfirmDialog {...confirm.dialogProps} />
    </>
  );
}

export function Settings() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [saved, setSaved] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const validTabs: SettingsTab[] = [
    'appearance',
    'system',
    'energy',
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

  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const confirm = useConfirmDialog();

  // Theme state
  const theme = useAppStore((s) => s.theme);
  const themePreference = useAppStore((s) => s.themePreference);
  const setThemePreference = useAppStore((s) => s.setThemePreference);
  const setTheme = useAppStore((s) => s.setTheme);
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const handleThemeChange = (preference: ThemePreference) => {
    setThemePreference(preference);
    const resolvedTheme = resolveTheme(preference);
    setTheme(resolvedTheme);
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleTokenVisibility = (key: string) => {
    setShowTokens((prev) => ({ ...prev, [key]: !prev[key] }));
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

  const isSystem = themePreference === 'system';

  const inputClass =
    'w-full bg-(--color-surface) border border-(--color-border) rounded-xl px-4 py-2.5 text-(--color-text) focus:outline-none focus:border-(--color-primary)/70 focus:ring-2 focus:ring-(--color-primary)/20 transition-all duration-300 placeholder:text-(--color-muted)';
  const sectionClass = 'glass-panel-strong p-6 rounded-2xl space-y-6';
  const sectionHeaderClass =
    'text-lg fluid-text-lg font-medium flex items-center gap-2 border-b border-(--color-border) pb-4';

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
            <h1 className="fluid-text-2xl text-2xl font-semibold tracking-tight">
              {t('settings.title')}
            </h1>
            <p className="text-sm text-(--color-muted)">
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
            className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400"
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
            className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400"
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
                onClick={() => handleTabChange(tab.key)}
                role="tab"
                aria-selected={activeTab === tab.key}
                aria-controls={`tabpanel-${tab.key}`}
                id={`tab-${tab.key}`}
                className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200 active:scale-[0.97] ${
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
                  {/* Theme Selection */}
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <Palette size={20} className="text-(--color-primary)" />
                      {t('settings.themeTitle', 'Color Theme')}
                    </h2>

                    {/* System Theme Toggle */}
                    <div className="flex items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                      <div className="flex items-center gap-3">
                        <Monitor size={20} className="text-(--color-muted)" />
                        <div>
                          <p className="text-sm font-medium">
                            {t('settings.systemTheme', 'Follow system preference')}
                          </p>
                          <p className="text-xs text-(--color-muted)">
                            {t(
                              'settings.systemThemeHint',
                              'Automatically switch between light and dark themes',
                            )}
                          </p>
                        </div>
                      </div>
                      <ToggleSwitch
                        id="system-theme"
                        checked={isSystem}
                        onChange={(v) => handleThemeChange(v ? 'system' : theme)}
                        label={t('settings.systemTheme', 'Follow system preference')}
                      />
                    </div>

                    {/* Theme Grid */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {themeOrder.map((name) => (
                        <ThemePreviewCard
                          key={name}
                          def={themeDefinitions[name]}
                          isActive={!isSystem && theme === name}
                          onClick={() => handleThemeChange(name)}
                        />
                      ))}
                    </div>

                    {/* Active Theme Info */}
                    <div className="flex items-center gap-2 rounded-lg border border-(--color-primary)/20 bg-(--color-primary)/5 px-4 py-3 text-sm">
                      <Info size={16} className="shrink-0 text-(--color-primary)" />
                      <span>
                        {t('settings.activeTheme', 'Active')}:{' '}
                        <strong>{themeDefinitions[theme].label}</strong>
                        {isSystem && (
                          <span className="text-(--color-muted)"> ({t('common.systemTheme')})</span>
                        )}
                      </span>
                    </div>
                  </section>

                  {/* Display Settings */}
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <Eye size={20} className="text-blue-400" />
                      {t('settings.displayTitle', 'Display')}
                    </h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {t('settings.animations', 'Animations')}
                          </p>
                          <p className="text-xs text-(--color-muted)">
                            {t(
                              'settings.animationsHint',
                              'Enable smooth transitions and motion effects',
                            )}
                          </p>
                        </div>
                        <ToggleSwitch
                          id="animations"
                          checked={settings.animations ?? true}
                          onChange={(v) => updateSettings({ animations: v })}
                          label={t('settings.animations', 'Animations')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {t('settings.compactMode', 'Compact mode')}
                          </p>
                          <p className="text-xs text-(--color-muted)">
                            {t(
                              'settings.compactModeHint',
                              'Reduce spacing for more content on screen',
                            )}
                          </p>
                        </div>
                        <ToggleSwitch
                          id="compact"
                          checked={settings.compactMode ?? false}
                          onChange={(v) => updateSettings({ compactMode: v })}
                          label={t('settings.compactMode', 'Compact mode')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {t('settings.glowEffects', 'Glow effects')}
                          </p>
                          <p className="text-xs text-(--color-muted)">
                            {t('settings.glowEffectsHint', 'Neon glow and glassmorphism effects')}
                          </p>
                        </div>
                        <ToggleSwitch
                          id="glow"
                          checked={settings.glowEffects ?? true}
                          onChange={(v) => updateSettings({ glowEffects: v })}
                          label={t('settings.glowEffects', 'Glow effects')}
                        />
                      </div>
                    </div>
                  </section>

                  {/* Language */}
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <Globe size={20} className="text-cyan-400" />
                      {t('settings.languageTitle', 'Language & Region')}
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="settings-language" className="text-sm font-medium">
                          {t('common.language')}
                        </label>
                        <select
                          id="settings-language"
                          className={inputClass}
                          value={locale}
                          onChange={(e) => {
                            const l = e.target.value as 'de' | 'en';
                            setLocale(l);
                            void i18n.changeLanguage(l);
                          }}
                        >
                          <option value="de">Deutsch</option>
                          <option value="en">English</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="settings-units" className="text-sm font-medium">
                          {t('settings.units', 'Units')}
                        </label>
                        <select
                          id="settings-units"
                          className={inputClass}
                          value={settings.units ?? 'metric'}
                          onChange={(e) =>
                            updateSettings({ units: e.target.value as 'metric' | 'imperial' })
                          }
                        >
                          <option value="metric">
                            {t('settings.metric', 'Metric (kW, kWh, °C)')}
                          </option>
                          <option value="imperial">
                            {t('settings.imperial', 'Imperial (BTU, °F)')}
                          </option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="settings-dateformat" className="text-sm font-medium">
                          {t('settings.dateFormat', 'Date format')}
                        </label>
                        <select
                          id="settings-dateformat"
                          className={inputClass}
                          value={settings.dateFormat ?? 'dd.mm.yyyy'}
                          onChange={(e) =>
                            updateSettings({
                              dateFormat: e.target.value as
                                | 'dd.mm.yyyy'
                                | 'mm/dd/yyyy'
                                | 'yyyy-mm-dd',
                            })
                          }
                        >
                          <option value="dd.mm.yyyy">DD.MM.YYYY</option>
                          <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                          <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="settings-currency" className="text-sm font-medium">
                          {t('settings.currency', 'Currency')}
                        </label>
                        <select
                          id="settings-currency"
                          className={inputClass}
                          value={settings.currency ?? 'eur'}
                          onChange={(e) =>
                            updateSettings({ currency: e.target.value as 'eur' | 'chf' | 'gbp' })
                          }
                        >
                          <option value="eur">€ Euro</option>
                          <option value="chf">CHF Franken</option>
                          <option value="gbp">£ Pound</option>
                        </select>
                      </div>
                    </div>
                  </section>

                  {/* Accessibility */}
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <Type size={20} className="text-violet-400" />
                      {t('settings.accessibilityTitle', 'Accessibility')}
                    </h2>
                    <div className="space-y-5">
                      {/* Font Scale */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {t('settings.fontScale', 'Font size')}
                            </p>
                            <p className="text-xs text-(--color-muted)">
                              {t('settings.fontScaleHint', 'Adjust the global font size scaling')}
                            </p>
                          </div>
                          <span className="font-mono text-sm text-(--color-primary) tabular-nums">
                            {Math.round((settings.fontScale ?? 1.0) * 100)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-(--color-muted)">A</span>
                          <input
                            type="range"
                            min={0.85}
                            max={1.25}
                            step={0.05}
                            value={settings.fontScale ?? 1.0}
                            onChange={(e) => updateSettings({ fontScale: Number(e.target.value) })}
                            className="flex-1 accent-(--color-primary)"
                            aria-label={t('settings.fontScale', 'Font size')}
                            aria-valuetext={`${Math.round((settings.fontScale ?? 1.0) * 100)}%`}
                          />
                          <span className="text-base font-medium text-(--color-muted)">A</span>
                        </div>
                      </div>
                      {/* Reduced Motion */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {t('settings.reducedMotion', 'Reduced motion')}
                          </p>
                          <p className="text-xs text-(--color-muted)">
                            {t(
                              'settings.reducedMotionHint',
                              'Minimize animations for motion-sensitive users',
                            )}
                          </p>
                        </div>
                        <ToggleSwitch
                          id="reduced-motion"
                          checked={settings.reducedMotion ?? false}
                          onChange={(v) => updateSettings({ reducedMotion: v })}
                          label={t('settings.reducedMotion', 'Reduced motion')}
                        />
                      </div>
                      {/* High Contrast */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {t('settings.highContrast', 'High contrast')}
                          </p>
                          <p className="text-xs text-(--color-muted)">
                            {t(
                              'settings.highContrastHint',
                              'Increase contrast ratios for better readability',
                            )}
                          </p>
                        </div>
                        <ToggleSwitch
                          id="high-contrast"
                          checked={settings.highContrast ?? false}
                          onChange={(v) => updateSettings({ highContrast: v })}
                          label={t('settings.highContrast', 'High contrast')}
                        />
                      </div>
                    </div>
                  </section>
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
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <Server size={20} className="text-blue-400" />
                      {t('settings.system')}
                    </h2>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      {/* Gateway Type Selector */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium">{t('settings.gatewayType')}</label>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          {[
                            {
                              value: 'cerbo-gx' as const,
                              label: 'Cerbo GX',
                              desc: t('settings.gatewayTypeCerboHint'),
                            },
                            {
                              value: 'cerbo-gx-mk2' as const,
                              label: 'Cerbo GX MK2',
                              desc: t('settings.gatewayTypeMk2Hint'),
                            },
                            {
                              value: 'raspberry-pi' as const,
                              label: 'Raspberry Pi',
                              desc: t('settings.gatewayTypeRpiHint'),
                            },
                          ].map((gw) => (
                            <button
                              key={gw.value}
                              type="button"
                              onClick={() => updateSettings({ gatewayType: gw.value })}
                              className={`rounded-xl border-2 p-3 text-left transition-all ${
                                settings.gatewayType === gw.value
                                  ? 'border-(--color-primary) bg-(--color-primary)/10'
                                  : 'border-(--color-border) bg-(--color-surface) hover:border-(--color-primary)/40'
                              }`}
                              aria-pressed={settings.gatewayType === gw.value}
                            >
                              <span className="text-sm font-medium">{gw.label}</span>
                              <p className="mt-1 text-xs text-(--color-muted)">{gw.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.victronIp')}</label>
                        <input
                          type="text"
                          value={settings.victronIp}
                          onChange={(e) => updateSettings({ victronIp: e.target.value })}
                          className={inputClass}
                          placeholder="192.168.1.100"
                        />
                        <p className="text-xs text-(--color-muted)">
                          {t('settings.victronIpHint', 'IP address of your Victron Cerbo GX')}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.knxIp')}</label>
                        <input
                          type="text"
                          value={settings.knxIp}
                          onChange={(e) => updateSettings({ knxIp: e.target.value })}
                          className={inputClass}
                          placeholder="192.168.1.101"
                        />
                        <p className="text-xs text-(--color-muted)">
                          {t('settings.knxIpHint', 'IP address of your KNX IP router')}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.wsPort')}</label>
                        <input
                          type="number"
                          value={settings.wsPort}
                          onChange={(e) => updateSettings({ wsPort: Number(e.target.value) })}
                          className={inputClass}
                          min={1}
                          max={65535}
                        />
                        <p className="text-xs text-(--color-muted)">
                          {t('settings.wsPortHint', 'Node-RED WebSocket port (default: 1880)')}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.refreshRate')}</label>
                        <input
                          type="number"
                          value={settings.refreshRateMs}
                          onChange={(e) =>
                            updateSettings({ refreshRateMs: Number(e.target.value) })
                          }
                          className={inputClass}
                          min={500}
                          max={30000}
                          step={100}
                        />
                        <p className="text-xs text-(--color-muted)">
                          {t('settings.refreshRateHint', 'Data polling interval in milliseconds')}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Connection Status */}
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <Wifi size={20} className="text-emerald-400" />
                      {t('settings.connectionStatus', 'Connection Status')}
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      {[
                        { name: t('devices.cerboGx'), status: true },
                        { name: t('devices.knxRouter'), status: false },
                        { name: 'Node-RED', status: true },
                      ].map((device) => (
                        <div
                          key={device.name}
                          className="flex items-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-3"
                        >
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${device.status ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-rose-400'}`}
                          />
                          <div>
                            <p className="text-sm font-medium">{device.name}</p>
                            <p className="text-xs text-(--color-muted)">
                              {device.status ? t('common.connected') : t('common.disconnected')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* MQTT Configuration */}
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <RefreshCw size={20} className="text-orange-400" />
                      {t('settings.mqttConfig', 'MQTT / Home Assistant')}
                    </h2>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('mqtt.brokerUrl')}</label>
                        <input
                          type="text"
                          className={inputClass}
                          placeholder="mqtt://192.168.1.50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('mqtt.port')}</label>
                        <input type="number" defaultValue={1883} className={inputClass} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('mqtt.username')}</label>
                        <input type="text" className={inputClass} placeholder="mqtt_user" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('mqtt.password')}</label>
                        <input type="password" className={inputClass} placeholder="••••••••" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <p className="text-sm font-medium">{t('mqtt.autoDiscovery')}</p>
                        <p className="text-xs text-(--color-muted)">
                          {t(
                            'settings.mqttAutoHint',
                            'Automatically discover Home Assistant devices',
                          )}
                        </p>
                      </div>
                      <ToggleSwitch
                        id="mqtt-auto"
                        checked={settings.mqttAutoDiscovery ?? true}
                        onChange={(v) => updateSettings({ mqttAutoDiscovery: v })}
                        label={t('mqtt.autoDiscovery')}
                      />
                    </div>
                  </section>
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
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <Zap size={20} className="text-yellow-400" />
                      {t('settings.energy')}
                    </h2>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="settings-tariff" className="text-sm font-medium">
                          {t('settings.tariffProvider')}
                        </label>
                        <select
                          id="settings-tariff"
                          className={inputClass}
                          value={settings.tariffProvider}
                          onChange={(e) =>
                            updateSettings({
                              tariffProvider: e.target.value as 'tibber' | 'awattar' | 'none',
                            })
                          }
                        >
                          <option value="tibber">{t('settings.tibber')}</option>
                          <option value="awattar">{t('settings.awattar')}</option>
                          <option value="none">{t('settings.none')}</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.apiTokenLabel')}</label>
                        <div className="relative">
                          <input
                            type={showTokens['tariff'] ? 'text' : 'password'}
                            className={inputClass + ' pr-10'}
                            placeholder="••••••••••••••••"
                            aria-label={t('settings.apiTokenLabel')}
                          />
                          <button
                            type="button"
                            onClick={() => toggleTokenVisibility('tariff')}
                            className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-(--color-muted) hover:text-(--color-text)"
                            aria-label={
                              showTokens['tariff']
                                ? t('settings.hideToken')
                                : t('settings.showToken')
                            }
                          >
                            {showTokens['tariff'] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {t('settings.chargeThreshold')}
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0.05}
                            max={0.5}
                            step={0.01}
                            value={settings.chargeThreshold}
                            onChange={(e) =>
                              updateSettings({ chargeThreshold: Number(e.target.value) })
                            }
                            className="flex-1 accent-(--color-primary)"
                            aria-valuetext={`${settings.chargeThreshold.toFixed(2)} €/kWh`}
                          />
                          <span className="w-16 text-right font-mono text-sm">
                            {settings.chargeThreshold.toFixed(2)} €
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.maxGrid')}</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={1.0}
                            max={11.0}
                            step={0.1}
                            value={settings.maxGridImportKw}
                            onChange={(e) =>
                              updateSettings({ maxGridImportKw: Number(e.target.value) })
                            }
                            className="flex-1 accent-(--color-primary)"
                            aria-valuetext={`${settings.maxGridImportKw.toFixed(1)} kW`}
                          />
                          <span className="w-16 text-right font-mono text-sm">
                            {settings.maxGridImportKw.toFixed(1)} kW
                          </span>
                        </div>
                        <p className="text-xs text-(--color-muted)">
                          {t(
                            'settings.maxGridHint',
                            '§14a EnWG limit: 4.2 kW for controllable consumers',
                          )}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* System Preset */}
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <Server size={20} className="text-cyan-400" />
                      {t('settings.systemPreset')}
                    </h2>
                    <p className="mb-4 text-xs text-(--color-muted)">
                      {t('settings.systemPresetHint')}
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {Object.values(SYSTEM_PRESETS).map((preset) => (
                        <button
                          key={preset.presetId}
                          type="button"
                          onClick={() => updateSettings({ systemConfig: { ...preset } })}
                          className={`rounded-xl border-2 p-3 text-left transition-all ${
                            settings.systemConfig.presetId === preset.presetId
                              ? 'border-(--color-primary) bg-(--color-primary)/10'
                              : 'border-(--color-border) bg-(--color-surface) hover:border-(--color-primary)/40'
                          }`}
                          aria-pressed={settings.systemConfig.presetId === preset.presetId}
                        >
                          <span className="text-sm font-medium">{preset.presetName}</span>
                          {preset.presetId !== 'custom' && (
                            <p className="mt-1 text-xs text-(--color-muted)">
                              {preset.inverter.count}× {preset.inverter.ratedPowerW / 1000} kW ·{' '}
                              {preset.pv.peakPowerKWp} kWp · {preset.battery.capacityKWh} kWh
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Inverter Configuration */}
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <Zap size={20} className="text-amber-400" />
                      {t('settings.inverterConfig')}
                    </h2>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.inverterModel')}</label>
                        <input
                          type="text"
                          value={settings.systemConfig.inverter.model}
                          onChange={(e) =>
                            updateSettings({
                              systemConfig: {
                                ...settings.systemConfig,
                                presetId: 'custom',
                                presetName: 'Custom',
                                inverter: {
                                  ...settings.systemConfig.inverter,
                                  model: e.target.value,
                                },
                              },
                            })
                          }
                          className={inputClass}
                          placeholder="Victron MultiPlus-II 48/5000/70-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.inverterCount')}</label>
                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={settings.systemConfig.inverter.count}
                          onChange={(e) =>
                            updateSettings({
                              systemConfig: {
                                ...settings.systemConfig,
                                presetId: 'custom',
                                presetName: 'Custom',
                                inverter: {
                                  ...settings.systemConfig.inverter,
                                  count: Number(e.target.value),
                                },
                              },
                            })
                          }
                          className={inputClass}
                        />
                        <p className="text-xs text-(--color-muted)">
                          {t('settings.inverterCountHint')}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.inverterPower')}</label>
                        <input
                          type="number"
                          step={100}
                          min={500}
                          max={15000}
                          value={settings.systemConfig.inverter.ratedPowerW}
                          onChange={(e) =>
                            updateSettings({
                              systemConfig: {
                                ...settings.systemConfig,
                                presetId: 'custom',
                                presetName: 'Custom',
                                inverter: {
                                  ...settings.systemConfig.inverter,
                                  ratedPowerW: Number(e.target.value),
                                },
                              },
                            })
                          }
                          className={inputClass}
                        />
                        <p className="text-xs text-(--color-muted)">
                          {t('settings.totalPower')}:{' '}
                          {(
                            (settings.systemConfig.inverter.count *
                              settings.systemConfig.inverter.ratedPowerW) /
                            1000
                          ).toFixed(1)}{' '}
                          kW
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="settings-inv-mode" className="text-sm font-medium">
                          {t('settings.inverterMode')}
                        </label>
                        <select
                          id="settings-inv-mode"
                          className={inputClass}
                          value={settings.systemConfig.inverter.mode}
                          onChange={(e) =>
                            updateSettings({
                              systemConfig: {
                                ...settings.systemConfig,
                                presetId: 'custom',
                                presetName: 'Custom',
                                inverter: {
                                  ...settings.systemConfig.inverter,
                                  mode: e.target.value as 'single' | 'parallel' | 'three-phase',
                                },
                              },
                            })
                          }
                        >
                          <option value="single">{t('settings.modeSingle')}</option>
                          <option value="parallel">{t('settings.modeParallel')}</option>
                          <option value="three-phase">{t('settings.modeThreePhase')}</option>
                        </select>
                      </div>
                    </div>
                  </section>

                  {/* PV System */}
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <Zap size={20} className="text-yellow-400" />
                      {t('settings.pvSystem', 'PV System')}
                    </h2>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {t('settings.pvPeakPower', 'Peak power (kWp)')}
                        </label>
                        <input
                          type="number"
                          step={0.1}
                          value={settings.systemConfig.pv.peakPowerKWp}
                          onChange={(e) =>
                            updateSettings({
                              systemConfig: {
                                ...settings.systemConfig,
                                presetId: 'custom',
                                presetName: 'Custom',
                                pv: {
                                  ...settings.systemConfig.pv,
                                  peakPowerKWp: Number(e.target.value),
                                },
                              },
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="settings-orientation" className="text-sm font-medium">
                          {t('settings.pvOrientation', 'Orientation')}
                        </label>
                        <select
                          id="settings-orientation"
                          className={inputClass}
                          value={settings.systemConfig.pv.orientation}
                          onChange={(e) =>
                            updateSettings({
                              systemConfig: {
                                ...settings.systemConfig,
                                presetId: 'custom',
                                presetName: 'Custom',
                                pv: {
                                  ...settings.systemConfig.pv,
                                  orientation: e.target.value as PVConfig['orientation'],
                                },
                              },
                            })
                          }
                        >
                          <option value="south">{t('settings.south', 'South')}</option>
                          <option value="east-west">{t('settings.eastWest', 'East/West')}</option>
                          <option value="east">{t('settings.east', 'East')}</option>
                          <option value="west">{t('settings.west', 'West')}</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {t('settings.pvTilt', 'Tilt angle (°)')}
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={90}
                          value={settings.systemConfig.pv.tiltDeg}
                          onChange={(e) =>
                            updateSettings({
                              systemConfig: {
                                ...settings.systemConfig,
                                presetId: 'custom',
                                presetName: 'Custom',
                                pv: {
                                  ...settings.systemConfig.pv,
                                  tiltDeg: Number(e.target.value),
                                },
                              },
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.pvStrings')}</label>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={settings.systemConfig.pv.strings}
                          onChange={(e) =>
                            updateSettings({
                              systemConfig: {
                                ...settings.systemConfig,
                                presetId: 'custom',
                                presetName: 'Custom',
                                pv: {
                                  ...settings.systemConfig.pv,
                                  strings: Number(e.target.value),
                                },
                              },
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.mpptCount')}</label>
                        <input
                          type="number"
                          min={1}
                          max={8}
                          value={settings.systemConfig.pv.mpptCount}
                          onChange={(e) =>
                            updateSettings({
                              systemConfig: {
                                ...settings.systemConfig,
                                presetId: 'custom',
                                presetName: 'Custom',
                                pv: {
                                  ...settings.systemConfig.pv,
                                  mpptCount: Number(e.target.value),
                                },
                              },
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </section>

                  {/* Battery Config */}
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <HardDrive size={20} className="text-purple-400" />
                      {t('settings.batteryConfig', 'Battery Configuration')}
                    </h2>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.batteryModel')}</label>
                        <input
                          type="text"
                          value={settings.systemConfig.battery.model}
                          onChange={(e) =>
                            updateSettings({
                              systemConfig: {
                                ...settings.systemConfig,
                                presetId: 'custom',
                                presetName: 'Custom',
                                battery: {
                                  ...settings.systemConfig.battery,
                                  model: e.target.value,
                                },
                              },
                            })
                          }
                          className={inputClass}
                          placeholder="BYD Battery-Box Premium HVS"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {t('settings.batteryCapacity', 'Capacity (kWh)')}
                        </label>
                        <input
                          type="number"
                          step={0.1}
                          value={settings.systemConfig.battery.capacityKWh}
                          onChange={(e) =>
                            updateSettings({
                              systemConfig: {
                                ...settings.systemConfig,
                                presetId: 'custom',
                                presetName: 'Custom',
                                battery: {
                                  ...settings.systemConfig.battery,
                                  capacityKWh: Number(e.target.value),
                                },
                              },
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {t('settings.batteryModules')}
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={16}
                          value={settings.systemConfig.battery.modules}
                          onChange={(e) =>
                            updateSettings({
                              systemConfig: {
                                ...settings.systemConfig,
                                presetId: 'custom',
                                presetName: 'Custom',
                                battery: {
                                  ...settings.systemConfig.battery,
                                  modules: Number(e.target.value),
                                },
                              },
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {t('settings.batteryVoltage')}
                        </label>
                        <input
                          type="number"
                          step={0.1}
                          value={settings.systemConfig.battery.nominalVoltageV}
                          onChange={(e) =>
                            updateSettings({
                              systemConfig: {
                                ...settings.systemConfig,
                                presetId: 'custom',
                                presetName: 'Custom',
                                battery: {
                                  ...settings.systemConfig.battery,
                                  nominalVoltageV: Number(e.target.value),
                                },
                              },
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {t('settings.batteryMaxCharge', 'Max charge rate (kW)')}
                        </label>
                        <input
                          type="number"
                          step={0.1}
                          value={settings.systemConfig.battery.maxChargeRateKW}
                          onChange={(e) =>
                            updateSettings({
                              systemConfig: {
                                ...settings.systemConfig,
                                presetId: 'custom',
                                presetName: 'Custom',
                                battery: {
                                  ...settings.systemConfig.battery,
                                  maxChargeRateKW: Number(e.target.value),
                                },
                              },
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {t('settings.batteryMaxDischarge')}
                        </label>
                        <input
                          type="number"
                          step={0.1}
                          value={settings.systemConfig.battery.maxDischargeRateKW}
                          onChange={(e) =>
                            updateSettings({
                              systemConfig: {
                                ...settings.systemConfig,
                                presetId: 'custom',
                                presetName: 'Custom',
                                battery: {
                                  ...settings.systemConfig.battery,
                                  maxDischargeRateKW: Number(e.target.value),
                                },
                              },
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {t('settings.batteryMinSoC', 'Minimum SoC (%)')}
                        </label>
                        <input
                          type="number"
                          min={5}
                          max={50}
                          value={settings.systemConfig.battery.minSoCPercent}
                          onChange={(e) =>
                            updateSettings({
                              systemConfig: {
                                ...settings.systemConfig,
                                presetId: 'custom',
                                presetName: 'Custom',
                                battery: {
                                  ...settings.systemConfig.battery,
                                  minSoCPercent: Number(e.target.value),
                                },
                              },
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="settings-strategy" className="text-sm font-medium">
                          {t('settings.batteryStrategy', 'Default strategy')}
                        </label>
                        <select
                          id="settings-strategy"
                          className={inputClass}
                          value={settings.systemConfig.battery.strategy}
                          onChange={(e) =>
                            updateSettings({
                              systemConfig: {
                                ...settings.systemConfig,
                                presetId: 'custom',
                                presetName: 'Custom',
                                battery: {
                                  ...settings.systemConfig.battery,
                                  strategy: e.target.value as
                                    | 'self-consumption'
                                    | 'force-charge'
                                    | 'time-of-use'
                                    | 'auto',
                                },
                              },
                            })
                          }
                        >
                          <option value="self-consumption">{t('control.selfConsumption')}</option>
                          <option value="force-charge">{t('control.forceCharge')}</option>
                          <option value="time-of-use">{t('settings.timeOfUse')}</option>
                          <option value="auto">{t('control.auto')}</option>
                        </select>
                      </div>
                    </div>
                  </section>

                  {/* EV Charger & Heat Pump */}
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <Gauge size={20} className="text-emerald-400" />
                      {t('settings.consumersConfig')}
                    </h2>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {t('settings.evChargerModel')}
                        </label>
                        <input
                          type="text"
                          value={settings.systemConfig.evCharger.model}
                          onChange={(e) =>
                            updateSettings({
                              systemConfig: {
                                ...settings.systemConfig,
                                presetId: 'custom',
                                presetName: 'Custom',
                                evCharger: {
                                  ...settings.systemConfig.evCharger,
                                  model: e.target.value,
                                },
                              },
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.evMaxPower')}</label>
                        <input
                          type="number"
                          step={0.1}
                          min={1}
                          max={50}
                          value={settings.systemConfig.evCharger.maxPowerKW}
                          onChange={(e) =>
                            updateSettings({
                              systemConfig: {
                                ...settings.systemConfig,
                                presetId: 'custom',
                                presetName: 'Custom',
                                evCharger: {
                                  ...settings.systemConfig.evCharger,
                                  maxPowerKW: Number(e.target.value),
                                },
                              },
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.heatPumpModel')}</label>
                        <input
                          type="text"
                          value={settings.systemConfig.heatPump.model}
                          onChange={(e) =>
                            updateSettings({
                              systemConfig: {
                                ...settings.systemConfig,
                                presetId: 'custom',
                                presetName: 'Custom',
                                heatPump: {
                                  ...settings.systemConfig.heatPump,
                                  model: e.target.value,
                                },
                              },
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.heatPumpPower')}</label>
                        <input
                          type="number"
                          step={0.1}
                          min={1}
                          max={30}
                          value={settings.systemConfig.heatPump.ratedPowerKW}
                          onChange={(e) =>
                            updateSettings({
                              systemConfig: {
                                ...settings.systemConfig,
                                presetId: 'custom',
                                presetName: 'Custom',
                                heatPump: {
                                  ...settings.systemConfig.heatPump,
                                  ratedPowerKW: Number(e.target.value),
                                },
                              },
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </section>

                  {/* Location & Weather */}
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <MapPin size={20} className="text-rose-400" />
                      {t('settings.locationTitle', 'Location & Weather')}
                    </h2>
                    <p className="-mt-2 text-xs text-(--color-muted)">
                      {t(
                        'settings.locationHint',
                        'Used for solar forecast, weather data, and sunrise/sunset calculations',
                      )}
                    </p>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="settings-lat" className="text-sm font-medium">
                          {t('settings.latitude', 'Latitude')}
                        </label>
                        <input
                          id="settings-lat"
                          type="number"
                          step={0.0001}
                          min={-90}
                          max={90}
                          value={settings.location.lat}
                          onChange={(e) =>
                            updateSettings({
                              location: { ...settings.location, lat: Number(e.target.value) },
                            })
                          }
                          className={inputClass}
                          placeholder="53.5511"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="settings-lon" className="text-sm font-medium">
                          {t('settings.longitude', 'Longitude')}
                        </label>
                        <input
                          id="settings-lon"
                          type="number"
                          step={0.0001}
                          min={-180}
                          max={180}
                          value={settings.location.lon}
                          onChange={(e) =>
                            updateSettings({
                              location: { ...settings.location, lon: Number(e.target.value) },
                            })
                          }
                          className={inputClass}
                          placeholder="9.9937"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Grid & Tariff Extras */}
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <Zap size={20} className="text-orange-400" />
                      {t('settings.gridExtrasTitle', 'Grid & Tariff Details')}
                    </h2>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="settings-grid-price" className="text-sm font-medium">
                          {t('settings.gridPriceAvg', 'Avg. grid price (€/kWh)')}
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0.1}
                            max={0.6}
                            step={0.01}
                            value={settings.gridPriceAvg}
                            onChange={(e) =>
                              updateSettings({ gridPriceAvg: Number(e.target.value) })
                            }
                            className="flex-1 accent-(--color-primary)"
                            aria-label={t('settings.gridPriceAvg', 'Avg. grid price (€/kWh)')}
                            aria-valuetext={`${settings.gridPriceAvg.toFixed(2)} €/kWh`}
                          />
                          <span className="w-20 text-right font-mono text-sm">
                            {settings.gridPriceAvg.toFixed(2)} €
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="settings-feedin" className="text-sm font-medium">
                          {t('settings.feedInTariff', 'Feed-in tariff (€/kWh)')}
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0.0}
                            max={0.2}
                            step={0.001}
                            value={settings.feedInTariff ?? 0.082}
                            onChange={(e) =>
                              updateSettings({ feedInTariff: Number(e.target.value) })
                            }
                            className="flex-1 accent-(--color-primary)"
                            aria-label={t('settings.feedInTariff', 'Feed-in tariff (€/kWh)')}
                            aria-valuetext={`${(settings.feedInTariff ?? 0.082).toFixed(3)} €/kWh`}
                          />
                          <span className="w-20 text-right font-mono text-sm">
                            {(settings.feedInTariff ?? 0.082).toFixed(3)} €
                          </span>
                        </div>
                        <p className="text-xs text-(--color-muted)">
                          {t('settings.feedInTariffHint', 'EEG feed-in compensation per kWh')}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="settings-grid-operator" className="text-sm font-medium">
                          {t('settings.gridOperator', 'Grid operator')}
                        </label>
                        <input
                          id="settings-grid-operator"
                          type="text"
                          value={settings.gridOperator ?? ''}
                          onChange={(e) => updateSettings({ gridOperator: e.target.value })}
                          className={inputClass}
                          placeholder={t(
                            'settings.gridOperatorPlaceholder',
                            'e.g. Stromnetz Hamburg',
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="settings-budget" className="text-sm font-medium">
                          {t('settings.monthlyBudget', 'Monthly energy budget (€)')}
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={20}
                            max={500}
                            step={5}
                            value={settings.monthlyBudget ?? 80}
                            onChange={(e) =>
                              updateSettings({ monthlyBudget: Number(e.target.value) })
                            }
                            className="flex-1 accent-(--color-primary)"
                            aria-label={t('settings.monthlyBudget', 'Monthly energy budget (€)')}
                            aria-valuetext={`${settings.monthlyBudget ?? 80} €`}
                          />
                          <span className="w-16 text-right font-mono text-sm">
                            {settings.monthlyBudget ?? 80} €
                          </span>
                        </div>
                        <p className="text-xs text-(--color-muted)">
                          {t(
                            'settings.monthlyBudgetHint',
                            'Target monthly electricity cost for budget tracking',
                          )}
                        </p>
                      </div>
                    </div>
                  </section>
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
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <Shield size={20} className="text-red-400" />
                      {t('settings.security')}
                    </h2>
                    <div className="space-y-5">
                      <div className="flex items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                        <div>
                          <p className="text-sm font-medium">{t('settings.mtls')}</p>
                          <p className="text-xs text-(--color-muted)">{t('settings.mtlsHint')}</p>
                        </div>
                        <ToggleSwitch
                          id="mtls"
                          checked={settings.mtls}
                          onChange={(v) => updateSettings({ mtls: v })}
                          label={t('settings.mtls')}
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                        <div>
                          <p className="text-sm font-medium">{t('settings.telemetry')}</p>
                          <p className="text-xs text-(--color-muted)">
                            {t('settings.telemetryHint')}
                          </p>
                        </div>
                        <ToggleSwitch
                          id="telemetry"
                          checked={settings.telemetryDisabled}
                          onChange={(v) => updateSettings({ telemetryDisabled: v })}
                          label={t('settings.telemetry')}
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                        <div>
                          <p className="text-sm font-medium">{t('settings.twoFactor')}</p>
                          <p className="text-xs text-(--color-muted)">
                            {t('settings.twoFactorHint')}
                          </p>
                        </div>
                        <ToggleSwitch
                          id="2fa"
                          checked={settings.twoFactor}
                          onChange={(v) => updateSettings({ twoFactor: v })}
                          label={t('settings.twoFactor')}
                        />
                      </div>
                    </div>
                  </section>

                  {/* Encryption Info */}
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <Lock size={20} className="text-amber-400" />
                      {t('settings.encryptionTitle', 'Encryption & Certificates')}
                    </h2>
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                      <div className="flex items-start gap-3">
                        <Shield size={20} className="mt-0.5 shrink-0 text-emerald-400" />
                        <div className="space-y-1 text-sm">
                          <p className="font-medium text-emerald-400">
                            {t('settings.encryptionActive', 'End-to-end encryption active')}
                          </p>
                          <p className="text-(--color-muted)">
                            {t(
                              'settings.encryptionDesc',
                              'All API keys are stored with AES-GCM 256-bit encryption. WebSocket connections use TLS. Local data stays in your browser.',
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-3">
                        <p className="text-xs text-(--color-muted)">
                          {t('settings.certStatus', 'Certificate Status')}
                        </p>
                        <p className="text-sm font-medium text-emerald-400">
                          {t('settings.certValid', 'Valid')}
                        </p>
                      </div>
                      <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-3">
                        <p className="text-xs text-(--color-muted)">
                          {t('settings.encType', 'Encryption')}
                        </p>
                        <p className="text-sm font-medium">PBKDF2 + AES-GCM 256</p>
                      </div>
                    </div>
                  </section>
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
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <Database size={20} className="text-purple-400" />
                      {t('settings.storage')}
                    </h2>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.influxUrl')}</label>
                        <input
                          type="text"
                          value={settings.influxUrl}
                          onChange={(e) => updateSettings({ influxUrl: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.influxToken')}</label>
                        <div className="relative">
                          <input
                            type={showTokens['influx'] ? 'text' : 'password'}
                            value={settings.influxToken}
                            onChange={(e) => updateSettings({ influxToken: e.target.value })}
                            className={inputClass + ' pr-10'}
                          />
                          <button
                            type="button"
                            onClick={() => toggleTokenVisibility('influx')}
                            className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-(--color-muted) hover:text-(--color-text)"
                            aria-label={
                              showTokens['influx']
                                ? t('settings.hideToken')
                                : t('settings.showToken')
                            }
                          >
                            {showTokens['influx'] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.historyDays')}</label>
                        <input
                          type="number"
                          value={settings.historyDays}
                          onChange={(e) => updateSettings({ historyDays: Number(e.target.value) })}
                          className={inputClass}
                          min={1}
                          max={365}
                        />
                        <p className="text-xs text-(--color-muted)">{t('settings.historyHint')}</p>
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
                        <p className="text-2xl font-bold text-(--color-primary)">~2.4</p>
                        <p className="text-xs text-(--color-muted)">MB IndexedDB</p>
                      </div>
                      <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center">
                        <p className="text-2xl font-bold text-(--color-secondary)">847</p>
                        <p className="text-xs text-(--color-muted)">
                          {t('settings.snapshots', 'Snapshots')}
                        </p>
                      </div>
                      <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 text-center">
                        <p className="text-2xl font-bold text-amber-400">30</p>
                        <p className="text-xs text-(--color-muted)">
                          {t('settings.daysRetention', 'Days retention')}
                        </p>
                      </div>
                    </div>
                    <motion.button
                      type="button"
                      className="flex items-center gap-2 text-sm text-rose-400 transition-colors hover:text-rose-300"
                      whileHover={{ x: 4 }}
                    >
                      <Trash2 size={16} />
                      {t('settings.clearCache', 'Clear local cache')}
                    </motion.button>
                  </section>
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
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <Bell size={20} className="text-yellow-400" />
                      {t('settings.notifications', 'Notifications')}
                    </h2>
                    <div className="space-y-5">
                      <div className="flex items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                        <div>
                          <p className="text-sm font-medium">
                            {t('settings.pushNotifications', 'Push notifications')}
                          </p>
                          <p className="text-xs text-(--color-muted)">
                            {t('settings.pushHint', 'Receive alerts for important system events')}
                          </p>
                        </div>
                        <ToggleSwitch
                          id="push"
                          checked={settings.pushNotifications ?? true}
                          onChange={(v) => updateSettings({ pushNotifications: v })}
                          label={t('settings.pushNotifications', 'Push notifications')}
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                        <div>
                          <p className="text-sm font-medium">
                            {t('settings.priceAlerts', 'Price alerts')}
                          </p>
                          <p className="text-xs text-(--color-muted)">
                            {t(
                              'settings.priceAlertsHint',
                              'Notify when electricity price drops below threshold',
                            )}
                          </p>
                        </div>
                        <ToggleSwitch
                          id="price-alerts"
                          checked={settings.priceAlerts ?? true}
                          onChange={(v) => updateSettings({ priceAlerts: v })}
                          label={t('settings.priceAlerts', 'Price alerts')}
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                        <div>
                          <p className="text-sm font-medium">
                            {t('settings.batteryAlerts', 'Battery alerts')}
                          </p>
                          <p className="text-xs text-(--color-muted)">
                            {t(
                              'settings.batteryAlertsHint',
                              'Alert when battery SoC falls below minimum',
                            )}
                          </p>
                        </div>
                        <ToggleSwitch
                          id="battery-alerts"
                          checked={settings.batteryAlerts ?? true}
                          onChange={(v) => updateSettings({ batteryAlerts: v })}
                          label={t('settings.batteryAlerts', 'Battery alerts')}
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                        <div>
                          <p className="text-sm font-medium">
                            {t('settings.gridAlerts', 'Grid anomaly alerts')}
                          </p>
                          <p className="text-xs text-(--color-muted)">
                            {t(
                              'settings.gridAlertsHint',
                              'Alert on voltage fluctuations or power outages',
                            )}
                          </p>
                        </div>
                        <ToggleSwitch
                          id="grid-alerts"
                          checked={settings.gridAlerts ?? false}
                          onChange={(v) => updateSettings({ gridAlerts: v })}
                          label={t('settings.gridAlerts', 'Grid anomaly alerts')}
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                        <div>
                          <p className="text-sm font-medium">
                            {t('settings.updateNotifications', 'Update notifications')}
                          </p>
                          <p className="text-xs text-(--color-muted)">
                            {t('settings.updateHint', 'Notify when a new app version is available')}
                          </p>
                        </div>
                        <ToggleSwitch
                          id="update-notif"
                          checked={settings.updateNotifications ?? true}
                          onChange={(v) => updateSettings({ updateNotifications: v })}
                          label={t('settings.updateNotifications', 'Update notifications')}
                        />
                      </div>
                    </div>
                  </section>

                  {/* Alert Thresholds */}
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <Gauge size={20} className="text-orange-400" />
                      {t('settings.alertThresholds', 'Alert Thresholds')}
                    </h2>
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {t('settings.batteryAlertThreshold', 'Battery SoC alert level')}
                          </p>
                          <span className="font-mono text-sm text-(--color-primary) tabular-nums">
                            {settings.batteryAlertThreshold ?? 15}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={5}
                          max={50}
                          step={1}
                          value={settings.batteryAlertThreshold ?? 15}
                          onChange={(e) =>
                            updateSettings({ batteryAlertThreshold: Number(e.target.value) })
                          }
                          className="w-full accent-(--color-primary)"
                          aria-label={t(
                            'settings.batteryAlertThreshold',
                            'Battery SoC alert level',
                          )}
                          aria-valuetext={`${settings.batteryAlertThreshold ?? 15}%`}
                        />
                        <p className="text-xs text-(--color-muted)">
                          {t(
                            'settings.batteryAlertThresholdHint',
                            'Alert when battery falls below this charge level',
                          )}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {t('settings.priceAlertThreshold', 'Price alert threshold')}
                          </p>
                          <span className="font-mono text-sm text-(--color-primary) tabular-nums">
                            {(settings.priceAlertThreshold ?? 0.1).toFixed(2)} €/kWh
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0.02}
                          max={0.5}
                          step={0.01}
                          value={settings.priceAlertThreshold ?? 0.1}
                          onChange={(e) =>
                            updateSettings({ priceAlertThreshold: Number(e.target.value) })
                          }
                          className="w-full accent-(--color-primary)"
                          aria-label={t('settings.priceAlertThreshold', 'Price alert threshold')}
                          aria-valuetext={`${(settings.priceAlertThreshold ?? 0.1).toFixed(2)} €/kWh`}
                        />
                        <p className="text-xs text-(--color-muted)">
                          {t(
                            'settings.priceAlertThresholdHint',
                            'Notify when grid price drops below this value',
                          )}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Quiet Hours */}
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <Moon size={20} className="text-indigo-400" />
                      {t('settings.quietHours', 'Quiet Hours')}
                    </h2>
                    <div className="space-y-5">
                      <div className="flex items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                        <div>
                          <p className="text-sm font-medium">
                            {t('settings.quietHoursEnabled', 'Enable quiet hours')}
                          </p>
                          <p className="text-xs text-(--color-muted)">
                            {t(
                              'settings.quietHoursHint',
                              'Suppress non-critical notifications during specified hours',
                            )}
                          </p>
                        </div>
                        <ToggleSwitch
                          id="quiet-hours"
                          checked={settings.quietHoursEnabled ?? false}
                          onChange={(v) => updateSettings({ quietHoursEnabled: v })}
                          label={t('settings.quietHoursEnabled', 'Enable quiet hours')}
                        />
                      </div>
                      {(settings.quietHoursEnabled ?? false) && (
                        <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2">
                          <div className="space-y-2">
                            <label
                              htmlFor="quiet-start"
                              className="flex items-center gap-2 text-sm font-medium"
                            >
                              <Clock size={14} className="text-(--color-muted)" />
                              {t('settings.quietHoursStart', 'Start')}
                            </label>
                            <input
                              id="quiet-start"
                              type="time"
                              value={settings.quietHoursStart ?? '22:00'}
                              onChange={(e) => updateSettings({ quietHoursStart: e.target.value })}
                              className={inputClass}
                            />
                          </div>
                          <div className="space-y-2">
                            <label
                              htmlFor="quiet-end"
                              className="flex items-center gap-2 text-sm font-medium"
                            >
                              <Clock size={14} className="text-(--color-muted)" />
                              {t('settings.quietHoursEnd', 'End')}
                            </label>
                            <input
                              id="quiet-end"
                              type="time"
                              value={settings.quietHoursEnd ?? '07:00'}
                              onChange={(e) => updateSettings({ quietHoursEnd: e.target.value })}
                              className={inputClass}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
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
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <Gauge size={20} className="text-indigo-400" />
                      {t('settings.advanced', 'Advanced')}
                    </h2>
                    <div className="space-y-5">
                      <div className="flex items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface) p-4">
                        <div>
                          <p className="text-sm font-medium">
                            {t('settings.debugMode', 'Debug mode')}
                          </p>
                          <p className="text-xs text-(--color-muted)">
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
                          <p className="text-sm font-medium">
                            {t('settings.experimentalFeatures', 'Experimental features')}
                          </p>
                          <p className="text-xs text-(--color-muted)">
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
                          <p className="text-sm font-medium">
                            {t('settings.performanceMode', 'Performance mode')}
                          </p>
                          <p className="text-xs text-(--color-muted)">
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

                      {/* Reset Onboarding */}
                      <div className="rounded-xl border border-(--color-primary)/20 bg-(--color-primary)/5 p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-(--color-primary)/15">
                              <RotateCcw size={20} className="text-(--color-primary)" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium">
                                {t('settings.resetOnboarding', 'Show onboarding again')}
                              </p>
                              <p className="mt-1 text-xs text-(--color-muted)">
                                {t(
                                  'settings.resetOnboardingHint',
                                  'Restart the welcome tour on next reload',
                                )}
                              </p>
                            </div>
                          </div>
                          <motion.button
                            type="button"
                            onClick={() => {
                              useAppStore.getState().setOnboardingCompleted(false);
                              setSaved(true);
                              setTimeout(() => setSaved(false), 3000);
                            }}
                            className="focus-ring flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-(--color-primary)/30 bg-(--color-primary)/10 px-4 py-2 text-sm text-(--color-primary) transition-colors hover:bg-(--color-primary)/20 sm:w-auto"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <RotateCcw size={16} />
                            {t('settings.resetOnboardingAction', 'Restart Tour')}
                          </motion.button>
                        </div>
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
                            <p className="text-sm font-medium">
                              {t('settings.dashboardRefreshSec', 'Auto-refresh interval')}
                            </p>
                            <p className="text-xs text-(--color-muted)">
                              {t(
                                'settings.dashboardRefreshHint',
                                'How often the dashboard data refreshes automatically',
                              )}
                            </p>
                          </div>
                          <span className="font-mono text-sm text-(--color-primary) tabular-nums">
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
                          <p className="text-sm font-medium">
                            {t('settings.sidebarPosition', 'Sidebar position')}
                          </p>
                          <p className="text-xs text-(--color-muted)">
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
                              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
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
                          <p className="text-sm font-medium">
                            {t('settings.autoBackup', 'Automatic backup')}
                          </p>
                          <p className="text-xs text-(--color-muted)">
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
                          <p className="flex items-center gap-2 text-sm font-medium">
                            <Keyboard size={14} className="text-(--color-muted)" />
                            {t('settings.keyboardShortcuts', 'Keyboard shortcuts')}
                          </p>
                          <p className="text-xs text-(--color-muted)">
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
                    </div>
                  </section>

                  {/* Reset */}
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <AlertTriangle size={20} className="text-rose-400" />
                      {t('settings.dangerZone', 'Danger Zone')}
                    </h2>
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-rose-400">
                            {t('settings.resetAll', 'Reset all settings')}
                          </p>
                          <p className="text-xs text-(--color-muted)">
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
                          className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-400 transition-colors hover:bg-rose-500/20 sm:w-auto"
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
