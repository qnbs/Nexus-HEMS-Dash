#!/usr/bin/env node
/**
 * Helm WAL deployment contract smoke tests (#452).
 * Requires `helm` on PATH (CI helm-chart job).
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const chartDir = path.join(repoRoot, 'helm/nexus-hems');

function runHelm(args, { expectFail = false, expectMessage } = {}) {
  const result = spawnSync('helm', ['template', 'nexus-hems-wal', chartDir, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  if (result.error) {
    console.error(`helm spawn failed: ${result.error.message}`);
    process.exit(1);
  }
  const combined = `${result.stdout}\n${result.stderr}`;
  const failed = result.status !== 0;
  if (expectFail) {
    if (!failed) {
      console.error(`Expected helm template to fail: ${args.join(' ')}`);
      process.exit(1);
    }
    if (expectMessage && !combined.includes(expectMessage)) {
      console.error(`Expected failure to include: ${expectMessage}`);
      console.error(combined);
      process.exit(1);
    }
    return result;
  }
  if (failed) {
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
  console.error('helm CLI is required for WAL contract verification.');
  process.exit(1);
}

const defaults = runHelm([]);
assertIncludes(defaults.stdout, 'name: NEXUS_HEMS_WAL_STORAGE_CLASS', 'default env block');
assertIncludes(defaults.stdout, 'value: "ephemeral"', 'default ephemeral WAL class');
assertIncludes(defaults.stdout, 'emptyDir: {}', 'default emptyDir data volume');

runHelm(['--set', 'replicaCount.server=2'], {
  expectFail: true,
  expectMessage: 'requires .Values.server.redisUrl',
});

runHelm(
  [
    '--set',
    'replicaCount.server=2',
    '--set',
    'server.redisUrl=redis://redis:6379',
    '--set',
    'server.walPersistence.enabled=true',
    '--set',
    'server.walPersistence.create=true',
  ],
  {
    expectFail: true,
    expectMessage: 'replicaCount.server > 1 cannot share a single ReadWriteOnce WAL PVC',
  },
);

runHelm([
  '--set',
  'replicaCount.server=1',
  '--set',
  'server.walPersistence.enabled=true',
  '--set',
  'server.walPersistence.create=true',
]);
runHelm(['--set', 'server.walPersistence.enabled=true'], {
  expectFail: true,
  expectMessage: 'requires server.walPersistence.existingClaim or create: true',
});

const pvcRender = runHelm([
  '--set',
  'server.walPersistence.enabled=true',
  '--set',
  'server.walPersistence.create=true',
]);
assertIncludes(pvcRender.stdout, 'persistentVolumeClaim:', 'PVC-backed WAL volume');
assertIncludes(pvcRender.stdout, 'value: "pvc"', 'pvc WAL storage class env');
assertIncludes(pvcRender.stdout, 'mountPath: /data/nexus-hems', 'WAL mount path');

const haRender = runHelm([
  '--set',
  'replicaCount.server=2',
  '--set',
  'server.redisUrl=redis://redis:6379',
]);
assertIncludes(haRender.stdout, 'name: REDIS_REQUIRED', 'HA redis flag');
assertIncludes(haRender.stdout, 'emptyDir: {}', 'HA without shared WAL uses per-pod emptyDir');

console.log('Helm WAL contract verification passed.');
