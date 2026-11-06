/**
 * PR feedback summary — shared logic for `.github/workflows/pr-feedback-summary.yml`.
 * One bot comment per open PR head (SHA): updates sections per upstream workflow name in place.
 *
 * @typedef {{ owner: string, repo: string }} RepoSlug
 * @typedef {{ html_url: string, name: string, conclusion: string | null, head_sha: string }} WorkflowRunLike
 * @typedef {{ number: number }} PullRequestLike
 */

export const MARKER = '<!-- pr-feedback-summary -->';
const VERSION_TAG = '<!-- pr-feedback-v1';

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

  /** @type {number | null} */
  let i = 0;
  while (i < lines.length && !lines[i].startsWith('### ')) {
    i += 1;
  }

  while (i < lines.length) {
    if (!lines[i].startsWith('### ')) {
      i += 1;
      continue;
    }
    const titleLine = lines[i].replace(/^###\s+/, '');
    const blockLines = [lines[i]];
    i += 1;
    while (i < lines.length && !lines[i].startsWith('### ')) {
      blockLines.push(lines[i]);
      i += 1;
    }
    if (!/finished\s*$/i.test(titleLine.trim())) continue;
    const nameMatch = titleLine
      .replace(/^[✅❌⚠️]\s+/, '')
      .replace(/\s+finished\s*$/i, '')
      .trim();
    const sectionBody = blockLines.join('\n').trimEnd();
    sections[nameMatch] = sectionBody;
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
 * @param {unknown} github Octokit instance
 * @param {RepoSlug & { prNumber: number }} params
 * @param {WorkflowRunLike} run
 */
export async function upsertPrFeedbackSummary(github, params, run) {
  const { owner, repo, prNumber } = params;
  const repoSlug = { owner, repo };

  const comments = await listAllIssueComments(github, repoSlug, prNumber);
  const ours = comments.filter((c) => c.body?.includes(MARKER));
  const headSha = run.head_sha;

  /** @type {Array<number>} */
  const toDelete = [];
  /** @type {number | null} */
  let keeperId = null;

  for (const c of ours) {
    const parsed = parseExistingSummary(c.body ?? '');
    if (parsed.headSha === headSha) {
      if (keeperId === null) keeperId = c.id;
      else toDelete.push(c.id);
    } else {
      toDelete.push(c.id);
    }
  }

  const pr = { number: prNumber };
  const sectionText = buildSectionBody(repoSlug, pr, run);

  /** @type {Record<string, string>} */
  let sections = {};
  if (keeperId !== null) {
    const keep = ours.find((c) => c.id === keeperId);
    const prev = parseExistingSummary(keep?.body ?? '');
    sections = { ...prev.sections };
  }

  const runName = run.name;
  sections[runName] = sectionText;

  const newBody = assembleSummaryBody(headSha, sections);

  for (const id of toDelete) {
    await github.rest.issues.deleteComment({ owner, repo, comment_id: id });
  }

  if (keeperId !== null) {
    await github.rest.issues.updateComment({
      owner,
      repo,
      comment_id: keeperId,
      body: newBody,
    });
  } else {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: newBody,
    });
  }
}
