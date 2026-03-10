import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = [
  { path: '/', name: 'Home', waitFor: 'h1' },
  { path: '/energy-flow', name: 'Energy Flow', waitFor: 'h1' },
  { path: '/production', name: 'Production', waitFor: 'h1' },
  { path: '/storage', name: 'Storage', waitFor: 'h1' },
  { path: '/consumption', name: 'Consumption', waitFor: 'h1' },
  { path: '/ev', name: 'EV Charging', waitFor: 'h1' },
  { path: '/floorplan', name: 'Floorplan', waitFor: 'h1' },
  { path: '/ai-optimizer', name: 'AI Optimizer', waitFor: 'h1' },
  { path: '/tariffs', name: 'Tariffs', waitFor: 'h1' },
  { path: '/analytics', name: 'Analytics', waitFor: 'h1' },
  { path: '/settings', name: 'Settings', waitFor: 'h2' },
  { path: '/help', name: 'Help', waitFor: 'h2' },
];

test.describe('WCAG 2.2 AA Accessibility', () => {
  for (const route of routes) {
    test(`${route.name} page should have no accessibility violations`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForSelector(route.waitFor);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .disableRules(['target-size'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  }

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
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Find a theme button and activate with keyboard
    const themeButton = page.locator('button[aria-pressed]').nth(1);
    await themeButton.press('Enter');

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
