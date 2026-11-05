# Security scan freshness heartbeat (#387)

Tracks whether **scheduled** security workflows still produce successful runs. GitHub may suspend cron workflows on inactive repositories; this workflow makes that gap visible.

## Workflow

- File: `.github/workflows/security-freshness-heartbeat.yml`
- Triggers: daily `04:30 UTC`, manual `workflow_dispatch`
- Checks:
  - **Blocking:** last successful **scheduled** `sbom-scan.yml` run must be ≤ 8 days old
  - **Advisory:** last successful scheduled `scorecard.yml` (continues on failure until #391 is resolved)

## When this fails

1. Confirm **Settings → Actions** allows workflows (re-enabled 2026-11-04 after suspension).
2. Distinguish **real stale cron** (e.g. Scorecard last `event=schedule` before threshold) from **script bugs** — `.github/scripts/security-scan-freshness.sh` must not use `--paginate --jq '… | first'` (GH CLI applies jq per page). Unit tests: `bash .github/scripts/security-scan-freshness.test.sh`.
3. **Blocking SBOM schedule step:** restore cron delivery and confirm a successful **`event=schedule`** `sbom-scan.yml` run (≤ `MAX_SBOM_SCHEDULE_STALE_DAYS`). A manual **workflow_dispatch**, **push**, or **pull_request** run only refreshes the **advisory** “any trigger” step — use those as diagnostics, not as a substitute for schedule proof.
4. Review repository **Settings → Actions → General** (workflow permissions).
5. Inspect org billing/quota if runs are skipped entirely.

The heartbeat workflow runs **schedule** checks (SBOM blocking on cron; Scorecard blocking except on post-CI `workflow_run`) plus **any-trigger** checks (`continue-on-error: true`) so operators still see recency after Actions re-enable (#387 notice step).

## Related issues

- #387 — missing schedules after 2026-10-19
- #386 / #388 — dependency and Grype remediation
- #391 — Scorecard checkout failures

Do not disable Grype or lower audit severity to green this job.
