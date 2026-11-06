import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  MARKER,
  assembleSummaryBody,
  compareWorkflowRunsForSameHead,
  isBotOwnedSummaryComment,
  isNewestWorkflowRunForHead,
  listAllIssueComments,
  parseExistingSummary,
  parseWorkflowNameFromHeading,
  upsertPrFeedbackSummary,
} from './pr-feedback-summary.mjs';

describe('pr-feedback-summary', () => {
  it('parses workflow name from heading with two-code-point warning emoji', () => {
    assert.equal(parseWorkflowNameFromHeading('⚠️ CI finished'), 'CI');
    assert.equal(parseWorkflowNameFromHeading('✅ Security Full finished'), 'Security Full');
  });

  it('assembles a stable body with marker and head tag', () => {
    const sha = 'a'.repeat(40);
    const body = assembleSummaryBody(sha, {
      CI: '### ✅ CI finished\n\ndone',
    });
    assert.ok(body.includes(`head=${sha}`));
    assert.ok(body.endsWith(`${MARKER}\n`));
    assert.ok(body.includes('### ✅ CI finished'));
  });

  it('parseExistingSummary round-trips sections', () => {
    const sha = 'b'.repeat(40);
    const first = assembleSummaryBody(sha, {
      CI: '### ✅ CI finished\n\nfirst',
    });
    const parsed = parseExistingSummary(first);
    assert.equal(parsed.headSha, sha);
    assert.ok(parsed.sections.CI.includes('first'));
  });

  it('isBotOwnedSummaryComment only matches github-actions bot', () => {
    assert.equal(isBotOwnedSummaryComment({ login: 'github-actions[bot]' }), true);
    assert.equal(isBotOwnedSummaryComment({ login: 'someone' }), false);
  });

  it('skips when workflow_run head does not match current PR head', async () => {
    const calls = { updated: 0, created: 0 };
    const github = {
      paginate: {
        iterator: async function* () {
          yield { data: [] };
        },
      },
      rest: {
        pulls: { get: async () => ({ data: { head: { sha: 'a'.repeat(40) } } }) },
        issues: {
          listComments: async () => ({ data: [] }),
          updateComment: async () => {
            calls.updated += 1;
          },
          createComment: async () => {
            calls.created += 1;
          },
          deleteComment: async () => {},
        },
        actions: { listWorkflowRuns: async () => ({ data: { workflow_runs: [] } }) },
      },
    };

    await upsertPrFeedbackSummary(
      github,
      { owner: 'o', repo: 'r', prNumber: 1 },
      {
        id: 1,
        workflow_id: 99,
        html_url: 'https://x',
        name: 'CI',
        conclusion: 'success',
        head_sha: 'c'.repeat(40),
        head_branch: 'topic',
      },
      { prHeadSha: 'a'.repeat(40), log: { info: () => {}, error: () => {} } },
    );

    assert.equal(calls.updated, 0);
    assert.equal(calls.created, 0);
  });

  it('skips when workflow run is not the newest for same workflow + branch + sha', async () => {
    const sha = 'd'.repeat(40);
    const calls = { issues: [] };
    const github = {
      paginate: {
        iterator: async function* () {
          yield { data: [] };
        },
      },
      rest: {
        pulls: { get: async () => ({ data: { head: { sha } } }) },
        issues: {
          listComments: async () => {
            calls.issues.push('list');
            return { data: [] };
          },
          updateComment: async () => {
            calls.issues.push('update');
          },
          createComment: async () => {
            calls.issues.push('create');
          },
          deleteComment: async () => {
            calls.issues.push('delete');
          },
        },
        actions: {
          listWorkflowRuns: async () => ({
            data: {
              workflow_runs: [
                {
                  id: 999,
                  event: 'pull_request',
                  head_sha: sha,
                  created_at: '2026-01-02T00:00:00Z',
                  updated_at: '2026-01-02T00:00:00Z',
                  run_attempt: 1,
                },
                {
                  id: 1,
                  event: 'pull_request',
                  head_sha: sha,
                  created_at: '2026-01-01T00:00:00Z',
                  updated_at: '2026-01-01T00:00:00Z',
                  run_attempt: 1,
                },
              ],
            },
          }),
        },
      },
    };

    await upsertPrFeedbackSummary(
      github,
      { owner: 'o', repo: 'r', prNumber: 1 },
      {
        id: 1,
        workflow_id: 42,
        html_url: 'https://x',
        name: 'CI',
        conclusion: 'success',
        head_sha: sha,
        head_branch: 'topic',
        run_attempt: 1,
      },
      { prHeadSha: sha, log: { info: () => {}, error: () => {} } },
    );

    assert.deepEqual(calls.issues, []);
  });

  it('upsert updates keeper, merges duplicate same-head sections, deletes stale head after', async () => {
    const sha = 'e'.repeat(40);
    const bodyKeeper = assembleSummaryBody(sha, {
      CI: '### ✅ CI finished\n\nold-ci',
    });
    const bodyDup = assembleSummaryBody(sha, {
      'Security Full': '### ✅ Security Full finished\n\nonly-here',
    });

    const calls = {
      deleted: [],
      updateArg: null,
    };

    const github = {
      paginate: {
        iterator: async function* (fn, params) {
          const page1 = await fn(params);
          yield page1;
        },
      },
      rest: {
        pulls: { get: async () => ({ data: { head: { sha } } }) },
        issues: {
          listComments: async () => ({
            data: [
              { id: 10, body: `${bodyKeeper}`, user: { login: 'github-actions[bot]' } },
              { id: 20, body: `${bodyDup}`, user: { login: 'github-actions[bot]' } },
              { id: 30, body: `${MARKER} stale`, user: { login: 'github-actions[bot]' } },
              { id: 40, body: `${MARKER} human?`, user: { login: 'human' } },
            ],
          }),
          deleteComment: async ({ comment_id }) => {
            calls.deleted.push(comment_id);
          },
          updateComment: async (args) => {
            calls.updateArg = args;
          },
          createComment: async () => {
            assert.fail('should update in place');
          },
        },
        actions: {
          listWorkflowRuns: async () => ({
            data: {
              workflow_runs: [
                {
                  id: 50,
                  event: 'pull_request',
                  head_sha: sha,
                  created_at: '2026-01-01T00:00:00Z',
                  updated_at: '2026-01-01T00:00:00Z',
                  run_attempt: 1,
                },
              ],
            },
          }),
        },
      },
    };

    await upsertPrFeedbackSummary(
      github,
      { owner: 'o', repo: 'r', prNumber: 44 },
      {
        id: 50,
        workflow_id: 7,
        html_url: 'https://example.com/run',
        name: 'CI',
        conclusion: 'success',
        head_sha: sha,
        head_branch: 'pr-branch',
        run_attempt: 1,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      { prHeadSha: sha, log: { info: () => {}, error: () => {} } },
    );

    assert.equal(calls.updateArg.comment_id, 10);
    assert.ok(calls.updateArg.body.includes('only-here'));
    assert.ok(calls.updateArg.body.includes('### ✅ CI finished'));
    assert.ok(calls.deleted.includes(20));
    assert.ok(calls.deleted.includes(30));
    assert.equal(calls.deleted.includes(40), false);
  });

  it('create-before-delete: does not delete stale until after successful create when no keeper', async () => {
    const sha = 'f'.repeat(40);
    const staleBody = assembleSummaryBody('0'.repeat(40), { CI: '### ✅ CI finished\n\nstale' });
    const order = [];

    const github = {
      paginate: {
        iterator: async function* (fn, params) {
          yield await fn(params);
        },
      },
      rest: {
        pulls: { get: async () => ({ data: { head: { sha } } }) },
        issues: {
          listComments: async () => ({
            data: [{ id: 1, body: staleBody, user: { login: 'github-actions[bot]' } }],
          }),
          deleteComment: async () => {
            order.push('delete');
          },
          createComment: async ({ body }) => {
            order.push('create');
            assert.ok(body.includes(sha));
            return { data: { id: 2 } };
          },
          updateComment: async () => assert.fail('unexpected update'),
        },
        actions: {
          listWorkflowRuns: async () => ({
            data: {
              workflow_runs: [
                {
                  id: 100,
                  event: 'pull_request',
                  head_sha: sha,
                  created_at: '2026-01-01T00:00:00Z',
                  updated_at: '2026-01-01T00:00:00Z',
                  run_attempt: 1,
                },
              ],
            },
          }),
        },
      },
    };

    await upsertPrFeedbackSummary(
      github,
      { owner: 'o', repo: 'r', prNumber: 1 },
      {
        id: 100,
        workflow_id: 5,
        html_url: 'https://r',
        name: 'CI',
        conclusion: 'success',
        head_sha: sha,
        head_branch: 'b',
        run_attempt: 1,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      { prHeadSha: sha, log: { info: () => {}, error: () => {} } },
    );

    assert.deepEqual(order, ['create', 'delete']);
  });
});

describe('isNewestWorkflowRunForHead', () => {
  it('returns true when API lists this run first', async () => {
    const sha = 'a'.repeat(40);
    const github = {
      rest: {
        actions: {
          listWorkflowRuns: async () => ({
            data: {
              workflow_runs: [
                {
                  id: 1,
                  event: 'pull_request',
                  head_sha: sha,
                  created_at: '2026-01-02T00:00:00Z',
                  updated_at: '2026-01-02T00:00:00Z',
                  run_attempt: 1,
                },
                {
                  id: 2,
                  event: 'pull_request',
                  head_sha: sha,
                  created_at: '2026-01-01T00:00:00Z',
                  updated_at: '2026-01-01T00:00:00Z',
                  run_attempt: 1,
                },
              ],
            },
          }),
        },
      },
    };
    const ok = await isNewestWorkflowRunForHead(github, { owner: 'o', repo: 'r' }, {
      id: 1,
      workflow_id: 9,
      head_branch: 'b',
      head_sha: sha,
      run_attempt: 1,
      created_at: '2026-01-02T00:00:00Z',
      updated_at: '2026-01-02T00:00:00Z',
    });
    assert.equal(ok, true);
  });

  it('skips when a higher run_attempt exists for the same head (re-run supersedes)', async () => {
    const sha = 'c'.repeat(40);
    const github = {
      rest: {
        actions: {
          listWorkflowRuns: async () => ({
            data: {
              workflow_runs: [
                {
                  id: 200,
                  event: 'pull_request',
                  head_sha: sha,
                  created_at: '2026-01-03T00:00:00Z',
                  updated_at: '2026-01-03T00:00:00Z',
                  run_attempt: 2,
                },
                {
                  id: 100,
                  event: 'pull_request',
                  head_sha: sha,
                  created_at: '2026-01-02T00:00:00Z',
                  updated_at: '2026-01-04T00:00:00Z',
                  run_attempt: 1,
                },
              ],
            },
          }),
        },
      },
    };
    const lateAttempt1 = await isNewestWorkflowRunForHead(github, { owner: 'o', repo: 'r' }, {
      id: 100,
      workflow_id: 1,
      head_branch: 'topic',
      head_sha: sha,
      run_attempt: 1,
      created_at: '2026-01-02T00:00:00Z',
      updated_at: '2026-01-04T00:00:00Z',
    });
    assert.equal(lateAttempt1, false);

    const attempt2 = await isNewestWorkflowRunForHead(github, { owner: 'o', repo: 'r' }, {
      id: 200,
      workflow_id: 1,
      head_branch: 'topic',
      head_sha: sha,
      run_attempt: 2,
      created_at: '2026-01-03T00:00:00Z',
      updated_at: '2026-01-03T00:00:00Z',
    });
    assert.equal(attempt2, true);
  });
});

describe('compareWorkflowRunsForSameHead', () => {
  it('orders by run_attempt before timestamps', () => {
    const a = {
      id: 1,
      run_attempt: 1,
      created_at: '2026-01-10T00:00:00Z',
      updated_at: '2026-01-10T00:00:00Z',
    };
    const b = { id: 2, run_attempt: 2, created_at: '2026-01-01T00:00:00Z' };
    assert.ok(compareWorkflowRunsForSameHead(a, b) > 0);
    assert.ok(compareWorkflowRunsForSameHead(b, a) < 0);
  });
});

describe('listAllIssueComments', () => {
  it('follows pagination until two pages are merged', async () => {
    const ids = [];
    const github = {
      paginate: {
        iterator: async function* (fn, params) {
          const p1 = await fn({ ...params, page: 1, per_page: 100 });
          yield p1;
          const p2 = await fn({ ...params, page: 2, per_page: 100 });
          yield p2;
        },
      },
      rest: {
        issues: {
          listComments: async (p) => {
            const page = p.page ?? 1;
            if (page === 1) {
              return { data: [{ id: 1, body: 'a', user: { login: 'u' } }] };
            }
            if (page === 2) {
              return { data: [{ id: 2, body: 'b', user: { login: 'u' } }] };
            }
            return { data: [] };
          },
        },
      },
    };
    const out = await listAllIssueComments(github, { owner: 'o', repo: 'r' }, 5);
    for (const c of out) {
      ids.push(c.id);
    }
    assert.deepEqual(ids, [1, 2]);
  });
});

describe('upsertPrFeedbackSummary burst', () => {
  it('merges four sequential workflow sections into one keeper comment', async () => {
    const sha = 'b'.repeat(40);
    /** @type {Array<{ id: number, body: string | null, user: { login: string } }>} */
    let stored = [];
    const github = {
      paginate: {
        iterator: async function* (fn, params) {
          yield await fn(params);
        },
      },
      rest: {
        pulls: { get: async () => ({ data: { head: { sha } } }) },
        issues: {
          listComments: async () => ({ data: stored }),
          createComment: async ({ body }) => {
            stored = [{ id: 1, body, user: { login: 'github-actions[bot]' } }];
            return { data: { id: 1 } };
          },
          updateComment: async ({ body }) => {
            stored = [{ id: 1, body, user: { login: 'github-actions[bot]' } }];
          },
          deleteComment: async () => {},
        },
        actions: {
          listWorkflowRuns: async () => ({
            data: {
              workflow_runs: [],
            },
          }),
        },
      },
    };

    const workflows = ['CI', 'Security Full', 'Lighthouse CI', 'Performance Benchmark'];
    let rid = 10;
    for (const name of workflows) {
      const eventRun = {
        id: rid,
        workflow_id: 1,
        html_url: `https://example.com/run/${rid}`,
        name,
        conclusion: 'success',
        head_sha: sha,
        head_branch: 'topic',
        run_attempt: 1,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        event: 'pull_request',
      };
      rid += 1;
      github.rest.actions.listWorkflowRuns = async () => ({
        data: {
          workflow_runs: [eventRun],
        },
      });
      await upsertPrFeedbackSummary(
        github,
        { owner: 'o', repo: 'r', prNumber: 99 },
        eventRun,
        { prHeadSha: sha, log: { info: () => {}, error: () => {} } },
      );
    }

    assert.equal(stored.length, 1);
    const body = stored[0]?.body ?? '';
    for (const w of workflows) {
      assert.ok(body.includes(`### ✅ ${w} finished`), `missing section ${w}`);
    }
  });
});
