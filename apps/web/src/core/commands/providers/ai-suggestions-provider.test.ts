import { describe, expect, it, vi } from 'vitest';
import { BATTERY_FORCE_CHARGE_W } from '../../../lib/battery-control';
import type { CommandContext } from '../types';
import { aiSuggestionsProvider } from './ai-suggestions-provider';

function mockContext(overrides: Partial<CommandContext> = {}): CommandContext {
  return {
    route: { pathname: '/', search: '' },
    locale: 'de',
    theme: 'ocean-dark',
    energy: {
      pvPower: 5,
      batterySoC: 50,
      batteryPower: 0,
      gridPower: 0,
      houseLoad: 2,
      priceCurrent: 0.2,
      evPower: 0,
    },
    adapterStatuses: new Map(),
    adapterEntries: new Map(),
    tariffProvider: 'tibber',
    chargeThreshold: 0.15,
    isReadOnly: false,
    isLiveMode: false,
    experimentalFeatures: true,
    authScope: 'readwrite',
    navigate: vi.fn(),
    t: ((key: string) => key) as CommandContext['t'],
    actions: {
      closePalette: vi.fn(),
      recordUsage: vi.fn(),
      toggleFavorite: vi.fn(),
    },
    ...overrides,
  };
}

describe('aiSuggestionsProvider', () => {
  it('returns no commands when experimental features are disabled', () => {
    const ctx = mockContext({
      experimentalFeatures: false,
      energy: { ...mockContext().energy, pvPower: 10, houseLoad: 1 },
    });
    expect(aiSuggestionsProvider.getCommands(ctx)).toEqual([]);
  });

  it('maps surplus suggestion to optimizer action', () => {
    const ctx = mockContext({
      energy: { ...mockContext().energy, pvPower: 8, houseLoad: 2 },
    });
    const cmd = aiSuggestionsProvider
      .getCommands(ctx)
      .find((c) => c.id === 'ai.suggest.optimizeSurplus');
    expect(cmd?.source).toBe('ai');
    expect(cmd?.category).toBe('ai');
    expect(cmd?.risk).toBe('safe');
    const onOptimize = vi.fn();
    cmd?.execute({ ...ctx, actions: { ...ctx.actions, onOptimize } });
    expect(onOptimize).toHaveBeenCalled();
    expect(ctx.actions.closePalette).toHaveBeenCalled();
  });

  it('maps EV start suggestion through hardware command bridge', () => {
    const ctx = mockContext({
      energy: { ...mockContext().energy, pvPower: 6, houseLoad: 2, evPower: 0 },
    });
    const cmd = aiSuggestionsProvider
      .getCommands(ctx)
      .find((c) => c.id === 'ai.suggest.startEvCharging');
    expect(cmd?.risk).toBe('moderate');
    expect(cmd?.blockedInReadOnly).toBe(true);
    expect(cmd?.hardwareCommand).toEqual({ type: 'START_CHARGING', value: true });
    const preview = cmd?.preview?.(ctx);
    expect(preview?.titleKey).toBe('command.aiSuggest.preview.startEvCharging');
    expect(preview?.impactKey).toBe('command.aiSuggest.preview.startEvChargingImpact');
    cmd?.execute(ctx);
    expect(ctx.actions.closePalette).toHaveBeenCalled();
  });

  it('maps battery force charge through hardware command bridge', () => {
    const ctx = mockContext({
      energy: {
        ...mockContext().energy,
        batterySoC: 40,
        batteryPower: 0,
        priceCurrent: 0.1,
      },
      chargeThreshold: 0.15,
    });
    const cmd = aiSuggestionsProvider
      .getCommands(ctx)
      .find((c) => c.id === 'ai.suggest.batteryForceCharge');
    expect(cmd?.hardwareCommand).toEqual({
      type: 'SET_BATTERY_POWER',
      value: BATTERY_FORCE_CHARGE_W,
    });
    const preview = cmd?.preview?.(ctx);
    expect(preview?.titleKey).toBe('command.aiSuggest.preview.batteryForceCharge');
    cmd?.execute(ctx);
    expect(ctx.actions.closePalette).toHaveBeenCalled();
  });

  it('navigates to tariffs for high-price suggestion', () => {
    const ctx = mockContext({
      energy: { ...mockContext().energy, priceCurrent: 0.35 },
      chargeThreshold: 0.15,
    });
    const cmd = aiSuggestionsProvider
      .getCommands(ctx)
      .find((c) => c.id === 'ai.suggest.viewTariffs');
    cmd?.execute(ctx);
    expect(ctx.navigate).toHaveBeenCalledWith('/tariffs');
    expect(ctx.actions.closePalette).toHaveBeenCalled();
  });

  it('navigates to energy flow for low battery suggestion', () => {
    const ctx = mockContext({
      energy: { ...mockContext().energy, batterySoC: 12 },
    });
    const cmd = aiSuggestionsProvider
      .getCommands(ctx)
      .find((c) => c.id === 'ai.suggest.viewBattery');
    cmd?.execute(ctx);
    expect(ctx.navigate).toHaveBeenCalledWith('/energy-flow');
  });

  it('navigates to monitoring when adapter errors exist', () => {
    const ctx = mockContext({
      adapterStatuses: new Map([['victron', 'error']]),
    });
    const cmd = aiSuggestionsProvider
      .getCommands(ctx)
      .find((c) => c.id === 'ai.suggest.checkMonitoring');
    cmd?.execute(ctx);
    expect(ctx.navigate).toHaveBeenCalledWith('/monitoring');
  });
});
