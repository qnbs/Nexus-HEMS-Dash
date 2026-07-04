import type { Page } from '@playwright/test';

/** Shape of `/api/health` used by Playwright route mocks. */
export interface MockHealthBody {
  status: string;
  mode: 'mock' | 'live';
  readOnly: boolean;
  adapters: string[];
}

/** Default `/api/health` payload for Playwright route mocks. */
export const MOCK_HEALTH_BODY: MockHealthBody = {
  status: 'healthy',
  mode: 'mock',
  readOnly: false,
  adapters: [],
};

/**
 * Mock `GET /api/health` for safety/mode E2E scenarios.
 */
export async function mockBackendHealth(
  page: Page,
  overrides: Partial<MockHealthBody> = {},
): Promise<void> {
  const body = { ...MOCK_HEALTH_BODY, ...overrides };
  await page.route('**/api/health', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

/**
 * Navigate and wait until the health poll has completed.
 */
export async function gotoAndWaitForHealth(page: Page, path = './'): Promise<void> {
  const healthResponse = page.waitForResponse((res) => res.url().includes('/api/health'));
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await healthResponse;
}

/**
 * Shared E2E setup: seed the persisted store in localStorage.
 * Call this inside addInitScript() in every test's beforeEach.
 */
export function setupLocalStorage(): void {
  localStorage.setItem('nexus-hems-store', JSON.stringify({ state: {}, version: 0 }));
}

/** Console errors that are benign in preview/E2E (meta-CSP limitations, etc.). */
const IGNORED_CONSOLE_ERRORS = [
  "The Content Security Policy directive 'frame-ancestors' is ignored when delivered via a <meta> element.",
  'Content Security Policy directive',
];

/**
 * Attach page-error listeners that fail the current test on uncaught
 * exceptions. Console errors are logged only — strict CSP preview builds
 * emit benign style-src noise from third-party libs (axe, motion).
 */
export function attachPageErrorHandler(page: Page): void {
  page.on('pageerror', (error) => {
    throw new Error(`Uncaught page error: ${error.message}`);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (IGNORED_CONSOLE_ERRORS.some((ignored) => text.includes(ignored))) {
        return;
      }
      // Log but do not fail — CSP meta-tag and inline-style warnings are expected in preview.
      console.warn(`[e2e console] ${text}`);
    }
  });
}
