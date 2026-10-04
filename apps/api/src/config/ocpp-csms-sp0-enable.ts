import { resolveAdapterMode } from './adapter-mode.js';

const DEFAULT_MAX_SESSIONS = 32;
const MAX_SESSIONS_CAP = 4096;

export function resolveOcppCsmsMaxSessions(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.OCPP_CSMS_MAX_SESSIONS?.trim();
  if (!raw) return DEFAULT_MAX_SESSIONS;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_MAX_SESSIONS;
  return Math.min(Math.floor(n), MAX_SESSIONS_CAP);
}

/**
 * SP0 (plain WebSocket) CSMS listener is opt-in (FUP-OCPP-01).
 * Requires `OCPP_CSMS_PORT` and `OCPP_CSMS_ENABLE_SP0=true`.
 * Live mode additionally requires `ALLOW_LIVE_HARDWARE=true`.
 */
export function isOcppCsmsSp0Enabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const port = env.OCPP_CSMS_PORT?.trim();
  if (!port) return false;
  if (env.OCPP_CSMS_ENABLE_SP0?.trim().toLowerCase() !== 'true') return false;
  if (resolveAdapterMode(env) === 'live') {
    return env.ALLOW_LIVE_HARDWARE?.trim().toLowerCase() === 'true';
  }
  return true;
}
