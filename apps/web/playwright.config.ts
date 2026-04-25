import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  ...(process.env.CI && { workers: 1 }),
  reporter: process.env.CI ? 'github' : 'html',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:4173/Nexus-HEMS-Dash/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: process.env.CI
    ? [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },
      ]
    : [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
      ],

  webServer: {
    // Explicit --host 0.0.0.0 ensures the preview server binds to all interfaces
    // (both IPv4 127.0.0.1 and IPv6 ::1). Node.js 24 on Ubuntu 22+ may resolve
    // 'localhost' to ::1 only, causing Playwright's IPv4 health-check to time out.
    command: 'pnpm exec vite preview --host 0.0.0.0 --port 4173',
    url: 'http://127.0.0.1:4173/Nexus-HEMS-Dash/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
