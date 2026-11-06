#!/usr/bin/env node
/**
 * Verify recent successful push runs for code-scanning ingest workflows (#421).
 * Uses `gh` CLI; compares each workflow's latest **push** run on `main` to the
 * current `main` tip (from the API). Advisory (exit 0 with WARN lines) when
 * `GITHUB_ACTIONS` is set on a non-main push; strict otherwise unless
 * `VERIFY_CODE_SCANNING_STRICT=0`.
 */
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const repo = process.env.GITHUB_REPOSITORY ?? 'qnbs/Nexus-HEMS-Dash';
const isMainPush =
  process.env.GITHUB_REF === 'refs/heads/main' && process.env.GITHUB_EVENT_NAME === 'push';
const inGithubCi = process.env.GITHUB_ACTIONS === 'true';
/** Exit 1 when any check fails (default strict for local runs and main push). */
const strictExit =
  process.env.VERIFY_CODE_SCANNING_STRICT === '0'
    ? false
    : process.env.VERIFY_CODE_SCANNING_STRICT === '1' || isMainPush || !inGithubCi;

/** @typedef {{ workflowFile: string, label: string }} WorkflowSpec */

/** Skip `codeql.yml` expectations when GitHub Code scanning uses **Default** setup only (ADR-027: do not run Default + Advanced together). */
const skipCodeqlAdvancedWorkflow =
  process.env.VERIFY_CODE_SCANNING_SKIP_CODEQL_ADVANCED === '1';

/** @type {WorkflowSpec[]} */
const allWorkflows = [
  { workflowFile: 'security-full.yml', label: 'Security Full' },
  { workflowFile: 'codeql.yml', label: 'CodeQL Advanced' },
  { workflowFile: 'scorecard.yml', label: 'OpenSSF Scorecard' },
  { workflowFile: 'trivy-code-scanning.yml', label: 'Trivy Code Scanning' },
  { workflowFile: 'sbom-scan.yml', label: 'SBOM Generation' },
];

const workflows = skipCodeqlAdvancedWorkflow
  ? allWorkflows.filter((w) => w.workflowFile !== 'codeql.yml')
  : allWorkflows;

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
 * @returns {string}
 */
function getCurrentMainSha() {
  return runGh('gh', ['api', `repos/${repo}/branches/main`, '--jq', '.commit.sha']);
}

/**
 * @param {WorkflowSpec} spec
 * @param {string} currentMainSha
 * @returns {{ ok: boolean, detail: string }}
 */
function checkWorkflow(spec, currentMainSha) {
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
  const shaOk = run.headSha === currentMainSha;
  const ok = run.conclusion === 'success' && shaOk;
  const shortRun = run.headSha?.slice(0, 7) ?? '?';
  const shortMain = currentMainSha.slice(0, 7);
  let detail = `${run.conclusion} @ ${shortRun} (${run.databaseId}) ${run.url}`;
  if (run.conclusion === 'success' && !shaOk) {
    detail = `STALE success @ ${shortRun} (main is ${shortMain}) (${run.databaseId}) ${run.url}`;
  }
  return { ok, detail };
}

let currentMainSha = '';
try {
  currentMainSha = getCurrentMainSha();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Cannot resolve current main SHA: ${message}`);
  process.exit(strictExit ? 1 : 0);
}

console.log(`Code scanning workflow ingest health (#421) — repo ${repo}`);
console.log(`Current main tip: ${currentMainSha}`);
if (skipCodeqlAdvancedWorkflow) {
  console.log(
    'SKIP CodeQL Advanced (`codeql.yml`): VERIFY_CODE_SCANNING_SKIP_CODEQL_ADVANCED=1 — use only when GitHub Code scanning Default setup is ON and `.github/workflows/codeql.yml` is disabled; see docs/runbooks/code-scanning-tool-health-421.md',
  );
}

let failures = 0;
for (const spec of workflows) {
  try {
    const { ok, detail } = checkWorkflow(spec, currentMainSha);
    console.log(`${ok ? 'OK' : 'WARN'} ${spec.label}: ${detail}`);
    if (!ok) {
      failures += 1;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`WARN ${spec.label}: ${message}`);
    failures += 1;
  }
}

if (failures > 0 && strictExit) {
  console.error(
    `${failures} workflow check(s) failed — latest push run missing, not successful, or not at main tip (${currentMainSha.slice(0, 7)}); see docs/runbooks/code-scanning-tool-health-421.md`,
  );
  process.exit(1);
}

console.log('Workflow ingest health check complete (GitHub Tool status UI still requires maintainer export).');
process.exit(0);
