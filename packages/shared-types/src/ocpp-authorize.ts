export type OcppAuthorizeDecision = 'Accepted' | 'Invalid' | 'Blocked';

/** Extract idToken string from OCPP Authorize payload shapes. */
export function extractOcppIdToken(payload: Record<string, unknown>): string | undefined {
  const direct = payload.idToken;
  if (typeof direct === 'string' && direct.trim()) return direct.trim();
  if (direct && typeof direct === 'object') {
    const nested = (direct as { idToken?: unknown }).idToken;
    if (typeof nested === 'string' && nested.trim()) return nested.trim();
  }
  return undefined;
}

/**
 * Resolve Authorize status for inbound OCPP Authorize calls.
 * Live mode requires an explicit allowlist match; mock mode auto-accepts.
 */
export function resolveOcppAuthorizeDecision(
  adapterMode: 'mock' | 'live',
  payload: Record<string, unknown>,
  allowlistedTokens: ReadonlySet<string>,
): OcppAuthorizeDecision {
  if (adapterMode !== 'live') {
    return 'Accepted';
  }
  const token = extractOcppIdToken(payload);
  if (!token) return 'Invalid';
  if (allowlistedTokens.has(token)) return 'Accepted';
  return 'Blocked';
}

export function idTokenInfoStatus(
  decision: OcppAuthorizeDecision,
): 'Accepted' | 'Invalid' | 'Blocked' {
  return decision;
}
