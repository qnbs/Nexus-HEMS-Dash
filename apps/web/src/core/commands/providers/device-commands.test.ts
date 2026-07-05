import { describe, expect, it, vi } from 'vitest';
import type { CommandContext } from '../types';
import { createDeviceCommands } from './device-commands';

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
      evPower: 3500,
    },
    adapterStatuses: new Map(),
    adapterEntries: new Map(),
    tariffProvider: 'tibber',
    chargeThreshold: 0.15,
    isReadOnly: false,
    isLiveMode: false,
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

describe('createDeviceCommands', () => {
  const commands = createDeviceCommands();
  const stopCmd = commands.find((cmd) => cmd.id === 'device.stopEvCharging');
  const viewCmd = commands.find((cmd) => cmd.id === 'device.viewEvCharging');

  it('exposes EV charging commands when load is active', () => {
    const ctx = mockContext();
    expect(stopCmd?.when?.(ctx)).toBe(true);
    expect(viewCmd?.when?.(ctx)).toBe(true);
  });

  it('hides EV commands when evPower is idle', () => {
    const ctx = mockContext({ energy: { ...mockContext().energy, evPower: 0 } });
    expect(stopCmd?.when?.(ctx)).toBe(false);
    expect(viewCmd?.when?.(ctx)).toBe(false);
  });

  it('formats stop-charging preview with locale-aware power', () => {
    const ctx = mockContext();
    const preview = stopCmd?.preview?.(ctx);
    expect(preview?.titleKey).toBe('command.preview.stopCharging');
    expect(preview?.metrics?.[0]?.value).toMatch(/3,5 kW|3\.5 kW/);
  });

  it('closes palette on stop execute and navigates on view execute', () => {
    const ctx = mockContext();
    stopCmd?.execute(ctx);
    expect(ctx.actions.closePalette).toHaveBeenCalled();
    viewCmd?.execute(ctx);
    expect(ctx.navigate).toHaveBeenCalledWith('/devices');
    expect(ctx.actions.closePalette).toHaveBeenCalledTimes(2);
  });
});
