/**
 * PR feedback summary — shared logic for `.github/workflows/pr-feedback-summary.yml`.
 * One bot-owned summary comment per open PR head (SHA): updates sections per upstream
 * workflow display name in place.
 *
 * @typedef {{ owner: string, repo: string }} RepoSlug
 * @typedef {{
 *   html_url: string;
 *   name: string;
 *   conclusion: string | null;
 *   head_sha: string;
 *   id: number;
 *   run_attempt?: number;
 *   created_at?: string;
 *   updated_at?: string | null;
 *   head_branch?: string | null;
 *   event?: string | null;
 * }} WorkflowRunLike
 * @typedef {{ number: number }} PullRequestLike
 */

export const MARKER = '<!-- pr-feedback-summary -->';
const VERSION_TAG = '<!-- pr-feedback-v1';

/** Upstream workflows that post sections via `pr-feedback-summary.yml` (partial rollup source). */
export const TRACKED_FEEDBACK_WORKFLOWS = [
  'CI',
  'Security Full',
  'Lighthouse CI',
  'Performance Benchmark',
];

/** Bot identities allowed to own summary comments (workflow GITHUB_TOKEN). */
const BOT_OWNERS = new Set(['github-actions[bot]']);

/**
 * @param {{ login?: string | null } | null | undefined} user
 * @returns {boolean}
 */
export function isBotOwnedSummaryComment(user) {
  const login = user?.login;
  return typeof login === 'string' && BOT_OWNERS.has(login);
}

/**
 * Normalize workflow display name from a ### heading (strip status emoji + " finished").
 * Handles multi-code-point emoji (e.g. ⚠️ = U+26A0 U+FE0F).
 *
 * @param {string} titleLineWithoutHashes
 * @returns {string | null}
 */
export function parseWorkflowNameFromHeading(titleLineWithoutHashes) {
  const t = titleLineWithoutHashes.trim();
  const finished = t.replace(/\s+finished\s*$/i, '').trim();
  if (finished === t) return null;
  let rest = finished;
  rest = rest.replace(/^[\uFE00-\uFE0F\u200D\s]+/, '');
  const emojiStripped = rest.replace(/^(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)\s*/u, '');
  return emojiStripped.trim();
}

/**
 * @param {WorkflowRunLike} run
 * @returns {string}
 */
function iconForConclusion(run) {
  const c = run.conclusion;
  if (c === 'success') return '✅';
  if (c === 'failure' || c === 'timed_out') return '❌';
  if (c === 'cancelled' || c === 'skipped') return '⏭️';
  if (c === 'neutral') return '⚪';
  if (c === 'action_required') return '🔶';
  if (c === null || c === 'pending' || c === 'in_progress') return '⏳';
  return '⚠️';
}

/**
 * @param {string} sectionMarkdown
 * @returns {string | null}
 */
export function extractConclusionFromSection(sectionMarkdown) {
  const m = sectionMarkdown.match(/_Conclusion: `([^`]+)`/);
  return m?.[1] ?? null;
}

/**
 * Roll up tracked workflow section conclusions (not full GitHub Checks API).
 *
 * @param {Record<string, string>} sections
 * @returns {{ overall: string, counts: Record<string, number>, pendingWorkflows: string[] }}
 */
export function rollupTrackedWorkflowConclusions(sections) {
  /** @type {Record<string, number>} */
  const counts = {
    success: 0,
    failure: 0,
    neutral: 0,
    skipped: 0,
    cancelled: 0,
    action_required: 0,
    unknown: 0,
    pending: 0,
  };
  /** @type {string[]} */
  const pendingWorkflows = [];

  for (const name of TRACKED_FEEDBACK_WORKFLOWS) {
    const block = sections[name];
    if (!block) {
      counts.pending += 1;
      pendingWorkflows.push(name);
      continue;
    }
    const c = extractConclusionFromSection(block);
    if (c === 'success') counts.success += 1;
    else if (c === 'failure' || c === 'timed_out') counts.failure += 1;
    else if (c === 'neutral') counts.neutral += 1;
    else if (c === 'skipped') counts.skipped += 1;
    else if (c === 'cancelled') counts.cancelled += 1;
    else if (c === 'action_required') counts.action_required += 1;
    else counts.unknown += 1;
  }

  /** @type {string} */
  let overall = 'pending';
  if (counts.failure > 0) overall = 'failed';
  else if (counts.pending > 0) overall = 'pending';
  else if (counts.neutral > 0 || counts.unknown > 0) overall = 'neutral';
  else if (counts.action_required > 0) overall = 'action_required';
  else if (counts.cancelled > 0 && counts.success === 0) overall = 'cancelled';
  else if (counts.skipped > 0 && counts.success + counts.skipped === TRACKED_FEEDBACK_WORKFLOWS.length) {
    overall = 'skipped';
  } else if (counts.success === TRACKED_FEEDBACK_WORKFLOWS.length) overall = 'success';

  return { overall, counts, pendingWorkflows };
}

/**
 * @param {ReturnType<typeof rollupTrackedWorkflowConclusions>} rollup
 * @returns {string}
 */
export function formatRollupStatusLine(rollup) {
  const { overall, counts, pendingWorkflows } = rollup;
  const parts = [
    `overall **${overall}**`,
    `success ${counts.success}`,
    `failed ${counts.failure}`,
    `pending ${counts.pending}`,
    `neutral ${counts.neutral}`,
    `skipped ${counts.skipped}`,
    `cancelled ${counts.cancelled}`,
  ];
  if (pendingWorkflows.length > 0) {
    parts.push(`awaiting: ${pendingWorkflows.join(', ')}`);
  }
  return parts.join(' · ');
}

/**
 * @param {RepoSlug} repo
 * @param {PullRequestLike} pr
 * @param {WorkflowRunLike} run
 * @returns {string}
 */
export function buildSectionBody(repo, pr, run) {
  const runUrl = run.html_url;
  const runName = run.name;
  const icon = iconForConclusion(run);
  const conclusion = run.conclusion ?? 'unknown';
  const attempt = run.run_attempt ?? 1;

  return `### ${icon} ${runName} finished

_Conclusion: \`${conclusion}\` (run_attempt ${attempt}). This \`workflow_run.completed\` event reflects only this workflow; other PR checks may still be **pending** — see the **Checks** tab._

| Detail | Link |
| -------- | ------ |
| Workflow run | [View run](${runUrl}) |
| Coverage (Codecov) | [View PR report](https://app.codecov.io/gh/${repo.owner}/${repo.repo}/pull/${pr.number}) |
| DeepSource report | [View report card](https://app.deepsource.com/gh/${repo.owner}/${repo.repo}/) |
| Coverage artifact | Download “coverage-report” artifact from the CI run |
| Bundle analysis | Download “bundle-analysis” artifact from the CI run |
| Lighthouse report | Download “lighthouse-report” artifact (if Lighthouse run) |

**Next steps:**
- If any check failed, click the failing job and read the log.
- See [PR Feedback Playbook](https://github.com/${repo.owner}/${repo.repo}/blob/main/docs/PR-FEEDBACK-PLAYBOOK.md) for tool roles.
- Follow the [PR Review & Correction Loop Runbook](https://github.com/${repo.owner}/${repo.repo}/blob/${run.head_sha}/docs/runbooks/pr-review-correction-loop.md) (mandatory checklist).
- Resolve all review threads before merging.
`;
}

/**
 * @param {string} headSha
 * @param {Record<string, string>} sections
 * @returns {string}
 */
export function assembleSummaryBody(headSha, sections) {
  const short = headSha.slice(0, 7);
  const rollup = rollupTrackedWorkflowConclusions(sections);
  const order = [...TRACKED_FEEDBACK_WORKFLOWS];
  const keys = Object.keys(sections);
  keys.sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  const parts = [
    `${VERSION_TAG} head=${headSha} -->`,
    '',
    `## Pull request check summary`,
    '',
    `_Latest \`workflow_run\` head: \`${short}\` (${headSha})_`,
    '',
    `**Tracked workflow rollup (partial):** ${formatRollupStatusLine(rollup)}`,
    '',
    '_Scope: conclusions from the four upstream workflows above only — branch rulesets and other Checks (e.g. CodeQL) may still be **pending** on the Checks tab._',
    '',
  ];
  for (const k of keys) {
    parts.push(sections[k].trimEnd());
    parts.push('');
  }
  parts.push(MARKER);
  parts.push('');
  return parts.join('\n');
}

/**
 * @param {string} body
 * @returns {{ headSha: string | null, sections: Record<string, string> }}
 */
export function parseExistingSummary(body) {
  /** @type {Record<string, string>} */
  const sections = {};
  if (!body) return { headSha: null, sections };

  const headMatch = body.match(/<!-- pr-feedback-v1 head=([0-9a-f]{40}) -->/i);
  const headSha = headMatch?.[1] ?? null;

  const chunk = body.split(MARKER)[0] ?? '';
  const lines = chunk.split('\n');

  let i = 0;
  while (i < lines.length && !lines[i].startsWith('### ')) {
    i += 1;
  }

  while (i < lines.length) {
    if (!lines[i].startsWith('### ')) {
      i += 1;
      continue;
    }
    const rawTitle = lines[i].replace(/^###\s+/, '');
    const blockLines = [lines[i]];
    i += 1;
    while (i < lines.length && !lines[i].startsWith('### ')) {
      blockLines.push(lines[i]);
      i += 1;
    }
    const nameKey = parseWorkflowNameFromHeading(rawTitle);
    if (!nameKey) continue;
    sections[nameKey] = blockLines.join('\n').trimEnd();
  }

  return { headSha, sections };
}

/**
 * @param {unknown} github Octokit instance (`github-script` or Actions toolkit)
 * @param {RepoSlug} repo
 * @param {number} issueNumber
 * @returns {Promise<Array<{ id: number, body: string | null, user: { login?: string } | null }>>}
 */
export async function listAllIssueComments(github, repo, issueNumber) {
  /** @type {Array<{ id: number, body: string | null, user: { login?: string } | null }>} */
  const out = [];
  for await (const response of github.paginate.iterator(github.rest.issues.listComments, {
    owner: repo.owner,
    repo: repo.repo,
    issue_number: issueNumber,
    per_page: 100,
  })) {
    for (const c of response.data) {
      out.push({ id: c.id, body: c.body, user: c.user });
    }
  }
  return out;
}

/**
 * True when this `workflow_run` is the latest attempt/recency for the same workflow + branch + head SHA
 * (avoids late/out-of-order completions overwriting a newer summary — including re-run attempts).
 *
 * @param {unknown} github
 * @param {RepoSlug} repo
 * @param {WorkflowRunLike & { workflow_id?: number }} run
 * @returns {Promise<boolean>}
 */
function runRecencyTimestampMs(w) {
  const u = w.updated_at ?? w.created_at;
  if (typeof u !== 'string') return 0;
  const t = Date.parse(u);
  return Number.isFinite(t) ? t : 0;
}

/**
 * Higher = more recent. Same workflow + branch + head SHA only.
 *
 * @param {WorkflowRunLike & { workflow_id?: number }} a
 * @param {WorkflowRunLike & { workflow_id?: number }} b
 * @returns {number}
 */
export function compareWorkflowRunsForSameHead(a, b) {
  const attA = a.run_attempt ?? 1;
  const attB = b.run_attempt ?? 1;
  if (attA !== attB) return attB - attA;
  const ts = runRecencyTimestampMs(b) - runRecencyTimestampMs(a);
  if (ts !== 0) return ts;
  return b.id - a.id;
}

export async function isNewestWorkflowRunForHead(github, repo, run) {
  const wfId = run.workflow_id;
  const branch = run.head_branch;
  const sha = run.head_sha;
  if (wfId === undefined || !branch || !sha) return true;

  const { data } = await github.rest.actions.listWorkflowRuns({
    owner: repo.owner,
    repo: repo.repo,
    workflow_id: wfId,
    branch,
    per_page: 100,
  });

  const runs = data.workflow_runs.filter((w) => w.event === 'pull_request' && w.head_sha === sha);
  if (runs.length === 0) return true;
  const sorted = [...runs].sort(compareWorkflowRunsForSameHead);
  const newest = sorted[0];
  if (!newest) return true;

  const sameAsNewest =
    (newest.run_attempt ?? 1) === (run.run_attempt ?? 1) &&
    runRecencyTimestampMs(newest) === runRecencyTimestampMs(run) &&
    newest.id === run.id;
  return sameAsNewest;
}

/**
 * @param {unknown} github
 * @param {RepoSlug & { prNumber: number }} params
 * @param {WorkflowRunLike} run
 * @param {{ prHeadSha: string, log?: { info: (m: string) => void; error: (m: string) => void } }} ctx
 */
export async function upsertPrFeedbackSummary(github, params, run, ctx) {
  const { owner, repo, prNumber } = params;
  const repoSlug = { owner, repo };
  const eventHead = run.head_sha;
  const prHeadSha = ctx.prHeadSha;
  const log = ctx.log ?? { info: () => {}, error: () => {} };

  if (eventHead !== prHeadSha) {
    log.info(
      `Skipping summary: workflow_run head ${eventHead.slice(0, 7)} ≠ PR head ${prHeadSha.slice(0, 7)}.`,
    );
    return;
  }

  const latestOk = await isNewestWorkflowRunForHead(github, repoSlug, run);
  if (!latestOk) {
    log.info(`Skipping summary: superseded workflow_run ${run.id} for ${run.name} @ ${eventHead.slice(0, 7)}.`);
    return;
  }

  const comments = await listAllIssueComments(github, repoSlug, prNumber);
  const ours = comments.filter(
    (c) => c.body?.includes(MARKER) && isBotOwnedSummaryComment(c.user),
  );

  const headSha = run.head_sha;

  /** @type {Array<{ id: number, body: string | null }>} */
  const sameHeadBot = [];
  /** @type {Array<{ id: number, body: string | null }>} */
  const otherHeadBot = [];

  for (const c of ours) {
    const parsed = parseExistingSummary(c.body ?? '');
    if (parsed.headSha === headSha) sameHeadBot.push(c);
    else otherHeadBot.push(c);
  }

  sameHeadBot.sort((a, b) => a.id - b.id);

  /** @type {Record<string, string>} */
  let sections = {};
  for (const c of sameHeadBot) {
    const p = parseExistingSummary(c.body ?? '');
    sections = { ...sections, ...p.sections };
  }

  const pr = { number: prNumber };
  const runName = run.name;
  sections[runName] = buildSectionBody(repoSlug, pr, run);
  const newBody = assembleSummaryBody(headSha, sections);

  /** @type {number | null} */
  const keeperId = sameHeadBot.length > 0 ? sameHeadBot[0].id : null;
  /** @type {Array<number>} */
  const duplicateSameHeadIds = sameHeadBot.slice(1).map((c) => c.id);
  /** @type {Array<number>} */
  const staleHeadIds = otherHeadBot.map((c) => c.id);

  try {
    if (keeperId !== null) {
      await github.rest.issues.updateComment({
        owner,
        repo,
        comment_id: keeperId,
        body: newBody,
      });
      const toRemove = [...new Set([...duplicateSameHeadIds, ...staleHeadIds])];
      for (const id of toRemove) {
        await github.rest.issues.deleteComment({ owner, repo, comment_id: id });
      }
      return;
    }

    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: newBody,
    });

    const toRemoveAfterCreate = [
      ...new Set([...sameHeadBot.map((c) => c.id), ...staleHeadIds]),
    ];
    for (const id of toRemoveAfterCreate) {
      await github.rest.issues.deleteComment({ owner, repo, comment_id: id });
    }
  } catch (e) {
    log.error(e instanceof Error ? e.message : String(e));
    throw e;
  }
}
