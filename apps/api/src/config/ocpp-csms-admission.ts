import { getEffectiveAdapterMode } from './adapter-mode.js';

/** Max inbound OCPP JSON frame size (bytes). */
export const OCPP_MAX_WS_MESSAGE_BYTES = 64 * 1024;

function readStationAllowlist(env: NodeJS.ProcessEnv): Set<string> {
  return new Set(
    (env.OCPP_CSMS_STATION_ALLOWLIST ?? process.env.OCPP_CSMS_STATION_ALLOWLIST ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export type OcppStationAdmission = 'accepted' | 'rejected';

/**
 * Live mode: charge-point identity must match OCPP_CSMS_STATION_ALLOWLIST when set.
 * Mock mode: accept all stations (lab/demo).
 */
export function resolveOcppStationAdmission(
  chargePointId: string,
  env: NodeJS.ProcessEnv = process.env,
): OcppStationAdmission {
  const mode = getEffectiveAdapterMode(env);
  if (mode !== 'live') return 'accepted';
  const allowlist = readStationAllowlist(env);
  if (allowlist.size === 0) {
    return 'rejected';
  }
  return allowlist.has(chargePointId) ? 'accepted' : 'rejected';
}
