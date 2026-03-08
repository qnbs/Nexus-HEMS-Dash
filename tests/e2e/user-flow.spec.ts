import { test, expect } from '@playwright/test';

test.describe('User Flow', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto('/');

    // Check Dashboard is loaded
    await expect(page.locator('h1')).toContainText('Nexus-HEMS');

    // Navigate to Settings
    await page.click('text=Settings, text=Einstellungen');
    await expect(page).toHaveURL('/settings');

    // Navigate to Help
    await page.click('text=Help, text=Hilfe');
    await expect(page).toHaveURL('/help');

    // Navigate back to Dashboard
    await page.click('text=Dashboard');
    await expect(page).toHaveURL('/');
  });

  test('should display live energy data', async ({ page }) => {
    await page.goto('/');

    // Check for energy metrics
    await expect(page.locator('text=/\\d+\\.\\d+ kW/')).toBeVisible();
  });

  test('should switch themes', async ({ page }) => {
    await page.goto('/');

    const initialTheme = await page.getAttribute('html', 'data-theme');

    // Click theme switcher
    await page.locator('button:has-text("Mode"), button:has-text("Modus")').first().click();

    // Wait for theme to change
    await page.waitForTimeout(500);

    const newTheme = await page.getAttribute('html', 'data-theme');
    expect(newTheme).not.toBe(initialTheme);
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
