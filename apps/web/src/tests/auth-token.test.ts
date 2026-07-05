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

  it('exchangeApiKeyForJwt returns network on fetch failure', async () => {
    vi.stubGlobal('window', { location: { origin: 'http://localhost:3000' } });
    vi.mocked(fetch).mockRejectedValueOnce(new Error('offline'));

    const { exchangeApiKeyForJwt } = await import('../lib/auth-token');
    const result = await exchangeApiKeyForJwt('client-1', 'secret-key');

    expect(result).toEqual({ ok: false, error: 'network' });
  });

  it('exchangeApiKeyForJwt returns invalid_response when body lacks token', async () => {
    vi.stubGlobal('window', { location: { origin: 'http://localhost:3000' } });
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ scope: 'read' }), { status: 200 }),
    );

    const { exchangeApiKeyForJwt } = await import('../lib/auth-token');
    const result = await exchangeApiKeyForJwt('client-1', 'secret-key');

    expect(result).toEqual({ ok: false, error: 'invalid_response' });
  });

  it('getAuthHeader returns null when no token is stored', async () => {
    const { clearAuthToken, getAuthHeader } = await import('../lib/auth-token');
    clearAuthToken();
    expect(getAuthHeader()).toBeNull();
  });

  it('fetchWsTicket returns a ticket when authenticated', async () => {
    vi.stubGlobal('window', { location: { origin: 'http://localhost:3000' } });
    const { setAuthToken, fetchWsTicket } = await import('../lib/auth-token');
    setAuthToken('jwt-abc');
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ticket: 'ws-ticket-1' }), { status: 200 }),
    );

    await expect(fetchWsTicket()).resolves.toBe('ws-ticket-1');
  });

  it('fetchWsTicket returns null without auth header', async () => {
    vi.stubGlobal('window', { location: { origin: 'http://localhost:3000' } });
    const { fetchWsTicket } = await import('../lib/auth-token');
    await expect(fetchWsTicket()).resolves.toBeNull();
  });

  it('fetchWsTicket returns null on non-OK responses', async () => {
    vi.stubGlobal('window', { location: { origin: 'http://localhost:3000' } });
    const { setAuthToken, fetchWsTicket } = await import('../lib/auth-token');
    setAuthToken('jwt-abc');
    vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 503 }));
    await expect(fetchWsTicket()).resolves.toBeNull();
  });

  it('exchangeApiKeyForJwt returns invalid_response on non-OK HTTP status', async () => {
    vi.stubGlobal('window', { location: { origin: 'http://localhost:3000' } });
    vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 500 }));

    const { exchangeApiKeyForJwt } = await import('../lib/auth-token');
    const result = await exchangeApiKeyForJwt('client-1', 'secret-key');

    expect(result).toEqual({ ok: false, error: 'invalid_response' });
  });

  it('fetchWsTicket returns null on network failure', async () => {
    vi.stubGlobal('window', { location: { origin: 'http://localhost:3000' } });
    const { setAuthToken, fetchWsTicket } = await import('../lib/auth-token');
    setAuthToken('jwt-abc');
    vi.mocked(fetch).mockRejectedValueOnce(new Error('offline'));
    await expect(fetchWsTicket()).resolves.toBeNull();
  });

  describe('getTokenScope', () => {
    function makeToken(payload: Record<string, unknown>): string {
      const json = JSON.stringify(payload);
      const base64 = btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      return `header.${base64}.signature`;
    }

    it('returns scope claim from a valid token', async () => {
      const { getTokenScope } = await import('../lib/auth-token');
      expect(getTokenScope(makeToken({ scope: 'admin' }))).toBe('admin');
      expect(getTokenScope(makeToken({ scope: 'read' }))).toBe('read');
    });

    it('returns null when token is missing', async () => {
      const { getTokenScope } = await import('../lib/auth-token');
      expect(getTokenScope(null)).toBeNull();
      expect(getTokenScope(undefined)).toBeNull();
    });

    it('returns null for malformed tokens', async () => {
      const { getTokenScope } = await import('../lib/auth-token');
      expect(getTokenScope('not-a-jwt')).toBeNull();
      expect(getTokenScope('only.two')).toBeNull();
    });

    it('returns null when scope claim is absent or non-string', async () => {
      const { getTokenScope } = await import('../lib/auth-token');
      expect(getTokenScope(makeToken({ sub: 'user' }))).toBeNull();
      expect(getTokenScope(makeToken({ scope: 123 }))).toBeNull();
    });
  });
});
