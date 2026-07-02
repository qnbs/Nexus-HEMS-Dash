import { describe, expect, it } from 'vitest';
import { isValidWsOrigin, parseWsOrigins, validateWsOrigins } from './ws-origins.js';

describe('ws-origins', () => {
  it('parses comma-separated origins', () => {
    expect(parseWsOrigins(' wss://a.example , ws://b.local:8080 ')).toEqual([
      'wss://a.example',
      'ws://b.local:8080',
    ]);
  });

  it('accepts well-formed origins', () => {
    expect(isValidWsOrigin('wss://dashboard.example.com')).toBe(true);
    expect(isValidWsOrigin('ws://192.168.1.10:8085')).toBe(true);
  });

  it('rejects invalid schemes and characters', () => {
    expect(isValidWsOrigin('http://bad.example')).toBe(false);
    expect(isValidWsOrigin('wss://evil.com;rm -rf')).toBe(false);
  });

  it('does not throw in non-production', () => {
    expect(() =>
      validateWsOrigins({ NODE_ENV: 'development', WS_ORIGINS: 'not-valid' }),
    ).not.toThrow();
  });

  it('throws in production on invalid origin', () => {
    expect(() => validateWsOrigins({ NODE_ENV: 'production', WS_ORIGINS: 'ftp://bad' })).toThrow(
      /Invalid WebSocket origin/,
    );
  });

  it('allows empty WS_ORIGINS in production', () => {
    expect(() => validateWsOrigins({ NODE_ENV: 'production', WS_ORIGINS: '' })).not.toThrow();
  });
});
