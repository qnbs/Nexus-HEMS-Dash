#!/usr/bin/env node
/**
 * Helm trusted-registry enforcement checks (#424 / Trivy alerts #180, #181).
 * Requires `helm` on PATH (CI helm-chart job).
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const chartDir = path.join(repoRoot, 'helm/nexus-hems');

function runHelm(args, { expectFail = false } = {}) {
  const result = spawnSync('helm', ['template', 'nexus-hems-test', chartDir, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const failed = result.status !== 0;
  if (expectFail && !failed) {
    console.error(`Expected helm template to fail: helm template ${args.join(' ')}`);
    process.exit(1);
  }
  if (!expectFail && failed) {
    console.error(result.stderr || result.stdout);
    process.exit(1);
  }
  return result;
}

function assertIncludes(output, needle, label) {
  if (!output.includes(needle)) {
    console.error(`${label}: expected rendered output to include ${needle}`);
    process.exit(1);
  }
}

const helmVersion = spawnSync('helm', ['version', '--short'], { encoding: 'utf8' });
if (helmVersion.error || helmVersion.status !== 0) {
  console.error('helm CLI is required for trusted-registry verification.');
  process.exit(1);
}

const defaultRender = runHelm([]);
assertIncludes(defaultRender.stdout, 'ghcr.io/qnbs/nexus-hems-dash', 'default frontend image');
assertIncludes(defaultRender.stdout, 'ghcr.io/qnbs/nexus-hems-server', 'default server image');

runHelm(['--set', 'image.frontend.repository=docker.io/evil/nexus-hems-dash'], { expectFail: true });
runHelm(['--set', 'image.server.repository=ghcr.io/qnbs-evil/nexus-hems-server'], { expectFail: true });
runHelm(['--set-json', 'image.trustedRegistries=[]'], { expectFail: true });

const digestRender = runHelm([
  '--set',
  'image.frontend.digest=sha256:0000000000000000000000000000000000000000000000000000000000000001',
]);
assertIncludes(
  digestRender.stdout,
  'ghcr.io/qnbs/nexus-hems-dash@sha256:0000000000000000000000000000000000000000000000000000000000000001',
  'digest-pinned frontend image',
);

const fixtureValues = path.join(chartDir, 'tests/fixtures/untrusted-frontend-values.yaml');
if (!fs.existsSync(fixtureValues)) {
  console.error(`Missing fixture: ${fixtureValues}`);
  process.exit(1);
}
runHelm(['-f', fixtureValues], { expectFail: true });

console.log('Helm trusted-registry verification passed.');
