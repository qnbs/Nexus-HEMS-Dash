#!/usr/bin/env node
/**
 * Validates docs/audit/invariants/register.csv against on-disk evidence paths (#449).
 * Does not execute tests — only schema + file presence (machine-readable traversal).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const REGISTER = join(ROOT, 'docs/audit/invariants/register.csv');
const ALLOWED_STATUS = new Set([
  'observed',
  'reproduced-negative-test',
  'branch-fixed',
  'verified',
  'merged-main-verified',
]);
const SHA_RE = /^[0-9a-f]{7,40}$/i;

function parseCsv(text) {
  const lines = text.trim().split('\n');
  const header = lines[0]?.split(',') ?? [];
  if (header.join(',') !== 'invariant_id,title,component,status,provenance_sha,verification,evidence_ref,notes') {
    throw new Error('register.csv header drift — update this script if columns changed');
  }
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const cols = [];
    let cur = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === ',' && !inQuotes) {
        cols.push(cur);
        cur = '';
        continue;
      }
      cur += ch;
    }
    cols.push(cur);
    if (cols.length < 8) {
      throw new Error(`Malformed CSV at line ${i + 1}`);
    }
    rows.push({
      invariant_id: cols[0],
      title: cols[1],
      component: cols[2],
      status: cols[3],
      provenance_sha: cols[4],
      verification: cols[5],
      evidence_ref: cols[6],
      notes: cols[7],
    });
  }
  return rows;
}

function evidencePath(ref) {
  const pathPart = ref.split('#')[0]?.trim();
  return pathPart ? join(ROOT, pathPart) : null;
}

const failures = [];
let rows;
try {
  rows = parseCsv(readFileSync(REGISTER, 'utf8'));
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

const ids = new Set();
for (const row of rows) {
  if (ids.has(row.invariant_id)) {
    failures.push(`duplicate invariant_id: ${row.invariant_id}`);
  }
  ids.add(row.invariant_id);

  if (!ALLOWED_STATUS.has(row.status)) {
    failures.push(`${row.invariant_id}: invalid status "${row.status}"`);
  }

  if (row.status === 'merged-main-verified' || row.status === 'verified') {
    if (row.provenance_sha === 'pending' || !SHA_RE.test(row.provenance_sha)) {
      failures.push(`${row.invariant_id}: status ${row.status} needs provenance_sha on main`);
    }
  }

  const fp = evidencePath(row.evidence_ref);
  if (!fp || !existsSync(fp)) {
    failures.push(`${row.invariant_id}: missing evidence ${row.evidence_ref}`);
  }
}

if (failures.length > 0) {
  console.error('Invariant register check failed:\n');
  for (const msg of failures) console.error(`  - ${msg}`);
  process.exit(1);
}

console.log(`Invariant register OK (${rows.length} rows, evidence paths present).`);
