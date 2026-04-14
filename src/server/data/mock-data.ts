import type { EnergyData } from '../../types/protocol.js';

/**
 * Mock data for the HEMS dashboard demo.
 * In production, replace with AdapterBridge for real adapter data.
 *
 * Control via ADAPTER_MODE env var:
 *   - "mock" (default): randomized simulation data
 *   - "live": real adapter readings (requires adapter connections)
 */

const adapterMode = process.env.ADAPTER_MODE || 'mock';

export const mockData: EnergyData = {
  gridPower: 0,
  pvPower: 2500,
  batteryPower: -500,
  houseLoad: 2000,
  batterySoC: 65,
  heatPumpPower: 800,
  evPower: 0,
  gridVoltage: 230,
  batteryVoltage: 51.2,
  pvYieldToday: 12.5,
  priceCurrent: 0.15,
};

/**
 * Update mock data with random noise (called on interval).
 */
export function updateMockData(): void {
  if (adapterMode !== 'mock') return;

  mockData.pvPower = Math.max(0, mockData.pvPower + (Math.random() * 200 - 100));
  mockData.houseLoad = Math.max(300, mockData.houseLoad + (Math.random() * 100 - 50));

  // Simple energy balance: Grid = House + Battery + EV + HeatPump - PV
  mockData.gridPower =
    mockData.houseLoad +
    mockData.batteryPower +
    mockData.evPower +
    mockData.heatPumpPower -
    mockData.pvPower;
}

/**
 * Returns whether the server is running in mock mode.
 */
export function isMockMode(): boolean {
  return adapterMode === 'mock';
}
