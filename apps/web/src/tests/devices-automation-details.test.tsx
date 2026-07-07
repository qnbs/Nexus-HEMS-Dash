import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DeviceInlineDetails } from '../components/devices-automation/cards/DeviceInlineDetails';
import { DeviceMetricRow } from '../components/devices-automation/cards/DeviceMetricRow';
import { DeviceDetailContent } from '../components/devices-automation/detail/DeviceDetailContent';
import { QuickAction } from '../components/devices-automation/quick-actions/QuickAction';
import type { UnifiedEnergyModel } from '../core/adapters/EnergyAdapter';
import type { EnergyData, StoredSettings } from '../types';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const data = {
  pvPower: 4500,
  houseLoad: 2800,
  gridPower: -1200,
  batteryPower: -800,
  batterySoC: 68,
  heatPumpPower: 600,
  evPower: 100,
  pvYieldToday: 12.5,
  priceCurrent: 0.22,
  batteryVoltage: 52.4,
  gridVoltage: 230,
} as unknown as EnergyData;

const settings = {
  systemConfig: {
    pv: { peakPowerKWp: 10, orientation: 'S', strings: 2, mpptCount: 2 },
    evCharger: { maxPowerKW: 11, model: 'Wallbox' },
    battery: { maxChargeRateKW: 5 },
  },
} as unknown as StoredSettings;

const unified = {
  knx: { rooms: [{ name: 'Living', lightsOn: true, temperature: 21.5 }] },
} as unknown as UnifiedEnergyModel;

const IDS = ['pv', 'storage', 'ev', 'heatpump', 'building'];

/** Render an element for every device id and assert it produced output. */
function renderForAll(factory: (id: string) => ReactElement) {
  for (const id of IDS) {
    const { unmount, container } = render(factory(id));
    expect(container.textContent?.length ?? 0).toBeGreaterThan(0);
    unmount();
  }
}

describe('devices-automation per-device components', () => {
  it('DeviceMetricRow renders for every device', () => {
    renderForAll((id) => (
      <DeviceMetricRow deviceId={id} data={data} unified={unified} settings={settings} />
    ));
  });

  it('DeviceInlineDetails renders for every device', () => {
    renderForAll((id) => (
      <DeviceInlineDetails
        deviceId={id}
        data={data}
        unified={unified}
        settings={settings}
        onOpenDetail={vi.fn()}
      />
    ));
  });

  it('QuickAction renders for every device', () => {
    renderForAll((id) => (
      <QuickAction deviceId={id} data={data} settings={settings} sendCommand={vi.fn()} />
    ));
  });

  it('DeviceDetailContent renders for every device', () => {
    renderForAll((id) => (
      <DeviceDetailContent
        deviceId={id}
        data={data}
        unified={unified}
        settings={settings}
        sendCommand={vi.fn()}
      />
    ));
  });
});
