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
const TRUSTED_FAIL_SNIPPET = 'must use one of the trusted registry prefixes';

function messageMatches(combined, expectMessage) {
  if (!expectMessage) return true;
  const needles = Array.isArray(expectMessage) ? expectMessage : [expectMessage];
  return needles.some((needle) => combined.includes(needle));
}

function runHelm(args, { expectFail = false, expectMessage = TRUSTED_FAIL_SNIPPET } = {}) {
  const result = spawnSync('helm', ['template', 'nexus-hems-test', chartDir, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  if (result.error) {
    console.error(`helm spawn failed: ${result.error.message}`);
    process.exit(1);
  }
  if (result.signal) {
    console.error(`helm terminated by signal ${result.signal}`);
    process.exit(1);
  }
  if (result.status === null) {
    console.error('helm exited with null status (not a valid negative-test success)');
    process.exit(1);
  }
  const combined = `${result.stdout}\n${result.stderr}`;
  const failed = result.status !== 0;
  if (expectFail) {
    if (!failed) {
      console.error(`Expected helm template to fail: helm template ${args.join(' ')}`);
      process.exit(1);
    }
    if (expectMessage && !messageMatches(combined, expectMessage)) {
      console.error(`Expected failure output to match one of: ${JSON.stringify(expectMessage)}`);
      console.error(combined);
      process.exit(1);
    }
  } else if (failed) {
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

function fixturePath(name) {
  const filePath = path.join(chartDir, 'tests/fixtures', name);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing fixture: ${filePath}`);
    process.exit(1);
  }
  return filePath;
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
runHelm(['--set-json', 'image.trustedRegistries=[]'], {
  expectFail: true,
  expectMessage: [TRUSTED_FAIL_SNIPPET, 'Array must have at least 1 items'],
});

const digestRender = runHelm([
  '--set',
  'image.frontend.digest=sha256:0000000000000000000000000000000000000000000000000000000000000001',
]);
assertIncludes(
  digestRender.stdout,
  'ghcr.io/qnbs/nexus-hems-dash@sha256:0000000000000000000000000000000000000000000000000000000000000001',
  'digest-pinned frontend image',
);

runHelm(['-f', fixturePath('untrusted-frontend-values.yaml')], { expectFail: true });
runHelm(['-f', fixturePath('registry-boundary-spoof-values.yaml')], { expectFail: true });

const subpathRender = runHelm(['-f', fixturePath('trusted-subpath-values.yaml')]);
assertIncludes(
  subpathRender.stdout,
  'ghcr.io/qnbs/releases/nexus-hems-dash',
  'trusted nested subpath frontend image',
);

console.log('Helm trusted-registry verification passed.');
