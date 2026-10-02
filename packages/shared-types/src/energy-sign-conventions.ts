/**
 * Canonical power sign conventions for UI, adapters, and documentation (Wave 8).
 * All values are watts unless noted.
 */

export const ENERGY_SIGN_CONVENTIONS = {
  /** Positive: power drawn from grid; negative: feed-in / export. */
  gridPowerW: 'import_positive_export_negative',
  /** Positive: battery discharging; negative: charging. */
  batteryPowerW: 'discharge_positive_charge_negative',
  /** Positive: EV charging; negative: V2G discharge to site. */
  evPowerW: 'charge_positive_discharge_negative',
  /** PV production is always non-negative. */
  pvPowerW: 'production_non_negative',
} as const;

export type EnergySignConventionKey = keyof typeof ENERGY_SIGN_CONVENTIONS;
