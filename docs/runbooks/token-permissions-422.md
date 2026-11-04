# Token-Permissions hardening (#422)

OpenSSF Scorecard **Token-Permissions** alerts **208, 207, 206, 205, 96, 95** — workflow default `GITHUB_TOKEN` must not grant broad write scopes.

## Pattern

- Workflow level: `permissions: contents: read` **or** `permissions: {}` when jobs declare all required scopes explicitly (see `graphify.yml`).
- Job level: grant only what the job uses (`pull-requests: write`, `issues: write`, `actions: write`, `id-token: write`, `packages: write`, `attestations: write`, `actions: read`).

## Event-mode validation matrix (PR #434)

| Workflow | Trigger modes | Write scopes (job) | Evidence on #434 |
| --- | --- | --- | --- |
| `labeler.yml` | `pull_request` (base repo) | `pull-requests: write` on `label` job | Auto-label PR **pass** |
| `coderabbit-rereview.yml` | `pull_request`, `workflow_run`, `dispatch` | `pull-requests: write` on `request-review` | Request CodeRabbit review **pass** |
| `pr-feedback-summary.yml` | `workflow_run` (after CI) | `pull-requests: write`, `actions: read` on `summarize` | PR feedback summary comment posted |
| `container-publish.yml` | `push`/`tags`, `dispatch` | `packages`, `id-token`, `attestations` on `publish` | (path-only PR; publish unchanged on PR CI) |
| `deploy.yml` | `push` `main`, `dispatch` | `actions: write`, `pages: write`, `id-token` on deploy jobs | CI build/deploy jobs **pass** on PR |
| `release.yml` | `workflow_dispatch` only | `contents: write`, `issues`/`pull-requests` on release job | Not executed on PR (dispatch-gated) |
| `sbom-scan.yml` | `push`, `schedule`, `dispatch` | `actions: write` on SBOM jobs | SBOM jobs **pass** |
| `deploy-recovery.yml` | `workflow_run`, `dispatch` | `actions: write` on recovery job | Not triggered on PR (main-only `workflow_run`) |
| `security-freshness-heartbeat.yml` | `schedule`, `dispatch`, `workflow_run` | `actions: read` on `heartbeat` | Not re-run on PR; job scope unchanged vs prior |
| `stale.yml` | `schedule`, `dispatch` | `issues`/`pull-requests: write` on `stale` | Not executed on PR |
| `graphify.yml` | `push` `main`, `dispatch` | `contents: read`, `actions: write`/`read` on jobs; workflow `{}` | Push-only; validated on next `main` push post-merge |

### Fork pull requests

Fork PRs receive a **read-only** `GITHUB_TOKEN` for `pull_request` workflows regardless of job `permissions` (GitHub platform rule). Labeler and CodeRabbit re-review on fork PRs may no-op or skip write steps; base-repo `workflow_run` paths retain write token after green CI.

## Post-merge

1. Merge PR #434 (or successor) when required CI is green.
2. Run **OpenSSF Scorecard** on `main` and map fresh SARIF to acceptance ledger rows **208–205, 96, 95**.
3. Close Scorecard Token-Permissions alerts only after fresh scan evidence.
