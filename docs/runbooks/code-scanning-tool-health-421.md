# Code scanning tool health (#421)

**Prepared:** 2026-11-04 (Europe/Berlin)  
**Canonical tracker:** [#402](recovery-evidence-ledger-402.md) · Issues [#421](https://github.com/qnbs/Nexus-HEMS-Dash/issues/421)–[#425](https://github.com/qnbs/Nexus-HEMS-Dash/issues/425)

This runbook implements **Wave B** of the Security & Quality Master Addendum (2026-11-04). It does **not** dismiss alerts or re-enable workflows without maintainer authorization.

## 1. Confirmed root cause: `Security Full` disabled

| Field | Value |
| --- | --- |
| Workflow file | `.github/workflows/security-full.yml` |
| Workflow name | `Security Full` |
| GitHub Actions workflow ID | `246879325` |
| **State** | **`active`** (re-enabled by maintainer 2026-11-04; was `disabled_manually`) |
| Last `push` run on `main` | 2026-06-30 (success) |
| Last `pull_request` run | 2026-06-30 |

While disabled, this workflow does **not** run on `push`/`pull_request`/`schedule`/`workflow_dispatch` triggers. That explains:

- No `Security Full` entries in recent push run samples (200+ runs, Nov 2026 audit).
- Missing expected **CodeQL + Semgrep SARIF + Gitleaks** uploads from this workflow (ADR-027 single CodeQL source is **this file** when enabled).
- GitHub **Code scanning → Tool status** errors and stale Scorecard/Trivy ingest may persist even when `ci.yml`, `sbom-scan.yml`, and `scorecard.yml` succeed.

### Maintainer action (required before closing #421)

1. GitHub → **Actions** → **Security Full** → **Enable workflow** (or remove manual disable at org/repo level).
2. Run **workflow_dispatch** once on `main` and confirm jobs: CodeQL, Semgrep, Gitleaks, dependency audit, summary gate.
3. Open **Security and quality → Code scanning → Tool status** — confirm each tool shows a **successful analysis on current `main`** (not only green Actions jobs).

**Agents must not** use API/workflow edits to bypass disablement without explicit owner approval (see Master Addendum §3.3).

## 2. Other scan paths (still active on `main`)

| Workflow | Trigger | Role |
| --- | --- | --- |
| `ci.yml` | push/PR | Lint, tests, build, E2E, fuzz — **not** full CodeQL/Semgrep from `security-full.yml` |
| `sbom-scan.yml` | push/PR/schedule | SBOM, Grype, pnpm audit |
| `scorecard.yml` | push/PR/schedule | OpenSSF Scorecard SARIF |
| `security-freshness-heartbeat.yml` | schedule, dispatch, `workflow_run` after CI | Staleness guard (#387) |

**Schedule delivery:** GitHub `event=schedule` for SBOM/Scorecard largely stalled since **2026-10-19** — see [scheduled-security-workflows-387-391.md](scheduled-security-workflows-387-391.md). Push-triggered runs remain green; cron proof still open (#387/#391).

## 3. Semgrep SARIF upload (`continue-on-error: true`)

In `security-full.yml`, the Semgrep SARIF upload step uses `continue-on-error: true`. Before changing it:

1. Re-enable workflow and capture a failing upload log (permissions, SARIF schema, category collision).
2. Only then decide: fix root cause vs. promote upload failure to blocking.

Do not blanket-remove `continue-on-error` without evidence (Master Addendum §3.2).

## 4. Agent/API limits

Cloud agent tokens **cannot** list code scanning alerts (`403 Resource not accessible by integration`). Per-alert disposition requires:

- Maintainer **Tool status** screenshots/exports, or
- PAT with **Code scanning alerts: read** (sanitized before posting in issues).

Use the acceptance ledger: [code-scanning-alert-acceptance-ledger-421.md](code-scanning-alert-acceptance-ledger-421.md).

## 5. Stop conditions for #421

- [ ] `Security Full` enabled and at least one successful **`workflow_dispatch`** on current `main`.
- [ ] Tool status: no unexplained configuration errors for CodeQL, Scorecard, Trivy/Grype (as shown in UI).
- [ ] Fresh accepted analyses indexed for `refs/heads/main` (analysis IDs recorded in ledger).
- [ ] Schedule/cron recovery tracked separately under #387/#391.

## 6. Related issue map (22 supplied alerts)

| Issue | Alerts |
| --- | --- |
| #422 Token-Permissions | 208, 207, 206, 205, 96, 95 |
| #423 Pinned-Dependencies | 204–196 |
| #424 Trusted container registries | 181, 180 |
| #425 Scorecard project health | 20, 19, 16 |
| #390 Branch protection / review | 17, 7 |

**0/22 closed by documentation alone.** Fixes require evidence-backed PRs per wave C–F in the Master Addendum.

## 7. Post-enable dispatch on `main` (run `41905375510`, 2026-11-04 ~21:18 CET)

Maintainer ran **workflow_dispatch** after re-enabling **Security Full**. Outcome:

| Job | Result | Notes |
| --- | --- | --- |
| CodeQL | **failure** (dispatch `41905375510`; **resolved** 2026-11-04) | Maintainer disabled **default** setup, enabled **Advanced** (`codeql.yml`, PR #429). Duplicate CodeQL job removed from `security-full.yml` in consolidation PR. Re-run dispatch after merge. |
| Gitleaks | **failure** | 11 findings — placeholder PEM in adapter forms, docs JSON examples, EEBUS test fixtures, HA `mqttPassword` field key (see `.gitleaksignore` / `.gitleaks.toml` fix PR). |
| Semgrep OSS | success | SARIF upload step green (`continue-on-error` still advisory until upload failures are proven). |
| Dependency audit, anti-trojan, branch-protection reminder | success | |
| Security Gate | **failure** | Rollup failed on CodeQL + Gitleaks. |

Log anchor: `gh run view 41905375510 --log-failed`.

### Stop-condition progress (#421)

- [x] `Security Full` enabled + manual dispatch executed on current `main`.
- [x] CodeQL ingest: **default off / Advanced on** (`codeql.yml`); dedupe from `security-full.yml` pending merge.
- [ ] Gitleaks: green on `main` after allowlist PR merges (no real secrets rotated — all documented placeholders).
- [ ] Tool status UI review (maintainer).
- [ ] Schedule/cron recovery (#387/#391) — separate track.

## 8. Maintainer Security overview (screenshot 2026-11-04 ~21:20 CET)

Evidence from repo **Security** tab (maintainer mobile capture; archived in agent artifacts as `github-security-overview-2026-11-04.jpg`):

| Surface | Reading |
| --- | --- |
| **Dependabot** | **60** vulnerabilities (Malware category listed in UI) |
| **Code scanning** | **37** open alerts |
| **Secret scanning** | Listed; count not visible in capture |
| **Banner** | **Code scanning configuration error** — *"Scorecard and Trivy are reporting errors. Check the status page for help."* |
| **Security policy** | Enabled |
| **Security advisories** | Enabled |

### How this maps to the recovery plan

1. **37 code scanning alerts** exceeds the **22** owner-supplied IDs in §6 — expect additional Semgrep/CodeQL/Scorecard (and possibly default-setup) findings. Inventory via **Code scanning → All alerts** export after Tool status is healthy; do not bulk-dismiss.
2. **60 Dependabot** items are **dependency alerts**, not the code-scanning acceptance ledger. Triage via Renovate/Dependabot + `pnpm audit` waves; malware-flagged items need maintainer priority review.
3. **Scorecard + Trivy configuration errors** on **Tool status** can persist while **`scorecard.yml` Actions jobs are green** (verified on `main` push after #427). Likely causes:
   - **CodeQL default setup** still enabled alongside advanced `security-full.yml` (§7) — blocks coherent SARIF ingest.
   - **Trivy** in Tool status may refer to GitHub’s default/integrated scanner name; this repo’s CI uses **Grype** for image/SBOM gates (`sbom-scan.yml`, `container-publish.yml`) and does **not** upload Grype SARIF to Code scanning today. Orphaned or default **Trivy** registration may need removal or a deliberate SARIF upload workflow (#424).
4. **Next maintainer click:** **Security → Code scanning → Tool status** (from the red banner) — capture the **Scorecard** and **Trivy** row error text and last successful analysis SHA.

### Stop-condition progress (#421) — UI

- [x] Maintainer provided Security overview screenshot (counts + configuration banner).
- [ ] Tool status detail export for Scorecard + Trivy rows.
- [ ] Code scanning alert export reconciled with §6 issue map + extra 15 alerts.

## 9. Post-merge manual Security Full on `main` (run `41906727744`, 2026-11-04 ~21:27 CET)

After maintainer re-enabled workflows and switched CodeQL to **Advanced**, a **`workflow_dispatch`** on **`main`** (before **#429** merged) produced:

| Job | Result | Notes |
| --- | --- | --- |
| CodeQL (legacy job on old `main`) | success | Pre-#429 tree still had `security-full` CodeQL job; **#429** moved CodeQL to `codeql.yml`. |
| Gitleaks | **failure** | Expected until **#429** Gitleaks allowlists landed on `main`. |
| Semgrep, dependency audit, anti-trojan | success | |
| Security Gate | **failure** | Rollup failed on Gitleaks only. |

**After #429 merged (`b8d7246`):** re-run **Security Full** and **CodeQL Advanced** on `main`; expect **Security Gate green** if Gitleaks allowlists are active.

The red **Scorecard + Trivy configuration error** banner on the Security tab is **Tool status**, not the Security Full rollup. Mitigation PR adds explicit Scorecard SARIF upload + `trivy-code-scanning.yml` Helm SARIF ingest.
