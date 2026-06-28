#!/usr/bin/env node
/**
 * Smoke-test the production build by loading it in a headless browser.
 *
 * Starts `vite preview` against the already-built `dist/` folder, navigates to
 * the app with Playwright, and fails if React does not mount or if an uncaught
 * runtime error occurs.
 *
 * Environment:
 *   - VITE_E2E_TESTING=true is recommended so the build matches CI conditions.
 *   - CI=true enables headless-shell Chromium selection.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const basePath = '/Nexus-HEMS-Dash/';
const port = 4174;
const url = `http://127.0.0.1:${port}${basePath}`;

/**
 * Wait until the preview server responds with 200.
 */
async function waitForServer(url, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status === 200) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Preview server did not become ready within ${timeoutMs}ms`);
}

/**
 * Global hard timeout for the whole smoke test. If anything hangs (browser
 * download, page load, or server startup), fail fast instead of blocking CI.
 */
const GLOBAL_TIMEOUT_MS = 180_000;

async function main() {
  let server;
  let browser;

  try {
    server = spawn('pnpm', ['exec', 'vite', 'preview', '--port', String(port), '--strictPort'], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'production' },
    });
    server.on('error', (err) => {
      throw new Error(`Failed to start preview server: ${err.message}`);
    });
    server.stdout.on('data', (d) => {
      if (process.env.SMOKE_DEBUG) process.stdout.write(d);
    });
    server.stderr.on('data', (d) => {
      if (process.env.SMOKE_DEBUG) process.stderr.write(d);
    });

    await waitForServer(url);

    const errors = [];
    browser = await chromium.launch({
      headless: true,
      args: ['--disable-dev-shm-usage', '--disable-gpu'],
    });
    const page = await browser.newPage();
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(`console.error: ${msg.text()}`);
      }
    });

    // Use 'domcontentloaded' rather than 'networkidle' because the dashboard
    // starts background polling and WebSocket connections that may never fully
    // settle, causing 'networkidle' to hang indefinitely in CI.
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    // Wait for React to mount. The root div should contain more than just the
    // raw HTML fallback (i.e., actual rendered application markup).
    const rootHasContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.children.length > 0 : false;
    });
    if (!rootHasContent) {
      throw new Error('React did not mount: #root is empty after domcontentloaded');
    }

    if (errors.length > 0) {
      throw new Error(`Runtime errors detected:\n${errors.join('\n')}`);
    }

    console.log('✅ Production build smoke test passed');
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server) server.kill('SIGKILL');
  }
}

const globalTimer = setTimeout(() => {
  console.error(`Smoke test exceeded global timeout of ${GLOBAL_TIMEOUT_MS}ms`);
  process.exit(1);
}, GLOBAL_TIMEOUT_MS);

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    clearTimeout(globalTimer);
    process.exit(process.exitCode ?? 0);
  });
