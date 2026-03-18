import { useState, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  Settings as SettingsIcon,
  Palette,
  Server,
  Zap,
  Shield,
  Database,
  Bell,
  Gauge,
  Sparkles,
  Cable,
  Cpu,
  Puzzle,
  HelpCircle,
  ChevronRight,
  Wrench,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { PageCrossLinks } from '../components/ui/PageCrossLinks';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { PageTour, type TourStep } from '../components/ui/PageTour';

// ─── Lazy-load existing pages ────────────────────────────────────────
const SettingsPage = lazy(() => import('./Settings').then((m) => ({ default: m.Settings })));
const PluginsPage = lazy(() => import('./PluginsPage'));
const HelpPage = lazy(() => import('./Help').then((m) => ({ default: m.Help })));

// ─── Tab definitions ─────────────────────────────────────────────────

type SettingsSection = 'settings' | 'plugins' | 'help';

function TabFallback() {
  return (
    <div className="flex min-h-[30vh] items-center justify-center" role="status">
      <div className="flex flex-col items-center gap-3">
        <div
          className="cyber-shimmer h-6 w-6 animate-spin rounded-full border-2 border-(--color-primary) border-t-transparent"
          aria-hidden="true"
        />
        <span className="text-xs text-(--color-muted)">Laden…</span>
      </div>
    </div>
  );
}

// ─── Unified Settings & Plugins Page ─────────────────────────────────

function SettingsUnifiedComponent() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const tourSteps: TourStep[] = [
    {
      icon: SettingsIcon,
      titleKey: 'tour.settings.overviewTitle',
      descKey: 'tour.settings.overviewDesc',
      color: '#38bdf8',
    },
    {
      icon: Puzzle,
      titleKey: 'tour.settings.pluginsTitle',
      descKey: 'tour.settings.pluginsDesc',
      color: '#a855f6',
    },
    {
      icon: Wrench,
      titleKey: 'tour.settings.advancedTitle',
      descKey: 'tour.settings.advancedDesc',
      color: '#ff8800',
    },
  ];

  // Derive initial section from URL
  const sectionParam = searchParams.get('section') as SettingsSection | null;
  const validSections: SettingsSection[] = ['settings', 'plugins', 'help'];
  const initialSection =
    sectionParam && validSections.includes(sectionParam) ? sectionParam : 'settings';
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);

  const handleSectionChange = (section: SettingsSection) => {
    setActiveSection(section);
    if (section === 'settings') {
      // Remove section param, Settings uses its own ?tab= param
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ section }, { replace: true });
    }
  };

  const sections: {
    key: SettingsSection;
    icon: React.ReactNode;
    label: string;
    desc: string;
    badge?: string;
  }[] = [
    {
      key: 'settings',
      icon: <SettingsIcon size={20} />,
      label: t('settingsUnified.configSection'),
      desc: t('settingsUnified.configSectionDesc'),
    },
    {
      key: 'plugins',
      icon: <Puzzle size={20} />,
      label: t('settingsUnified.pluginsSection'),
      desc: t('settingsUnified.pluginsSectionDesc'),
      badge: t('settingsUnified.marketplace'),
    },
    {
      key: 'help',
      icon: <HelpCircle size={20} />,
      label: t('settingsUnified.helpSection'),
      desc: t('settingsUnified.helpSectionDesc'),
    },
  ];

  // Quick-access tiles for the Settings sub-tabs
  const quickTiles = [
    {
      icon: <Palette size={16} />,
      label: t('settings.appearance', 'Appearance'),
      tab: 'appearance',
      color: 'text-pink-400',
      bg: 'bg-pink-500/10',
    },
    {
      icon: <Server size={16} />,
      label: t('settings.system'),
      tab: 'system',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      icon: <Zap size={16} />,
      label: t('settings.energyShort', 'Energy'),
      tab: 'energy',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
    },
    {
      icon: <Cable size={16} />,
      label: t('adapterConfig.tabLabel', 'Adapters'),
      tab: 'adapters',
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
    {
      icon: <Cpu size={16} />,
      label: t('settings.controllersTab', 'Controllers'),
      tab: 'controllers',
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
    },
    {
      icon: <Shield size={16} />,
      label: t('settings.security'),
      tab: 'security',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: <Database size={16} />,
      label: t('settings.storageShort', 'Storage'),
      tab: 'storage',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      icon: <Bell size={16} />,
      label: t('settings.notifications', 'Notifications'),
      tab: 'notifications',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
    {
      icon: <Gauge size={16} />,
      label: t('settings.advanced', 'Advanced'),
      tab: 'advanced',
      color: 'text-gray-400',
      bg: 'bg-gray-500/10',
    },
    {
      icon: <Sparkles size={16} />,
      label: t('settings.aiTab', 'AI Providers'),
      tab: 'ai',
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <PageTour tourId="settings" steps={tourSteps} />

      <PageHeader
        title={t('settingsUnified.title')}
        subtitle={t('settingsUnified.subtitle')}
        icon={<SettingsIcon size={22} aria-hidden="true" />}
      />

      {/* ─── Vertical Accordion Navigation ─────────────────────────── */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left: Section Accordion */}
        <nav className="w-full shrink-0 lg:w-64" aria-label={t('settingsUnified.title')}>
          <div className="mb-2 flex items-center gap-2 px-1">
            <span className="text-[10px] font-semibold tracking-widest text-(--color-muted) uppercase">
              {t('settingsUnified.sections', 'Bereiche')}
            </span>
            <HelpTooltip
              content={t(
                'tour.settings.navHelp',
                'Wähle einen Bereich aus, um Einstellungen, Plugins oder Hilfe zu öffnen.',
              )}
            />
          </div>
          <div className="space-y-2">
            {sections.map((section) => (
              <motion.button
                key={section.key}
                onClick={() => handleSectionChange(section.key)}
                className={`group flex w-full items-center gap-3 rounded-2xl p-4 text-left transition-all duration-200 ${
                  activeSection === section.key
                    ? 'glass-panel-strong border border-(--color-primary)/20 shadow-[0_0_15px_var(--color-primary)/8]'
                    : 'glass-panel border border-transparent hover:border-(--color-border)'
                }`}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    activeSection === section.key
                      ? 'bg-(--color-primary)/15 text-(--color-primary)'
                      : 'bg-white/5 text-(--color-muted) group-hover:text-(--color-text)'
                  }`}
                >
                  {section.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        activeSection === section.key
                          ? 'text-(--color-primary)'
                          : 'text-(--color-text)'
                      }`}
                    >
                      {section.label}
                    </span>
                    {section.badge && (
                      <span className="rounded-full bg-(--color-primary)/10 px-2 py-0.5 text-[9px] font-semibold tracking-wider text-(--color-primary) uppercase">
                        {section.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-(--color-muted)">{section.desc}</p>
                </div>
                <ChevronRight
                  size={14}
                  className={`shrink-0 transition-transform ${
                    activeSection === section.key
                      ? 'rotate-90 text-(--color-primary)'
                      : 'text-(--color-muted) group-hover:text-(--color-text)'
                  }`}
                  aria-hidden="true"
                />
              </motion.button>
            ))}
          </div>

          {/* Quick Access Tiles (below nav on desktop, visible when settings section active) */}
          <AnimatePresence>
            {activeSection === 'settings' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="mt-4 hidden overflow-hidden lg:block"
              >
                <h3 className="mb-2 px-1 text-[10px] font-semibold tracking-widest text-(--color-muted) uppercase">
                  {t('settingsUnified.quickAccess')}
                </h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {quickTiles.map((tile) => (
                    <button
                      key={tile.tab}
                      onClick={() => {
                        handleSectionChange('settings');
                        // Navigate to the specific settings tab via URL params
                        setSearchParams({ tab: tile.tab }, { replace: true });
                      }}
                      className="focus-ring flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition-colors hover:bg-white/5"
                    >
                      <span className={`${tile.color}`}>{tile.icon}</span>
                      <span className="truncate text-(--color-muted)">{tile.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Right: Content Area */}
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            {activeSection === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <Suspense fallback={<TabFallback />}>
                  <SettingsPage />
                </Suspense>
              </motion.div>
            )}

            {activeSection === 'plugins' && (
              <motion.div
                key="plugins"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <Suspense fallback={<TabFallback />}>
                  <PluginsPage />
                </Suspense>
              </motion.div>
            )}

            {activeSection === 'help' && (
              <motion.div
                key="help"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <Suspense fallback={<TabFallback />}>
                  <HelpPage />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <PageCrossLinks />
    </div>
  );
}

export default SettingsUnifiedComponent;
