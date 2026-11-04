# Security scan freshness heartbeat (#387)

Tracks whether **scheduled** security workflows still produce successful runs. GitHub may suspend cron workflows on inactive repositories; this workflow makes that gap visible.

## Workflow

- File: `.github/workflows/security-freshness-heartbeat.yml`
- Triggers: daily `04:30 UTC`, manual `workflow_dispatch`
- Checks:
  - **Blocking:** last successful **scheduled** `sbom-scan.yml` run must be ≤ 8 days old
  - **Advisory:** last successful scheduled `scorecard.yml` (continues on failure until #391 is resolved)

## When this fails

1. Open **Actions → SBOM Generation → Run workflow** (dispatch) after merging dependency fixes (#403).
2. Review repository **Settings → Actions → General** (workflow permissions, fork PR settings).
3. Confirm the repository had activity within GitHub’s schedule window (inactive repos pause cron).
4. Inspect org billing/quota if runs are skipped entirely.

## Related issues

- #387 — missing schedules after 2026-10-19
- #386 / #388 — dependency and Grype remediation
- #391 — Scorecard checkout failures

Do not disable Grype or lower audit severity to green this job.
