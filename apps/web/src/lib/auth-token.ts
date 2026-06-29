/**
 * JWT persistence for production API calls (background sync, shares, EEBUS proxy).
 * Token is written after a successful POST /api/auth/token exchange.
 */

const AUTH_TOKEN_KEY = 'nexus-hems-auth-token';

/** Resolve API base URL — explicit env var or same-origin fallback (dev proxy). */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    /* private mode / quota */
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    /* private mode */
  }
}

export type TokenExchangeResult =
  | { ok: true; token: string; scope: string }
  | { ok: false; error: 'no_api_base' | 'invalid_credentials' | 'network' | 'invalid_response' };

/** Exchange API key for JWT and persist to localStorage. */
export async function exchangeApiKeyForJwt(
  clientId: string,
  apiKey: string,
  scope: 'read' | 'readwrite' | 'admin' = 'readwrite',
): Promise<TokenExchangeResult> {
  const base = getApiBaseUrl();
  if (!base) return { ok: false, error: 'no_api_base' };

  try {
    const res = await fetch(`${base}/api/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, apiKey, scope }),
    });

    if (res.status === 401) return { ok: false, error: 'invalid_credentials' };
    if (!res.ok) return { ok: false, error: 'invalid_response' };

    const data = (await res.json()) as { token?: string; scope?: string };
    if (!data.token) return { ok: false, error: 'invalid_response' };

    setAuthToken(data.token);
    return { ok: true, token: data.token, scope: data.scope ?? scope };
  } catch {
    return { ok: false, error: 'network' };
  }
}

export function getAuthHeader(): Record<string, string> | null {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : null;
}
