/**
 * E2E: Simulates an OCPP Charging Session and verifies the Sankey
 * energy-flow diagram updates in real time.
 *
 * Uses the dev-mode window.__NEXUS_STORE__ handle (Zustand) to inject
 * energy data as if an OCPP adapter pushed TransactionEvent updates.
 *
 * Flow:
 *   1. Navigate to /energy-flow → demo data shows EV = 3700 W
 *   2. Inject "charging started" (11 kW) → Sankey EV row = 11000 W
 *   3. Inject "charging update" (22 kW) → Sankey EV row = 22000 W
 *   4. Inject "charging ended" (0 W) → EV row disappears
 */

import { expect, test } from '@playwright/test';
import { setupLocalStorage } from './e2e-setup';

type DevStoreHandle = {
  getState(): {
    setConnected(connected: boolean): void;
    setEnergyData(data: Record<string, number>): void;
  };
};

/** Helper: call setEnergyData + setConnected on the Zustand store */
async function setStoreEnergy(
  page: import('@playwright/test').Page,
  data: Record<string, number>,
  connected = true,
) {
  await page.evaluate(
    ({ d, c }) => {
      const store = (window as Window & { __NEXUS_STORE__?: DevStoreHandle }).__NEXUS_STORE__;
      if (!store) throw new Error('__NEXUS_STORE__ not exposed – is DEV mode active?');
      store.getState().setConnected(c);
      store.getState().setEnergyData(d);
    },
    { d: data, c: connected },
  );
}

test.describe('OCPP Charging Session → Sankey Update', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(setupLocalStorage);
  });

  test('Sankey updates on EV charging start / update / stop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./energy-flow');
    await page.waitForSelector('svg[role="img"]', { timeout: 15_000 });

    // SR-only data table rendered by SankeyDiagram
    const sankeyTable = page.locator('table.sr-only');
    await expect(sankeyTable).toBeAttached({ timeout: 10_000 });

    // ── 1. Demo data — EV = 3700 W ──────────────────────────────
    const evRow = sankeyTable.locator('tr', { hasText: 'EV' });
    await expect(evRow).toBeVisible({ timeout: 10_000 });
    await expect(evRow.locator('td').last()).toHaveText('3700');

    // ── 2. OCPP TransactionEvent Started — 11 kW ────────────────
    await setStoreEnergy(page, {
      pvPower: 5000,
      gridPower: 9180,
      batteryPower: 0,
      houseLoad: 3180,
      batterySoC: 72,
      heatPumpPower: 0,
      evPower: 11000,
      gridVoltage: 230,
      batteryVoltage: 51.2,
      pvYieldToday: 15.3,
      priceCurrent: 0.28,
    });
    await expect(evRow.locator('td').last()).toHaveText('11000', { timeout: 5_000 });

    // ── 3. OCPP MeterValues Update — 22 kW ──────────────────────
    await setStoreEnergy(page, { evPower: 22000, gridPower: 20180 });
    await expect(evRow.locator('td').last()).toHaveText('22000', { timeout: 5_000 });

    // ── 4. OCPP TransactionEvent Ended — EV = 0 W ───────────────
    await setStoreEnergy(page, { evPower: 0, gridPower: 180 });
    await expect(evRow).toHaveCount(0, { timeout: 5_000 });
  });
});
