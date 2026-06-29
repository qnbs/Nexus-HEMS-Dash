import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const storage = new Map<string, string>();

vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storage.set(key, value);
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
});

describe('auth-token', () => {
  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('getApiBaseUrl falls back to window.location.origin', async () => {
    vi.stubGlobal('window', { location: { origin: 'http://localhost:5173' } });
    const { getApiBaseUrl } = await import('../lib/auth-token');
    expect(getApiBaseUrl()).toBe('http://localhost:5173');
  });

  it('setAuthToken and getAuthToken round-trip', async () => {
    const { setAuthToken, getAuthToken } = await import('../lib/auth-token');
    setAuthToken('test-jwt');
    expect(getAuthToken()).toBe('test-jwt');
  });

  it('clearAuthToken removes stored token', async () => {
    const { setAuthToken, clearAuthToken, getAuthToken } = await import('../lib/auth-token');
    setAuthToken('test-jwt');
    clearAuthToken();
    expect(getAuthToken()).toBeNull();
  });

  it('getAuthHeader returns Bearer header when token exists', async () => {
    const { setAuthToken, getAuthHeader } = await import('../lib/auth-token');
    setAuthToken('abc123');
    expect(getAuthHeader()).toEqual({ Authorization: 'Bearer abc123' });
  });

  it('exchangeApiKeyForJwt persists token on success', async () => {
    vi.stubGlobal('window', { location: { origin: 'http://localhost:3000' } });
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ token: 'jwt-xyz', scope: 'readwrite' }), { status: 200 }),
    );

    const { exchangeApiKeyForJwt, getAuthToken } = await import('../lib/auth-token');
    const result = await exchangeApiKeyForJwt('client-1', 'secret-key', 'readwrite');

    expect(result).toEqual({ ok: true, token: 'jwt-xyz', scope: 'readwrite' });
    expect(getAuthToken()).toBe('jwt-xyz');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/token',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('exchangeApiKeyForJwt returns invalid_credentials on 401', async () => {
    vi.stubGlobal('window', { location: { origin: 'http://localhost:3000' } });
    vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 401 }));

    const { exchangeApiKeyForJwt } = await import('../lib/auth-token');
    const result = await exchangeApiKeyForJwt('client-1', 'bad-key');

    expect(result).toEqual({ ok: false, error: 'invalid_credentials' });
  });
});
