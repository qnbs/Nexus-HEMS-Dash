import { test, expect } from '@playwright/test';

test.describe('Settings & Command Palette', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'nexus-hems-store',
        JSON.stringify({ state: { onboardingCompleted: true }, version: 0 }),
      );
    });
  });

  test('should render settings page with tab sections', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForSelector('h1', { timeout: 15_000 });

    // Settings page should show configuration sections
    await expect(page.locator('h1')).toBeVisible();

    // Should have tab buttons or settings sections
    const buttons = page.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('should open command palette with Cmd+K / Ctrl+K', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 15_000 });

    // Open command palette with keyboard shortcut
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+k' : 'Control+k');

    // Should show dialog or search input
    const dialog = page.locator('[role="dialog"]');
    const searchInput = page.locator('input[type="search"], input[type="text"], [role="combobox"]');

    // Either a dialog opens or an input appears
    const dialogVisible = await dialog.isVisible().catch(() => false);
    const inputVisible = await searchInput
      .first()
      .isVisible()
      .catch(() => false);

    expect(dialogVisible || inputVisible).toBe(true);

    // Close with Escape
    await page.keyboard.press('Escape');
  });

  test('should navigate settings tabs via query params', async ({ page }) => {
    await page.goto('/settings?tab=appearance');
    await page.waitForSelector('h1', { timeout: 15_000 });
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should show skip-to-content link on Tab', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 15_000 });

    // First Tab should reveal skip-to-content
    await page.keyboard.press('Tab');

    const skipLink = page.locator('a[href="#main-content"]');
    const isVisible = await skipLink.isVisible().catch(() => false);

    // Skip link should exist (even if visually hidden until focused)
    if (isVisible) {
      await expect(skipLink).toBeVisible();
    } else {
      // It might be sr-only and become visible on focus
      const exists = (await skipLink.count()) > 0;
      expect(exists).toBe(true);
    }
  });
});

test.describe('Mobile Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'nexus-hems-store',
        JSON.stringify({ state: { onboardingCompleted: true }, version: 0 }),
      );
    });
  });

  test('should toggle mobile bottom sheet via More button', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { waitUntil: 'networkidle' });

    // Bottom navigation bar should be visible on mobile
    const bottomNav = page.locator('nav[aria-label*="Mobile" i], nav[aria-label*="Mobil" i]');
    await expect(bottomNav.first()).toBeVisible({ timeout: 10_000 });

    // Locate the More button via data-testid within the bottom nav
    const moreButton = bottomNav.first().getByTestId('mobile-more-btn');
    await expect(moreButton).toBeVisible({ timeout: 10_000 });
    await moreButton.click({ force: true, timeout: 10_000 });

    // Bottom sheet dialog should appear with more navigation items
    const sheet = page.locator('[role="dialog"]');
    await expect(sheet.first()).toBeVisible({ timeout: 5_000 });
  });

  test('should show responsive layout on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { waitUntil: 'networkidle' });

    // Main content should still be visible
    await expect(page.locator('#main-content').first()).toBeVisible({ timeout: 10_000 });

    // Desktop sidebar should be hidden on mobile
    const sidebar = page.locator('nav[aria-label*="Main" i], nav[aria-label*="Haupt" i]');
    if ((await sidebar.count()) > 0) {
      await expect(sidebar.first()).not.toBeVisible();
    }
  });
});

test.describe('Error Boundary', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'nexus-hems-store',
        JSON.stringify({ state: { onboardingCompleted: true }, version: 0 }),
      );
    });
  });

  test('should recover gracefully from broken routes', async ({ page }) => {
    // Visit a valid route first
    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 15_000 });

    // Navigate to 404
    await page.goto('/totally-broken-route');
    await expect(page.locator('text=/404|not found|nicht gefunden/i')).toBeVisible({
      timeout: 15_000,
    });

    // Navigate back should work
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible({ timeout: 15_000 });
  });
});
