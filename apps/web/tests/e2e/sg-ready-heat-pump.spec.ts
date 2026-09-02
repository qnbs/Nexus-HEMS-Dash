import { expect, test } from '@playwright/test';
import {
  attachPageErrorHandler,
  gotoAndWaitForHealth,
  mockBackendHealth,
  setupLocalStorage,
} from './e2e-setup';

test.describe('SG Ready heat pump UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(setupLocalStorage);
    attachPageErrorHandler(page);
    await mockBackendHealth(page);
  });

  test('devices page shows SG Ready mode selector on heat pump detail', async ({ page }) => {
    await gotoAndWaitForHealth(page, './devices');

    const heatPumpCard = page.getByRole('button', { name: /heat pump|wärmepumpe/i }).first();
    if (await heatPumpCard.isVisible().catch(() => false)) {
      await heatPumpCard.click();
    }

    await expect(page.getByRole('heading', { name: /sg ready|sg-ready/i }).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
