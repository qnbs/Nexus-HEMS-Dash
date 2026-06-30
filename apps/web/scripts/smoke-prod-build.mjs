#!/usr/bin/env node
/**
 * Smoke-test the production build by loading it in a headless browser.
 *
 * This script is intentionally lightweight: it starts `vite preview` against the
 * already-built `dist/` folder, navigates to the app with Playwright, and fails
 * if React does not mount or if an uncaught runtime error occurs.
 *
 * Environment:
 *   - VITE_E2E_TESTING=true is recommended so the build matches CI conditions.
 *   - CI=true enables headless-shell Chromium selection.
 *
 * `vite preview` is the only server strategy: it respects the production base
 * path from vite.config.ts and is always available via the workspace devDeps, so
 * there is no hand-rolled static file server (which would be a path-traversal
 * sink for no benefit).
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, '..');
const basePath = '/Nexus-HEMS-Dash/';
const port = 4174;
const url = `http://127.0.0.1:${port}${basePath}`;

/**
 * Wait until the preview server responds with 200.
 */
async function waitForServer(target, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(target);
      if (res.status === 200) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Preview server did not become ready within ${timeoutMs}ms`);
}

async function main() {
  let server;
  let browser;

  try {
    // vite preview respects the production base path baked into the build.
    server = spawn('pnpm', ['exec', 'vite', 'preview', '--port', String(port), '--strictPort'], {
      cwd: webRoot,
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
      args: ['--disable-dev-shm-usage', '--disable-gpu', '--no-sandbox'],
    });
    const page = await browser.newPage();
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(`console.error: ${msg.text()}`);
      }
    });

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });

    // Wait for React to mount. The root div should contain more than just the
    // raw HTML fallback (i.e., actual rendered application markup).
    const rootHasContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.children.length > 0 : false;
    });
    if (!rootHasContent) {
      throw new Error('React did not mount: #root is empty after networkidle');
    }

    if (errors.length > 0) {
      throw new Error(`Runtime errors detected:\n${errors.join('\n')}`);
    }

    console.log('✅ Production build smoke test passed');
  } finally {
    if (browser) await browser.close();
    if (server && typeof server.kill === 'function') {
      server.kill();
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
