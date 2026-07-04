import { SearchX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ResolvedCommand } from '../../core/commands/types';
import { EmptyState } from '../ui/EmptyState';
import { CommandPaletteItem } from './CommandPaletteItem';
import { buildFlatRows, getSectionLabelKey } from './command-palette-list-utils';

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
        {rows.map((row) => {
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
        })}
      </div>
    </div>
  );
}
