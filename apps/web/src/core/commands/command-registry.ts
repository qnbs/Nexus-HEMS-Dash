import type {
  CommandContext,
  CommandDefinition,
  CommandListSection,
  CommandProvider,
  ResolvedCommand,
} from './types';

const registry = new Map<string, CommandDefinition>();
const providers: CommandProvider[] = [];
let coreBootstrapped = false;

const SCOPE_RANK: Record<string, number> = { read: 0, readwrite: 1, admin: 2 };

function hasScope(ctx: CommandContext, required?: CommandDefinition['requiredScope']): boolean {
  if (!required) return true;
  return (SCOPE_RANK[ctx.authScope] ?? 0) >= (SCOPE_RANK[required] ?? 0);
}

function isVisible(cmd: CommandDefinition, ctx: CommandContext): boolean {
  if (cmd.when && !cmd.when(ctx)) return false;
  return true;
}

function resolveDisabled(
  cmd: CommandDefinition,
  ctx: CommandContext,
): { disabled: boolean; disabledReasonKey?: string } {
  if (cmd.blockedInReadOnly && ctx.isReadOnly) {
    return { disabled: true, disabledReasonKey: 'mode.readOnlyBlocked' };
  }
  if (!hasScope(ctx, cmd.requiredScope)) {
    return { disabled: true, disabledReasonKey: 'command.insufficientScope' };
  }
  return { disabled: false };
}

/**
 * Register a single command. Duplicate ids are skipped (dev warns).
 */
export function registerCommand(cmd: CommandDefinition): void {
  if (registry.has(cmd.id)) {
    if (import.meta.env.DEV) {
      console.warn('[CommandRegistry] Command already registered, skipping:', cmd.id);
    }
    return;
  }
  registry.set(cmd.id, cmd);
}

/** Register a dynamic command provider (adapters, plugins). */
export function registerCommandProvider(provider: CommandProvider): void {
  if (providers.some((p) => p.id === provider.id)) {
    if (import.meta.env.DEV) {
      console.warn('[CommandRegistry] Provider already registered, skipping:', provider.id);
    }
    return;
  }
  providers.push(provider);
  providers.sort((a, b) => a.priority - b.priority);
}

export function unregisterCommandsBySource(
  source: CommandDefinition['source'],
  adapterId?: string,
): void {
  for (const [id, cmd] of registry.entries()) {
    if (cmd.source !== source) continue;
    if (adapterId && cmd.adapterId !== adapterId) continue;
    registry.delete(id);
  }
}

export function unregisterCommandProvider(providerId: string): void {
  const idx = providers.findIndex((p) => p.id === providerId);
  if (idx >= 0) providers.splice(idx, 1);
}

export function clearCommandRegistryForTests(): void {
  registry.clear();
  providers.length = 0;
  coreBootstrapped = false;
}

export function markCoreProvidersBootstrapped(): void {
  coreBootstrapped = true;
}

export function isCoreProvidersBootstrapped(): boolean {
  return coreBootstrapped;
}

/** Collect all command definitions visible in the current context. */
export function collectCommandDefinitions(ctx: CommandContext): CommandDefinition[] {
  const seen = new Set<string>();
  const merged: CommandDefinition[] = [];

  const add = (cmd: CommandDefinition) => {
    if (seen.has(cmd.id)) return;
    if (!isVisible(cmd, ctx)) return;
    seen.add(cmd.id);
    merged.push(cmd);
  };

  for (const cmd of registry.values()) {
    add(cmd);
  }

  for (const provider of providers) {
    try {
      const cmds = provider.getCommands(ctx);
      const resolved = cmds instanceof Promise ? [] : cmds;
      if (cmds instanceof Promise && import.meta.env.DEV) {
        console.warn('[CommandRegistry] Sync provider expected, got Promise:', provider.id);
      }
      for (const cmd of resolved) add(cmd);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[CommandRegistry] Provider failed:', provider.id, err);
      }
    }
  }

  return merged;
}

export interface ResolveCommandsOptions {
  query: string;
  recentIds: string[];
  favoriteIds: string[];
  contextualIds: string[];
  scoreFn: (
    cmd: CommandDefinition,
    label: string,
    query: string,
    boosts: { recent: boolean; favorite: boolean; contextual: boolean },
  ) => number;
}

const SECTION_SORT_ORDER: CommandListSection[] = [
  'recent',
  'favorites',
  'contextual',
  'action',
  'energy',
  'navigation',
  'device',
  'settings',
  'adapter',
  'ai',
  'system',
];

/** Resolve, score, and annotate commands for palette rendering. */
export function resolveCommands(
  ctx: CommandContext,
  options: ResolveCommandsOptions,
): ResolvedCommand[] {
  const definitions = collectCommandDefinitions(ctx);
  const favoriteSet = new Set(options.favoriteIds);
  const recentSet = new Set(options.recentIds);
  const contextualSet = new Set(options.contextualIds);

  const resolved: ResolvedCommand[] = definitions.map((cmd) => {
    const label = ctx.t(cmd.labelKey);
    const description = cmd.descriptionKey ? ctx.t(cmd.descriptionKey) : undefined;
    const { disabled, disabledReasonKey } = resolveDisabled(cmd, ctx);
    const isFavorite = favoriteSet.has(cmd.id);
    const isRecent = recentSet.has(cmd.id);
    const isContextual = contextualSet.has(cmd.id);

    const score = options.scoreFn(cmd, label, options.query, {
      recent: isRecent,
      favorite: isFavorite,
      contextual: isContextual,
    });

    let section: CommandListSection = cmd.category;
    if (isRecent && !options.query) section = 'recent';
    else if (isFavorite && !options.query) section = 'favorites';
    else if (isContextual && !options.query) section = 'contextual';

    const base: ResolvedCommand = {
      ...cmd,
      label,
      score,
      disabled,
      isFavorite,
      section,
    };
    if (description !== undefined) base.description = description;
    if (disabledReasonKey !== undefined) base.disabledReasonKey = disabledReasonKey;
    return base;
  });

  const filtered = options.query.trim().length > 0 ? resolved.filter((c) => c.score > 0) : resolved;

  filtered.sort((a, b) => {
    const sa = SECTION_SORT_ORDER.indexOf(a.section);
    const sb = SECTION_SORT_ORDER.indexOf(b.section);
    if (sa !== sb) return sa - sb;
    return b.score - a.score || a.label.localeCompare(b.label);
  });

  return filtered;
}

export type { CommandProvider };
