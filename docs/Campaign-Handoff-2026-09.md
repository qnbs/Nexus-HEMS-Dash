# Campaign Handoff — Post-v1.11.0 Freeze (Sep 2026)

> **Status:** Complete (2026-09-01)  
> **Snapshot:** `main` @ `1716a42` — `v1.11.1` tagged and released  
> **Purpose:** Closeout record for the Sep 2026 operational campaign after a 53-day product freeze, plus the post-freeze master-prompt remediation wave.

---

## Context

Between **2026-07-10** (v1.11.0 ship) and **2026-09-01**, no product commits landed on `main`.
Operational rot accumulated: stale Dependabot Action pin PRs, demo chrome misreporting mock mode as
"connected", docs drift from enforced CI gates, missing E-STOP regression coverage, unset-`NODE_ENV`
auth fail-open, and high-severity dependency/CVE findings.

---

## Phase 1 — Sep campaign PRs (merged 2026-09-01)

| PR | Branch | Scope |
| --- | --- | --- |
| [#336](https://github.com/qnbs/Nexus-HEMS-Dash/pull/336) | `cursor/deps-audit-high-cve-sep2026-988d` | Production deps audit + Docker CVE remediation |
| [#329](https://github.com/qnbs/Nexus-HEMS-Dash/pull/329) | `cursor/ci-bump-github-actions-sep2026-988d` | GitHub Actions pin alignment (supersedes #323–#327) |
| [#332](https://github.com/qnbs/Nexus-HEMS-Dash/pull/332) | `cursor/fix-pages-demo-chrome-988d` | Demo chrome honesty (`resolveConnectionPresentation`) |
| [#334](https://github.com/qnbs/Nexus-HEMS-Dash/pull/334) | `cursor/docs-truth-sync-sep2026-988d` | Docs / debt registry truth-sync |
| [#335](https://github.com/qnbs/Nexus-HEMS-Dash/pull/335) | `cursor/p1-emergency-stop-test-988d` | EmergencyStop async test stabilization |
| [#333](https://github.com/qnbs/Nexus-HEMS-Dash/pull/333) | `cursor/sec-11-node-env-fail-closed-3e8d` | SEC-11 `NODE_ENV` fail-closed auth |
| [#337](https://github.com/qnbs/Nexus-HEMS-Dash/pull/337) | — | Campaign closeout docs + OPS-FREEZE-01 resolved |

---

## Phase 2 — Master-prompt remediation (merged 2026-09-01)

| PR | Scope |
| --- | --- |
| [#338](https://github.com/qnbs/Nexus-HEMS-Dash/pull/338) | `v1.11.1` version sync across manifests + CHANGELOG |
| [#339](https://github.com/qnbs/Nexus-HEMS-Dash/pull/339) | Post-release docs truth-sync (Perfection-Roadmap, Offline-Sync status) |
| [#340](https://github.com/qnbs/Nexus-HEMS-Dash/pull/340) | Command Hub i18n completion + single Simulation badge + header price pill |
| [#341](https://github.com/qnbs/Nexus-HEMS-Dash/pull/341) | Offline command idempotency slice 1 (Modbus write + mock WS dedupe) |

**Release:** [`v1.11.1`](https://github.com/qnbs/Nexus-HEMS-Dash/releases/tag/v1.11.1) tagged at `1716a42` (2026-09-01).

---

## Housekeeping

- **History dedup:** Direct push (`0006a56`) preceded an empty PR squash commit (`e49b0c0`); force-pushed `main` to keep the substantive commit only.
- **Dependabot:** PRs #323–#327 closed (superseded by #329).
- **Stale remote branches:** Merged `cursor/*-988d` campaign branches deleted on merge.
- **Docs:** `FEATURE_STATUS.md`, `Technical-Debt-Registry.md` (OPS-FREEZE-01 → resolved), `CHANGELOG.md` `[1.11.1]`.

---

## Verification

CI on `main` after Phase 2: lint, type-check, unit tests (coverage ≥72% branches), build, smoke-prod, E2E, fuzz, Lighthouse — all green on PRs #340–#341.

---

## Follow-up (not in this campaign)

- Remaining debt in `docs/Technical-Debt-Registry.md` (non-OPS items).
- Node 20 deprecation warnings on remaining GitHub Actions workflows (informational → `node24-runners` mode).
- Protocol depth increments (Matter, HA, Zigbee, OpenADR, SG-Ready) — one protocol per PR.
- SUPPLY-02 Grype exception review — due 2026-09-29.
- Full offline sync (conflict UI, `lastSyncVersion`, TTL) — post idempotency slice 1.
