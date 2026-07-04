import { motion } from 'motion/react';
import type { RefObject } from 'react';
import { AppShellHeaderBar } from './AppShellHeaderBar';
import { AppShellHeaderTicker } from './AppShellHeaderTicker';

/**
 * Fixed app header: safety banners, navigation actions, and live KPI ticker.
 *
 * @param props - Header layout state wired from {@link AppShell}.
 */
export function AppShellHeader({
  headerRef,
  scrolled,
  isLive,
  isReadOnly,
  connected,
  hasDegradedAdapter,
  priceCurrent,
  pvPower,
  batterySoC,
  gridPower,
  houseLoad,
  onOpenCommandPalette,
}: {
  headerRef: RefObject<HTMLElement | null>;
  scrolled: boolean;
  isLive: boolean;
  isReadOnly: boolean;
  connected: boolean;
  hasDegradedAdapter: boolean;
  priceCurrent: number;
  pvPower: number;
  batterySoC: number;
  gridPower: number;
  houseLoad: number;
  onOpenCommandPalette: () => void;
}) {
  const selfSufficiencyPercent =
    houseLoad > 0
      ? Math.min(100, Math.round(((houseLoad - Math.max(0, gridPower)) / houseLoad) * 100))
      : 0;

  return (
    <motion.header
      ref={headerRef}
      data-scrolled={scrolled ? 'true' : 'false'}
      className="app-header header-accent-line fixed top-0 right-0 left-0 z-sticky overflow-hidden px-3 pt-[max(0.375rem,env(safe-area-inset-top))] pb-1.5 sm:px-6 sm:pt-[max(0.75rem,env(safe-area-inset-top))] sm:pb-3 lg:left-64"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <AppShellHeaderBar
        isLive={isLive}
        isReadOnly={isReadOnly}
        connected={connected}
        hasDegradedAdapter={hasDegradedAdapter}
        priceCurrent={priceCurrent}
        onOpenCommandPalette={onOpenCommandPalette}
      />
      <AppShellHeaderTicker
        priceCurrent={priceCurrent}
        pvPower={pvPower}
        batterySoC={batterySoC}
        gridPower={gridPower}
        selfSufficiencyPercent={selfSufficiencyPercent}
      />
    </motion.header>
  );
}
