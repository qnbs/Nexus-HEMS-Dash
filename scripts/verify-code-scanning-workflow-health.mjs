#!/usr/bin/env node
/**
 * Verify recent successful push runs for code-scanning ingest workflows (#421).
 * Uses `gh` CLI; advisory on PRs, informational on main push.
 */
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const repo = process.env.GITHUB_REPOSITORY ?? 'qnbs/Nexus-HEMS-Dash';
const expectedSha = process.env.GITHUB_SHA ?? '';
const isMainPush =
  process.env.GITHUB_REF === 'refs/heads/main' && process.env.GITHUB_EVENT_NAME === 'push';

/** @typedef {{ workflowFile: string, label: string }} WorkflowSpec */

/** @type {WorkflowSpec[]} */
const workflows = [
  { workflowFile: 'security-full.yml', label: 'Security Full' },
  { workflowFile: 'codeql.yml', label: 'CodeQL Advanced' },
  { workflowFile: 'scorecard.yml', label: 'OpenSSF Scorecard' },
  { workflowFile: 'trivy-code-scanning.yml', label: 'Trivy Code Scanning' },
  { workflowFile: 'sbom-scan.yml', label: 'SBOM Generation' },
];

/**
 * @param {string} command
 * @param {string[]} args
 * @returns {string}
 */
function runGh(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(result.stderr || `${command} exited ${result.status}`);
  }
  return result.stdout.trim();
}

/**
 * @param {WorkflowSpec} spec
 * @returns {{ ok: boolean, detail: string }}
 */
function checkWorkflow(spec) {
  const json = runGh('gh', [
    'run',
    'list',
    '--repo',
    repo,
    '--workflow',
    spec.workflowFile,
    '--branch',
    'main',
    '--event',
    'push',
    '--limit',
    '1',
    '--json',
    'conclusion,headSha,databaseId,createdAt,url',
  ]);
  const [run] = JSON.parse(json);
  if (!run) {
    return { ok: false, detail: 'no push run found on main' };
  }
  const shaOk = !isMainPush || !expectedSha || run.headSha === expectedSha;
  const ok = run.conclusion === 'success' && shaOk;
  const detail = `${run.conclusion} @ ${run.headSha?.slice(0, 7) ?? '?'} (${run.databaseId}) ${run.url}`;
  return { ok, detail };
}

console.log(`Code scanning workflow ingest health (#421) — repo ${repo}`);
if (expectedSha) {
  console.log(`Expected head SHA (main push only): ${expectedSha}`);
}

let failures = 0;
for (const spec of workflows) {
  try {
    const { ok, detail } = checkWorkflow(spec);
    console.log(`${ok ? 'OK' : 'WARN'} ${spec.label}: ${detail}`);
    if (!ok && isMainPush) {
      failures += 1;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`WARN ${spec.label}: ${message}`);
    if (isMainPush) {
      failures += 1;
    }
  }
}

if (failures > 0 && isMainPush) {
  console.error(
    `${failures} workflow(s) missing a successful push run for this SHA — Tool status may lag; see docs/runbooks/code-scanning-tool-health-421.md`,
  );
  process.exit(1);
}

console.log('Workflow ingest health check complete (GitHub Tool status UI still requires maintainer export).');
process.exit(0);
