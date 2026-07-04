import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ResolvedCommand } from '../../core/commands/types';
import { getSectionLabelKey } from './command-palette-list-utils';

const CATEGORY_KEYS: Record<ResolvedCommand['category'], string> = {
  navigation: 'command.categoryNavigation',
  action: 'command.categoryAction',
  device: 'command.categoryDevice',
  energy: 'command.categoryEnergy',
  settings: 'command.categorySettings',
  adapter: 'command.categoryAdapter',
  ai: 'command.categoryAi',
  system: 'command.categorySystem',
};

interface CommandPaletteItemProps {
  cmd: ResolvedCommand;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onHover: () => void;
}

export function CommandPaletteItem({
  cmd,
  index,
  isSelected,
  onSelect,
  onHover,
}: CommandPaletteItemProps) {
  const { t } = useTranslation();
  const Icon: LucideIcon | undefined = cmd.icon;
  const categoryLabel = t(CATEGORY_KEYS[cmd.category]);
  const sectionKey = getSectionLabelKey(cmd.section);

  return (
    <button
      type="button"
      id={`cmd-${cmd.id}`}
      data-index={index}
      onClick={onSelect}
      onMouseEnter={onHover}
      role="option"
      aria-selected={isSelected}
      aria-disabled={cmd.disabled}
      disabled={cmd.disabled}
      className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
        isSelected
          ? 'bg-(--color-primary)/20 text-(--color-text)'
          : 'text-(--color-muted) hover:bg-(--color-surface-strong)'
      } ${cmd.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          isSelected ? 'bg-(--color-primary)/30' : 'bg-(--color-surface)'
        }`}
        aria-hidden="true"
      >
        {Icon ? <Icon className="h-5 w-5" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{cmd.label}</p>
        <p className="truncate text-(--color-muted) text-xs">
          {sectionKey ? t(sectionKey) : categoryLabel}
          {cmd.description ? ` · ${cmd.description}` : ''}
        </p>
      </div>
      {cmd.isFavorite ? (
        <span className="text-(--color-primary) text-xs" aria-hidden="true">
          ★
        </span>
      ) : null}
      {isSelected ? (
        <kbd className="hidden shrink-0 rounded bg-(--color-surface-strong) px-2 py-1 text-(--color-muted) text-xs sm:inline">
          ↵
        </kbd>
      ) : null}
    </button>
  );
}
