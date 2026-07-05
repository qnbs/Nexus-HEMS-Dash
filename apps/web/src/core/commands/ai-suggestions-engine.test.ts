import { describe, expect, it } from 'vitest';
import { AI_SUGGESTION_SPECS, getVisibleAiSuggestionSpecs } from './ai-suggestions-engine';
import type { CommandContext } from './types';

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

describe('getVisibleAiSuggestionSpecs', () => {
  it('returns empty list when experimental features are disabled', () => {
    const ctx = mockContext({
      experimentalFeatures: false,
      energy: { ...mockContext().energy, pvPower: 10, houseLoad: 1 },
    });
    expect(getVisibleAiSuggestionSpecs(ctx)).toEqual([]);
  });

  it('suggests surplus optimization when PV exceeds load', () => {
    const ctx = mockContext({
      energy: { ...mockContext().energy, pvPower: 8, houseLoad: 2 },
    });
    const ids = getVisibleAiSuggestionSpecs(ctx).map((s) => s.id);
    expect(ids).toContain('ai.suggest.optimizeSurplus');
  });

  it('suggests EV charging when wallbox is idle and PV exceeds load', () => {
    const ctx = mockContext({
      energy: { ...mockContext().energy, pvPower: 6, houseLoad: 2, evPower: 0 },
    });
    const ids = getVisibleAiSuggestionSpecs(ctx).map((s) => s.id);
    expect(ids).toContain('ai.suggest.startEvCharging');
  });

  it('suggests battery force charge when SoC is low and price is cheap', () => {
    const ctx = mockContext({
      energy: {
        ...mockContext().energy,
        batterySoC: 40,
        batteryPower: 0,
        priceCurrent: 0.1,
      },
      chargeThreshold: 0.15,
    });
    const ids = getVisibleAiSuggestionSpecs(ctx).map((s) => s.id);
    expect(ids).toContain('ai.suggest.batteryForceCharge');
  });

  it('suggests viewing tariffs when price exceeds threshold', () => {
    const ctx = mockContext({
      energy: { ...mockContext().energy, priceCurrent: 0.35 },
      chargeThreshold: 0.15,
    });
    const ids = getVisibleAiSuggestionSpecs(ctx).map((s) => s.id);
    expect(ids).toContain('ai.suggest.viewTariffs');
  });

  it('suggests viewing battery when SoC is critically low', () => {
    const ctx = mockContext({
      energy: { ...mockContext().energy, batterySoC: 12 },
    });
    const ids = getVisibleAiSuggestionSpecs(ctx).map((s) => s.id);
    expect(ids).toContain('ai.suggest.viewBattery');
  });

  it('suggests monitoring when an adapter is in error state', () => {
    const ctx = mockContext({
      adapterStatuses: new Map([['victron', 'error']]),
    });
    const ids = getVisibleAiSuggestionSpecs(ctx).map((s) => s.id);
    expect(ids).toContain('ai.suggest.checkMonitoring');
  });

  it('exposes six rule specs with mirror command ids', () => {
    expect(AI_SUGGESTION_SPECS).toHaveLength(6);
    for (const spec of AI_SUGGESTION_SPECS) {
      expect(spec.mirrorsCommandId).toBeTruthy();
      expect(spec.previewTitleKey).toMatch(/^command\.aiSuggest\.preview\./);
    }
  });
});
