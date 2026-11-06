import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  MARKER,
  assembleSummaryBody,
  parseExistingSummary,
  upsertPrFeedbackSummary,
} from './pr-feedback-summary.mjs';

describe('pr-feedback-summary', () => {
  it('assembles a stable body with marker and head tag', () => {
    const sha = 'a'.repeat(40);
    const body = assembleSummaryBody(sha, {
      CI: '### ✅ CI finished\n\ndone',
    });
    assert.ok(body.includes(`head=${sha}`));
    assert.ok(body.endsWith(`${MARKER}\n`));
    assert.ok(body.includes('### ✅ CI finished'));
  });

  it('parses round-trip sections for the same head', () => {
    const sha = 'b'.repeat(40);
    const first = assembleSummaryBody(sha, {
      CI: '### ✅ CI finished\n\nfirst',
    });
    const parsed = parseExistingSummary(first);
    assert.equal(parsed.headSha, sha);
    assert.ok(parsed.sections.CI.includes('first'));

    const second = assembleSummaryBody(sha, {
      ...parsed.sections,
      'Security Full': '### ✅ Security Full finished\n\nsec',
    });
    const again = parseExistingSummary(second);
    assert.ok(again.sections.CI.includes('first'));
    assert.ok(again.sections['Security Full'].includes('sec'));
  });

  it('upsert updates one comment in place and deletes duplicates for same head', async () => {
    const sha = 'c'.repeat(40);
    const calls = { deleted: [], updated: 0, created: 0 };

    const github = {
      paginate: {
        iterator: async function* (fn, params) {
          const page1 = await fn(params);
          yield page1;
        },
      },
      rest: {
        issues: {
          listComments: async () => ({
            data: [
              {
                id: 1,
                body: `${assembleSummaryBody(sha, { CI: '### ✅ CI finished\n\nold' })}`,
                user: { login: 'github-actions[bot]' },
              },
              {
                id: 2,
                body: `${assembleSummaryBody(sha, { CI: '### ✅ CI finished\n\ndup' })}`,
                user: { login: 'github-actions[bot]' },
              },
            ],
          }),
          deleteComment: async ({ comment_id }) => {
            calls.deleted.push(comment_id);
          },
          updateComment: async () => {
            calls.updated += 1;
          },
          createComment: async () => {
            calls.created += 1;
          },
        },
      },
    };

    await upsertPrFeedbackSummary(
      github,
      { owner: 'o', repo: 'r', prNumber: 44 },
      {
        html_url: 'https://example.com/run',
        name: 'CI',
        conclusion: 'success',
        head_sha: sha,
      },
    );

    assert.equal(calls.updated, 1);
    assert.equal(calls.created, 0);
    assert.ok(calls.deleted.includes(2));
  });
});
