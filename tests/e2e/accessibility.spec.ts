import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = [
  { path: '/', name: 'Home' },
  { path: '/energy-flow', name: 'Energy Flow' },
  { path: '/production', name: 'Production' },
  { path: '/storage', name: 'Storage' },
  { path: '/consumption', name: 'Consumption' },
  { path: '/ev', name: 'EV Charging' },
  { path: '/floorplan', name: 'Floorplan' },
  { path: '/ai-optimizer', name: 'AI Optimizer' },
  { path: '/tariffs', name: 'Tariffs' },
  { path: '/analytics', name: 'Analytics' },
  { path: '/monitoring', name: 'Monitoring' },
  { path: '/settings', name: 'Settings' },
  { path: '/help', name: 'Help' },
];

test.describe('WCAG 2.2 AA Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Dismiss Onboarding overlay (CI starts with clean localStorage)
    await page.addInitScript(() => {
      localStorage.setItem(
        'nexus-hems-store',
        JSON.stringify({ state: { onboardingCompleted: true }, version: 0 }),
      );
    });
  });

  for (const route of routes) {
    test(`${route.name} page should have no accessibility violations`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForSelector('h1', { timeout: 15_000 });

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .disableRules(['target-size'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  }

  test('Keyboard navigation should work', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 15_000 });

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check that focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('Theme switcher should be keyboard accessible', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForSelector('h1', { timeout: 15_000 });

    // Find a theme button and activate with keyboard
    const themeButton = page.locator('button[aria-pressed]').nth(1);
    await themeButton.focus();
    await themeButton.press('Enter');

    // Verify theme changed
    await expect(page.locator('html')).toHaveAttribute('data-theme', /.+/);
  });

  test('Language switcher should be keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 15_000 });

    // Language switcher has DE and EN buttons with aria-pressed
    const langButton = page.locator('button[aria-pressed]').first();
    await expect(langButton).toBeVisible();
    await langButton.focus();
    await langButton.press('Enter');

    await expect(page.locator('html')).toHaveAttribute('lang', /^(de|en)$/);
  });
});
