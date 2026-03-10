import { describe, it, expect } from 'vitest';
import { buildOptimizerRecommendations } from '../lib/optimizer';
import type { EnergyData, StoredSettings } from '../types';

const baseEnergy: EnergyData = {
  pvPower: 4000,
  gridPower: 200,
  batteryPower: -500,
  houseLoad: 2000,
  batterySoC: 70,
  evPower: 0,
  heatPumpPower: 1000,
  gridVoltage: 230,
  batteryVoltage: 52,
  pvYieldToday: 10,
  priceCurrent: 0.15,
};

const baseSettings: StoredSettings = {
  chargeThreshold: 0.2,
  maxGridImportKw: 5,
  language: 'de',
  theme: 'energy-dark',
};

describe('Optimizer Recommendations', () => {
  it('should recommend battery charge when price is below threshold', () => {
    const recs = buildOptimizerRecommendations(
      { ...baseEnergy, priceCurrent: 0.1 },
      baseSettings,
    );
    const chargeRec = recs.find((r) => r.id === 'charge-window');
    expect(chargeRec).toBeDefined();
    expect(chargeRec?.severity).toBe('positive');
  });

  it('should NOT recommend battery charge when price is above threshold', () => {
    const recs = buildOptimizerRecommendations(
      { ...baseEnergy, priceCurrent: 0.25 },
      baseSettings,
    );
    expect(recs.find((r) => r.id === 'charge-window')).toBeUndefined();
  });

  it('should recommend EV charging on PV surplus > 1800W', () => {
    // pvSurplus = pvPower - houseLoad - heatPumpPower - evPower
    // 5000 - 2000 - 1000 - 0 = 2000 > 1800 ✓
    const recs = buildOptimizerRecommendations(
      { ...baseEnergy, pvPower: 5000 },
      baseSettings,
    );
    expect(recs.find((r) => r.id === 'pv-surplus')).toBeDefined();
  });

  it('should NOT recommend EV with low PV surplus', () => {
    const recs = buildOptimizerRecommendations(
      { ...baseEnergy, pvPower: 2500 },
      baseSettings,
    );
    expect(recs.find((r) => r.id === 'pv-surplus')).toBeUndefined();
  });

  it('should recommend SG Ready heat pump when battery > 65% and price low', () => {
    const recs = buildOptimizerRecommendations(
      { ...baseEnergy, batterySoC: 80, priceCurrent: 0.15 },
      baseSettings,
    );
    expect(recs.find((r) => r.id === 'sg-ready')).toBeDefined();
  });

  it('should warn on grid import exceeding limit', () => {
    const recs = buildOptimizerRecommendations(
      { ...baseEnergy, gridPower: 6000 },
      baseSettings,
    );
    const gridRec = recs.find((r) => r.id === 'grid-limit');
    expect(gridRec).toBeDefined();
    expect(gridRec?.severity).toBe('critical');
  });

  it('should return balanced fallback when no conditions fire', () => {
    const recs = buildOptimizerRecommendations(
      { ...baseEnergy, pvPower: 2000, priceCurrent: 0.25, batterySoC: 50, gridPower: 1000 },
      baseSettings,
    );
    expect(recs.find((r) => r.id === 'balanced')).toBeDefined();
  });
});
