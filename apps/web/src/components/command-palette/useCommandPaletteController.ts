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
import {
  getPaletteMotionProps,
  handlePaletteKeyDown,
  invokeAsyncCommand,
  isDesktopViewport,
  resolveInitialFocusRef,
} from './command-palette-helpers';

export interface CommandPaletteControllerOptions {
  isOpen: boolean;
  onClose: () => void;
  onOptimize?: () => void;
  onExportReport?: () => void;
}

export function useCommandPaletteController({
  isOpen,
  onClose,
  onOptimize,
  onExportReport,
}: CommandPaletteControllerOptions) {
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

  const autoFocusInput = isDesktopViewport();
  const dialogRef = useFocusTrap<HTMLDivElement>(isOpen, {
    onEscape: onClose,
    initialFocusRef: resolveInitialFocusRef(autoFocusInput, inputRef, containerFocusRef),
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

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync on dialog open
    setSearch('');
    setSelectedIndex(0);
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

  const onSelectCommand = useCallback(
    (index: number) => invokeAsyncCommand(runCommand, index),
    [runCommand],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) =>
      handlePaletteKeyDown(e, {
        isOpen,
        commandCount: commands.length,
        clampedIndex,
        setSelectedIndex,
        runCommand,
      });

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, clampedIndex, commands.length, runCommand]);

  const selectedCommand = commands[clampedIndex] ?? null;
  const previewData: CommandPreview | null = useMemo(() => {
    if (!selectedCommand?.preview) return null;
    return selectedCommand.preview(ctx);
  }, [selectedCommand, ctx]);

  const activeDescendant = selectedCommand ? `cmd-${selectedCommand.id}` : undefined;
  const motionProps = getPaletteMotionProps(reducedMotion);

  return {
    search,
    setSearch,
    setSelectedIndex,
    inputRef,
    containerFocusRef,
    dialogRef,
    commands,
    clampedIndex,
    selectedCommand,
    previewData,
    activeDescendant,
    motionProps,
    onSelectCommand,
  };
}
