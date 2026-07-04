import type { TFunction } from 'i18next';
import { getUbaFactor } from '../lib/co2-report';
import type { EnergySnapshot } from '../lib/db';
import { calculateCo2Savings } from '../lib/format';
import type { EnergyData } from '../types';

export interface EnergyMetrics {
  selfConsumed: number;
  selfRate: number;
  autarky: number;
  co2Total: number;
  savingsToday: number;
  gridImport: number;
  gridExport: number;
  feedInRevenue: number;
  gridCost: number;
  netCost: number;
}

export interface EfficiencyMetrics {
  systemEfficiency: number;
  inverterEfficiency: number;
  batteryRoundTrip: number;
}

export interface MonthlyCo2Balance {
  gridEmissions: number;
  selfSavings: number;
  feedInSavings: number;
  netBalance: number;
  totalSaved: number;
  treesEquiv: number;
  carKmEquiv: number;
  flightsEquiv: number;
}

export interface CostAllocationSlice {
  name: string;
  value: number;
  color: string;
}

export interface AnnualSummaryItem {
  label: string;
  value: string;
  color: string;
}

export interface TimeIndicators {
  isPeakHour: boolean;
  isSolarPeak: boolean;
}

export function computeEnergyMetrics(energyData: EnergyData): EnergyMetrics {
  const selfConsumed = Math.min(
    energyData.pvPower,
    energyData.houseLoad + energyData.heatPumpPower + energyData.evPower,
  );
  const selfRate = energyData.pvPower > 0 ? (selfConsumed / energyData.pvPower) * 100 : 0;
  const autarky =
    energyData.houseLoad > 0 ? Math.min(100, (selfConsumed / energyData.houseLoad) * 100) : 0;
  const co2Total = calculateCo2Savings(energyData.pvYieldToday);
  const savingsToday = energyData.pvYieldToday * energyData.priceCurrent;
  const gridImport = Math.max(0, energyData.gridPower);
  const gridExport = Math.max(0, -energyData.gridPower);
  const feedInRevenue = (gridExport / 1000) * 0.0811;
  const gridCost = (gridImport / 1000) * energyData.priceCurrent;
  const netCost = gridCost - feedInRevenue;

  return {
    selfConsumed,
    selfRate,
    autarky,
    co2Total,
    savingsToday,
    gridImport,
    gridExport,
    feedInRevenue,
    gridCost,
    netCost,
  };
}

export function buildCostAllocation(
  t: TFunction,
  metrics: Pick<EnergyMetrics, 'selfConsumed' | 'gridCost' | 'feedInRevenue'>,
  priceCurrent: number,
): CostAllocationSlice[] {
  const selfSavings = (metrics.selfConsumed / 1000) * priceCurrent;
  return [
    {
      name: t('analytics.selfConsumptionSavings'),
      value: Math.round(selfSavings * 100),
      color: 'var(--chart-1)',
    },
    {
      name: t('analytics.gridCostLabel'),
      value: Math.round(metrics.gridCost * 100),
      color: 'var(--chart-3)',
    },
    {
      name: t('analytics.feedInRevenue'),
      value: Math.round(metrics.feedInRevenue * 100),
      color: 'var(--chart-6)',
    },
  ].filter((d) => d.value > 0);
}

export function computeEfficiencyMetrics(
  energyData: EnergyData,
  selfConsumed: number,
  gridExport: number,
): EfficiencyMetrics {
  const systemEfficiency =
    energyData.pvPower > 0
      ? Math.min(99, ((selfConsumed + gridExport) / energyData.pvPower) * 100)
      : 0;
  const inverterEfficiency = energyData.pvPower > 0 ? 96.2 + (energyData.pvPower % 100) / 100 : 0;
  const batteryRoundTrip = energyData.batterySoC > 10 ? 92.5 + (energyData.batterySoC % 10) / 5 : 0;

  return { systemEfficiency, inverterEfficiency, batteryRoundTrip };
}

export function computeMonthlyCo2(
  energyData: EnergyData,
  selfRate: number,
  gridImport: number,
  ubaFactor: number,
): MonthlyCo2Balance {
  const pvKwh = energyData.pvYieldToday * 30;
  const selfConsumedKwh = pvKwh * (selfRate / 100);
  const exportedKwh = pvKwh - selfConsumedKwh;
  const importedKwh = (gridImport / 1000) * 24 * 30;
  const factorKg = ubaFactor / 1000;

  const gridEmissions = importedKwh * factorKg;
  const selfSavings = selfConsumedKwh * factorKg;
  const feedInSavings = exportedKwh * factorKg;
  const netBalance = gridEmissions - selfSavings - feedInSavings;
  const totalSaved = selfSavings + feedInSavings;

  return {
    gridEmissions,
    selfSavings,
    feedInSavings,
    netBalance,
    totalSaved,
    treesEquiv: totalSaved / (22 / 12),
    carKmEquiv: totalSaved / 0.12,
    flightsEquiv: totalSaved / 250,
  };
}

export function getTimeIndicators(date = new Date()): TimeIndicators {
  const hour = date.getHours();
  return {
    isPeakHour: hour >= 17 && hour <= 21,
    isSolarPeak: hour >= 10 && hour <= 14,
  };
}

export function getUbaFactorForYear(year = new Date().getFullYear()): number {
  return getUbaFactor(year);
}

export function generateForecastSnapshots(
  energyData: EnergyData,
  now = Date.now(),
): EnergySnapshot[] {
  return Array.from({ length: 72 }, (_, i) => {
    const hour = new Date(now - (72 - i) * 3_600_000).getHours();
    const sunFactor = hour >= 6 && hour <= 20 ? Math.sin(((hour - 6) / 14) * Math.PI) : 0;
    return {
      timestamp: now - (72 - i) * 3_600_000,
      gridPower: 500 + Math.sin(i / 4) * 300 + Math.sin(i * 0.7) * 100,
      pvPower: Math.round(energyData.pvPower * sunFactor * (0.5 + Math.sin(i * 0.3) * 0.3)),
      batteryPower: Math.sin(i / 6) * 1500,
      houseLoad: 800 + Math.sin(i / 3) * 400 + (hour >= 17 && hour <= 21 ? 600 : 0),
      batterySoC: 40 + Math.sin(i / 12) * 30,
      heatPumpPower: hour >= 6 && hour <= 22 ? 800 + Math.sin(i / 5) * 400 : 200,
      evPower: hour >= 22 || hour <= 6 ? 3500 : 0,
      gridVoltage: 230 + Math.sin(i / 8) * 3,
      batteryVoltage: 51.2 + Math.sin(i / 10) * 1.5,
      pvYieldToday: energyData.pvYieldToday,
      priceCurrent: 0.25 + Math.sin(i / 6) * 0.08,
    };
  });
}

export function buildAnnualSummary(
  monthlyData: Array<{ production: number; consumption: number; savings: number }>,
  t: TFunction,
): AnnualSummaryItem[] {
  const totalProd = monthlyData.reduce((a, d) => a + d.production, 0);
  const totalCons = monthlyData.reduce((a, d) => a + d.consumption, 0);
  const totalSav = monthlyData.reduce((a, d) => a + d.savings, 0);
  const yearlyAutarky = totalProd > 0 ? Math.min(100, (totalProd / totalCons) * 100) : 0;

  return [
    {
      label: t('analytics.yearlyProduction'),
      value: `${(totalProd / 1000).toFixed(1)} MWh`,
      color: 'text-yellow-400',
    },
    {
      label: t('analytics.yearlyConsumption'),
      value: `${(totalCons / 1000).toFixed(1)} MWh`,
      color: 'text-blue-400',
    },
    {
      label: t('analytics.yearlySavings'),
      value: `€${totalSav.toFixed(0)}`,
      color: 'text-emerald-400',
    },
    {
      label: t('analytics.yearlyAutarky'),
      value: `${yearlyAutarky.toFixed(0)}%`,
      color: 'text-purple-400',
    },
  ];
}

export function computeBalanceNetKwh(
  balanceData: Array<{ pv: number; consumption: number }>,
): number {
  return balanceData.reduce((a, d) => a + d.pv - d.consumption, 0) / 1000;
}
