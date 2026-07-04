import { BatteryMedium, Sun, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SelfSufficiencyRing } from './SelfSufficiencyRing';

/**
 * Mobile/tablet live KPI ticker below the main header row.
 *
 * @param props - Live KPI values rendered in the compact header strip.
 */
export function AppShellHeaderTicker({
  priceCurrent,
  pvPower,
  batterySoC,
  gridPower,
  selfSufficiencyPercent,
}: {
  priceCurrent: number;
  pvPower: number;
  batterySoC: number;
  gridPower: number;
  selfSufficiencyPercent: number;
}) {
  const { t } = useTranslation();

  return (
    <div
      className="scrollbar-hide mt-1.5 flex items-center gap-1 overflow-x-auto lg:hidden"
      role="status"
      aria-label={t('header.liveStatus')}
      aria-live="polite"
    >
      <div
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-(--color-surface)/60 px-2 py-0.5 font-medium text-xs"
        title={t('header.pvPower')}
      >
        <Sun className="h-3 w-3 text-amber-400" aria-hidden="true" />
        <span className="text-(--color-text)">
          {pvPower >= 1000 ? `${(pvPower / 1000).toFixed(1)} kW` : `${Math.round(pvPower)} W`}
        </span>
      </div>

      <div
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-(--color-surface)/60 px-2 py-0.5 font-medium text-xs"
        title={t('header.batterySoC')}
      >
        <BatteryMedium
          className={`h-3 w-3 ${
            batterySoC > 50
              ? 'text-(--color-neon-green)'
              : batterySoC > 20
                ? 'text-amber-400'
                : 'text-red-400'
          }`}
          aria-hidden="true"
        />
        <span className="text-(--color-text)">{Math.round(batterySoC)}%</span>
      </div>

      <div
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-(--color-surface)/60 px-2 py-0.5 font-medium text-xs"
        title={gridPower >= 0 ? t('header.gridImport') : t('header.gridExport')}
      >
        <Zap
          className={`h-3 w-3 ${gridPower >= 0 ? 'text-red-400' : 'text-(--color-neon-green)'}`}
          aria-hidden="true"
        />
        <span className="text-(--color-text)">
          {Math.abs(gridPower) >= 1000
            ? `${(Math.abs(gridPower) / 1000).toFixed(1)} kW`
            : `${Math.round(Math.abs(gridPower))} W`}
        </span>
        <span
          className={`text-[10px] ${gridPower >= 0 ? 'text-red-400' : 'text-(--color-neon-green)'}`}
        >
          {gridPower >= 0 ? '↓' : '↑'}
        </span>
      </div>

      <div
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-(--color-surface)/60 px-2 py-0.5 font-medium text-xs md:hidden"
        title={t('dashboard.currentPrice')}
      >
        <span className="text-(--color-primary)">{priceCurrent.toFixed(2)} ct</span>
      </div>

      <div
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-(--color-surface)/60 px-2 py-0.5 font-medium text-xs"
        title={t('header.selfSufficiency')}
      >
        <SelfSufficiencyRing percentage={selfSufficiencyPercent} />
        <span className="text-(--color-text)">{selfSufficiencyPercent}%</span>
      </div>
    </div>
  );
}
