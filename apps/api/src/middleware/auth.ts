import type { NextFunction, Request, Response } from 'express';
import type { IncomingMessage } from 'http';
import { verifyToken } from '../jwt-utils.js';

// ─── Scope Ordering ──────────────────────────────────────────────────

export type JWTScope = 'read' | 'readwrite' | 'admin';

const SCOPE_ORDER: Record<JWTScope, number> = { read: 0, readwrite: 1, admin: 2 };

// ─── API Key Validation (Production Auth) ───────────────────────────
// In production, API clients must provide a valid API key to obtain a JWT.
// Set API_KEYS env var as a comma-separated list of pre-shared keys.
// Set API_KEY_SCOPES env var as comma-separated "key:scope" pairs to bind
// maximum allowed scope to each key (e.g., "monitorkey:read,appkey:readwrite").
// In dev mode, API key validation is skipped (auto-accept with warning).

const VALID_API_KEYS = new Set(
  (process.env.API_KEYS || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean),
);

// CRIT-01 fix: map each API key to its maximum allowed scope
export const API_KEY_SCOPE_MAP = new Map<string, JWTScope>(
  (process.env.API_KEY_SCOPES || '')
    .split(',')
    .map((entry) => {
      const colonIdx = entry.trim().lastIndexOf(':');
      if (colonIdx <= 0) return null;
      const key = entry.slice(0, colonIdx).trim();
      const scope = entry.slice(colonIdx + 1).trim() as JWTScope;
      if (!key || !['read', 'readwrite', 'admin'].includes(scope)) return null;
      return [key, scope] as [string, JWTScope];
    })
    .filter((entry): entry is [string, JWTScope] => entry !== null),
);

// LOW-04: Warn on any entries dropped due to invalid scope values
(process.env.API_KEY_SCOPES || '')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean)
  .forEach((entry) => {
    const colonIdx = entry.lastIndexOf(':');
    if (colonIdx <= 0) {
      console.warn(`[Auth] API_KEY_SCOPES entry "${entry}" has no colon separator — skipped`);
      return;
    }
    const scope = entry.slice(colonIdx + 1).trim();
    if (!['read', 'readwrite', 'admin'].includes(scope)) {
      console.warn(
        `[Auth] API_KEY_SCOPES entry has invalid scope "${scope}" — skipped (valid: read|readwrite|admin)`,
      );
    }
  });

/**
 * Returns the maximum scope allowed for the given API key.
 * Falls back to 'readwrite' if no scope mapping is configured for the key.
 */
export function getApiKeyMaxScope(apiKey: string): JWTScope {
  return API_KEY_SCOPE_MAP.get(apiKey) ?? 'readwrite';
}

/**
 * Clamps the requested scope to the maximum allowed for the given API key.
 * Prevents privilege escalation by any valid key (CRIT-01).
 */
export function clampScope(requestedScope: JWTScope | undefined, apiKey: string): JWTScope {
  const maxScope = getApiKeyMaxScope(apiKey);
  const requested = requestedScope ?? 'readwrite';
  return SCOPE_ORDER[requested] <= SCOPE_ORDER[maxScope] ? requested : maxScope;
}

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Validates an API key against the configured set.
 * In dev mode, always returns true (with console warning if no keys configured).
 */
export function validateApiKey(apiKey: string | undefined): boolean {
  if (isDev) {
    if (VALID_API_KEYS.size === 0) {
      // Dev mode without API_KEYS — auto-accept
      return true;
    }
  }
  if (!apiKey) return isDev; // In dev, allow missing key; in prod, reject
  return VALID_API_KEYS.has(apiKey);
}

// ─── JWT Middleware (Express) ────────────────────────────────────────

/**
 * Express middleware that requires a valid JWT Bearer token.
 * Stores decoded payload in res.locals.jwtPayload for downstream use.
 * In dev mode, auth is optional (anonymous access allowed with warning).
 */
export async function requireJWT(req: Request, res: Response, next: NextFunction): Promise<void> {
  // In dev mode, skip auth requirement
  if (isDev) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }

  try {
    const payload = await verifyToken(authHeader.slice(7));
    res.locals.jwtPayload = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Express middleware that enforces a minimum JWT scope level.
 * Must be used AFTER requireJWT (depends on res.locals.jwtPayload).
 * Returns 403 if the token scope is insufficient.
 */
export function requireScope(minScope: JWTScope) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    if (isDev) {
      // In dev mode, skip scope check (mirrors requireJWT behaviour)
      next();
      return;
    }
    const payload = res.locals.jwtPayload as { scope?: string } | undefined;
    const tokenScope = (payload?.scope ?? 'readwrite') as JWTScope;
    if (SCOPE_ORDER[tokenScope] < SCOPE_ORDER[minScope]) {
      res.status(403).json({ error: `Insufficient scope: ${minScope} required` });
      return;
    }
    next();
  };
}

// ─── WebSocket Authentication ───────────────────────────────────────

// CRIT-02 fix: AuthenticatedClient now carries scope for per-command authorization
export interface AuthenticatedClient {
  clientId: string;
  scope: JWTScope;
  authenticated: boolean;
  connectedAt: number;
}

/**
 * Authenticate a WebSocket connection via JWT token.
 * Accepts: ?ticket=<single-use WS ticket> (preferred — HIGH-04)
 * Falls back to: Authorization header or ?token=<JWT> (deprecated — logged in URL)
 *
 * The scope claim is extracted and stored for per-command authorization (CRIT-02).
 */
export async function authenticateWS(
  req: IncomingMessage,
  wsTickets: Map<string, { clientId: string; scope: JWTScope; expiresAt: number }>,
): Promise<AuthenticatedClient | null> {
  try {
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);

    // HIGH-04 fix: Prefer single-use WS ticket (prevents JWT from appearing in access logs)
    const ticket = url.searchParams.get('ticket');
    if (ticket) {
      const ticketData = wsTickets.get(ticket);
      if (ticketData && Date.now() < ticketData.expiresAt) {
        wsTickets.delete(ticket); // single-use: consume immediately
        return {
          clientId: ticketData.clientId,
          scope: ticketData.scope,
          authenticated: true,
          connectedAt: Date.now(),
        };
      }
      // Expired or unknown ticket — fall through to JWT fallback
    }

    // Fallback: Authorization header (preferred for non-browser clients)
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    // Legacy fallback: ?token= query param (still supported but deprecated)
    const queryToken = url.searchParams.get('token');

    const jwtToken = bearerToken ?? queryToken;
    if (!jwtToken) return null;

    const decoded = await verifyToken(jwtToken);
    const scope = (
      ['read', 'readwrite', 'admin'].includes(decoded.scope) ? decoded.scope : 'readwrite'
    ) as JWTScope;

    return {
      clientId: decoded.sub || 'unknown',
      scope,
      authenticated: true,
      connectedAt: Date.now(),
    };
  } catch {
    return null;
  }
}
