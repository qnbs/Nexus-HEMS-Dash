import { SearchX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ResolvedCommand } from '../../core/commands/types';
import { EmptyState } from '../ui/EmptyState';
import { CommandPaletteListRow } from './CommandPaletteListRow';
import { buildFlatRows } from './command-palette-list-utils';

interface CommandPaletteListProps {
  commands: ResolvedCommand[];
  selectedIndex: number;
  query: string;
  onSelect: (index: number) => void;
  onHover: (index: number) => void;
}

export function CommandPaletteList({
  commands,
  selectedIndex,
  query,
  onSelect,
  onHover,
}: CommandPaletteListProps) {
  const { t } = useTranslation();
  const showSections = query.trim().length === 0;
  const rows = buildFlatRows(commands, showSections);

  if (commands.length === 0) {
    return (
      <div role="status" aria-live="polite">
        <EmptyState icon={SearchX} title={t('command.noResults')} />
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto p-2">
      <div role="listbox" id="command-listbox" className="space-y-1">
        {rows.map((row, rowIndex) => (
          <CommandPaletteListRow
            key={row.type === 'header' ? `header-${row.section}` : (row.command?.id ?? rowIndex)}
            row={row}
            selectedIndex={selectedIndex}
            onSelect={onSelect}
            onHover={onHover}
          />
        ))}
      </div>
    </div>
  );
}
