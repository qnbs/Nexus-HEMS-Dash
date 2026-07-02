/**
 * Fail-fast validation for production WS_ORIGINS (CSP connect-src).
 * Mirrors the nginx docker-entrypoint allowlist; API Helmet consumes the same env.
 */

const WS_ORIGIN_PATTERN = /^wss?:\/\/[a-zA-Z0-9][a-zA-Z0-9._\-[\]:]*(?::\d{1,5})?(?:\/[^\s]*)?$/;

export function parseWsOrigins(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

export function isValidWsOrigin(origin: string): boolean {
  return WS_ORIGIN_PATTERN.test(origin);
}

/**
 * In production, reject malformed WS_ORIGINS before Helmet applies CSP.
 * Empty is allowed (no extra connect-src entries beyond defaults).
 */
export function validateWsOrigins(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV !== 'production') return;

  for (const origin of parseWsOrigins(env.WS_ORIGINS)) {
    if (!isValidWsOrigin(origin)) {
      throw new Error(
        `[WS_ORIGINS] Invalid WebSocket origin "${origin}" — expected ws:// or wss:// with host [and optional port]`,
      );
    }
  }
}
