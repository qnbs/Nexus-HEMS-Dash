/**
 * ControlAuthority — pure resolver for browser-originated hardware control (FUP-CTRL-01).
 * Runtime wiring lives in `lib/adapter-mode.ts` (`getBrowserControlAuthority`).
 */

export type BackendAdapterMode = 'mock' | 'live' | 'unknown';

export type ControlAuthoritySource = 'browser-adapters' | 'backend' | 'none';

export type ControlAuthorityDenyReason =
  | 'read_only'
  | 'backend_live'
  | 'backend_ws'
  | 'backend_unresolved'
  | 'simulation_only';

export interface ControlAuthoritySnapshot {
  source: ControlAuthoritySource;
  /** Whether `BaseAdapter.sendCommand` / `sendAdapterCommand` may reach hardware. */
  browserDirectControlAllowed: boolean;
  denyReason?: ControlAuthorityDenyReason;
}

export interface ControlAuthorityInput {
  backendMode: BackendAdapterMode;
  readOnly: boolean;
  buildAllowsLive: boolean;
  backendWsEnabled: boolean;
}

export function resolveControlAuthority(input: ControlAuthorityInput): ControlAuthoritySnapshot {
  if (input.readOnly) {
    return {
      source: 'none',
      browserDirectControlAllowed: false,
      denyReason: 'read_only',
    };
  }

  if (input.backendMode === 'live') {
    return {
      source: 'backend',
      browserDirectControlAllowed: false,
      denyReason: 'backend_live',
    };
  }

  if (input.backendWsEnabled) {
    return {
      source: 'backend',
      browserDirectControlAllowed: false,
      denyReason: 'backend_ws',
    };
  }

  if (input.backendMode === 'unknown' && input.buildAllowsLive) {
    return {
      source: 'none',
      browserDirectControlAllowed: false,
      denyReason: 'backend_unresolved',
    };
  }

  // Mock/demo deployments: browser adapters may drive simulated hardware only.
  // Actual live connections remain gated by `isLiveHardwareBuildAllowed()`.
  return {
    source: 'browser-adapters',
    browserDirectControlAllowed: true,
  };
}

export function browserControlDeniedMessage(snapshot: ControlAuthoritySnapshot): string {
  switch (snapshot.denyReason) {
    case 'read_only':
      return 'System is in read-only mode — control commands are disabled';
    case 'backend_live':
      return 'Backend live mode is active — send control commands through the server API only';
    case 'backend_ws':
      return 'Backend WebSocket mode is enabled — browser adapters cannot command hardware directly';
    case 'backend_unresolved':
      return 'Backend health is not resolved yet — hardware commands are blocked until /api/health responds';
    case 'simulation_only':
      return 'Hardware control is disabled in simulation mode';
    default:
      return 'Hardware control is not permitted in the current deployment mode';
  }
}
