import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { Search, Sparkles, FileDown, Home, Settings, HelpCircle, Zap, Sun, Battery } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

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

export function CommandPalette({ isOpen, onClose, onOptimize, onExportReport }: CommandPaletteProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

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
      label: t('nav.dashboard', 'Dashboard'),
      icon: <Home className="h-5 w-5" />,
      action: () => {
        navigate('/');
        onClose();
      },
      category: 'navigation',
      keywords: ['home', 'start'],
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
      keywords: ['config', 'options'],
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
      keywords: ['docs', 'documentation', 'support'],
    },

    // Devices
    {
      id: 'device-pv',
      label: t('command.viewPv', 'View PV Generation'),
      icon: <Sun className="h-5 w-5 text-yellow-400" />,
      action: () => {
        navigate('/');
        onClose();
      },
      category: 'device',
      keywords: ['solar', 'photovoltaic', 'panels'],
    },
    {
      id: 'device-battery',
      label: t('command.viewBattery', 'View Battery Status'),
      icon: <Battery className="h-5 w-5 text-emerald-400" />,
      action: () => {
        navigate('/');
        onClose();
      },
      category: 'device',
      keywords: ['storage', 'soc'],
    },
    {
      id: 'device-grid',
      label: t('command.viewGrid', 'View Grid Status'),
      icon: <Zap className="h-5 w-5 text-red-400" />,
      action: () => {
        navigate('/');
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
            className="fixed left-1/2 top-1/4 z-50 w-full max-w-2xl -translate-x-1/2 overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-2xl backdrop-blur-3xl"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 border-b border-[color:var(--color-border)] p-4">
              <Search className="h-5 w-5 text-[color:var(--color-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('command.searchPlaceholder', 'Search commands...')}
                className="flex-1 bg-transparent text-[color:var(--color-text)] outline-none placeholder:text-[color:var(--color-muted)]"
                autoFocus
              />
              <kbd className="rounded bg-slate-800/50 px-2 py-1 text-xs text-[color:var(--color-muted)]">
                ESC
              </kbd>
            </div>

            {/* Commands List */}
            <div className="max-h-96 overflow-y-auto p-2">
              {filteredCommands.length === 0 ? (
                <div className="py-12 text-center text-sm text-[color:var(--color-muted)]">
                  {t('command.noResults', 'No commands found')}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredCommands.map((cmd, index) => (
                    <motion.button
                      key={cmd.id}
                      onClick={cmd.action}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                        index === selectedIndex
                          ? 'bg-[color:var(--color-primary)]/20 text-[color:var(--color-text)]'
                          : 'text-[color:var(--color-muted)] hover:bg-slate-800/50'
                      }`}
                      whileHover={{ x: 4 }}
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          index === selectedIndex
                            ? 'bg-[color:var(--color-primary)]/30'
                            : 'bg-slate-800/30'
                        }`}
                      >
                        {cmd.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{cmd.label}</p>
                        <p className="text-xs capitalize text-[color:var(--color-muted)]">
                          {cmd.category}
                        </p>
                      </div>
                      {index === selectedIndex && (
                        <kbd className="rounded bg-slate-800/50 px-2 py-1 text-xs text-[color:var(--color-muted)]">
                          ↵
                        </kbd>
                      )}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[color:var(--color-border)] px-4 py-3 text-xs text-[color:var(--color-muted)]">
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
