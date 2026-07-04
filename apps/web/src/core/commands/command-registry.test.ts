import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearCommandRegistryForTests,
  collectCommandDefinitions,
  registerCommand,
  resolveCommands,
} from './command-registry';
import { scoreCommand } from './command-search';
import { registerCoreCommands } from './providers';
import type { CommandContext } from './types';

function mockContext(overrides: Partial<CommandContext> = {}): CommandContext {
  return {
    route: { pathname: '/', search: '' },
    locale: 'de',
    theme: 'ocean-dark',
    energy: {
      pvPower: 5,
      batterySoC: 50,
      gridPower: 0,
      houseLoad: 2,
      priceCurrent: 0.2,
      evPower: 0,
    },
    adapterStatuses: new Map(),
    tariffProvider: 'tibber',
    chargeThreshold: 0.15,
    isReadOnly: false,
    isLiveMode: false,
    authScope: 'readwrite',
    navigate: () => {},
    t: ((key: string) => key) as CommandContext['t'],
    actions: {
      closePalette: () => {},
      recordUsage: () => {},
      toggleFavorite: () => {},
    },
    ...overrides,
  };
}

describe('command-registry', () => {
  beforeEach(() => {
    clearCommandRegistryForTests();
    registerCoreCommands();
  });

  it('registers core navigation commands', () => {
    const ctx = mockContext();
    const cmds = collectCommandDefinitions(ctx);
    expect(cmds.some((c) => c.id === 'nav-dashboard')).toBe(true);
    expect(cmds.some((c) => c.id === 'nav-settings-adapters')).toBe(true);
    expect(cmds.length).toBeGreaterThanOrEqual(20);
  });

  it('filters contextual energy commands by when()', () => {
    const lowPv = mockContext({
      energy: {
        pvPower: 1,
        batterySoC: 50,
        gridPower: 0,
        houseLoad: 2,
        priceCurrent: 0.1,
        evPower: 0,
      },
    });
    const highPv = mockContext({
      energy: {
        pvPower: 8,
        batterySoC: 50,
        gridPower: 0,
        houseLoad: 2,
        priceCurrent: 0.1,
        evPower: 0,
      },
    });
    const lowCmds = collectCommandDefinitions(lowPv);
    const highCmds = collectCommandDefinitions(highPv);
    expect(lowCmds.some((c) => c.id === 'energy.optimizeSurplus')).toBe(false);
    expect(highCmds.some((c) => c.id === 'energy.optimizeSurplus')).toBe(true);
  });

  it('disables commands in read-only mode when blocked', () => {
    registerCommand({
      id: 'test.danger',
      labelKey: 'test',
      category: 'device',
      risk: 'danger',
      blockedInReadOnly: true,
      source: 'core',
      execute: () => {},
    });
    const ctx = mockContext({ isReadOnly: true });
    const resolved = resolveCommands(ctx, {
      query: 'test',
      recentIds: [],
      favoriteIds: [],
      contextualIds: [],
      scoreFn: scoreCommand,
    });
    const cmd = resolved.find((c) => c.id === 'test.danger');
    expect(cmd?.disabled).toBe(true);
  });
});

describe('command-search', () => {
  it('ranks prefix matches above substring matches', () => {
    const cmd = {
      id: 'nav-tariffs',
      labelKey: 'x',
      category: 'navigation' as const,
      risk: 'safe' as const,
      source: 'core' as const,
      execute: () => {},
      keywords: ['preis'],
    };
    const prefix = scoreCommand(cmd, 'Tarife', 'tar', {
      recent: false,
      favorite: false,
      contextual: false,
    });
    const keyword = scoreCommand(cmd, 'Tarife', 'preis', {
      recent: false,
      favorite: false,
      contextual: false,
    });
    expect(prefix).toBeGreaterThan(keyword);
  });

  it('returns zero for non-matching query', () => {
    const cmd = {
      id: 'x',
      labelKey: 'y',
      category: 'navigation' as const,
      risk: 'safe' as const,
      source: 'core' as const,
      execute: () => {},
    };
    expect(
      scoreCommand(cmd, 'Home', 'zzzzz', { recent: false, favorite: false, contextual: false }),
    ).toBe(0);
  });
});
