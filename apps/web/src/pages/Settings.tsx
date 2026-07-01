import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Cable,
  Check,
  Cpu,
  Database,
  Download,
  Eye,
  EyeOff,
  FlaskConical,
  Gauge,
  Globe,
  HardDrive,
  Info,
  Keyboard,
  MapPin,
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
  Type,
  Upload,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type FormEvent, lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { AdapterConfigPanel } from '../components/AdapterConfigPanel';
import { ConfirmDialog, useConfirmDialog } from '../components/ConfirmDialog';
import { EmergencyStop } from '../components/EmergencyStop';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { NotificationsTab } from '../components/settings/NotificationsTab';
import { PWASettingsSection } from '../components/settings/PWASettingsSection';
import { SecurityTab } from '../components/settings/SecurityTab';
import { SettingsFeatureBar } from '../components/settings/SettingsFeatureBar';
import { StorageTab } from '../components/settings/StorageTab';
import { SystemTab } from '../components/settings/SystemTab';
import { inputClass, sectionClass, sectionHeaderClass } from '../components/settings/styles';
import { ThemePreviewCard } from '../components/settings/ThemePreviewCard';
import { ToggleSwitch } from '../components/settings/ToggleSwitch';
import { themeDefinitions, themeOrder } from '../design-tokens';
import { isLiveSafetyMode } from '../lib/adapter-mode';
import { resolveTheme, type ThemePreference } from '../lib/theme';
import { defaultSettings, useAppStoreShallow } from '../store';
import { type PVConfig, SYSTEM_PRESETS } from '../types';

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
  const { t, i18n } = useTranslation();
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

  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const confirm = useConfirmDialog();

  // Theme state
  const {
    theme,
    themePreference,
    setThemePreference,
    setTheme,
    locale,
    setLocale,
    settings,
    updateSettings,
    adapterMode,
  } = useAppStoreShallow((s) => ({
    theme: s.theme,
    themePreference: s.themePreference,
    setThemePreference: s.setThemePreference,
    setTheme: s.setTheme,
    locale: s.locale,
    setLocale: s.setLocale,
    settings: s.settings,
    updateSettings: s.updateSettings,
    adapterMode: s.adapterMode,
  }));

  const isLiveMode = isLiveSafetyMode(adapterMode);

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

  const isSystem = themePreference === 'system';

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
                  <SettingsFeatureBar tabId="appearance" />
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
                          <p className="font-medium text-sm">
                            {t('settings.systemTheme', 'Follow system preference')}
                          </p>
                          <p className="text-(--color-muted) text-xs">
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
                          <p className="font-medium text-sm">
                            {t('settings.animations', 'Animations')}
                          </p>
                          <p className="text-(--color-muted) text-xs">
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
                          <p className="font-medium text-sm">
                            {t('settings.compactMode', 'Compact mode')}
                          </p>
                          <p className="text-(--color-muted) text-xs">
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
                          <p className="font-medium text-sm">
                            {t('settings.glowEffects', 'Glow effects')}
                          </p>
                          <p className="text-(--color-muted) text-xs">
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
                    <div className="mb-4 flex items-center gap-3">
                      <span className="text-(--color-muted) text-sm">
                        {t('settings.quickSwitch', 'Quick switch')}:
                      </span>
                      <LanguageSwitcher />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="settings-language" className="font-medium text-sm">
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
                        <label htmlFor="settings-units" className="font-medium text-sm">
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
                        <label htmlFor="settings-dateformat" className="font-medium text-sm">
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
                        <label htmlFor="settings-currency" className="font-medium text-sm">
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
                            <p className="font-medium text-sm">
                              {t('settings.fontScale', 'Font size')}
                            </p>
                            <p className="text-(--color-muted) text-xs">
                              {t('settings.fontScaleHint', 'Adjust the global font size scaling')}
                            </p>
                          </div>
                          <span className="font-mono text-(--color-primary) text-sm tabular-nums">
                            {Math.round((settings.fontScale ?? 1.0) * 100)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-(--color-muted) text-xs">A</span>
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
                          <span className="font-medium text-(--color-muted) text-base">A</span>
                        </div>
                      </div>
                      {/* Reduced Motion */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            {t('settings.reducedMotion', 'Reduced motion')}
                          </p>
                          <p className="text-(--color-muted) text-xs">
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
                          <p className="font-medium text-sm">
                            {t('settings.highContrast', 'High contrast')}
                          </p>
                          <p className="text-(--color-muted) text-xs">
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
                  <SettingsFeatureBar tabId="energy" />
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <Zap size={20} className="text-yellow-400" />
                      {t('settings.energy')}
                    </h2>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="settings-tariff" className="font-medium text-sm">
                          {t('settings.tariffProvider')}
                        </label>
                        <select
                          id="settings-tariff"
                          className={inputClass}
                          value={settings.tariffProvider}
                          onChange={(e) =>
                            updateSettings({
                              tariffProvider: e.target.value as import('../types').TariffProvider,
                            })
                          }
                        >
                          <option value="tibber">{t('settings.tibber')}</option>
                          <option value="tibber-pulse">{t('settings.tibberPulse')}</option>
                          <option value="awattar-de">{t('settings.awattarDE')}</option>
                          <option value="awattar-at">{t('settings.awattarAT')}</option>
                          <option value="octopus">{t('settings.octopus')}</option>
                          <option value="awattar">{t('settings.awattar')}</option>
                          <option value="none">{t('settings.none')}</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="settings-api-token" className="font-medium text-sm">
                          {t('settings.apiTokenLabel')}
                        </label>
                        <div className="relative">
                          <input
                            id="settings-api-token"
                            type={showTokens.tariff ? 'text' : 'password'}
                            className={`${inputClass} pr-10`}
                            placeholder="••••••••••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => toggleTokenVisibility('tariff')}
                            className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-(--color-muted) hover:text-(--color-text)"
                            aria-label={
                              showTokens.tariff ? t('settings.hideToken') : t('settings.showToken')
                            }
                          >
                            {showTokens.tariff ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="settings-charge-threshold" className="font-medium text-sm">
                          {t('settings.chargeThreshold')}
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            id="settings-charge-threshold"
                            type="range"
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
                        <label htmlFor="settings-max-grid" className="font-medium text-sm">
                          {t('settings.maxGrid')}
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            id="settings-max-grid"
                            type="range"
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
                        <p className="text-(--color-muted) text-xs">
                          {t(
                            'settings.maxGridHint',
                            '§14a EnWG limit: 4.2 kW for controllable consumers',
                          )}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="font-medium text-sm">{t('settings.dynamicGridFees')}</p>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={settings.dynamicGridFees}
                            onClick={() =>
                              updateSettings({ dynamicGridFees: !settings.dynamicGridFees })
                            }
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${settings.dynamicGridFees ? 'bg-(--color-primary)' : 'bg-(--color-border)'}`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${settings.dynamicGridFees ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`}
                            />
                          </button>
                          <span className="text-sm">
                            {settings.dynamicGridFees
                              ? t('settings.dynamicGridFeesActive')
                              : t('settings.dynamicGridFeesInactive')}
                          </span>
                        </div>
                        <p className="text-(--color-muted) text-xs">
                          {t('settings.dynamicGridFeesHint')}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="settings-grid-operator" className="font-medium text-sm">
                          {t('settings.gridOperatorLabel')}
                        </label>
                        <input
                          id="settings-grid-operator"
                          type="text"
                          className={inputClass}
                          value={settings.gridOperatorName}
                          onChange={(e) => updateSettings({ gridOperatorName: e.target.value })}
                          placeholder={t('settings.gridOperatorInputPlaceholder')}
                        />
                      </div>
                    </div>
                  </section>

                  {/* System Preset */}
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <Server size={20} className="text-cyan-400" />
                      {t('settings.systemPreset')}
                    </h2>
                    <p className="mb-4 text-(--color-muted) text-xs">
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
                          <span className="font-medium text-sm">{preset.presetName}</span>
                          {preset.presetId !== 'custom' && (
                            <p className="mt-1 text-(--color-muted) text-xs">
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
                        <label htmlFor="settings-inverter-model" className="font-medium text-sm">
                          {t('settings.inverterModel')}
                        </label>
                        <input
                          id="settings-inverter-model"
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
                        <label htmlFor="settings-inverter-count" className="font-medium text-sm">
                          {t('settings.inverterCount')}
                        </label>
                        <input
                          id="settings-inverter-count"
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
                        <p className="text-(--color-muted) text-xs">
                          {t('settings.inverterCountHint')}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="settings-inverter-power" className="font-medium text-sm">
                          {t('settings.inverterPower')}
                        </label>
                        <input
                          id="settings-inverter-power"
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
                        <p className="text-(--color-muted) text-xs">
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
                        <label htmlFor="settings-inv-mode" className="font-medium text-sm">
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
                        <label htmlFor="settings-pv-peak-power" className="font-medium text-sm">
                          {t('settings.pvPeakPower', 'Peak power (kWp)')}
                        </label>
                        <input
                          id="settings-pv-peak-power"
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
                        <label htmlFor="settings-orientation" className="font-medium text-sm">
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
                        <label htmlFor="settings-pv-tilt" className="font-medium text-sm">
                          {t('settings.pvTilt', 'Tilt angle (°)')}
                        </label>
                        <input
                          id="settings-pv-tilt"
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
                        <label htmlFor="settings-pv-strings" className="font-medium text-sm">
                          {t('settings.pvStrings')}
                        </label>
                        <input
                          id="settings-pv-strings"
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
                        <label htmlFor="pv-mppt-count" className="font-medium text-sm">
                          {t('settings.mpptCount')}
                        </label>
                        <input
                          id="pv-mppt-count"
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
                        <label htmlFor="settings-battery-model" className="font-medium text-sm">
                          {t('settings.batteryModel')}
                        </label>
                        <input
                          id="settings-battery-model"
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
                        <label htmlFor="settings-battery-capacity" className="font-medium text-sm">
                          {t('settings.batteryCapacity', 'Capacity (kWh)')}
                        </label>
                        <input
                          id="settings-battery-capacity"
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
                        <label htmlFor="settings-battery-modules" className="font-medium text-sm">
                          {t('settings.batteryModules')}
                        </label>
                        <input
                          id="settings-battery-modules"
                          type="number"
                          min={1}
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
                        <label htmlFor="settings-battery-voltage" className="font-medium text-sm">
                          {t('settings.batteryVoltage')}
                        </label>
                        <input
                          id="settings-battery-voltage"
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
                        <label
                          htmlFor="settings-battery-max-charge"
                          className="font-medium text-sm"
                        >
                          {t('settings.batteryMaxCharge', 'Max charge rate (kW)')}
                        </label>
                        <input
                          id="settings-battery-max-charge"
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
                        <label
                          htmlFor="settings-battery-max-discharge"
                          className="font-medium text-sm"
                        >
                          {t('settings.batteryMaxDischarge')}
                        </label>
                        <input
                          id="settings-battery-max-discharge"
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
                        <label htmlFor="settings-battery-min-soc" className="font-medium text-sm">
                          {t('settings.batteryMinSoC', 'Minimum SoC (%)')}
                        </label>
                        <input
                          id="settings-battery-min-soc"
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
                        <label htmlFor="settings-strategy" className="font-medium text-sm">
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
                        <label htmlFor="settings-ev-charger-model" className="font-medium text-sm">
                          {t('settings.evChargerModel')}
                        </label>
                        <input
                          id="settings-ev-charger-model"
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
                        <label htmlFor="settings-ev-max-power" className="font-medium text-sm">
                          {t('settings.evMaxPower')}
                        </label>
                        <input
                          id="settings-ev-max-power"
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
                        <label htmlFor="settings-heat-pump-model" className="font-medium text-sm">
                          {t('settings.heatPumpModel')}
                        </label>
                        <input
                          id="settings-heat-pump-model"
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
                        <label htmlFor="settings-heat-pump-power" className="font-medium text-sm">
                          {t('settings.heatPumpPower')}
                        </label>
                        <input
                          id="settings-heat-pump-power"
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
                    <p className="-mt-2 text-(--color-muted) text-xs">
                      {t(
                        'settings.locationHint',
                        'Used for solar forecast, weather data, and sunrise/sunset calculations',
                      )}
                    </p>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="settings-lat" className="font-medium text-sm">
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
                        <label htmlFor="settings-lon" className="font-medium text-sm">
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
                        <label htmlFor="settings-grid-price" className="font-medium text-sm">
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
                        <label htmlFor="settings-feedin" className="font-medium text-sm">
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
                        <p className="text-(--color-muted) text-xs">
                          {t('settings.feedInTariffHint', 'EEG feed-in compensation per kWh')}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="settings-grid-operator" className="font-medium text-sm">
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
                        <label htmlFor="settings-budget" className="font-medium text-sm">
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
                        <p className="text-(--color-muted) text-xs">
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
                  <SettingsFeatureBar tabId="controllers" />

                  {/* Controller Pipeline Overview */}
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <Cpu size={20} className="text-cyan-400" />
                      {t('settings.controllerPipeline', 'Controller Pipeline')}
                    </h2>
                    <p className="text-(--color-muted) text-xs">
                      {t(
                        'settings.controllerPipelineHint',
                        'Seven real-time energy control loops inspired by EMHASS, OpenEMS & evcc. Controllers run in priority order (critical → low) and merge their outputs.',
                      )}
                    </p>

                    <div className="space-y-3">
                      {[
                        {
                          id: 'ess-symmetric',
                          name: t('settings.ctrl_essSym', 'ESS Symmetric Controller'),
                          desc: t(
                            'settings.ctrl_essSymDesc',
                            'PID grid-balance, zero-grid-power target',
                          ),
                          priority: 'high' as const,
                          icon: '⚡',
                        },
                        {
                          id: 'peak-shaving',
                          name: t('settings.ctrl_peakShaving', 'Peak Shaving Controller'),
                          desc: t(
                            'settings.ctrl_peakShavingDesc',
                            'Grid import capping with hysteresis band',
                          ),
                          priority: 'critical' as const,
                          icon: '📉',
                        },
                        {
                          id: 'grid-optimized-charge',
                          name: t('settings.ctrl_gridCharge', 'Grid-Optimized Charge'),
                          desc: t(
                            'settings.ctrl_gridChargeDesc',
                            'Tariff-based battery charge/discharge scheduling',
                          ),
                          priority: 'normal' as const,
                          icon: '💰',
                        },
                        {
                          id: 'self-consumption',
                          name: t('settings.ctrl_selfConsumption', 'Self-Consumption'),
                          desc: t(
                            'settings.ctrl_selfConsumptionDesc',
                            'Maximize PV self-consumption, absorb surplus',
                          ),
                          priority: 'normal' as const,
                          icon: '\u2600',
                        },
                        {
                          id: 'emergency-capacity',
                          name: t('settings.ctrl_emergency', 'Emergency Capacity'),
                          desc: t(
                            'settings.ctrl_emergencyDesc',
                            'Reserve SoC backup for grid outages',
                          ),
                          priority: 'critical' as const,
                          icon: '🔋',
                        },
                        {
                          id: 'heatpump-sg-ready',
                          name: t('settings.ctrl_heatpump', 'Heat Pump SG Ready'),
                          desc: t(
                            'settings.ctrl_heatpumpDesc',
                            'SG Ready mode 1–4 based on PV surplus & tariff',
                          ),
                          priority: 'normal' as const,
                          icon: '\uD83C\uDF21',
                        },
                        {
                          id: 'ev-smart-charge',
                          name: t('settings.ctrl_evSmart', 'EV Smart Charge'),
                          desc: t(
                            'settings.ctrl_evSmartDesc',
                            'PV surplus charging, tariff optimization, §14a EnWG',
                          ),
                          priority: 'normal' as const,
                          icon: '🚗',
                        },
                      ].map((ctrl) => (
                        <div
                          key={ctrl.id}
                          className="flex items-center gap-4 rounded-xl border border-(--color-border) bg-(--color-surface) p-4 transition-all hover:border-(--color-primary)/30"
                        >
                          <span className="text-xl" aria-hidden="true">
                            {ctrl.icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{ctrl.name}</p>
                              <span
                                className={`rounded-full px-2 py-0.5 font-semibold text-[10px] uppercase tracking-wider ${
                                  ctrl.priority === 'critical'
                                    ? 'bg-rose-500/15 text-rose-400'
                                    : ctrl.priority === 'high'
                                      ? 'bg-amber-500/15 text-amber-400'
                                      : 'bg-blue-500/15 text-blue-400'
                                }`}
                              >
                                {ctrl.priority}
                              </span>
                            </div>
                            <p className="mt-0.5 text-(--color-muted) text-xs">{ctrl.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 rounded-lg border border-(--color-primary)/20 bg-(--color-primary)/5 px-4 py-3 text-sm">
                      <Info size={16} className="shrink-0 text-(--color-primary)" />
                      <span>
                        {t(
                          'settings.controllerManageHint',
                          'Manage controller states, enable/disable, and view live outputs on the',
                        )}{' '}
                        <Link
                          to="/devices"
                          className="font-medium text-(--color-primary) underline-offset-2 hover:underline"
                        >
                          {t('nav.controllers', 'Controllers')}
                        </Link>{' '}
                        {t('common.page', 'page')}.
                      </span>
                    </div>
                  </section>

                  {/* MPC Optimizer */}
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <Gauge size={20} className="text-emerald-400" />
                      {t('settings.mpcOptimizer', 'MPC Day-Ahead Optimizer')}
                    </h2>
                    <p className="text-(--color-muted) text-xs">
                      {t(
                        'settings.mpcOptimizerHint',
                        'Greedy LP day-ahead optimization over a 24-hour horizon with 15-minute resolution. Multi-objective: minimize cost, maximize self-consumption, minimize CO₂.',
                      )}
                    </p>
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="settings-pv-peak-kw-mpc" className="font-medium text-sm">
                          {t('settings.pvPeakKw', 'PV peak power (kW)')}
                        </label>
                        <input
                          id="settings-pv-peak-kw-mpc"
                          type="number"
                          step={0.1}
                          min={0}
                          max={100}
                          value={settings.pvPeakKw}
                          onChange={(e) => updateSettings({ pvPeakKw: Number(e.target.value) })}
                          className={inputClass}
                        />
                        <p className="text-(--color-muted) text-xs">
                          {t(
                            'settings.pvPeakKwHint',
                            'Used by MPC for PV generation forecast scaling',
                          )}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="settings-battery-capacity-kwh-mpc"
                          className="font-medium text-sm"
                        >
                          {t('settings.batteryCapacityKWhMpc', 'Battery capacity (kWh)')}
                        </label>
                        <input
                          id="settings-battery-capacity-kwh-mpc"
                          type="number"
                          step={0.1}
                          min={0}
                          max={200}
                          value={settings.batteryCapacityKWh}
                          onChange={(e) =>
                            updateSettings({ batteryCapacityKWh: Number(e.target.value) })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="settings-battery-max-charge-kw-mpc"
                          className="font-medium text-sm"
                        >
                          {t('settings.batteryMaxChargeKW', 'Max charge rate (kW)')}
                        </label>
                        <input
                          id="settings-battery-max-charge-kw-mpc"
                          type="number"
                          step={0.1}
                          min={0}
                          max={50}
                          value={settings.batteryMaxChargeKW}
                          onChange={(e) =>
                            updateSettings({ batteryMaxChargeKW: Number(e.target.value) })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="settings-battery-min-soc-mpc"
                          className="font-medium text-sm"
                        >
                          {t('settings.batteryMinSoCMpc', 'Min SoC (%)')}
                        </label>
                        <input
                          id="settings-battery-min-soc-mpc"
                          type="number"
                          min={5}
                          max={50}
                          value={settings.batteryMinSoC}
                          onChange={(e) =>
                            updateSettings({ batteryMinSoC: Number(e.target.value) })
                          }
                          className={inputClass}
                        />
                        <p className="text-(--color-muted) text-xs">
                          {t(
                            'settings.batteryMinSoCHint',
                            'MPC will not discharge below this SoC level',
                          )}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="settings-ev-max-power-kw-mpc"
                          className="font-medium text-sm"
                        >
                          {t('settings.evMaxPowerKW', 'EV max charge (kW)')}
                        </label>
                        <input
                          id="settings-ev-max-power-kw-mpc"
                          type="number"
                          step={0.1}
                          min={1}
                          max={50}
                          value={settings.evMaxPowerKW}
                          onChange={(e) => updateSettings({ evMaxPowerKW: Number(e.target.value) })}
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="settings-heat-pump-power-kw-mpc"
                          className="font-medium text-sm"
                        >
                          {t('settings.heatPumpPowerKW', 'Heat pump power (kW)')}
                        </label>
                        <input
                          id="settings-heat-pump-power-kw-mpc"
                          type="number"
                          step={0.1}
                          min={0}
                          max={30}
                          value={settings.heatPumpPowerKW}
                          onChange={(e) =>
                            updateSettings({ heatPumpPowerKW: Number(e.target.value) })
                          }
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="settings-feed-in-tariff" className="font-medium text-sm">
                          {t('settings.feedInTariffEurKWh', 'Feed-in tariff (€/kWh)')}
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            id="settings-feed-in-tariff"
                            type="range"
                            min={0.0}
                            max={0.15}
                            step={0.001}
                            value={settings.feedInTariffEurKWh}
                            onChange={(e) =>
                              updateSettings({ feedInTariffEurKWh: Number(e.target.value) })
                            }
                            className="flex-1 accent-(--color-primary)"
                            aria-label={t('settings.feedInTariffEurKWh', 'Feed-in tariff (€/kWh)')}
                            aria-valuetext={`${settings.feedInTariffEurKWh.toFixed(3)} €/kWh`}
                          />
                          <span className="w-20 text-right font-mono text-sm">
                            {settings.feedInTariffEurKWh.toFixed(3)} €
                          </span>
                        </div>
                        <p className="text-(--color-muted) text-xs">
                          {t(
                            'settings.feedInTariffEurKWhHint',
                            'EEG compensation used by MPC cost function',
                          )}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="settings-max-grid-import-mpc"
                          className="font-medium text-sm"
                        >
                          {t('settings.maxGridImportKwMpc', 'Max grid import (kW)')}
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            id="settings-max-grid-import-mpc"
                            type="range"
                            min={1.0}
                            max={15.0}
                            step={0.1}
                            value={settings.maxGridImportKw}
                            onChange={(e) =>
                              updateSettings({ maxGridImportKw: Number(e.target.value) })
                            }
                            className="flex-1 accent-(--color-primary)"
                            aria-label={t('settings.maxGridImportKwMpc', 'Max grid import (kW)')}
                            aria-valuetext={`${settings.maxGridImportKw.toFixed(1)} kW`}
                          />
                          <span className="w-16 text-right font-mono text-sm">
                            {settings.maxGridImportKw.toFixed(1)} kW
                          </span>
                        </div>
                        <p className="text-(--color-muted) text-xs">
                          {t(
                            'settings.maxGridMpcHint',
                            '§14a EnWG constraint for MPC & peak shaving controller',
                          )}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Command Safety */}
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <Shield size={20} className="text-amber-400" />
                      {t('settings.commandSafety', 'Command Safety Layer')}
                    </h2>
                    <p className="text-(--color-muted) text-xs">
                      {t(
                        'settings.commandSafetyHint',
                        'All 18 adapter command types are validated with Zod schemas and IEC/EN safety limits. Dangerous commands require user confirmation via dialog.',
                      )}
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        { label: t('settings.safetyEvPower', 'EV Power'), range: '0–50 kW' },
                        {
                          label: t('settings.safetyEvCurrent', 'EV Current (IEC 61851)'),
                          range: '0–80 A',
                        },
                        { label: t('settings.safetyBattPower', 'Battery Power'), range: '±25 kW' },
                        { label: t('settings.safetySgReady', 'SG Ready Mode'), range: '1–4' },
                        {
                          label: t('settings.safetyGridLimit', 'Grid Limit (§14a)'),
                          range: '0–25 kW',
                        },
                        { label: t('settings.safetyKnxTemp', 'KNX Temperature'), range: '5–35 °C' },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between rounded-xl border border-(--color-border) bg-(--color-surface) px-4 py-3"
                        >
                          <span className="text-sm">{item.label}</span>
                          <span className="font-mono text-(--color-primary) text-xs">
                            {item.range}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Quick Links to Feature Pages */}
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <ArrowRight size={20} className="text-violet-400" />
                      {t('settings.featurePages', 'Feature Pages')}
                    </h2>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <Link
                        to="/devices"
                        className="flex items-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-4 transition-all hover:border-(--color-primary)/40 hover:bg-(--color-primary)/5"
                      >
                        <Cpu size={20} className="text-cyan-400" />
                        <div>
                          <p className="font-medium text-sm">
                            {t('nav.controllers', 'Controllers')}
                          </p>
                          <p className="text-(--color-muted) text-xs">
                            {t('settings.controllersLinkDesc', 'Live controller states & outputs')}
                          </p>
                        </div>
                      </Link>
                      <Link
                        to="/plugins"
                        className="flex items-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-4 transition-all hover:border-(--color-primary)/40 hover:bg-(--color-primary)/5"
                      >
                        <Sparkles size={20} className="text-purple-400" />
                        <div>
                          <p className="font-medium text-sm">{t('nav.plugins', 'Plugins')}</p>
                          <p className="text-(--color-muted) text-xs">
                            {t('settings.pluginsLinkDesc', 'Plugin lifecycle & services')}
                          </p>
                        </div>
                      </Link>
                      <Link
                        to="/devices"
                        className="flex items-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-4 transition-all hover:border-(--color-primary)/40 hover:bg-(--color-primary)/5"
                      >
                        <HardDrive size={20} className="text-orange-400" />
                        <div>
                          <p className="font-medium text-sm">{t('nav.hardware', 'Hardware')}</p>
                          <p className="text-(--color-muted) text-xs">
                            {t('settings.hardwareLinkDesc', '120+ supported devices')}
                          </p>
                        </div>
                      </Link>
                    </div>
                  </section>
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
