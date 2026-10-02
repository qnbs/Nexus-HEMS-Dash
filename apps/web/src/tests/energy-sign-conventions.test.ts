import { ENERGY_SIGN_CONVENTIONS } from '@nexus-hems/shared-types';
import { describe, expect, it } from 'vitest';

describe('ENERGY_SIGN_CONVENTIONS', () => {
  it('documents canonical power sign semantics for adapters and UI', () => {
    expect(ENERGY_SIGN_CONVENTIONS.gridPowerW).toBe('import_positive_export_negative');
    expect(ENERGY_SIGN_CONVENTIONS.batteryPowerW).toBe('discharge_positive_charge_negative');
    expect(ENERGY_SIGN_CONVENTIONS.evPowerW).toBe('charge_positive_discharge_negative');
    expect(ENERGY_SIGN_CONVENTIONS.pvPowerW).toBe('production_non_negative');
  });
});
