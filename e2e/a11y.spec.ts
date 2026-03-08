import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests (WCAG 2.2 AA)', () => {
  test('Dashboard page should not have any automatically detectable accessibility issues', async ({
    page,
  }) => {
    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Settings page should not have accessibility violations', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

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
    
    const nav = page.getByRole('navigation', { name: /mobile navigation/i });
    await expect(nav).toBeVisible();
    
    // All nav items should have accessible names
    const navLinks = await nav.getByRole('link').all();
    for (const link of navLinks) {
      await expect(link).toHaveAccessibleName();
    }
  });

  test('Color contrast should meet WCAG AA standards', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('.metric-card')
      .include('.glass-panel')
      .analyze();

    expect(accessibilityScanResults.violations.filter((v) => v.id === 'color-contrast')).toEqual(
      [],
    );
  });
});
