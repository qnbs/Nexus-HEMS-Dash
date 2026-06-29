import type { Page } from '@playwright/test';

/**
 * Shared E2E setup: seed the persisted store in localStorage.
 * Call this inside addInitScript() in every test's beforeEach.
 */
export function setupLocalStorage(): void {
  localStorage.setItem('nexus-hems-store', JSON.stringify({ state: {}, version: 0 }));
}

/**
 * Attach page-error listeners that fail the current test on uncaught
 * exceptions or console error messages. This surfaces JavaScript crashes
 * immediately instead of letting Playwright spin until its selector timeout
 * expires.
 */
export function attachPageErrorHandler(page: Page): void {
  page.on('pageerror', (error) => {
    throw new Error(`Uncaught page error: ${error.message}`);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      throw new Error(`Console error: ${msg.text()}`);
    }
  });
}
