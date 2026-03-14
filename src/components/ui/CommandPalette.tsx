import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState, useMemo } from 'react';
import {
  Search,
  Sparkles,
  FileDown,
  Home,
  Settings,
  HelpCircle,
  Zap,
  Sun,
  Battery,
  Activity,
  Car,
  Map,
  TrendingUp,
  BarChart3,
  SearchX,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const commands: Command[] = [
    // Actions
    {
      id: 'optimize',
      label: t('command.optimizeNow', 'Optimize Energy Now'),
      icon: <Sparkles className="h-5 w-5" />,
      action: () => {
        onOptimize?.();
        onClose();
      },
      category: 'action',
      keywords: ['ai', 'optimize', 'gemini', 'energy'],
    },
    {
      id: 'export-report',
      label: t('command.exportReport', 'Export Monthly Report'),
      icon: <FileDown className="h-5 w-5" />,
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
      icon: <Home className="h-5 w-5" />,
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
      icon: <Activity className="h-5 w-5" />,
      action: () => {
        navigate('/energy-flow');
        onClose();
      },
      category: 'navigation',
      keywords: ['sankey', 'flow', 'energiefluss'],
    },
    {
      id: 'nav-production',
      label: t('nav.production', 'Production'),
      icon: <Sun className="h-5 w-5 text-yellow-400" />,
      action: () => {
        navigate('/production');
        onClose();
      },
      category: 'navigation',
      keywords: ['solar', 'pv', 'photovoltaic', 'erzeugung'],
    },
    {
      id: 'nav-storage',
      label: t('nav.storage', 'Storage'),
      icon: <Battery className="h-5 w-5 text-emerald-400" />,
      action: () => {
        navigate('/storage');
        onClose();
      },
      category: 'navigation',
      keywords: ['battery', 'soc', 'batterie', 'speicher'],
    },
    {
      id: 'nav-consumption',
      label: t('nav.consumption', 'Consumption'),
      icon: <Home className="h-5 w-5 text-blue-400" />,
      action: () => {
        navigate('/consumption');
        onClose();
      },
      category: 'navigation',
      keywords: ['house', 'load', 'verbrauch', 'haus'],
    },
    {
      id: 'nav-ev',
      label: t('nav.ev', 'EV Charging'),
      icon: <Car className="h-5 w-5 text-green-400" />,
      action: () => {
        navigate('/ev');
        onClose();
      },
      category: 'navigation',
      keywords: ['wallbox', 'car', 'charging', 'auto', 'laden'],
    },
    {
      id: 'nav-floorplan',
      label: t('nav.floorplan', 'Floorplan'),
      icon: <Map className="h-5 w-5" />,
      action: () => {
        navigate('/floorplan');
        onClose();
      },
      category: 'navigation',
      keywords: ['knx', 'building', 'automation', 'grundriss'],
    },
    {
      id: 'nav-ai',
      label: t('nav.aiOptimizer', 'AI Optimizer'),
      icon: <Sparkles className="h-5 w-5 text-purple-400" />,
      action: () => {
        navigate('/ai-optimizer');
        onClose();
      },
      category: 'navigation',
      keywords: ['gemini', 'optimize', 'ki'],
    },
    {
      id: 'nav-ai-settings',
      label: t('command.aiSettings', 'AI Provider Keys'),
      icon: <Sparkles className="h-5 w-5 text-cyan-400" />,
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
      icon: <TrendingUp className="h-5 w-5 text-orange-400" />,
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
      icon: <BarChart3 className="h-5 w-5" />,
      action: () => {
        navigate('/analytics');
        onClose();
      },
      category: 'navigation',
      keywords: ['report', 'chart', 'bericht', 'analyse'],
    },
    {
      id: 'nav-settings',
      label: t('nav.settings', 'Settings'),
      icon: <Settings className="h-5 w-5" />,
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
      icon: <HelpCircle className="h-5 w-5" />,
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
      icon: <Zap className="h-5 w-5 text-red-400" />,
      action: () => {
        navigate('/energy-flow');
        onClose();
      },
      category: 'device',
      keywords: ['import', 'export', 'netzbezug'],
    },
  ];

  const filteredCommands = useMemo(
    () =>
      commands.filter((cmd) => {
        const searchLower = search.toLowerCase();
        return (
          cmd.label.toLowerCase().includes(searchLower) ||
          cmd.keywords?.some((k) => k.toLowerCase().includes(searchLower))
        );
      }),
    [search, commands],
  );

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

  useEffect(() => {
    if (isOpen) {
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
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-1/4 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-2xl backdrop-blur-3xl"
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
              <kbd className="rounded bg-slate-800/50 px-2 py-1 text-xs text-(--color-muted)">
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
                          : 'text-(--color-muted) hover:bg-slate-800/50'
                      }`}
                      whileHover={{ x: 4 }}
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          index === selectedIndex ? 'bg-(--color-primary)/30' : 'bg-slate-800/30'
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
                        <kbd className="rounded bg-slate-800/50 px-2 py-1 text-xs text-(--color-muted)">
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
                <kbd className="rounded bg-slate-800/50 px-2 py-1">↑↓</kbd>
                <kbd className="rounded bg-slate-800/50 px-2 py-1">↵</kbd>
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
