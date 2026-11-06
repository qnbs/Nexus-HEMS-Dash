/**
 * PR feedback summary — shared logic for `.github/workflows/pr-feedback-summary.yml`.
 * One bot-owned summary comment per open PR head (SHA): updates sections per upstream
 * workflow display name in place.
 *
 * @typedef {{ owner: string, repo: string }} RepoSlug
 * @typedef {{ html_url: string; name: string; conclusion: string | null; head_sha: string; id: number; created_at?: string; head_branch?: string | null }} WorkflowRunLike
 * @typedef {{ number: number }} PullRequestLike
 */

export const MARKER = '<!-- pr-feedback-summary -->';
const VERSION_TAG = '<!-- pr-feedback-v1';

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
  if (run.conclusion === 'success') return '✅';
  if (run.conclusion === 'failure') return '❌';
  return '⚠️';
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

  return `### ${icon} ${runName} finished

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
  const order = ['CI', 'Security Full', 'Lighthouse CI', 'Performance Benchmark'];
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
 * True when this `workflow_run` is the newest run for the same workflow + branch + head SHA
 * (avoids late/out-of-order completions overwriting a newer head's summary).
 *
 * @param {unknown} github
 * @param {RepoSlug} repo
 * @param {WorkflowRunLike & { workflow_id?: number }} run
 * @returns {Promise<boolean>}
 */
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
    per_page: 30,
  });

  const runs = data.workflow_runs.filter((w) => w.event === 'pull_request' && w.head_sha === sha);
  if (runs.length === 0) return true;
  return runs[0].id === run.id;
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
