import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('WCAG 2.2 AA Accessibility', () => {
  test('Dashboard page should have no accessibility violations', async ({ page }) => {
    await page.goto('/');

    // Wait for content to load
    await page.waitForSelector('h1');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Settings page should have no accessibility violations', async ({ page }) => {
    await page.goto('/settings');

    await page.waitForSelector('h2');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Help page should have no accessibility violations', async ({ page }) => {
    await page.goto('/help');

    await page.waitForSelector('h2');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Keyboard navigation should work', async ({ page }) => {
    await page.goto('/');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check that focus is visible
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('Theme switcher should be keyboard accessible', async ({ page }) => {
    await page.goto('/');

    // Find theme switcher and activate with keyboard
    await page.locator('[aria-label*="theme"]').first().press('Enter');

    // Verify theme changed (check for data-theme attribute)
    const theme = await page.getAttribute('html', 'data-theme');
    expect(theme).toBeTruthy();
  });

  test('Language switcher should be keyboard accessible', async ({ page }) => {
    await page.goto('/');

    // Find language switcher
    const langSwitcher = page.locator('[aria-label*="language"], [aria-label*="Sprache"]').first();

    if ((await langSwitcher.count()) > 0) {
      await langSwitcher.press('Enter');
      const lang = await page.getAttribute('html', 'lang');
      expect(['de', 'en']).toContain(lang);
    }
  });
});
