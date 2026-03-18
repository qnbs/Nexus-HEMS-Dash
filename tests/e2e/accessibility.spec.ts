import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { setupLocalStorage } from './e2e-setup';

const routes = [
  { path: '/', name: 'Command Hub' },
  { path: '/energy-flow', name: 'Live Energy Flow' },
  { path: '/devices', name: 'Devices & Automation' },
  { path: '/optimization-ai', name: 'AI Optimization' },
  { path: '/tariffs', name: 'Tariffs' },
  { path: '/analytics', name: 'Analytics' },
  { path: '/monitoring', name: 'Monitoring' },
  { path: '/settings', name: 'Settings' },
  { path: '/help', name: 'Help' },
];

test.describe('WCAG 2.2 AA Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(setupLocalStorage);
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
    await page.goto('/settings');
    await page.waitForSelector('h1', { timeout: 15_000 });

    // Language switcher has DE and EN buttons with aria-pressed
    const langButton = page.locator('button[aria-pressed]').first();
    await expect(langButton).toBeVisible();
    await langButton.focus();
    await langButton.press('Enter');

    await expect(page.locator('html')).toHaveAttribute('lang', /^(de|en)$/);
  });

  test('Skip-to-content link should be present and functional', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 15_000 });

    // The skip link should exist
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toHaveCount(1);

    // Tab to the skip link (should be first focusable element)
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toHaveAttribute('href', '#main-content');
  });

  test('High contrast mode should apply CSS class to <html>', async ({ page }) => {
    // Inject high-contrast setting into localStorage before the page loads
    await page.addInitScript(() => {
      const raw = localStorage.getItem('nexus-hems-store');
      const store = raw ? JSON.parse(raw) : { state: {}, version: 0 };
      store.state = {
        ...store.state,
        onboardingCompleted: true,
        settings: { ...store.state?.settings, highContrast: true },
      };
      localStorage.setItem('nexus-hems-store', JSON.stringify(store));
      // Dismiss tours
      [
        'command-hub',
        'live-energy-flow',
        'devices-automation',
        'optimization-ai',
        'settings',
        'analytics',
        'monitoring',
      ].forEach((id) => localStorage.setItem(`nexus-tour-${id}`, '1'));
    });

    await page.goto('/settings');
    await page.waitForSelector('h1', { timeout: 15_000 });

    await expect(page.locator('html')).toHaveClass(/high-contrast/, { timeout: 10_000 });
  });

  test('Reduced motion mode should apply CSS class to <html>', async ({ page }) => {
    // Inject reduced-motion setting into localStorage before the page loads
    await page.addInitScript(() => {
      const raw = localStorage.getItem('nexus-hems-store');
      const store = raw ? JSON.parse(raw) : { state: {}, version: 0 };
      store.state = {
        ...store.state,
        onboardingCompleted: true,
        settings: { ...store.state?.settings, reducedMotion: true },
      };
      localStorage.setItem('nexus-hems-store', JSON.stringify(store));
      // Dismiss tours
      [
        'command-hub',
        'live-energy-flow',
        'devices-automation',
        'optimization-ai',
        'settings',
        'analytics',
        'monitoring',
      ].forEach((id) => localStorage.setItem(`nexus-tour-${id}`, '1'));
    });

    await page.goto('/settings');
    await page.waitForSelector('h1', { timeout: 15_000 });

    await expect(page.locator('html')).toHaveClass(/reduced-motion/, { timeout: 10_000 });
  });

  test('Heading hierarchy should be correct (no skipped levels)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 15_000 });

    const headings = await page.evaluate(() => {
      const hs = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      return Array.from(hs).map((h) => parseInt(h.tagName.replace('H', ''), 10));
    });

    // Verify headings start at h1
    expect(headings[0]).toBe(1);

    // Verify no heading level is skipped (e.g. h1 → h3 without h2)
    for (let i = 1; i < headings.length; i++) {
      const jump = headings[i] - headings[i - 1];
      expect(jump).toBeLessThanOrEqual(1); // can go same level, up (negative), or +1
    }
  });

  test('Sankey energy flow should have ARIA-live region for screen readers', async ({ page }) => {
    await page.goto('/energy-flow');
    await page.waitForSelector('h1', { timeout: 15_000 });

    // Check for the Sankey-specific ARIA-live region (sr-only, inside the Sankey container)
    const liveRegion = page.locator(
      '[role="status"][aria-live="polite"][aria-atomic="true"].sr-only',
    );
    await expect(liveRegion).toHaveCount(1);
  });

  test('Sankey energy flow should have accessible sr-only data table', async ({ page }) => {
    await page.goto('/energy-flow');
    await page.waitForSelector('h1', { timeout: 15_000 });

    // Check for sr-only data table
    const dataTable = page.locator('table.sr-only');
    await expect(dataTable).toHaveCount(1);

    // Table should have headers
    const headers = dataTable.locator('th');
    await expect(headers).toHaveCount(3);
  });

  test('Focus order should follow visual layout', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 15_000 });

    // Tab through first 5 interactive elements and capture their bounding boxes
    const positions: number[] = [];
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const box = await page.locator(':focus').boundingBox();
      if (box) positions.push(box.y);
    }

    // Y positions should be generally non-decreasing (top-to-bottom flow)
    // Allow some tolerance for elements at the same vertical position
    for (let i = 1; i < positions.length; i++) {
      // Elements can be on the same line (within 50px tolerance)
      expect(positions[i]).toBeGreaterThanOrEqual(positions[i - 1] - 50);
    }
  });

  test('All images should have alt text', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 15_000 });

    const imagesWithoutAlt = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      return Array.from(imgs).filter((img) => !img.hasAttribute('alt') && !img.hasAttribute('role'))
        .length;
    });

    expect(imagesWithoutAlt).toBe(0);
  });

  test('All interactive elements should have accessible names', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 15_000 });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['button-name', 'link-name', 'input-button-name', 'label'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
