#!/usr/bin/env node
/**
 * PRF-03 — fail CI when web coverage drops below the committed baseline.
 * Run after `pnpm --filter @nexus-hems/web test:coverage`.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SUMMARY_PATH = join(ROOT, 'apps/web/coverage/coverage-summary.json');
const BASELINE_PATH = join(ROOT, 'apps/web/coverage-baseline.json');
const TOLERANCE = 0.05;

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function pct(value) {
  return Number(value.toFixed(2));
}

const baseline = readJson(BASELINE_PATH);
let summary;

try {
  summary = readJson(SUMMARY_PATH);
} catch {
  console.error(`[coverage-baseline] Missing ${SUMMARY_PATH}. Run web test:coverage first.`);
  process.exit(1);
}

const total = summary.total;
if (!total) {
  console.error('[coverage-baseline] coverage-summary.json has no "total" section.');
  process.exit(1);
}

const metrics = ['statements', 'branches', 'functions', 'lines'];
const failures = [];

for (const metric of metrics) {
  const actual = pct(total[metric]?.pct ?? 0);
  const floor = baseline[metric];
  if (floor == null) {
    failures.push(`baseline missing metric "${metric}"`);
    continue;
  }
  if (actual + TOLERANCE < floor) {
    failures.push(`${metric}: ${actual}% < baseline ${floor}%`);
  } else {
    console.log(`[coverage-baseline] ${metric}: ${actual}% (floor ${floor}%)`);
  }
}

if (failures.length > 0) {
  console.error('[coverage-baseline] Coverage regressed below committed baseline:');
  for (const line of failures) console.error(`  - ${line}`);
  process.exit(1);
}

console.log('[coverage-baseline] All metrics meet or exceed the baseline.');
