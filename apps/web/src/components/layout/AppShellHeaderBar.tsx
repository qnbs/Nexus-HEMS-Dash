import { AppShellHeaderActions } from './AppShellHeaderActions';
import { AppShellHeaderLogo } from './AppShellHeaderLogo';
import { AppShellHeaderSafetyBanners } from './AppShellHeaderSafetyBanners';
import { MobilePageTitle } from './MobilePageTitle';

/**
 * Primary header row: logo, page title, safety badges, and quick actions.
 *
 * @param props.isLive - Whether live adapter mode is active.
 * @param props.isReadOnly - Whether the backend enforces read-only mode.
 * @param props.connected - Whether the backend WebSocket is connected.
 * @param props.hasDegradedAdapter - Whether any enabled adapter is degraded.
 * @param props.priceCurrent - Current electricity price in €/kWh.
 * @param props.onOpenCommandPalette - Opens the global command palette.
 */
export function AppShellHeaderBar({
  isLive,
  isReadOnly,
  connected,
  hasDegradedAdapter,
  priceCurrent,
  onOpenCommandPalette,
}: {
  isLive: boolean;
  isReadOnly: boolean;
  connected: boolean;
  hasDegradedAdapter: boolean;
  priceCurrent: number;
  onOpenCommandPalette: () => void;
}) {
  return (
    <>
      <AppShellHeaderSafetyBanners isLive={isLive} isReadOnly={isReadOnly} />

      <div className="flex items-center gap-2 sm:gap-3">
        <AppShellHeaderLogo connected={connected} />
        <MobilePageTitle />
        <AppShellHeaderActions
          isLive={isLive}
          hasDegradedAdapter={hasDegradedAdapter}
          priceCurrent={priceCurrent}
          onOpenCommandPalette={onOpenCommandPalette}
        />
      </div>
    </>
  );
}
