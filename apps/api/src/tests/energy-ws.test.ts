import { afterEach, describe, expect, it } from 'vitest';
import type { WebSocket } from 'ws';
import { isReadOnlyMode } from '../config/read-only-mode.js';
import { checkWsRateLimit, filterMockData, sanitizeOutgoingWsPayload, validateWSCommand } from '../ws/energy.ws.js';

describe('validateWSCommand', () => {
  it('accepts a valid hardware command', () => {
    const result = validateWSCommand({ type: 'SET_GRID_LIMIT', value: 4200 });
    expect(result.valid).toBe(true);
  });

  it('rejects commands with invalid shape', () => {
    const result = validateWSCommand({ type: 123, value: 'nope' });
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('filterMockData', () => {
  it('returns only subscribed metric keys', () => {
    const data = { pvPower: 100, batteryPower: -50, gridPower: 10, houseLoad: 80 };
    const filtered = filterMockData(data, new Set(['pvPower', 'gridPower']));
    expect(filtered).toEqual({ pvPower: 100, gridPower: 10 });
  });

  it('ignores keys not present in the payload', () => {
    const filtered = filterMockData({ pvPower: 1 }, new Set(['pvPower', 'evPower']));
    expect(filtered).toEqual({ pvPower: 1 });
  });
});

describe('sanitizeOutgoingWsPayload', () => {
  it('masks PII inside outbound websocket payloads', () => {
    const sanitized = sanitizeOutgoingWsPayload({
      type: 'ERROR',
      error: 'Reach admin@example.com at 192.168.1.42',
      data: {
        label: 'Room owner@example.com',
      },
    }) as {
      error: string;
      data: { label: string };
    };

    expect(sanitized.error).toContain('[EMAIL]');
    expect(sanitized.error).toContain('[IP]');
    expect(sanitized.error).not.toContain('admin@example.com');
    expect(sanitized.data.label).toContain('[EMAIL]');
  });
});

describe('checkWsRateLimit', () => {
  const originalWsRateLimit = process.env.WS_RATE_LIMIT;

  afterEach(() => {
    if (originalWsRateLimit === undefined) delete process.env.WS_RATE_LIMIT;
    else process.env.WS_RATE_LIMIT = originalWsRateLimit;
  });

  it('returns true up to the limit and false afterwards', () => {
    process.env.WS_RATE_LIMIT = '2';
    const ws = {} as WebSocket;
    const limits = new WeakMap<WebSocket, { count: number; resetAt: number }>();

    // First two calls are within the limit
    expect(checkWsRateLimit(ws, limits)).toBe(true);
    expect(checkWsRateLimit(ws, limits)).toBe(true);
    // Third call exceeds the limit
    expect(checkWsRateLimit(ws, limits)).toBe(false);
    // Subsequent calls stay blocked in the same window
    expect(checkWsRateLimit(ws, limits)).toBe(false);
  });

  it('resets the counter after the window expires', () => {
    process.env.WS_RATE_LIMIT = '1';
    const ws = {} as WebSocket;
    const limits = new WeakMap<WebSocket, { count: number; resetAt: number }>();

    expect(checkWsRateLimit(ws, limits)).toBe(true);
    expect(checkWsRateLimit(ws, limits)).toBe(false);

    // Simulate an expired window by moving resetAt to the past
    const entry = limits.get(ws);
    expect(entry).toBeDefined();
    if (entry) {
      entry.resetAt = Date.now() - 1;
    }

    // A new window should start and allow one more command
    expect(checkWsRateLimit(ws, limits)).toBe(true);
  });
});

describe('isReadOnlyMode', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env.READ_ONLY_MODE = originalEnv.READ_ONLY_MODE;
  });

  it('returns false when READ_ONLY_MODE is not set', () => {
    delete process.env.READ_ONLY_MODE;
    expect(isReadOnlyMode()).toBe(false);
  });

  it('returns true when READ_ONLY_MODE=true', () => {
    process.env.READ_ONLY_MODE = 'true';
    expect(isReadOnlyMode()).toBe(true);
  });

  it('returns false when READ_ONLY_MODE=false', () => {
    process.env.READ_ONLY_MODE = 'false';
    expect(isReadOnlyMode()).toBe(false);
  });
});
