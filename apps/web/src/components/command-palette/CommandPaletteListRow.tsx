import { useTranslation } from 'react-i18next';
import { CommandPaletteItem } from './CommandPaletteItem';
import type { FlatListRow } from './command-palette-list-utils';
import { getSectionLabelKey } from './command-palette-list-utils';

interface CommandPaletteListRowProps {
  row: FlatListRow;
  selectedIndex: number;
  onSelect: (index: number) => void;
  onHover: (index: number) => void;
}

export function CommandPaletteListRow({
  row,
  selectedIndex,
  onSelect,
  onHover,
}: CommandPaletteListRowProps) {
  const { t } = useTranslation();

  if (row.type === 'header' && row.section) {
    const key = getSectionLabelKey(row.section);
    return (
      <div
        key={`header-${row.section}`}
        className="px-4 py-2 font-semibold text-(--color-muted) text-xs uppercase tracking-wide"
      >
        {key ? t(key) : ''}
      </div>
    );
  }

  const cmd = row.command;
  const cmdIndex = row.commandIndex ?? 0;
  if (!cmd) return null;

  return (
    <CommandPaletteItem
      key={cmd.id}
      cmd={cmd}
      index={cmdIndex}
      isSelected={cmdIndex === selectedIndex}
      onSelect={() => onSelect(cmdIndex)}
      onHover={() => onHover(cmdIndex)}
    />
  );
}
