# Scheduled security workflows (#387 / #391)

**Workflows:** `sbom-scan.yml` (daily 03:00 UTC), `scorecard.yml` (Monday 03:00 UTC), watchdog `security-freshness-heartbeat.yml` (04:30 UTC + post-CI on `main`).

## Observed state (2026-11-04)

| Workflow | Last `event=schedule` run | Last `push`/`pull_request` success |
| --- | --- | --- |
| SBOM | 2026-10-19 — **failure** (run `39192971692`, setup-node skipped on legacy composite) | 2026-11-04 — success on `main` pushes |
| Scorecard | 2026-10-19 — failure; 2026-10-05 — last schedule **success** | 2026-11-04 — success on PR/push |
| Freshness heartbeat | **2026-11-04** — run `41892929820` (`workflow_run` after #417 CI); schedule steps fail as expected (cron stale ~30d); any-trigger SBOM/Scorecard fresh |

GitHub did not enqueue new `schedule` runs after 2026-10-19 despite active `main` pushes. Treat this as **platform schedule delivery**, not application regression:

1. Repo **Settings → Actions → General** — confirm Actions enabled and scheduled workflows allowed for this repository/org.
2. Run **workflow_dispatch** on `sbom-scan.yml` and `scorecard.yml` weekly until schedule events resume.
3. Watch `Security Freshness Heartbeat` after merge — it runs on every successful **CI** completion on `main` and fails loudly when `event=schedule` success is older than configured thresholds.

## Freshness script

```bash
GITHUB_REPOSITORY=qnbs/Nexus-HEMS-Dash gh auth status
bash .github/scripts/security-scan-freshness.sh sbom-scan.yml 2 schedule
bash .github/scripts/security-scan-freshness.sh scorecard.yml 9 schedule
```

`any`-trigger mode accepts push/PR/dispatch successes (see heartbeat env `MAX_ANY_SUCCESS_STALE_DAYS`).

## Closing #387 / #391

- **Operational:** push-triggered SBOM/Scorecard on `main` are green; container and CI security gates remain Layer-1 blocking.
- **Schedule proof:** requires at least one post-fix `event=schedule` success **or** maintainer documents org-level schedule disablement + external cron dispatch (see heartbeat notice step).
