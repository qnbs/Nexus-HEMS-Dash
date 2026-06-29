/**
 * JWT persistence for production API calls (background sync, shares, EEBUS proxy).
 * Token is written after a successful POST /api/auth/token exchange.
 */

const AUTH_TOKEN_KEY = 'nexus-hems-auth-token';

function apiBase(): string {
  return import.meta.env.VITE_API_URL ?? '';
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

/** Exchange API key for JWT and persist to localStorage. */
export async function exchangeApiKeyForJwt(
  clientId: string,
  apiKey: string,
  scope: 'read' | 'readwrite' | 'admin' = 'readwrite',
): Promise<string | null> {
  const base = apiBase();
  if (!base) return null;

  const res = await fetch(`${base}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, apiKey, scope }),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as { token?: string };
  if (!data.token) return null;

  setAuthToken(data.token);
  return data.token;
}

export function getAuthHeader(): Record<string, string> | null {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : null;
}
