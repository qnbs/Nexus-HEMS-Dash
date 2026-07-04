import type { TFunction } from 'i18next';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { generateEnergyBalance } from '../../lib/analytics-chart-data';

type BalanceDataPoint = ReturnType<typeof generateEnergyBalance>[number];

export interface EnergyBalanceAreaChartProps {
  t: TFunction;
  balanceData: BalanceDataPoint[];
}

/** 24-hour PV vs consumption area chart for the Analytics balance section. */
export const EnergyBalanceAreaChart = ({ t, balanceData }: EnergyBalanceAreaChartProps) => (
  <div className="h-[260px]" role="img" aria-label={t('analytics.balanceChartAria')}>
    <ResponsiveContainer width="100%" height="100%">
      {/* skipcq: JS-0415 - Recharts gradient defs exceed JSX depth 4 by design */}
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
);
