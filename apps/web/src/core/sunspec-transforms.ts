/**
 * Shared SunSpec register → scalar field transforms.
 *
 * Used by `adapter-worker.ts` (off-thread) and `ModbusSunSpecAdapter` (main thread)
 * so MED-12 parity is enforced by a single code path before worker activation.
 */

export function applySunSpecScaleFactor(value: number, sf: number | undefined): number {
  if (sf === undefined || sf === 0) return value;
  return value * 10 ** sf;
}

export type SunSpecInverterScalars = {
  totalPowerW: number;
  yieldTodayKWh: number;
  voltageV?: number;
  currentA?: number;
  frequencyHz?: number;
  state?: number;
};

export type SunSpecBatteryScalars = {
  powerW: number;
  socPercent: number;
  voltageV?: number;
  currentA?: number;
  temperatureC?: number;
  cycleCount?: number;
  stateOfHealthPercent?: number;
};

export type SunSpecMeterScalars = {
  powerW: number;
  voltageV?: number;
  frequencyHz?: number;
  energyImportKWh?: number;
  energyExportKWh?: number;
};

function num(value: unknown, fallback = 0): number {
  return value == null ? fallback : Number(value);
}

function optionalNum(value: unknown): number | undefined {
  return value == null ? undefined : Number(value);
}

/** Parse SunSpec Model 103/124 inverter scalar registers. */
export function parseSunSpecInverterScalars(raw: Record<string, unknown>): SunSpecInverterScalars {
  const W = num(raw.W);
  const WH = num(raw.WH);
  const W_SF = optionalNum(raw.W_SF);
  const WH_SF = optionalNum(raw.WH_SF);
  const voltageV = optionalNum(raw.PhVphA);
  const currentA = optionalNum(raw.A);
  const frequencyHz = optionalNum(raw.Hz);
  const state = optionalNum(raw.St);

  return {
    totalPowerW: applySunSpecScaleFactor(W, W_SF),
    yieldTodayKWh: applySunSpecScaleFactor(WH, WH_SF) / 1000,
    ...(voltageV !== undefined ? { voltageV } : {}),
    ...(currentA !== undefined ? { currentA } : {}),
    ...(frequencyHz !== undefined ? { frequencyHz } : {}),
    ...(state !== undefined ? { state } : {}),
  };
}

/** Parse SunSpec Model 124 battery scalar registers. */
export function parseSunSpecBatteryScalars(raw: Record<string, unknown>): SunSpecBatteryScalars {
  const W = num(raw.W);
  const SoC = num(raw.SoC);
  const W_SF = optionalNum(raw.W_SF);
  const SoC_SF = optionalNum(raw.SoC_SF);
  const voltageV = optionalNum(raw.V);
  const currentA = optionalNum(raw.A);
  const temperatureC = optionalNum(raw.TmpBdy);
  const cycleCount = optionalNum(raw.CycCnt);
  const stateOfHealthPercent = optionalNum(raw.SoH);

  return {
    powerW: applySunSpecScaleFactor(W, W_SF),
    socPercent: applySunSpecScaleFactor(SoC, SoC_SF),
    ...(voltageV !== undefined ? { voltageV } : {}),
    ...(currentA !== undefined ? { currentA } : {}),
    ...(temperatureC !== undefined ? { temperatureC } : {}),
    ...(cycleCount !== undefined ? { cycleCount } : {}),
    ...(stateOfHealthPercent !== undefined ? { stateOfHealthPercent } : {}),
  };
}

/** Parse SunSpec Model 201–204 meter scalar registers. */
export function parseSunSpecMeterScalars(raw: Record<string, unknown>): SunSpecMeterScalars {
  const W = num(raw.W);
  const W_SF = optionalNum(raw.W_SF);
  const TotWh_SF = optionalNum(raw.TotWh_SF);
  const TotWhImp = optionalNum(raw.TotWhImp);
  const TotWhExp = optionalNum(raw.TotWhExp);
  const voltageV = optionalNum(raw.PhV);
  const frequencyHz = optionalNum(raw.Hz);
  const energyImportKWh =
    TotWhImp != null ? applySunSpecScaleFactor(TotWhImp, TotWh_SF) / 1000 : undefined;
  const energyExportKWh =
    TotWhExp != null ? applySunSpecScaleFactor(TotWhExp, TotWh_SF) / 1000 : undefined;

  return {
    powerW: applySunSpecScaleFactor(W, W_SF),
    ...(voltageV !== undefined ? { voltageV } : {}),
    ...(frequencyHz !== undefined ? { frequencyHz } : {}),
    ...(energyImportKWh !== undefined ? { energyImportKWh } : {}),
    ...(energyExportKWh !== undefined ? { energyExportKWh } : {}),
  };
}
