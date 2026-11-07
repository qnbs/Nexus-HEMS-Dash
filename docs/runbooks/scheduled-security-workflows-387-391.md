# Scheduled security workflows (#387 / #391)

**Workflows:** `sbom-scan.yml` (daily 03:00 UTC), `scorecard.yml` (Monday 03:00 UTC), watchdog `security-freshness-heartbeat.yml` (04:30 UTC + post-CI on `main`).

## Observed state (2026-11-07)

| Workflow | Last `event=schedule` run | Last `push`/`pull_request` success |
| --- | --- | --- |
| SBOM (`sbom-scan.yml`) | **2026-11-07** — success (`42332133401`, `event=schedule`) | PR/`main` runs continue to pass Layer-1 gates |
| Scorecard (`scorecard.yml`) | **2026-10-05** — last schedule **success** (`03:12:20Z`); 2026-10-19 schedule failed checkout (`Repository not found`) | 2026-11-06 — PR/push success (**not** a substitute for schedule freshness) |
| Renovate / Stale / other crons | **2026-11-07** — scheduled runs **green** (e.g. Renovate `42341339305`, Stale `42327967074`) | N/A |
| Freshness heartbeat | **2026-11-07** — run `42338839901` **`schedule` job failed** on Scorecard freshness (>9d since last schedule success; ~33d since 2026-10-05). SBOM schedule step on same run **green** after 2026-11-07 schedule success. | `workflow_run` post-`main` CI paths may still pass while schedule proof is red |

**Do not** widen freshness thresholds to green-wash the heartbeat while Scorecard `event=schedule` remains stale. Next expected Scorecard cron window: **Monday ~03:00 UTC** (`0 3 * * 1`); GitHub dispatch timing can skew.

**Agent follow-up (2026-11-09):** After the Monday 03:00 UTC `scorecard.yml` schedule run, append the run id + `event=schedule` conclusion to this file and to `docs/runbooks/recovery-evidence-ledger-402.md` under #387/#391. Until that cron fires, PR/push successes on `main` (e.g. post–v9 merge stack ending `69bae53`) are **not** schedule proof.

### Prior snapshot (2026-11-04)

SBOM schedule last failed 2026-10-19 before composite fix; post-fix **push** SBOM/Scorecard were green while **schedule** events were still sparse — see git history for #418 heartbeat work.

GitHub schedule delivery can lag org/repo policy. Treat prolonged absence of `event=schedule` as **platform schedule delivery**, not application regression:

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
