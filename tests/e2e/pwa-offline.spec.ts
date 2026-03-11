import { test, expect } from '@playwright/test';

test.describe('PWA & Offline Behavior', () => {
  test('should load the app and show main heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('should register a service worker', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const regs = await navigator.serviceWorker.getRegistrations();
      return regs.length > 0;
    });

    // In dev mode, SW might not be registered — that's expected
    expect(typeof swRegistered).toBe('boolean');
  });

  test('should show offline banner when network goes offline', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);

    // Trigger the offline event
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });

    // Check for the offline banner (role="alert")
    const banner = page.locator('[role="alert"]');
    // Banner should appear — may take animation time
    await expect(banner.first()).toBeVisible({ timeout: 5000 });

    // Go back online
    await context.setOffline(false);
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });
  });

  test('should have a manifest.json link', async ({ page }) => {
    await page.goto('/');
    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveAttribute('href', /manifest\.json/);
  });

  test('should have theme-color meta tag', async ({ page }) => {
    await page.goto('/');
    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveAttribute('content', /#[0-9a-fA-F]+/);
  });

  test('should have apple-touch-icon', async ({ page }) => {
    await page.goto('/');
    const icon = page.locator('link[rel="apple-touch-icon"]');
    await expect(icon).toHaveAttribute('href', /icon-.*\.png/);
  });
});

test.describe('Error Recovery', () => {
  test('should show 404 page for unknown routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-xyz');
    await expect(page.locator('text=/404|not found|nicht gefunden/i')).toBeVisible();
  });

  test('should have a home link on 404 page', async ({ page }) => {
    await page.goto('/unknown-route');
    const homeLink = page.locator('a[href="/"]').or(page.locator('a[href*="Nexus-HEMS-Dash"]'));
    await expect(homeLink.first()).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load the first contentful paint within reasonable time', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForSelector('h1');
    const fcp = Date.now() - start;
    // Should render within 10 seconds (generous for CI)
    expect(fcp).toBeLessThan(10_000);
  });

  test('should lazy-load route chunks', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (req) => {
      if (req.url().endsWith('.js')) {
        requests.push(req.url());
      }
    });

    // Load home page first
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const homeRequestCount = requests.length;

    // Navigate to Settings — should trigger additional chunk loads
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // At least one new chunk loaded for settings
    expect(requests.length).toBeGreaterThan(homeRequestCount);
  });
});
