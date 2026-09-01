# Campaign Handoff — Post-v1.11.0 Freeze (Sep 2026)

> **Status:** Complete (2026-09-01)  
> **Snapshot:** `main` @ `0006a56` after six merged PRs and history housekeeping  
> **Purpose:** Closeout record for the Sep 2026 operational campaign after a 53-day product freeze.

---

## Context

Between **2026-07-10** (v1.11.0 ship) and **2026-09-01**, no product commits landed on `main`.
Operational rot accumulated: stale Dependabot Action pin PRs, demo chrome misreporting mock mode as
"connected", docs drift from enforced CI gates, missing E-STOP regression coverage, unset-`NODE_ENV`
auth fail-open, and high-severity dependency/CVE findings.

---

## Merged PRs (in merge order)

| PR | Branch | Scope |
| --- | --- | --- |
| [#336](https://github.com/qnbs/Nexus-HEMS-Dash/pull/336) | `cursor/deps-audit-high-cve-sep2026-988d` | Production deps audit + Docker CVE remediation |
| [#329](https://github.com/qnbs/Nexus-HEMS-Dash/pull/329) | `cursor/ci-bump-github-actions-sep2026-988d` | GitHub Actions pin alignment (supersedes #323–#327) |
| [#332](https://github.com/qnbs/Nexus-HEMS-Dash/pull/332) | `cursor/fix-pages-demo-chrome-988d` | Demo chrome honesty (`resolveConnectionPresentation`) |
| [#334](https://github.com/qnbs/Nexus-HEMS-Dash/pull/334) | `cursor/docs-truth-sync-sep2026-988d` | Docs / debt registry truth-sync |
| [#335](https://github.com/qnbs/Nexus-HEMS-Dash/pull/335) | `cursor/p1-emergency-stop-test-988d` | EmergencyStop async test stabilization |
| [#333](https://github.com/qnbs/Nexus-HEMS-Dash/pull/333) | `cursor/sec-11-node-env-fail-closed-3e8d` | SEC-11 `NODE_ENV` fail-closed auth |

---

## Housekeeping (same day)

- **History dedup:** Direct push (`0006a56`) preceded an empty PR squash commit (`e49b0c0`); force-pushed `main` to keep the substantive commit only.
- **Dependabot:** PRs #323–#327 closed (superseded by #329).
- **Stale remote branches:** Delete merged `cursor/*-988d` and `cursor/*-3e8d` campaign branches after housekeeping PR merges.
- **Docs:** `FEATURE_STATUS.md`, `Technical-Debt-Registry.md` (OPS-FREEZE-01 → resolved), `CHANGELOG.md` `[Unreleased]`.

---

## Verification

CI on cleaned `main` (run [33526733249](https://github.com/qnbs/Nexus-HEMS-Dash/actions/runs/33526733249)): lint, type-check, unit tests, build, E2E (85 passed), fuzz — all green.

---

## Follow-up (not in this campaign)

- Manual **v1.11.1** or **v1.12.0** release dispatch when ready (`release.yml`, ADR-015).
- Remaining debt in `docs/Technical-Debt-Registry.md` (non-OPS items).
- Node 20 deprecation warnings on GitHub Actions runners (informational).
