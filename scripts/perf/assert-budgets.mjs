#!/usr/bin/env node
/**
 * CI perf budgets — invoked from perf-optimized-ci.yml after web build + size-limit.
 * - Main index bundle KB (matches ci.yml build job cap)
 * - Targeted Vitest perf regression tests
 */

import { execSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const ASSETS = join(ROOT, 'apps/web/dist/assets');
const MAX_INDEX_KB = Number(process.env.PERF_MAX_INDEX_KB ?? '650');

function mainIndexKb() {
  if (!existsSync(ASSETS)) {
    console.error(`assert-budgets: missing ${ASSETS} — run web build first`);
    process.exit(1);
  }
  const js = readdirSync(ASSETS).filter((f) => f.startsWith('index-') && f.endsWith('.js'));
  if (js.length === 0) {
    console.error('assert-budgets: no index-*.js in dist/assets');
    process.exit(1);
  }
  let maxKb = 0;
  for (const f of js) {
    const kb = Math.ceil(statSync(join(ASSETS, f)).size / 1024);
    if (kb > maxKb) maxKb = kb;
  }
  return maxKb;
}

const indexKb = mainIndexKb();
console.log(`assert-budgets: main index chunk ≤ ${MAX_INDEX_KB} KB (actual ${indexKb} KB)`);
if (indexKb > MAX_INDEX_KB) {
  console.error(`assert-budgets: FAIL — index bundle ${indexKb} KB exceeds ${MAX_INDEX_KB} KB`);
  process.exit(1);
}

execSync(
  'pnpm --filter @nexus-hems/web exec vitest run src/tests/chart-series-guard.test.ts src/tests/energy-store.test.ts -t "CI perf budget"',
  { cwd: ROOT, stdio: 'inherit' },
);

console.log('assert-budgets: OK');
