import { describe, expect, it } from 'vitest';
import { resolveOcppStationAdmission } from '../config/ocpp-csms-admission.js';

describe('resolveOcppStationAdmission', () => {
  it('accepts any station in mock mode', () => {
    expect(resolveOcppStationAdmission('cp-1', { ADAPTER_MODE: 'mock' })).toBe('accepted');
  });

  it('rejects live stations when allowlist is empty', () => {
    expect(
      resolveOcppStationAdmission('cp-1', {
        ADAPTER_MODE: 'live',
        ALLOW_LIVE_HARDWARE: 'true',
        OCPP_CSMS_STATION_ALLOWLIST: '',
      }),
    ).toBe('rejected');
  });

  it('accepts allowlisted live stations', () => {
    expect(
      resolveOcppStationAdmission('wallbox-7', {
        ADAPTER_MODE: 'live',
        ALLOW_LIVE_HARDWARE: 'true',
        OCPP_CSMS_STATION_ALLOWLIST: 'wallbox-7,other',
      }),
    ).toBe('accepted');
  });
});
