import { AppShellHeaderActions } from './AppShellHeaderActions';
import { AppShellHeaderLogo } from './AppShellHeaderLogo';
import { AppShellHeaderSafetyBanners } from './AppShellHeaderSafetyBanners';
import { MobilePageTitle } from './MobilePageTitle';

/** Props for {@link AppShellHeaderBar}. */
export interface AppShellHeaderBarProps {
  /** Whether live adapter mode is active. */
  isLive: boolean;
  /** Whether the backend enforces read-only mode. */
  isReadOnly: boolean;
  /** Whether the backend WebSocket is connected. */
  connected: boolean;
  /** Whether any enabled adapter is degraded. */
  hasDegradedAdapter: boolean;
  /** Current electricity price in €/kWh. */
  priceCurrent: number;
  /** Opens the global command palette. */
  onOpenCommandPalette: () => void;
}

/**
 * Primary header row: logo, page title, safety badges, and quick actions.
 */
export function AppShellHeaderBar({
  isLive,
  isReadOnly,
  connected,
  hasDegradedAdapter,
  priceCurrent,
  onOpenCommandPalette,
}: AppShellHeaderBarProps) {
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
