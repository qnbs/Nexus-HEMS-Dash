import { describe, expect, it } from 'vitest';
import { isProtocolCommandHandler } from './protocol-command.js';

describe('isProtocolCommandHandler', () => {
  it('returns false for null and non-objects', () => {
    expect(isProtocolCommandHandler(null)).toBe(false);
    expect(isProtocolCommandHandler(undefined)).toBe(false);
    expect(isProtocolCommandHandler('adapter')).toBe(false);
  });

  it('returns false when supportsCommand or sendCommand is missing', () => {
    expect(isProtocolCommandHandler({ supportsCommand: () => true })).toBe(false);
    expect(
      isProtocolCommandHandler({ sendCommand: async () => ({ handled: true, success: true }) }),
    ).toBe(false);
  });

  it('returns true for a full command handler shape', () => {
    const handler = {
      supportsCommand: () => true,
      sendCommand: async () => ({ handled: true, success: true }),
    };
    expect(isProtocolCommandHandler(handler)).toBe(true);
  });
});
