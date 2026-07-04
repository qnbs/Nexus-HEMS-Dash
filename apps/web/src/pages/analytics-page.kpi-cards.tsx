import type { TFunction } from 'i18next';
import {
  Battery,
  DollarSign,
  Gauge,
  Leaf,
  Shield,
  Sun,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { EfficiencyMetrics, EnergyMetrics } from './analytics-page.selectors';

export interface KpiCardConfig {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  trend: string;
  trendUp: boolean;
}

export function buildKpiCards(
  t: TFunction,
  metrics: EnergyMetrics,
  efficiency: EfficiencyMetrics,
  priceCurrent: number,
): KpiCardConfig[] {
  const { savingsToday, co2Total, selfRate, autarky, gridCost, feedInRevenue } = metrics;
  const { batteryRoundTrip, inverterEfficiency, systemEfficiency } = efficiency;

  return [
    {
      label: t('analytics.savingsToday'),
      value: `€${savingsToday.toFixed(2)}`,
      icon: <DollarSign size={16} />,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      trend: savingsToday > 1 ? '+12%' : '–',
      trendUp: true,
    },
    {
      label: t('forecast.co2Saved'),
      value: `${co2Total.toFixed(1)} kg`,
      icon: <Leaf size={16} />,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      trend: '-380g/kWh',
      trendUp: true,
    },
    {
      label: t('analytics.selfConsumptionRate'),
      value: `${selfRate.toFixed(0)}%`,
      icon: <Sun size={16} />,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      trend: selfRate > 60 ? t('analytics.excellent') : t('analytics.moderate'),
      trendUp: selfRate > 50,
    },
    {
      label: t('analytics.autarky'),
      value: `${autarky.toFixed(0)}%`,
      icon: <Shield size={16} />,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      trend: autarky > 70 ? t('analytics.excellent') : t('analytics.needsImprovement'),
      trendUp: autarky > 50,
    },
    {
      label: t('analytics.gridImportCost'),
      value: `€${gridCost.toFixed(2)}`,
      icon: <TrendingDown size={16} />,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      trend: `${(priceCurrent * 100).toFixed(1)} ct/kWh`,
      trendUp: false,
    },
    {
      label: t('analytics.feedInRevenueLabel'),
      value: `€${feedInRevenue.toFixed(2)}`,
      icon: <TrendingUp size={16} />,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      trend: '8,11 ct/kWh',
      trendUp: true,
    },
    {
      label: t('analytics.batteryEfficiency'),
      value: `${batteryRoundTrip.toFixed(1)}%`,
      icon: <Battery size={16} />,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      trend: t('analytics.roundTrip'),
      trendUp: batteryRoundTrip > 90,
    },
    {
      label: t('analytics.systemEfficiency'),
      value: `${systemEfficiency.toFixed(0)}%`,
      icon: <Gauge size={16} />,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10',
      trend: `η ${inverterEfficiency.toFixed(1)}%`,
      trendUp: systemEfficiency > 85,
    },
  ];
}
