import { test, expect } from '@playwright/test';

test.describe('User Flow', () => {
  test('should load home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible({ timeout: 15_000 });
  });

  test('should navigate to all main pages via sidebar', async ({ page }) => {
    // Use a large viewport to ensure sidebar is visible
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 15_000 });

    const navRoutes = [
      { linkText: /energy flow|energiefluss/i, url: '/energy-flow' },
      { linkText: /production|erzeugung/i, url: '/production' },
      { linkText: /storage|speicher/i, url: '/storage' },
      { linkText: /consumption|verbrauch/i, url: '/consumption' },
      { linkText: /ev|e-auto/i, url: '/ev' },
      { linkText: /floorplan|grundriss/i, url: '/floorplan' },
      { linkText: /ai optimizer|ki-optimierer/i, url: '/ai-optimizer' },
      { linkText: /tariffs|tarife/i, url: '/tariffs' },
      { linkText: /analytics|analysen/i, url: '/analytics' },
      { linkText: /monitoring/i, url: '/monitoring' },
      { linkText: /settings|einstellungen/i, url: '/settings' },
      { linkText: /help|hilfe/i, url: '/help' },
    ];

    for (const route of navRoutes) {
      const link = page.getByRole('link', { name: route.linkText }).first();
      if ((await link.count()) > 0 && (await link.isVisible())) {
        await link.click();
        await expect(page).toHaveURL(new RegExp(route.url));
        await page.waitForSelector('h1', { timeout: 15_000 });
      }
    }
  });

  test('should show 404 page for unknown routes', async ({ page }) => {
    await page.goto('/unknown-page-xyz');
    await expect(page.locator('text=/404|not found|nicht gefunden/i')).toBeVisible({
      timeout: 15_000,
    });
  });

  test('should switch themes', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForSelector('h1', { timeout: 15_000 });

    // Click a theme card button in Settings
    const themeButton = page.locator('button[aria-pressed]').nth(1);
    await themeButton.click();

    // Wait for theme attribute to change
    await expect(page.locator('html')).toHaveAttribute('data-theme', /.+/);
  });

  test('should switch language', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 15_000 });

    // Get current lang
    const initialLang = await page.getAttribute('html', 'lang');

    // Click the other language button (not the currently active one)
    const inactiveButton = page.locator('button[aria-pressed="false"]').first();
    await inactiveButton.click();

    // Verify language attribute changed
    await expect(page.locator('html')).not.toHaveAttribute('lang', initialLang || '');
  });
});
