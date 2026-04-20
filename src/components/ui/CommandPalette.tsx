import {
  Activity,
  BarChart3,
  Car,
  FileDown,
  HelpCircle,
  Home,
  Monitor,
  Search,
  SearchX,
  Settings,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from './EmptyState';

export interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  category: 'navigation' | 'action' | 'device';
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOptimize?: () => void;
  onExportReport?: () => void;
}

// ─── Module-level icon constants ────────────────────────────────────────────
// Allocated once at module load; never re-created on re-renders.
// React Compiler can treat these as stable references.
const ICON_SPARKLES = <Sparkles className="h-5 w-5" />;
const ICON_SPARKLES_PURPLE = <Sparkles className="h-5 w-5 text-purple-400" />;
const ICON_SPARKLES_CYAN = <Sparkles className="h-5 w-5 text-cyan-400" />;
const ICON_FILEDOWN = <FileDown className="h-5 w-5" />;
const ICON_HOME = <Home className="h-5 w-5" />;
const ICON_ACTIVITY = <Activity className="h-5 w-5" />;
const ICON_CAR = <Car className="h-5 w-5 text-green-400" />;
const ICON_TRENDING_UP = <TrendingUp className="h-5 w-5 text-orange-400" />;
const ICON_BAR_CHART = <BarChart3 className="h-5 w-5" />;
const ICON_MONITOR = <Monitor className="h-5 w-5" />;
const ICON_SETTINGS = <Settings className="h-5 w-5" />;
const ICON_HELP = <HelpCircle className="h-5 w-5" />;
const ICON_ZAP = <Zap className="h-5 w-5 text-red-400" />;

export function CommandPalette({
  isOpen,
  onClose,
  onOptimize,
  onExportReport,
}: CommandPaletteProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: Command[] = [
    // Actions
    {
      id: 'optimize',
      label: t('command.optimizeNow', 'Optimize Energy Now'),
      icon: ICON_SPARKLES,
      action: () => {
        onOptimize?.();
        onClose();
      },
      category: 'action',
      keywords: ['ai', 'optimize', 'energy', 'ki'],
    },
    {
      id: 'export-report',
      label: t('command.exportReport', 'Export Monthly Report'),
      icon: ICON_FILEDOWN,
      action: () => {
        onExportReport?.();
        onClose();
      },
      category: 'action',
      keywords: ['pdf', 'report', 'export', 'download'],
    },

    // Navigation
    {
      id: 'nav-dashboard',
      label: t('nav.home', 'Overview'),
      icon: ICON_HOME,
      action: () => {
        navigate('/');
        onClose();
      },
      category: 'navigation',
      keywords: ['home', 'start', 'overview', 'übersicht'],
    },
    {
      id: 'nav-energy-flow',
      label: t('nav.energyFlow', 'Energy Flow'),
      icon: ICON_ACTIVITY,
      action: () => {
        navigate('/energy-flow');
        onClose();
      },
      category: 'navigation',
      keywords: ['sankey', 'flow', 'energiefluss'],
    },
    {
      id: 'nav-devices',
      label: t('nav.devicesOverview', 'Devices & Automation'),
      icon: ICON_CAR,
      action: () => {
        navigate('/devices');
        onClose();
      },
      category: 'navigation',
      keywords: ['wallbox', 'car', 'ev', 'floorplan', 'knx', 'hardware', 'geräte'],
    },
    {
      id: 'nav-ai',
      label: t('nav.aiOptimizer', 'AI Optimizer'),
      icon: ICON_SPARKLES_PURPLE,
      action: () => {
        navigate('/optimization-ai');
        onClose();
      },
      category: 'navigation',
      keywords: ['ai', 'optimize', 'ki'],
    },
    {
      id: 'nav-ai-settings',
      label: t('command.aiSettings', 'AI Provider Keys'),
      icon: ICON_SPARKLES_CYAN,
      action: () => {
        navigate('/settings/ai');
        onClose();
      },
      category: 'navigation',
      keywords: ['api', 'key', 'provider', 'byok', 'schlüssel'],
    },
    {
      id: 'nav-tariffs',
      label: t('nav.tariffs', 'Tariffs'),
      icon: ICON_TRENDING_UP,
      action: () => {
        navigate('/tariffs');
        onClose();
      },
      category: 'navigation',
      keywords: ['price', 'tibber', 'awattar', 'tarif', 'preis'],
    },
    {
      id: 'nav-analytics',
      label: t('nav.analytics', 'Analytics'),
      icon: ICON_BAR_CHART,
      action: () => {
        navigate('/analytics');
        onClose();
      },
      category: 'navigation',
      keywords: ['report', 'chart', 'bericht', 'analyse'],
    },
    {
      id: 'nav-monitoring',
      label: t('nav.monitoring', 'Monitoring'),
      icon: ICON_MONITOR,
      action: () => {
        navigate('/monitoring');
        onClose();
      },
      category: 'navigation',
      keywords: ['health', 'status', 'adapter', 'gesundheit'],
    },
    {
      id: 'nav-settings',
      label: t('nav.settings', 'Settings'),
      icon: ICON_SETTINGS,
      action: () => {
        navigate('/settings');
        onClose();
      },
      category: 'navigation',
      keywords: ['config', 'options', 'einstellungen'],
    },
    {
      id: 'nav-help',
      label: t('nav.help', 'Help'),
      icon: ICON_HELP,
      action: () => {
        navigate('/help');
        onClose();
      },
      category: 'navigation',
      keywords: ['docs', 'documentation', 'support', 'hilfe'],
    },

    // Devices
    {
      id: 'device-grid',
      label: t('command.viewGrid', 'View Grid Status'),
      icon: ICON_ZAP,
      action: () => {
        navigate('/energy-flow');
        onClose();
      },
      category: 'device',
      keywords: ['import', 'export', 'netzbezug'],
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    const searchLower = search.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.keywords?.some((k) => k.toLowerCase().includes(searchLower))
    );
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        filteredCommands[selectedIndex]?.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  // Reset search & selection whenever the palette opens.
  // This is a legitimate "sync state on prop change" pattern.
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="z-modal-backdrop fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="z-modal fixed top-[10%] left-1/2 mx-4 w-full max-w-2xl -translate-x-1/2 overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-2xl backdrop-blur-3xl sm:top-1/4 sm:mx-0"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cmd-palette-title"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 border-b border-(--color-border) p-4">
              <Search className="h-5 w-5 text-(--color-muted)" aria-hidden="true" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('command.searchPlaceholder', 'Search commands…')}
                className="flex-1 bg-transparent text-(--color-text) outline-none placeholder:text-(--color-muted)"
                autoFocus={window.innerWidth >= 1024}
                role="combobox"
                aria-expanded="true"
                aria-controls="command-listbox"
                aria-activedescendant={
                  filteredCommands[selectedIndex]
                    ? `cmd-${filteredCommands[selectedIndex].id}`
                    : undefined
                }
                aria-autocomplete="list"
                aria-label={t('accessibility.searchCommands', 'Search commands')}
              />
              <span id="cmd-palette-title" className="sr-only">
                {t('accessibility.commandPaletteTitle', 'Command palette')}
              </span>
              <kbd className="rounded bg-(--color-surface-strong) px-2 py-1 text-xs text-(--color-muted)">
                ESC
              </kbd>
            </div>

            {/* Commands List */}
            <div className="max-h-96 overflow-y-auto p-2">
              {filteredCommands.length === 0 ? (
                <div role="status" aria-live="polite">
                  <EmptyState icon={SearchX} title={t('command.noResults', 'No commands found')} />
                </div>
              ) : (
                <div className="space-y-1" role="listbox" id="command-listbox">
                  {filteredCommands.map((cmd, index) => (
                    <motion.button
                      key={cmd.id}
                      id={`cmd-${cmd.id}`}
                      onClick={cmd.action}
                      onMouseEnter={() => setSelectedIndex(index)}
                      role="option"
                      aria-selected={index === selectedIndex}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                        index === selectedIndex
                          ? 'bg-(--color-primary)/20 text-(--color-text)'
                          : 'text-(--color-muted) hover:bg-(--color-surface-strong)'
                      }`}
                      whileHover={{ x: 4 }}
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          index === selectedIndex
                            ? 'bg-(--color-primary)/30'
                            : 'bg-(--color-surface)'
                        }`}
                      >
                        {cmd.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{cmd.label}</p>
                        <p className="text-xs text-(--color-muted) capitalize">
                          {cmd.category === 'navigation'
                            ? t('command.categoryNavigation', 'Navigation')
                            : cmd.category === 'action'
                              ? t('command.categoryAction', 'Action')
                              : t('command.categoryDevice', 'Device')}
                        </p>
                      </div>
                      {index === selectedIndex && (
                        <kbd className="rounded bg-(--color-surface-strong) px-2 py-1 text-xs text-(--color-muted)">
                          ↵
                        </kbd>
                      )}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-(--color-border) px-4 py-3 text-xs text-(--color-muted)">
              <span>{t('command.navigate', 'Navigate')}</span>
              <div className="flex gap-2">
                <kbd className="rounded bg-(--color-surface-strong) px-2 py-1">↑↓</kbd>
                <kbd className="rounded bg-(--color-surface-strong) px-2 py-1">↵</kbd>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Hook for global Cmd+K / Ctrl+K shortcut
// eslint-disable-next-line react-refresh/only-export-components
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
}
