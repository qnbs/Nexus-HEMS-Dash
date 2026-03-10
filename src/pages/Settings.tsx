import { useState, type FormEvent } from 'react';
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
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { themeDefinitions, themeOrder, type ThemeName } from '../design-tokens';
import { useAppStore } from '../store';
import { resolveTheme, type ThemePreference } from '../lib/theme';

type SettingsTab = 'appearance' | 'system' | 'energy' | 'security' | 'storage' | 'notifications' | 'advanced';

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
      className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all duration-300 focus-ring ${
        isActive
          ? 'border-[color:var(--color-primary)] bg-[color:var(--color-primary)]/10 shadow-[0_0_20px_var(--color-primary)/15]'
          : 'border-[color:var(--color-border)] bg-[color:var(--color-surface)] hover:border-[color:var(--color-primary)]/40'
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
          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--color-primary)] text-white"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <Check className="h-3 w-3" />
        </motion.div>
      )}
    </motion.button>
  );
}

function ToggleSwitch({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; id: string }) {
  return (
    <label htmlFor={id} className="relative inline-flex cursor-pointer items-center">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <span className="sr-only">{label}</span>
      <div className="h-6 w-11 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] peer-checked:bg-[color:var(--color-primary)] peer-focus:ring-2 peer-focus:ring-[color:var(--color-primary)]/30 transition-colors duration-300 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:duration-300 peer-checked:after:translate-x-5" />
    </label>
  );
}

export function Settings() {
  const { t } = useTranslation();
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [confirmReset, setConfirmReset] = useState(false);

  // Theme state
  const theme = useAppStore((s) => s.theme);
  const themePreference = useAppStore((s) => s.themePreference);
  const setThemePreference = useAppStore((s) => s.setThemePreference);
  const setTheme = useAppStore((s) => s.setTheme);
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
    const data = JSON.stringify(settings, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nexus-hems-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        updateSettings(data);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch {
        console.error('Invalid settings file');
      }
    };
    input.click();
  };

  const tabs: { key: SettingsTab; icon: React.ReactNode; label: string }[] = [
    { key: 'appearance', icon: <Palette size={18} />, label: t('settings.appearance', 'Appearance') },
    { key: 'system', icon: <Server size={18} />, label: t('settings.system') },
    { key: 'energy', icon: <Zap size={18} />, label: t('settings.energyShort', 'Energy') },
    { key: 'security', icon: <Shield size={18} />, label: t('settings.security') },
    { key: 'storage', icon: <Database size={18} />, label: t('settings.storageShort', 'Storage') },
    { key: 'notifications', icon: <Bell size={18} />, label: t('settings.notifications', 'Notifications') },
    { key: 'advanced', icon: <Gauge size={18} />, label: t('settings.advanced', 'Advanced') },
  ];

  const isSystem = themePreference === 'system';

  const inputClass = 'w-full bg-[color:var(--color-surface)] border border-[color:var(--color-border)] rounded-xl px-4 py-2.5 text-[color:var(--color-text)] focus:outline-none focus:border-[color:var(--color-primary)]/70 focus:ring-2 focus:ring-[color:var(--color-primary)]/20 transition-all duration-300 placeholder:text-[color:var(--color-muted)]';
  const sectionClass = 'glass-panel-strong p-6 rounded-2xl space-y-6';
  const sectionHeaderClass = 'text-lg font-medium flex items-center gap-2 border-b border-[color:var(--color-border)] pb-4';

  return (
    <motion.div
      className="max-w-5xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Page Header */}
      <motion.div
        className="flex items-center justify-between gap-3 mb-8"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-primary)]/10"
            animate={{ rotate: [0, 90, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <SettingsIcon className="text-[color:var(--color-primary)]" size={22} />
          </motion.div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight fluid-text-2xl">{t('settings.title')}</h1>
            <p className="text-sm text-[color:var(--color-muted)]">{t('settings.subtitle', 'Configure your HEMS dashboard')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={handleExportSettings}
            className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-3 py-2 text-sm transition-all hover:bg-[color:var(--color-primary)]/10 focus-ring"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title={t('settings.exportSettings', 'Export settings')}
          >
            <Download size={16} />
            <span className="hidden sm:inline">{t('settings.export', 'Export')}</span>
          </motion.button>
          <motion.button
            onClick={handleImportSettings}
            className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-3 py-2 text-sm transition-all hover:bg-[color:var(--color-primary)]/10 focus-ring"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title={t('settings.importSettings', 'Import settings')}
          >
            <Upload size={16} />
            <span className="hidden sm:inline">{t('settings.import', 'Import')}</span>
          </motion.button>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <nav className="w-full lg:w-56 shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0" role="tablist" aria-label={t('settings.title')}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                role="tab"
                aria-selected={activeTab === tab.key}
                aria-controls={`tabpanel-${tab.key}`}
                id={`tab-${tab.key}`}
                className={`flex items-center gap-2.5 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-[color:var(--color-primary)]/15 text-[color:var(--color-primary)] shadow-[inset_0_0_0_1px_var(--color-primary)/20]'
                    : 'text-[color:var(--color-muted)] hover:bg-white/5 hover:text-[color:var(--color-text)]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
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
                      <Palette size={20} className="text-[color:var(--color-primary)]" />
                      {t('settings.themeTitle', 'Color Theme')}
                    </h2>

                    {/* System Theme Toggle */}
                    <div className="flex items-center justify-between rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
                      <div className="flex items-center gap-3">
                        <Monitor size={20} className="text-[color:var(--color-muted)]" />
                        <div>
                          <p className="font-medium text-sm">{t('settings.systemTheme', 'Follow system preference')}</p>
                          <p className="text-xs text-[color:var(--color-muted)]">{t('settings.systemThemeHint', 'Automatically switch between light and dark themes')}</p>
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                    <div className="flex items-center gap-2 rounded-lg bg-[color:var(--color-primary)]/5 border border-[color:var(--color-primary)]/20 px-4 py-3 text-sm">
                      <Info size={16} className="text-[color:var(--color-primary)] shrink-0" />
                      <span>
                        {t('settings.activeTheme', 'Active')}: <strong>{themeDefinitions[theme].label}</strong>
                        {isSystem && <span className="text-[color:var(--color-muted)]"> ({t('common.systemTheme')})</span>}
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
                          <p className="font-medium text-sm">{t('settings.animations', 'Animations')}</p>
                          <p className="text-xs text-[color:var(--color-muted)]">{t('settings.animationsHint', 'Enable smooth transitions and motion effects')}</p>
                        </div>
                        <ToggleSwitch id="animations" checked={true} onChange={() => {}} label={t('settings.animations', 'Animations')} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{t('settings.compactMode', 'Compact mode')}</p>
                          <p className="text-xs text-[color:var(--color-muted)]">{t('settings.compactModeHint', 'Reduce spacing for more content on screen')}</p>
                        </div>
                        <ToggleSwitch id="compact" checked={false} onChange={() => {}} label={t('settings.compactMode', 'Compact mode')} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{t('settings.glowEffects', 'Glow effects')}</p>
                          <p className="text-xs text-[color:var(--color-muted)]">{t('settings.glowEffectsHint', 'Neon glow and glassmorphism effects')}</p>
                        </div>
                        <ToggleSwitch id="glow" checked={true} onChange={() => {}} label={t('settings.glowEffects', 'Glow effects')} />
                      </div>
                    </div>
                  </section>

                  {/* Language */}
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <Globe size={20} className="text-cyan-400" />
                      {t('settings.languageTitle', 'Language & Region')}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('common.language')}</label>
                        <select className={inputClass} defaultValue="de">
                          <option value="de">Deutsch</option>
                          <option value="en">English</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.units', 'Units')}</label>
                        <select className={inputClass} defaultValue="metric">
                          <option value="metric">{t('settings.metric', 'Metric (kW, kWh, °C)')}</option>
                          <option value="imperial">{t('settings.imperial', 'Imperial (BTU, °F)')}</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.dateFormat', 'Date format')}</label>
                        <select className={inputClass} defaultValue="dd.mm.yyyy">
                          <option value="dd.mm.yyyy">DD.MM.YYYY</option>
                          <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                          <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.currency', 'Currency')}</label>
                        <select className={inputClass} defaultValue="eur">
                          <option value="eur">€ Euro</option>
                          <option value="chf">CHF Franken</option>
                          <option value="gbp">£ Pound</option>
                        </select>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.victronIp')}</label>
                        <input type="text" defaultValue={settings.victronIp} className={inputClass} placeholder="192.168.1.100" />
                        <p className="text-xs text-[color:var(--color-muted)]">{t('settings.victronIpHint', 'IP address of your Victron Cerbo GX')}</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.knxIp')}</label>
                        <input type="text" defaultValue={settings.knxIp} className={inputClass} placeholder="192.168.1.101" />
                        <p className="text-xs text-[color:var(--color-muted)]">{t('settings.knxIpHint', 'IP address of your KNX IP router')}</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.wsPort')}</label>
                        <input type="number" defaultValue={settings.wsPort} className={inputClass} min={1} max={65535} />
                        <p className="text-xs text-[color:var(--color-muted)]">{t('settings.wsPortHint', 'Node-RED WebSocket port (default: 1880)')}</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.refreshRate')}</label>
                        <input type="number" defaultValue={settings.refreshRateMs} className={inputClass} min={500} max={30000} step={100} />
                        <p className="text-xs text-[color:var(--color-muted)]">{t('settings.refreshRateHint', 'Data polling interval in milliseconds')}</p>
                      </div>
                    </div>
                  </section>

                  {/* Connection Status */}
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <Wifi size={20} className="text-emerald-400" />
                      {t('settings.connectionStatus', 'Connection Status')}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { name: t('devices.cerboGx'), status: true },
                        { name: t('devices.knxRouter'), status: false },
                        { name: 'Node-RED', status: true },
                      ].map((device) => (
                        <div key={device.name} className="flex items-center gap-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3">
                          <span className={`h-2.5 w-2.5 rounded-full ${device.status ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-rose-400'}`} />
                          <div>
                            <p className="text-sm font-medium">{device.name}</p>
                            <p className="text-xs text-[color:var(--color-muted)]">{device.status ? t('common.connected') : t('common.disconnected')}</p>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('mqtt.brokerUrl')}</label>
                        <input type="text" className={inputClass} placeholder="mqtt://192.168.1.50" />
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
                        <p className="font-medium text-sm">{t('mqtt.autoDiscovery')}</p>
                        <p className="text-xs text-[color:var(--color-muted)]">{t('settings.mqttAutoHint', 'Automatically discover Home Assistant devices')}</p>
                      </div>
                      <ToggleSwitch id="mqtt-auto" checked={true} onChange={() => {}} label={t('mqtt.autoDiscovery')} />
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.tariffProvider')}</label>
                        <select className={inputClass} defaultValue={settings.tariffProvider}>
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
                            defaultValue="••••••••••••••••"
                            className={inputClass + ' pr-10'}
                          />
                          <button
                            type="button"
                            onClick={() => toggleTokenVisibility('tariff')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"
                            aria-label={showTokens['tariff'] ? t('settings.hideToken') : t('settings.showToken')}
                          >
                            {showTokens['tariff'] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.chargeThreshold')}</label>
                        <div className="flex items-center gap-3">
                          <input type="range" min={0.05} max={0.50} step={0.01} defaultValue={settings.chargeThreshold} className="flex-1 accent-[color:var(--color-primary)]" aria-valuetext={`${settings.chargeThreshold.toFixed(2)} €/kWh`} />
                          <span className="text-sm font-mono w-16 text-right">{settings.chargeThreshold.toFixed(2)} €</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.maxGrid')}</label>
                        <div className="flex items-center gap-3">
                          <input type="range" min={1.0} max={11.0} step={0.1} defaultValue={settings.maxGridImportKw} className="flex-1 accent-[color:var(--color-primary)]" aria-valuetext={`${settings.maxGridImportKw.toFixed(1)} kW`} />
                          <span className="text-sm font-mono w-16 text-right">{settings.maxGridImportKw.toFixed(1)} kW</span>
                        </div>
                        <p className="text-xs text-[color:var(--color-muted)]">{t('settings.maxGridHint', '§14a EnWG limit: 4.2 kW for controllable consumers')}</p>
                      </div>
                    </div>
                  </section>

                  {/* PV System */}
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <Zap size={20} className="text-amber-400" />
                      {t('settings.pvSystem', 'PV System')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.pvPeakPower', 'Peak power (kWp)')}</label>
                        <input type="number" step={0.1} defaultValue={10.0} className={inputClass} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.pvOrientation', 'Orientation')}</label>
                        <select className={inputClass} defaultValue="south">
                          <option value="south">{t('settings.south', 'South')}</option>
                          <option value="east-west">{t('settings.eastWest', 'East/West')}</option>
                          <option value="east">{t('settings.east', 'East')}</option>
                          <option value="west">{t('settings.west', 'West')}</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.pvTilt', 'Tilt angle (°)')}</label>
                        <input type="number" min={0} max={90} defaultValue={30} className={inputClass} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.inverterType', 'Inverter type')}</label>
                        <select className={inputClass} defaultValue="victron">
                          <option value="victron">Victron MultiPlus-II</option>
                          <option value="fronius">Fronius Symo</option>
                          <option value="sma">SMA Sunny Boy/Tripower</option>
                          <option value="huawei">Huawei SUN2000</option>
                        </select>
                      </div>
                    </div>
                  </section>

                  {/* Battery Config */}
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <HardDrive size={20} className="text-purple-400" />
                      {t('settings.batteryConfig', 'Battery Configuration')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.batteryCapacity', 'Capacity (kWh)')}</label>
                        <input type="number" step={0.1} defaultValue={10.0} className={inputClass} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.batteryMinSoC', 'Minimum SoC (%)')}</label>
                        <input type="number" min={5} max={50} defaultValue={10} className={inputClass} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.batteryMaxCharge', 'Max charge rate (kW)')}</label>
                        <input type="number" step={0.1} defaultValue={5.0} className={inputClass} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.batteryStrategy', 'Default strategy')}</label>
                        <select className={inputClass} defaultValue="self-consumption">
                          <option value="self-consumption">{t('control.selfConsumption')}</option>
                          <option value="force-charge">{t('control.forceCharge')}</option>
                          <option value="auto">{t('control.auto')}</option>
                        </select>
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
                      <div className="flex items-center justify-between p-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
                        <div>
                          <p className="font-medium text-sm">{t('settings.mtls')}</p>
                          <p className="text-xs text-[color:var(--color-muted)]">{t('settings.mtlsHint')}</p>
                        </div>
                        <ToggleSwitch id="mtls" checked={settings.mtls} onChange={(v) => updateSettings({ mtls: v })} label={t('settings.mtls')} />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
                        <div>
                          <p className="font-medium text-sm">{t('settings.telemetry')}</p>
                          <p className="text-xs text-[color:var(--color-muted)]">{t('settings.telemetryHint')}</p>
                        </div>
                        <ToggleSwitch id="telemetry" checked={settings.telemetryDisabled} onChange={(v) => updateSettings({ telemetryDisabled: v })} label={t('settings.telemetry')} />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
                        <div>
                          <p className="font-medium text-sm">{t('settings.twoFactor')}</p>
                          <p className="text-xs text-[color:var(--color-muted)]">{t('settings.twoFactorHint')}</p>
                        </div>
                        <ToggleSwitch id="2fa" checked={settings.twoFactor} onChange={(v) => updateSettings({ twoFactor: v })} label={t('settings.twoFactor')} />
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
                        <Shield size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                        <div className="text-sm space-y-1">
                          <p className="font-medium text-emerald-400">{t('settings.encryptionActive', 'End-to-end encryption active')}</p>
                          <p className="text-[color:var(--color-muted)]">{t('settings.encryptionDesc', 'All API keys are stored with AES-GCM 256-bit encryption. WebSocket connections use TLS. Local data stays in your browser.')}</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3">
                        <p className="text-xs text-[color:var(--color-muted)]">{t('settings.certStatus', 'Certificate Status')}</p>
                        <p className="text-sm font-medium text-emerald-400">{t('settings.certValid', 'Valid')}</p>
                      </div>
                      <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3">
                        <p className="text-xs text-[color:var(--color-muted)]">{t('settings.encType', 'Encryption')}</p>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.influxUrl')}</label>
                        <input type="text" defaultValue={settings.influxUrl} className={inputClass} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.influxToken')}</label>
                        <div className="relative">
                          <input
                            type={showTokens['influx'] ? 'text' : 'password'}
                            defaultValue={settings.influxToken}
                            className={inputClass + ' pr-10'}
                          />
                          <button
                            type="button"
                            onClick={() => toggleTokenVisibility('influx')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"
                            aria-label={showTokens['influx'] ? t('settings.hideToken') : t('settings.showToken')}
                          >
                            {showTokens['influx'] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('settings.historyDays')}</label>
                        <input type="number" defaultValue={settings.historyDays} className={inputClass} min={1} max={365} />
                        <p className="text-xs text-[color:var(--color-muted)]">{t('settings.historyHint')}</p>
                      </div>
                    </div>
                  </section>

                  {/* Local Storage Info */}
                  <section className={sectionClass}>
                    <h2 className={sectionHeaderClass}>
                      <HardDrive size={20} className="text-cyan-400" />
                      {t('settings.localStorage', 'Local Storage')}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 text-center">
                        <p className="text-2xl font-bold text-[color:var(--color-primary)]">~2.4</p>
                        <p className="text-xs text-[color:var(--color-muted)]">MB IndexedDB</p>
                      </div>
                      <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 text-center">
                        <p className="text-2xl font-bold text-[color:var(--color-secondary)]">847</p>
                        <p className="text-xs text-[color:var(--color-muted)]">{t('settings.snapshots', 'Snapshots')}</p>
                      </div>
                      <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 text-center">
                        <p className="text-2xl font-bold text-amber-400">30</p>
                        <p className="text-xs text-[color:var(--color-muted)]">{t('settings.daysRetention', 'Days retention')}</p>
                      </div>
                    </div>
                    <motion.button
                      type="button"
                      className="flex items-center gap-2 text-sm text-rose-400 hover:text-rose-300 transition-colors"
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
                      <div className="flex items-center justify-between p-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
                        <div>
                          <p className="font-medium text-sm">{t('settings.pushNotifications', 'Push notifications')}</p>
                          <p className="text-xs text-[color:var(--color-muted)]">{t('settings.pushHint', 'Receive alerts for important system events')}</p>
                        </div>
                        <ToggleSwitch id="push" checked={true} onChange={() => {}} label={t('settings.pushNotifications', 'Push notifications')} />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
                        <div>
                          <p className="font-medium text-sm">{t('settings.priceAlerts', 'Price alerts')}</p>
                          <p className="text-xs text-[color:var(--color-muted)]">{t('settings.priceAlertsHint', 'Notify when electricity price drops below threshold')}</p>
                        </div>
                        <ToggleSwitch id="price-alerts" checked={true} onChange={() => {}} label={t('settings.priceAlerts', 'Price alerts')} />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
                        <div>
                          <p className="font-medium text-sm">{t('settings.batteryAlerts', 'Battery alerts')}</p>
                          <p className="text-xs text-[color:var(--color-muted)]">{t('settings.batteryAlertsHint', 'Alert when battery SoC falls below minimum')}</p>
                        </div>
                        <ToggleSwitch id="battery-alerts" checked={true} onChange={() => {}} label={t('settings.batteryAlerts', 'Battery alerts')} />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
                        <div>
                          <p className="font-medium text-sm">{t('settings.gridAlerts', 'Grid anomaly alerts')}</p>
                          <p className="text-xs text-[color:var(--color-muted)]">{t('settings.gridAlertsHint', 'Alert on voltage fluctuations or power outages')}</p>
                        </div>
                        <ToggleSwitch id="grid-alerts" checked={false} onChange={() => {}} label={t('settings.gridAlerts', 'Grid anomaly alerts')} />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
                        <div>
                          <p className="font-medium text-sm">{t('settings.updateNotifications', 'Update notifications')}</p>
                          <p className="text-xs text-[color:var(--color-muted)]">{t('settings.updateHint', 'Notify when a new app version is available')}</p>
                        </div>
                        <ToggleSwitch id="update-notif" checked={true} onChange={() => {}} label={t('settings.updateNotifications', 'Update notifications')} />
                      </div>
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
                      <div className="flex items-center justify-between p-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
                        <div>
                          <p className="font-medium text-sm">{t('settings.debugMode', 'Debug mode')}</p>
                          <p className="text-xs text-[color:var(--color-muted)]">{t('settings.debugHint', 'Show detailed logs and developer tools')}</p>
                        </div>
                        <ToggleSwitch id="debug" checked={false} onChange={() => {}} label={t('settings.debugMode', 'Debug mode')} />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
                        <div>
                          <p className="font-medium text-sm">{t('settings.experimentalFeatures', 'Experimental features')}</p>
                          <p className="text-xs text-[color:var(--color-muted)]">{t('settings.experimentalHint', 'Enable beta features that may be unstable')}</p>
                        </div>
                        <ToggleSwitch id="experimental" checked={false} onChange={() => {}} label={t('settings.experimentalFeatures', 'Experimental features')} />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
                        <div>
                          <p className="font-medium text-sm">{t('settings.performanceMode', 'Performance mode')}</p>
                          <p className="text-xs text-[color:var(--color-muted)]">{t('settings.performanceHint', 'Reduce animations and effects for better performance')}</p>
                        </div>
                        <ToggleSwitch id="performance" checked={false} onChange={() => {}} label={t('settings.performanceMode', 'Performance mode')} />
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
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm text-rose-400">{t('settings.resetAll', 'Reset all settings')}</p>
                          <p className="text-xs text-[color:var(--color-muted)]">{t('settings.resetHint', 'This will reset all settings to their default values')}</p>
                        </div>
                        {!confirmReset ? (
                          <motion.button
                            type="button"
                            onClick={() => setConfirmReset(true)}
                            className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/20 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <RotateCcw size={16} />
                            {t('settings.reset', 'Reset')}
                          </motion.button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setConfirmReset(false)}
                              className="rounded-xl border border-[color:var(--color-border)] px-3 py-2 text-sm hover:bg-white/5 transition-colors"
                            >
                              {t('aiSettings.cancel', 'Cancel')}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmReset(false);
                                // Reset logic here
                              }}
                              className="rounded-xl bg-rose-500 px-3 py-2 text-sm text-white hover:bg-rose-600 transition-colors"
                            >
                              {t('settings.confirmReset', 'Confirm reset')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
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
    </motion.div>
  );
}
