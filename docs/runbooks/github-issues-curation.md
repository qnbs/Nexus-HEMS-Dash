# GitHub issues curation (agent-maintained)

**Purpose:** Mirror externally updated GitHub issues into repo docs so agents and maintainers share one curated view. Refresh this file when issue state, priority, or owner PRs change (typical trigger: issue comment/edit webhook or explicit maintainer note).

**Source of truth:** GitHub Issues API (`gh issue list` / `gh issue view`). This doc is **derivative** — do not treat it as authoritative over the issue tracker.

**Last curated:** 2026-11-09 (Europe/Berlin)

## Active delivery threads (open)

| Issue | Priority | Title (short) | Owner PR / branch | Notes |
| --- | --- | --- | --- | --- |
| [#448](https://github.com/qnbs/Nexus-HEMS-Dash/issues/448) | P1 | Offline sync: orphaned `syncing`, failure-atomic server-wins | [#467](https://github.com/qnbs/Nexus-HEMS-Dash/pull/467) @ `bc30a08` | Baseline + `fullResyncRequired` + atomic `GET /api/settings`; CAS/hardware still open |
| [#452](https://github.com/qnbs/Nexus-HEMS-Dash/issues/452) | P0 | K8s WAL durable single-writer | [#466](https://github.com/qnbs/Nexus-HEMS-Dash/pull/466) `cursor/helm-wal-hpa-enforce-452-79f6` | HEAD `dd90325`: 36/36 CI green + Lighthouse pass (2026-11-09); CodeRabbit rate-limit may block quiescence |
| [#465](https://github.com/qnbs/Nexus-HEMS-Dash/pull/465) | P1 | Docs/toolchain truth-sync | `cursor/docs-toolchain-refresh-79f6` @ `f7d3bac` | Docs-only; 0 unresolved threads; CI success on `9a8df9f` gate (re-run after `f7d3bac` if needed) |
| [#458](https://github.com/qnbs/Nexus-HEMS-Dash/issues/458) | P0/P1 | Object identity / CID audit umbrella | TBD | Cross-links OCPP mock isolation |
| [#421](https://github.com/qnbs/Nexus-HEMS-Dash/issues/421) | P0 | Code scanning tool status | Runbooks under `docs/runbooks/` | Pairs with #402 ledger |
| [#432](https://github.com/qnbs/Nexus-HEMS-Dash/issues/432) | P0 | Gitleaks integrity | — | Security-full gate |
| [#402](https://github.com/qnbs/Nexus-HEMS-Dash/issues/402) | AUDIT | Recovery evidence tracker | [recovery-evidence-ledger-402.md](recovery-evidence-ledger-402.md) | Wave A + post-merge SHAs |

## Curation rules (agents)

1. On each external issue update notification, run `gh issue view <n>` for affected IDs and adjust the table + linked docs (`FEATURE_STATUS.md`, debt registry, runbooks).
2. Never close issues from docs-only PRs; code PRs reference `Refs #nnn` and leave acceptance to maintainer.
3. Record merge-ready SHAs in [#402 ledger](recovery-evidence-ledger-402.md) only after authorized merge (v11).
4. Split overlapping work (**#465 docs** vs **#466/#467 code**) — avoid duplicate Helm/sync fixes on doc branches.

## Related

- [PR review correction loop](pr-review-correction-loop.md)
- [Technical Debt Registry](../Technical-Debt-Registry.md)
- [FEATURE_STATUS.md](../../FEATURE_STATUS.md)
