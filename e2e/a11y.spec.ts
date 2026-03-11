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
  { path: '/settings', name: 'Settings' },
  { path: '/help', name: 'Help' },
];

test.describe('Accessibility Tests (WCAG 2.2 AA)', () => {
  for (const route of routes) {
    test(`${route.name} page (${route.path}) should not have critical a11y issues`, async ({
      page,
    }) => {
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  }

  test('Command Palette should be keyboard accessible', async ({ page }) => {
    await page.goto('/');

    // Open with Cmd+K
    await page.keyboard.press('Meta+KeyK');

    // Should be visible
    await expect(page.getByRole('dialog')).toBeVisible();

    // Should be focusable
    const input = page.getByPlaceholder(/search/i);
    await expect(input).toBeFocused();

    // Should close with Escape
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('Mobile navigation should have proper ARIA labels', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const nav = page.getByRole('navigation', { name: /mobile/i });
    await expect(nav).toBeVisible();

    // All nav items should have accessible names
    const navLinksCount = await nav.getByRole('link').count();
    for (let i = 0; i < navLinksCount; i++) {
      await expect(nav.getByRole('link').nth(i)).toHaveAccessibleName(/.+/);
    }
  });

  test('Color contrast should meet WCAG AA standards', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('.glass-panel')
      .analyze();

    expect(accessibilityScanResults.violations.filter((v) => v.id === 'color-contrast')).toEqual(
      [],
    );
  });
});
