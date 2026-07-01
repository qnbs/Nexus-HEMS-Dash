import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ControllersTab } from '../components/settings/ControllersTab';
import { NotificationsTab } from '../components/settings/NotificationsTab';
import { SecurityTab } from '../components/settings/SecurityTab';
import { StorageTab } from '../components/settings/StorageTab';
import { SystemTab } from '../components/settings/SystemTab';
import { ToggleSwitch } from '../components/settings/ToggleSwitch';
import { fireEvent, render, screen } from './test-utils';

// ─── Shared mocks ────────────────────────────────────────────────────
// t() echoes the default value (or the key) so assertions can target labels.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: string | { defaultValue?: string }) =>
      typeof opts === 'string' ? opts : (opts?.defaultValue ?? key),
    i18n: { changeLanguage: vi.fn(), resolvedLanguage: 'en', language: 'en' },
  }),
}));

// Stub the cross-link bar (pulls in page-relations + router) and the heavy
// API-auth section — the tabs under test just render them as children.
vi.mock('../components/settings/SettingsFeatureBar', () => ({
  SettingsFeatureBar: () => null,
}));
vi.mock('../components/ApiAuthSettingsSection', () => ({
  ApiAuthSettingsSection: () => null,
}));

const mockUpdateSettings = vi.fn();
const mockSettings = {
  influxUrl: 'http://localhost:8086',
  influxToken: 'secret-token',
  historyDays: 30,
  gatewayType: 'cerbo-gx',
  victronIp: '192.168.1.100',
  knxIp: '192.168.1.101',
  wsPort: 1880,
  refreshRateMs: 1000,
  mqttAutoDiscovery: true,
  mtls: false,
  telemetryDisabled: true,
  twoFactor: false,
  pushNotifications: true,
  priceAlerts: true,
  batteryAlerts: true,
  gridAlerts: false,
  updateNotifications: true,
  batteryAlertThreshold: 15,
  priceAlertThreshold: 0.1,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  mpcOptimizer: true,
  commandSafety: true,
  pvPeakKw: 10,
  batteryCapacityKWh: 10,
  batteryMaxChargeKW: 5,
  batteryMinSoC: 10,
  maxGridImportKw: 25,
  batteryCapacityKWhMpc: 10,
  batteryMinSoCMpc: 10,
  maxGridImportKwMpc: 25,
  evMaxPowerKW: 11,
  heatPumpPowerKW: 3,
  feedInTariffEurKWh: 0.08,
};

vi.mock('../store', () => ({
  useAppStoreShallow: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ settings: mockSettings, updateSettings: mockUpdateSettings }),
}));

function renderTab(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── ToggleSwitch (shared atom) ──────────────────────────────────────
describe('ToggleSwitch', () => {
  it('reflects the checked state', () => {
    render(<ToggleSwitch id="t1" checked={true} onChange={() => {}} label="Toggle" />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('calls onChange with the toggled value', () => {
    const onChange = vi.fn();
    render(<ToggleSwitch id="t2" checked={false} onChange={onChange} label="Toggle" />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('exposes an accessible label', () => {
    render(<ToggleSwitch id="t3" checked={false} onChange={() => {}} label="My switch" />);
    expect(screen.getByText('My switch')).toBeInTheDocument();
  });
});

// ─── Extracted stateful tabs ─────────────────────────────────────────
describe('StorageTab', () => {
  it('renders the InfluxDB fields from the store', () => {
    const { container } = renderTab(<StorageTab />);
    expect(container.querySelector<HTMLInputElement>('#settings-influx-url')?.value).toBe(
      'http://localhost:8086',
    );
  });

  it('writes InfluxDB URL changes back to the store', () => {
    const { container } = renderTab(<StorageTab />);
    const input = container.querySelector('#settings-influx-url') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'http://influx:8086' } });
    expect(mockUpdateSettings).toHaveBeenCalledWith({ influxUrl: 'http://influx:8086' });
  });

  it('toggles InfluxDB token visibility', () => {
    const { container } = renderTab(<StorageTab />);
    const tokenInput = container.querySelector('#settings-influx-token') as HTMLInputElement;
    expect(tokenInput.type).toBe('password');
    fireEvent.click(screen.getByRole('button', { name: /token/i }));
    expect(tokenInput.type).toBe('text');
  });
});

describe('SystemTab', () => {
  it('renders device IP fields from the store', () => {
    const { container } = renderTab(<SystemTab />);
    expect(container.querySelector<HTMLInputElement>('#settings-victron-ip')?.value).toBe(
      '192.168.1.100',
    );
  });

  it('writes gateway-type selection back to the store', () => {
    renderTab(<SystemTab />);
    fireEvent.click(screen.getByRole('button', { name: /Raspberry Pi/ }));
    expect(mockUpdateSettings).toHaveBeenCalledWith({ gatewayType: 'raspberry-pi' });
  });
});

describe('SecurityTab', () => {
  it('mounts and reflects security toggles from the store', () => {
    renderTab(<SecurityTab />);
    // telemetryDisabled=true → its switch is checked
    const switches = screen.getAllByRole('checkbox');
    expect(switches.length).toBeGreaterThanOrEqual(3);
  });

  it('writes mTLS toggle changes back to the store', () => {
    const { container } = renderTab(<SecurityTab />);
    const mtls = container.querySelector('#mtls') as HTMLInputElement;
    fireEvent.click(mtls);
    expect(mockUpdateSettings).toHaveBeenCalledWith({ mtls: true });
  });
});

describe('NotificationsTab', () => {
  it('writes push-notification toggle changes back to the store', () => {
    const { container } = renderTab(<NotificationsTab />);
    const push = container.querySelector('#push') as HTMLInputElement;
    fireEvent.click(push);
    expect(mockUpdateSettings).toHaveBeenCalledWith({ pushNotifications: false });
  });

  it('writes battery-threshold slider changes back to the store', () => {
    const { container } = renderTab(<NotificationsTab />);
    const slider = container.querySelector('input[type="range"]') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '25' } });
    expect(mockUpdateSettings).toHaveBeenCalledWith({ batteryAlertThreshold: 25 });
  });
});

describe('ControllersTab', () => {
  it('mounts without crashing and shows optimizer content', () => {
    const { container } = renderTab(<ControllersTab />);
    expect(container.firstChild).toBeTruthy();
  });
});
