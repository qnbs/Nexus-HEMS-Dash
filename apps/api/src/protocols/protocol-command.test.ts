import { describe, expect, it } from 'vitest';
import { isProtocolCommandHandler, validateProtocolCommandRequest } from './protocol-command.js';

describe('validateProtocolCommandRequest', () => {
  it('accepts valid EV power commands', () => {
    const result = validateProtocolCommandRequest({ type: 'SET_EV_POWER', value: 7200 });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.command).toEqual({ type: 'SET_EV_POWER', value: 7200 });
    }
  });

  it('rejects non-numeric SET_EV_CURRENT values', () => {
    const result = validateProtocolCommandRequest({
      type: 'SET_EV_CURRENT',
      value: '16' as unknown as number,
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain('numeric');
    }
  });

  it('rejects negative SET_EV_POWER values', () => {
    const result = validateProtocolCommandRequest({ type: 'SET_EV_POWER', value: -1 });
    expect(result.valid).toBe(false);
  });

  it('accepts boolean charging commands', () => {
    const result = validateProtocolCommandRequest({ type: 'START_CHARGING', value: true });
    expect(result.valid).toBe(true);
  });
});

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
