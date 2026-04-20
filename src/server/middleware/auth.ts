import type { NextFunction, Request, Response } from 'express';
import type { IncomingMessage } from 'http';
import { verifyToken } from '../../../jwt-utils.js';

// ─── API Key Validation (Production Auth) ───────────────────────────
// In production, API clients must provide a valid API key to obtain a JWT.
// Set API_KEYS env var as a comma-separated list of pre-shared keys.
// In dev mode, API key validation is skipped (auto-accept with warning).

const VALID_API_KEYS = new Set(
  (process.env.API_KEYS || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean),
);

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
 * Used to protect sensitive endpoints like /metrics, /api/eebus/*, /api/grafana/*.
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
    await verifyToken(authHeader.slice(7));
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ─── WebSocket Authentication ───────────────────────────────────────

export interface AuthenticatedClient {
  clientId: string;
  authenticated: boolean;
  connectedAt: number;
}

/**
 * Authenticate a WebSocket connection via JWT token.
 * Token can be passed as query param (?token=...) or Authorization header.
 */
export async function authenticateWS(req: IncomingMessage): Promise<AuthenticatedClient | null> {
  try {
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const token = url.searchParams.get('token');

    // Also check Authorization header
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    const jwtToken = token || bearerToken;
    if (!jwtToken) return null;

    const decoded = await verifyToken(jwtToken);
    return {
      clientId: decoded.sub || 'unknown',
      authenticated: true,
      connectedAt: Date.now(),
    };
  } catch {
    return null;
  }
}
