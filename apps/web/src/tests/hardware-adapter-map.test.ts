import { describe, expect, it } from 'vitest';
import { registerBuiltinAdapters } from '../core/adapters/adapter-registry';
import { getDeviceById } from '../core/hardware-registry';
import { defaultPortForAdapter, suggestAdapterIdForDevice } from '../lib/hardware-adapter-map';

describe('hardware-adapter-map', () => {
  it('suggests a registered adapter for a known Victron device', () => {
    registerBuiltinAdapters();
    const device = getDeviceById('victron-multiplus-ii-48-5000');
    expect(device).toBeDefined();
    const adapterId = suggestAdapterIdForDevice(device!);
    expect(adapterId).toBe('victron-mqtt');
  });

  it('returns sensible default ports', () => {
    expect(defaultPortForAdapter('victron-mqtt')).toBe(9001);
    expect(defaultPortForAdapter('knx')).toBe(3671);
  });
});
