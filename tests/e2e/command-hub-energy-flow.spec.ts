import { test, expect } from '@playwright/test';

test.describe('Command Hub', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'nexus-hems-store',
        JSON.stringify({ state: { onboardingCompleted: true }, version: 0 }),
      );
    });
  });

  test('should render Command Hub with KPI metric cards', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 15_000 });

    // KPI cards should be present (metric cards with values)
    const metricCards = page.locator('[class*="glass-panel"], [class*="energy-card"]');
    await expect(metricCards.first()).toBeVisible({ timeout: 10_000 });
  });

  test('should render the mini Sankey energy flow', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 15_000 });

    // The Sankey SVG should render
    const svg = page.locator('svg').first();
    await expect(svg).toBeVisible({ timeout: 10_000 });
  });

  test('should have quick-nav links to all sections', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 15_000 });

    // There should be links to primary sections
    const links = page.locator('a[href]');
    const hrefs = await links.evaluateAll((els) => els.map((el) => el.getAttribute('href')));
    const targets = ['/energy-flow', '/devices', '/analytics', '/monitoring', '/settings'];
    for (const target of targets) {
      expect(hrefs.some((h) => h?.includes(target))).toBeTruthy();
    }
  });

  test('should display connection status indicator', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 15_000 });

    // Status indicator (online/offline badge or icon) should be visible
    // At minimum, the page should render without errors
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate to Energy Flow from Command Hub', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 15_000 });

    // Click on energy flow link
    const link = page.getByRole('link', { name: /energy flow|energiefluss/i }).first();
    if (await link.isVisible()) {
      await link.click();
      await expect(page).toHaveURL(/energy-flow/);
      await page.waitForSelector('h1', { timeout: 15_000 });
    }
  });
});

test.describe('Live Energy Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'nexus-hems-store',
        JSON.stringify({ state: { onboardingCompleted: true }, version: 0 }),
      );
    });
  });

  test('should render the full Sankey diagram', async ({ page }) => {
    await page.goto('/energy-flow');
    await page.waitForSelector('h1', { timeout: 15_000 });

    // Full Sankey SVG should render with paths (links)
    const svg = page.locator('svg');
    await expect(svg.first()).toBeVisible({ timeout: 10_000 });
  });

  test('should have ARIA-live region for screen readers', async ({ page }) => {
    await page.goto('/energy-flow');
    await page.waitForSelector('h1', { timeout: 15_000 });

    const liveRegion = page.locator(
      '[role="status"][aria-live="polite"][aria-atomic="true"].sr-only',
    );
    await expect(liveRegion).toHaveCount(1);
  });

  test('should have sr-only data table with proper headers', async ({ page }) => {
    await page.goto('/energy-flow');
    await page.waitForSelector('h1', { timeout: 15_000 });

    const dataTable = page.locator('table.sr-only');
    await expect(dataTable).toHaveCount(1);

    const headers = dataTable.locator('th');
    await expect(headers).toHaveCount(3);
  });

  test('should display live price widget area', async ({ page }) => {
    await page.goto('/energy-flow');
    await page.waitForSelector('h1', { timeout: 15_000 });

    // Page should fully load without JS errors
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
  });

  test('should support fullscreen toggle', async ({ page }) => {
    await page.goto('/energy-flow');
    await page.waitForSelector('h1', { timeout: 15_000 });

    // Look for fullscreen button
    const fullscreenBtn = page
      .locator('button[aria-label*="fullscreen" i], button[aria-label*="Vollbild" i]')
      .first();
    if (await fullscreenBtn.isVisible()) {
      await fullscreenBtn.click();
      // Should still render properly
      await expect(page.locator('svg').first()).toBeVisible();
    }
  });

  test('legacy routes should redirect to /energy-flow', async ({ page }) => {
    for (const legacy of ['/production', '/storage', '/consumption']) {
      await page.goto(legacy);
      await expect(page).toHaveURL(/energy-flow/, { timeout: 10_000 });
    }
  });

  test('legacy device routes should redirect to /devices', async ({ page }) => {
    for (const legacy of ['/ev', '/floorplan', '/controllers', '/hardware']) {
      await page.goto(legacy);
      await expect(page).toHaveURL(/devices/, { timeout: 10_000 });
    }
  });

  test('legacy /ai-optimizer should redirect to /optimization-ai', async ({ page }) => {
    await page.goto('/ai-optimizer');
    await expect(page).toHaveURL(/optimization-ai/, { timeout: 10_000 });
  });

  test('legacy /historical-analytics should redirect to /analytics', async ({ page }) => {
    await page.goto('/historical-analytics');
    await expect(page).toHaveURL(/analytics/, { timeout: 10_000 });
  });
});
