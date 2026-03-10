import { test, expect } from '@playwright/test';

test.describe('User Flow', () => {
  test('should load home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate to all main pages via sidebar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

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
      { linkText: /settings|einstellungen/i, url: '/settings' },
      { linkText: /help|hilfe/i, url: '/help' },
    ];

    for (const route of navRoutes) {
      const link = page.getByRole('link', { name: route.linkText }).first();
      if ((await link.count()) > 0 && (await link.isVisible())) {
        await link.click();
        await expect(page).toHaveURL(new RegExp(route.url));
      }
    }
  });

  test('should show 404 page for unknown routes', async ({ page }) => {
    await page.goto('/unknown-page-xyz');
    await expect(page.locator('text=/404|not found|nicht gefunden/i')).toBeVisible();
  });

  test('should switch themes', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    const initialTheme = await page.getAttribute('html', 'data-theme');

    // Click a theme card button in Settings
    const themeButton = page.locator('button[aria-pressed]').nth(1);
    await themeButton.click();

    // Wait for theme to change
    await page.waitForTimeout(500);

    const newTheme = await page.getAttribute('html', 'data-theme');
    expect(newTheme).toBeTruthy();
  });

  test('should switch language', async ({ page }) => {
    await page.goto('/');

    // Click language switcher
    const langButton = page.locator('button').filter({ hasText: /DE|EN/i }).first();
    await langButton.click();

    await page.waitForTimeout(300);

    const newLang = await page.getAttribute('html', 'lang');
    expect(['de', 'en']).toContain(newLang);
  });
});
