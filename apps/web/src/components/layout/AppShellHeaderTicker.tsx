import { useTranslation } from 'react-i18next';
import {
  AppShellHeaderBatteryPill,
  AppShellHeaderGridPill,
  AppShellHeaderPricePill,
  AppShellHeaderPvPill,
  AppShellHeaderSelfSufficiencyPill,
} from './AppShellHeaderTickerPills';

/** Props for {@link AppShellHeaderTicker}. */
export interface AppShellHeaderTickerProps {
  /** Current electricity price in €/kWh. */
  priceCurrent: number;
  /** PV production in watts. */
  pvPower: number;
  /** Battery state of charge (0–100). */
  batterySoC: number;
  /** Grid power in watts (positive = import, negative = export). */
  gridPower: number;
  /** Self-sufficiency ratio in the range 0–100. */
  selfSufficiencyPercent: number;
}

/**
 * Mobile/tablet live KPI ticker below the main header row.
 */
export function AppShellHeaderTicker({
  priceCurrent,
  pvPower,
  batterySoC,
  gridPower,
  selfSufficiencyPercent,
}: AppShellHeaderTickerProps) {
  const { t } = useTranslation();

  return (
    <div
      className="scrollbar-hide mt-1.5 flex items-center gap-1 overflow-x-auto lg:hidden"
      role="status"
      aria-label={t('header.liveStatus')}
      aria-live="polite"
    >
      <AppShellHeaderPvPill pvPower={pvPower} />
      <AppShellHeaderBatteryPill batterySoC={batterySoC} />
      <AppShellHeaderGridPill gridPower={gridPower} />
      <AppShellHeaderPricePill priceCurrent={priceCurrent} />
      <AppShellHeaderSelfSufficiencyPill selfSufficiencyPercent={selfSufficiencyPercent} />
    </div>
  );
}
