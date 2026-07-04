import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../../core/commands/providers';
import {
  executeResolvedCommand,
  getContextualCommandIds,
  getRecentCommandIds,
  resolveCommands,
  scoreCommand,
  useCommandContext,
} from '../../core/commands';
import type { CommandPreview } from '../../core/commands/types';
import { useFocusTrap } from '../../lib/useFocusTrap';
import { useAppStore } from '../../store';
import { CommandPaletteFooter } from './CommandPaletteFooter';
import { CommandPaletteInput } from './CommandPaletteInput';
import { CommandPaletteList } from './CommandPaletteList';
import { CommandPalettePreviewPane } from './CommandPalettePreview';

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
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerFocusRef = useRef<HTMLDivElement>(null);

  const commandPalette = useAppStore((s) => s.commandPalette);
  const reducedMotion = useAppStore((s) => s.settings.reducedMotion);
  const recordCommandUsage = useAppStore((s) => s.recordCommandUsage);
  const toggleCommandFavorite = useAppStore((s) => s.toggleCommandFavorite);

  const recordUsage = useCallback((id: string) => recordCommandUsage(id), [recordCommandUsage]);
  const toggleFavorite = useCallback(
    (id: string) => toggleCommandFavorite(id),
    [toggleCommandFavorite],
  );

  const ctx = useCommandContext({
    closePalette: onClose,
    recordUsage,
    toggleFavorite,
    ...(onOptimize !== undefined ? { onOptimize } : {}),
    ...(onExportReport !== undefined ? { onExportReport } : {}),
  });

  const autoFocusInput =
    typeof window !== 'undefined' && !!window.matchMedia?.('(min-width: 1024px)').matches;

  const dialogRef = useFocusTrap<HTMLDivElement>(isOpen, {
    onEscape: onClose,
    initialFocusRef: autoFocusInput ? inputRef : containerFocusRef,
  });

  const recentIds = useMemo(() => getRecentCommandIds(commandPalette), [commandPalette]);
  const contextualIds = useMemo(() => getContextualCommandIds(ctx), [ctx]);

  const commands = useMemo(() => {
    if (!isOpen) return [];
    return resolveCommands(ctx, {
      query: search,
      recentIds,
      favoriteIds: commandPalette.favorites,
      contextualIds,
      scoreFn: scoreCommand,
    });
  }, [isOpen, search, ctx, recentIds, commandPalette.favorites, contextualIds]);

  // Reset search & selection whenever the palette opens.
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync on dialog open
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset selection on query change
    setSelectedIndex(0);
  }, [search]);

  const clampedIndex = commands.length === 0 ? 0 : Math.min(selectedIndex, commands.length - 1);

  const runCommand = useCallback(
    async (index: number) => {
      const cmd = commands[index];
      if (!cmd) return;
      await executeResolvedCommand(cmd, ctx);
      if (!cmd.disabled) onClose();
    },
    [commands, ctx, onClose],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || commands.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % commands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + commands.length) % commands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        void runCommand(clampedIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, clampedIndex, commands, runCommand]);

  const selectedCommand = commands[clampedIndex] ?? null;
  const previewData: CommandPreview | null = useMemo(() => {
    if (!selectedCommand?.preview) return null;
    return selectedCommand.preview(ctx);
  }, [selectedCommand, ctx]);

  const activeDescendant = selectedCommand ? `cmd-${selectedCommand.id}` : undefined;

  const motionProps = reducedMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 0.95, y: -20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: -20 },
      };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-modal-backdrop bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            ref={dialogRef}
            {...motionProps}
            className="fixed top-[10%] left-1/2 z-modal mx-4 flex w-full max-w-3xl -translate-x-1/2 overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-2xl backdrop-blur-3xl sm:top-1/4 sm:mx-0"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cmd-palette-title"
          >
            <div
              ref={containerFocusRef}
              tabIndex={-1}
              aria-hidden="true"
              className="sr-only"
              data-testid="cmd-initial-focus"
            />

            <div className="flex min-w-0 flex-1 flex-col">
              <CommandPaletteInput
                value={search}
                onChange={setSearch}
                inputRef={inputRef}
                activeDescendant={activeDescendant}
              />

              <CommandPaletteList
                commands={commands}
                selectedIndex={clampedIndex}
                query={search}
                onSelect={(i) => void runCommand(i)}
                onHover={setSelectedIndex}
              />

              <CommandPaletteFooter />
            </div>

            <CommandPalettePreviewPane command={selectedCommand} previewData={previewData} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
