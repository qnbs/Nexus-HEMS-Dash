import { expect, test } from '@playwright/test';
import { attachPageErrorHandler, setupLocalStorage } from './e2e-setup';

test.describe('EEBUS pairing & certificates', () => {
  test.beforeEach(async ({ page }) => {
    attachPageErrorHandler(page);
    await page.addInitScript(setupLocalStorage);
  });

  test('EEBUS certificates tab renders trust store and import controls', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('./settings?tab=certificates', {
      waitUntil: 'domcontentloaded',
      timeout: 15_000,
    });
    await page.waitForSelector('#main-content h1', { timeout: 30_000 });

    await expect(page.locator('#cert-mgmt-heading')).toBeVisible();
    await expect(page.getByRole('button', { name: /import/i })).toBeVisible();
    await expect(page.locator('#ship-trust-heading')).toBeVisible();

    const importButton = page.getByRole('button', { name: /import/i }).first();
    await importButton.focus();
    await expect(importButton).toBeFocused();
  });

  test('EEBUS certificates tab is keyboard reachable from settings nav', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('./settings', { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await page.waitForSelector('#main-content h1', { timeout: 30_000 });

    const certsTab = page.getByRole('tab', { name: /eebus/i });
    await expect(certsTab).toBeVisible();
    await certsTab.focus();
    await certsTab.press('Enter');

    await expect(page).toHaveURL(/tab=certificates/);
    await expect(page.locator('#cert-mgmt-heading')).toBeVisible();
  });
});
