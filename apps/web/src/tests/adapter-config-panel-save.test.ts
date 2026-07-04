import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type AdapterPanelSaveInput,
  saveAdapterPanelEntry,
  validateAdapterPanelEntry,
} from '../core/adapter-config-panel-save';

const mockUpdateSettings = vi.fn();
const mockReconfigureAdapter = vi.fn();
const mockAttachAdapterEntry = vi.fn();

vi.mock('../store', () => ({
  useAppStore: {
    getState: () => ({ updateSettings: mockUpdateSettings }),
  },
}));

vi.mock('../lib/secure-store', () => ({
  saveAdapterCredentials: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../core/useEnergyStore', () => ({
  useEnergyStoreBase: {
    getState: () => ({
      adapters: { 'victron-mqtt': { adapter: { connect: vi.fn() } } },
      reconfigureAdapter: mockReconfigureAdapter,
    }),
  },
  attachAdapterEntry: (...args: unknown[]) => mockAttachAdapterEntry(...args),
}));

const validVictron: AdapterPanelSaveInput = {
  id: 'victron-1',
  type: 'victron',
  name: 'Cerbo GX',
  enabled: false,
  host: '192.168.1.10',
  port: 1880,
  tls: false,
  authToken: '',
  pollIntervalMs: 3000,
  gatewayType: 'cerbo-gx',
};

describe('validateAdapterPanelEntry', () => {
  it('accepts a valid Victron entry', () => {
    expect(validateAdapterPanelEntry(validVictron)).toEqual({ ok: true });
  });

  it('rejects empty host', () => {
    const result = validateAdapterPanelEntry({ ...validVictron, host: '' });
    expect(result.ok).toBe(false);
  });
});

describe('saveAdapterPanelEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists Victron settings and reconfigures the registry slot', async () => {
    const result = await saveAdapterPanelEntry(validVictron);
    expect(result.ok).toBe(true);
    expect(mockUpdateSettings).toHaveBeenCalledWith({
      victronIp: '192.168.1.10',
      wsPort: 1880,
      gatewayType: 'cerbo-gx',
    });
    expect(mockReconfigureAdapter).toHaveBeenCalledWith(
      'victron-mqtt',
      expect.objectContaining({ host: '192.168.1.10', port: 1880 }),
      false,
    );
    expect(mockAttachAdapterEntry).toHaveBeenCalledWith('victron-mqtt');
  });
});
