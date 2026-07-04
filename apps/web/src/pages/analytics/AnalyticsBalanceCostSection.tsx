import type { TFunction } from 'i18next';
import { Clock, PieChart as PieIcon } from 'lucide-react';
import { motion } from 'motion/react';
import type { generateEnergyBalance } from '../../lib/analytics-chart-data';
import { CostDonutChart } from './CostDonutChart';
import { EnergyBalanceAreaChart } from './EnergyBalanceAreaChart';

type BalanceDataPoint = ReturnType<typeof generateEnergyBalance>[number];

export interface CostAllocationEntry {
  name: string;
  value: number;
  color: string;
}

export interface AnalyticsBalanceCostSectionProps {
  t: TFunction;
  balanceData: BalanceDataPoint[];
  costAllocation: CostAllocationEntry[];
  netCost: number;
  gridCost: number;
  feedInRevenue: number;
}

/** Energy balance area chart and cost allocation donut for the Analytics page. */
export const AnalyticsBalanceCostSection = ({
  t,
  balanceData,
  costAllocation,
  netCost,
  gridCost,
  feedInRevenue,
}: AnalyticsBalanceCostSectionProps) => {
  const netBalanceKwh = balanceData.reduce((a, d) => a + d.pv - d.consumption, 0) / 1000;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <motion.section
        className="glass-panel-strong hover-lift p-6 lg:col-span-2"
        aria-labelledby="balance-chart-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
      >
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2
            id="balance-chart-title"
            className="fluid-text-lg flex items-center gap-2 font-medium"
          >
            <Clock size={20} className="text-(--color-secondary)" aria-hidden="true" />
            {t('analytics.energyBalance24h')}
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-400" />
              {t('analytics.pvProduction')}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-400" />
              {t('analytics.consumptionLabel')}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
              {t('analytics.surplus')}
            </span>
          </div>
        </div>
        <EnergyBalanceAreaChart t={t} balanceData={balanceData} />
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white/5 p-2.5 text-center">
            <p className="text-(--color-muted) text-[10px]">{t('analytics.totalProduction')}</p>
            <p className="font-medium text-sm text-yellow-400">
              {(balanceData.reduce((a, d) => a + d.pv, 0) / 1000).toFixed(1)} kWh
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-2.5 text-center">
            <p className="text-(--color-muted) text-[10px]">{t('analytics.totalConsumption')}</p>
            <p className="font-medium text-blue-400 text-sm">
              {(balanceData.reduce((a, d) => a + d.consumption, 0) / 1000).toFixed(1)} kWh
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-2.5 text-center">
            <p className="text-(--color-muted) text-[10px]">{t('analytics.netBalance')}</p>
            <p
              className={`font-medium text-sm ${netBalanceKwh >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {netBalanceKwh >= 0 ? '+' : ''}
              {netBalanceKwh.toFixed(1)} kWh
            </p>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="glass-panel-strong hover-lift p-6"
        aria-labelledby="cost-donut-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.38 }}
      >
        <h2
          id="cost-donut-title"
          className="fluid-text-lg mb-4 flex items-center gap-2 font-medium"
        >
          <PieIcon size={20} className="text-(--color-secondary)" aria-hidden="true" />
          {t('analytics.costAllocation')}
        </h2>
        <CostDonutChart costAllocation={costAllocation} />
        <div className="mt-3 rounded-xl bg-white/5 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-(--color-muted)">{t('analytics.netCostToday')}</span>
            <span
              className={`font-medium ${netCost <= 0 ? 'text-emerald-400' : 'text-orange-400'}`}
            >
              {netCost <= 0 ? '–' : ''}€{Math.abs(netCost).toFixed(2)}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-1 text-(--color-muted) text-[10px]">
            <span className="truncate">
              {t('analytics.gridCostLabel')}: €{gridCost.toFixed(2)}
            </span>
            <span className="truncate">
              {t('analytics.feedInRevenue')}: €{feedInRevenue.toFixed(2)}
            </span>
          </div>
        </div>
      </motion.section>
    </div>
  );
};
