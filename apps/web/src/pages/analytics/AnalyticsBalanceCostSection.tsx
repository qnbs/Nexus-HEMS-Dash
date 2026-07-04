import type { TFunction } from 'i18next';
import { Clock, PieChart as PieIcon } from 'lucide-react';
import { motion } from 'motion/react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { generateEnergyBalance } from '../../lib/analytics-chart-data';

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
        <div className="h-[260px]" role="img" aria-label={t('analytics.balanceChartAria')}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={balanceData}>
              <defs>
                <linearGradient id="gradPv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-7)" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="var(--chart-7)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradCons" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradSurplus" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
              <XAxis
                dataKey="hour"
                stroke="var(--color-muted)"
                tick={{ fill: 'var(--color-muted)', fontSize: 10 }}
                interval={2}
              />
              <YAxis
                stroke="var(--color-muted)"
                tick={{ fill: 'var(--color-muted)', fontSize: 10 }}
                label={{
                  value: 'W',
                  angle: -90,
                  position: 'insideLeft',
                  fill: 'var(--color-muted)',
                  fontSize: 10,
                }}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface-strong)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  fontSize: '11px',
                  color: 'var(--color-text)',
                }}
                formatter={(value) => [`${value} W`]}
              />
              <Area
                type="monotone"
                dataKey="pv"
                stroke="var(--chart-7)"
                fill="url(#gradPv)"
                strokeWidth={2}
                name="PV"
              />
              <Area
                type="monotone"
                dataKey="consumption"
                stroke="var(--chart-2)"
                fill="url(#gradCons)"
                strokeWidth={2}
                name={t('analytics.consumptionLabel')}
              />
              <Area
                type="monotone"
                dataKey="surplus"
                stroke="var(--chart-1)"
                fill="url(#gradSurplus)"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                name={t('analytics.surplus')}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
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
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPie>
              <Pie
                data={costAllocation}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {costAllocation.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} opacity={0.85} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface-strong)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  fontSize: '11px',
                  color: 'var(--color-text)',
                }}
                formatter={(value) => [`€${(Number(value) / 100).toFixed(2)}`]}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '10px', color: 'var(--color-muted)' }}
              />
            </RechartsPie>
          </ResponsiveContainer>
        </div>
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
