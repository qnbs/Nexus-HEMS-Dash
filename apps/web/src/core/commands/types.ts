import type { TFunction } from 'i18next';
import type { LucideIcon } from 'lucide-react';
import type { NavigateFunction } from 'react-router-dom';
import type { ThemeName } from '../../design-tokens';
import type { LocaleCode } from '../../types';
import type { AdapterStatus } from '../adapters/EnergyAdapter';

/** Minimum JWT scope required to run a command */
export type AuthScope = 'read' | 'readwrite' | 'admin';

/** Safety classification — aligns with command-safety.ts danger set */
export type CommandRisk = 'safe' | 'moderate' | 'danger' | 'admin';

export type CommandCategory =
  | 'navigation'
  | 'action'
  | 'device'
  | 'energy'
  | 'settings'
  | 'adapter'
  | 'ai'
  | 'system';

export type CommandSource = 'core' | 'adapter' | 'plugin' | 'user' | 'ai';

export interface CommandPreviewMetric {
  labelKey: string;
  value: string;
}

export interface CommandPreview {
  titleKey: string;
  bodyKey?: string;
  metrics?: CommandPreviewMetric[];
  impactKey?: string;
}

export interface CommandContext {
  route: { pathname: string; search: string };
  locale: LocaleCode;
  theme: ThemeName;
  energy: {
    pvPower: number;
    batterySoC: number;
    gridPower: number;
    houseLoad: number;
    priceCurrent: number;
    evPower: number;
  };
  adapterStatuses: Map<string, AdapterStatus>;
  tariffProvider: string;
  chargeThreshold: number;
  isReadOnly: boolean;
  isLiveMode: boolean;
  authScope: AuthScope;
  navigate: NavigateFunction;
  t: TFunction;
  /** Palette callbacks supplied by AppShell */
  actions: {
    onOptimize?: () => void;
    onExportReport?: () => void;
    closePalette: () => void;
    recordUsage: (commandId: string) => void;
    toggleFavorite: (commandId: string) => void;
  };
}

export interface CommandDefinition {
  /** Stable id, e.g. `nav.settings.adapters` */
  id: string;
  labelKey: string;
  descriptionKey?: string;
  icon?: LucideIcon;
  category: CommandCategory;
  risk: CommandRisk;
  keywords?: string[];
  shortcut?: string;
  requiredScope?: AuthScope;
  blockedInReadOnly?: boolean;
  when?: (ctx: CommandContext) => boolean;
  preview?: (ctx: CommandContext) => CommandPreview | null;
  execute: (ctx: CommandContext) => void | Promise<void>;
  schemaVersion?: 1;
  source: CommandSource;
  adapterId?: string;
}

export interface ResolvedCommand extends CommandDefinition {
  label: string;
  description?: string | undefined;
  score: number;
  disabled: boolean;
  disabledReasonKey?: string | undefined;
  isFavorite: boolean;
  section: CommandListSection;
}

export type CommandListSection =
  | 'recent'
  | 'favorites'
  | 'contextual'
  | 'navigation'
  | 'action'
  | 'device'
  | 'energy'
  | 'settings'
  | 'adapter'
  | 'ai'
  | 'system';

export interface CommandPalettePreferences {
  recent: { id: string; ts: number }[];
  favorites: string[];
}

export const MAX_RECENT_COMMANDS = 8;

export interface CommandProvider {
  id: string;
  priority: number;
  getCommands: (ctx: CommandContext) => CommandDefinition[] | Promise<CommandDefinition[]>;
}
