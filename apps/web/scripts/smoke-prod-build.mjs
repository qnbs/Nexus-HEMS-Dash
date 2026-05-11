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
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { createServer } from 'node:http';
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
 * Minimal static fallback if `vite preview` is not available. This is NOT used
 * in CI; it exists only so local agents without a full `vite` CLI can still run
 * the smoke test in a pinch. The base path is stripped so the SPA routes work.
 */
async function createFallbackServer() {
  return createServer((req, res) => {
    let filePath = req.url.startsWith(basePath) ? req.url.slice(basePath.length) : req.url;
    filePath = path.join(distDir, filePath || 'index.html');
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, 'index.html');
    }
    const ext = path.extname(filePath);
    const mime =
      {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.ico': 'image/x-icon',
      }[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(filePath).pipe(res);
  }).listen(port);
}

async function main() {
  let server;
  let browser;

  try {
    // Prefer vite preview because it respects the production base path.
    const useVite = process.env.SMOKE_USE_VITE !== 'false';
    if (useVite) {
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
    } else {
      server = await createFallbackServer();
    }

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
    if (server) {
      if (typeof server.kill === 'function') {
        server.kill();
      } else if (typeof server.close === 'function') {
        server.close();
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
