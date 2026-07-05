import type { ResolvedCommand } from '../../core/commands/types';

const SECTION_KEYS: Record<ResolvedCommand['section'], string | null> = {
  recent: 'commandPalette.recentCommands',
  favorites: 'command.favorites',
  contextual: 'command.contextualSuggestions',
  navigation: null,
  action: null,
  device: null,
  energy: null,
  settings: null,
  adapter: null,
  ai: null,
  system: null,
};

export function getSectionLabelKey(section: ResolvedCommand['section']): string | null {
  return SECTION_KEYS[section];
}

/** Virtual rows need a measurable scrollport; jsdom/Vitest has none — keep the flat list there. */
export function shouldVirtualizeCommandList(rowCount: number): boolean {
  if (rowCount <= 20) return false;
  if (import.meta.env.VITEST) return false;
  return true;
}

export interface FlatListRow {
  type: 'header' | 'command';
  section?: ResolvedCommand['section'];
  command?: ResolvedCommand;
  commandIndex?: number;
}

export function buildFlatRows(commands: ResolvedCommand[], showSections: boolean): FlatListRow[] {
  if (!showSections || commands.length === 0) {
    return commands.map((cmd, i) => ({ type: 'command' as const, command: cmd, commandIndex: i }));
  }

  const rows: FlatListRow[] = [];
  let lastSection: ResolvedCommand['section'] | null = null;

  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i]!;
    const headerKey = getSectionLabelKey(cmd.section);
    if (headerKey && cmd.section !== lastSection) {
      rows.push({ type: 'header', section: cmd.section });
      lastSection = cmd.section;
    }
    rows.push({ type: 'command', command: cmd, commandIndex: i });
  }

  return rows;
}
