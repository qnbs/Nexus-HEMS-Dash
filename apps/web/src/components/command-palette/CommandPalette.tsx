import { AnimatePresence, motion } from 'motion/react';
import type { AdapterCommand } from '../../core/adapters/EnergyAdapter';
import { CommandPaletteFooter } from './CommandPaletteFooter';
import { CommandPaletteInput } from './CommandPaletteInput';
import { CommandPaletteList } from './CommandPaletteList';
import { CommandPalettePreviewPane } from './CommandPalettePreview';
import { useCommandPaletteController } from './useCommandPaletteController';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOptimize?: () => void;
  onExportReport?: () => void;
  executeHardwareCommand?: (command: AdapterCommand) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onOptimize,
  onExportReport,
  executeHardwareCommand,
}: CommandPaletteProps) {
  const {
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
    hasListbox,
    motionProps,
    onSelectCommand,
  } = useCommandPaletteController({
    isOpen,
    onClose,
    ...(onOptimize !== undefined ? { onOptimize } : {}),
    ...(onExportReport !== undefined ? { onExportReport } : {}),
    ...(executeHardwareCommand !== undefined ? { executeHardwareCommand } : {}),
  });

  return (
    <AnimatePresence>
      {isOpen
        ? [
            <motion.div
              key="cmd-palette-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-modal-backdrop bg-black/80 backdrop-blur-sm"
            />,
            <motion.div
              key="cmd-palette-dialog"
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
                className="sr-only"
                data-testid="cmd-initial-focus"
              />

              <div className="flex min-w-0 flex-1 flex-col">
                <CommandPaletteInput
                  value={search}
                  onChange={setSearch}
                  inputRef={inputRef}
                  hasListbox={hasListbox}
                  {...(activeDescendant !== undefined ? { activeDescendant } : {})}
                />

                <CommandPaletteList
                  commands={commands}
                  selectedIndex={clampedIndex}
                  query={search}
                  onSelect={onSelectCommand}
                  onHover={setSelectedIndex}
                />

                <CommandPaletteFooter />
              </div>

              <CommandPalettePreviewPane command={selectedCommand} previewData={previewData} />
            </motion.div>,
          ]
        : null}
    </AnimatePresence>
  );
}
