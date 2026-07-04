import { AnimatePresence, motion } from 'motion/react';
import { CommandPaletteFooter } from './CommandPaletteFooter';
import { CommandPaletteInput } from './CommandPaletteInput';
import { CommandPaletteList } from './CommandPaletteList';
import { CommandPalettePreviewPane } from './CommandPalettePreview';
import { useCommandPaletteController } from './useCommandPaletteController';

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
    motionProps,
    onSelectCommand,
  } = useCommandPaletteController({
    isOpen,
    onClose,
    ...(onOptimize !== undefined ? { onOptimize } : {}),
    ...(onExportReport !== undefined ? { onExportReport } : {}),
  });

  return (
    <AnimatePresence>
      {isOpen ? (
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
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
