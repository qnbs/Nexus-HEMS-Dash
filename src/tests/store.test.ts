import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from '../store';

// Mock persistSettings to avoid Dexie in unit tests
vi.mock('../lib/db', () => ({
  persistSettings: vi.fn(),
}));

describe('Zustand Store', () => {
  beforeEach(() => {
    // Reset store state between tests
    useAppStore.setState({
      energyData: {
        gridPower: 0,
        pvPower: 0,
        batteryPower: 0,
        houseLoad: 0,
        batterySoC: 0,
        heatPumpPower: 0,
        evPower: 0,
        gridVoltage: 230,
        batteryVoltage: 51.2,
        pvYieldToday: 0,
        priceCurrent: 0.18,
      },
      connected: false,
      lastUpdated: null,
      locale: 'de',
      theme: 'energy-dark',
    });
  });

  it('should have default energy data', () => {
    const { energyData } = useAppStore.getState();
    expect(energyData.pvPower).toBe(0);
    expect(energyData.gridVoltage).toBe(230);
    expect(energyData.priceCurrent).toBe(0.18);
  });

  it('should update energy data partially', () => {
    useAppStore.getState().setEnergyData({ pvPower: 3500, batterySoC: 72 });
    const { energyData, lastUpdated } = useAppStore.getState();
    expect(energyData.pvPower).toBe(3500);
    expect(energyData.batterySoC).toBe(72);
    expect(energyData.gridVoltage).toBe(230); // unchanged
    expect(lastUpdated).toBeTypeOf('number');
  });

  it('should toggle connected status', () => {
    expect(useAppStore.getState().connected).toBe(false);
    useAppStore.getState().setConnected(true);
    expect(useAppStore.getState().connected).toBe(true);
  });

  it('should switch locale', () => {
    useAppStore.getState().setLocale('en');
    expect(useAppStore.getState().locale).toBe('en');
  });

  it('should switch theme and increment transition key', () => {
    const keyBefore = useAppStore.getState().themeTransitionKey;
    useAppStore.getState().setTheme('solar-light');
    expect(useAppStore.getState().theme).toBe('solar-light');
    expect(useAppStore.getState().themeTransitionKey).toBe(keyBefore + 1);
  });

  it('should update floorplan partially', () => {
    useAppStore.getState().updateFloorplan({ roomTemperature: 23 });
    expect(useAppStore.getState().floorplan.roomTemperature).toBe(23);
    expect(useAppStore.getState().floorplan.lightsOn).toBe(true); // unchanged
  });

  it('should update settings and persist', async () => {
    const db = await import('../lib/db');
    useAppStore.getState().updateSettings({ chargeThreshold: 0.12 });
    expect(useAppStore.getState().settings.chargeThreshold).toBe(0.12);
    expect(db.persistSettings).toHaveBeenCalled();
  });
});
