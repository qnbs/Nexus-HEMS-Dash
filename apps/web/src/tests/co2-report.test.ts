import { describe, expect, it } from 'vitest';
import {
  calculateAnnualCo2,
  calculateCo2Balance,
  calculateMonthlyCo2,
  getUbaFactor,
} from '../lib/co2-report';
import type { EnergySnapshot } from '../lib/db';
import type { DailyAggregate } from '../lib/ml-forecast';

const dailyRows: DailyAggregate[] = [
  {
    date: '2026-03-01',
    timestamp: Date.UTC(2026, 2, 1),
    pvGenerationKwh: 12,
    gridImportKwh: 4,
    gridExportKwh: 2,
    consumptionKwh: 14,
    selfConsumptionRate: 70,
    autarkyRate: 65,
    co2SavedKg: 3.2,
    costSavingsEur: 1.8,
    avgBatterySoC: 68,
    peakPvPowerW: 4200,
    peakLoadW: 2800,
  },
  {
    date: '2026-03-02',
    timestamp: Date.UTC(2026, 2, 2),
    pvGenerationKwh: 10,
    gridImportKwh: 5,
    gridExportKwh: 1,
    consumptionKwh: 14,
    selfConsumptionRate: 68,
    autarkyRate: 60,
    co2SavedKg: 2.8,
    costSavingsEur: 1.5,
    avgBatterySoC: 64,
    peakPvPowerW: 3900,
    peakLoadW: 2600,
  },
];

function makeMonthSnapshots(year: number, month: number): EnergySnapshot[] {
  const start = Date.UTC(year, month, 1, 8, 0, 0);
  return Array.from({ length: 24 }, (_, index) => ({
    timestamp: start + index * 3_600_000,
    gridPower: index % 3 === 0 ? 600 : -200,
    pvPower: 2500 + index * 50,
    batteryPower: -300,
    houseLoad: 1800,
    batterySoC: 55 + (index % 10),
    heatPumpPower: 400,
    evPower: 0,
    gridVoltage: 230,
    batteryVoltage: 52,
    pvYieldToday: 8,
    priceCurrent: 0.24,
  }));
}

describe('co2-report calculations', () => {
  it('returns known and fallback UBA emission factors', () => {
    expect(getUbaFactor(2025)).toBe(364);
    expect(getUbaFactor(1999)).toBe(364);
  });

  it('builds a monthly CO2 balance from daily aggregates', () => {
    const balance = calculateCo2Balance(dailyRows, 2026, 2, 'de-DE');

    expect(balance.period).toContain('2026');
    expect(balance.gridEmissionsKg).toBeGreaterThan(0);
    expect(balance.selfConsumptionSavingsKg).toBeGreaterThan(0);
    expect(balance.equivalences.treesEquivalent).toBeGreaterThan(0);
    expect(balance.netBalanceKg).toBeLessThan(balance.gridEmissionsKg);
  });

  it('derives monthly and annual balances from raw snapshots', () => {
    const snapshots = [...makeMonthSnapshots(2026, 2), ...makeMonthSnapshots(2026, 3)];

    const monthly = calculateMonthlyCo2(snapshots, 2026, 2);
    expect(monthly.dailyData.length).toBeGreaterThan(0);
    expect(monthly.ubaFactor).toBe(getUbaFactor(2026));

    const annual = calculateAnnualCo2(snapshots, 2026);
    expect(annual.months.length).toBeGreaterThan(0);
    expect(annual.totalSelfConsumptionSavingsKg).toBeGreaterThan(0);
    expect(annual.bestMonth.savingsKg).toBeGreaterThanOrEqual(annual.worstMonth.savingsKg);
  });
});
