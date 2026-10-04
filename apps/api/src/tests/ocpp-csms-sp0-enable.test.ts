import { describe, expect, it } from 'vitest';
import {
  isOcppCsmsSp0Enabled,
  resolveOcppCsmsMaxSessions,
} from '../config/ocpp-csms-sp0-enable.js';

describe('isOcppCsmsSp0Enabled', () => {
  it('is false when port is unset', () => {
    expect(isOcppCsmsSp0Enabled({})).toBe(false);
  });

  it('is false when only port is set (SP0 not explicitly enabled)', () => {
    expect(isOcppCsmsSp0Enabled({ OCPP_CSMS_PORT: '9000' })).toBe(false);
  });

  it('is true in mock mode with port and SP0 opt-in', () => {
    expect(
      isOcppCsmsSp0Enabled({
        ADAPTER_MODE: 'mock',
        OCPP_CSMS_PORT: '9000',
        OCPP_CSMS_ENABLE_SP0: 'true',
      }),
    ).toBe(true);
  });

  it('is false in live mode without ALLOW_LIVE_HARDWARE', () => {
    expect(
      isOcppCsmsSp0Enabled({
        ADAPTER_MODE: 'live',
        OCPP_CSMS_PORT: '9000',
        OCPP_CSMS_ENABLE_SP0: 'true',
      }),
    ).toBe(false);
  });

  it('is true in live mode with double opt-in', () => {
    expect(
      isOcppCsmsSp0Enabled({
        ADAPTER_MODE: 'live',
        ALLOW_LIVE_HARDWARE: 'true',
        OCPP_CSMS_PORT: '9000',
        OCPP_CSMS_ENABLE_SP0: 'true',
      }),
    ).toBe(true);
  });
});

describe('resolveOcppCsmsMaxSessions', () => {
  it('defaults to 32', () => {
    expect(resolveOcppCsmsMaxSessions({})).toBe(32);
  });

  it('parses OCPP_CSMS_MAX_SESSIONS', () => {
    expect(resolveOcppCsmsMaxSessions({ OCPP_CSMS_MAX_SESSIONS: '8' })).toBe(8);
  });
});
