# Linear curation (agent-maintained)

**Purpose:** Mirror **qnbs / QNB** Linear planning state for **Nexus-HEMS-Dash** the same way we mirror GitHub Issues — derivative, refreshed when Linear or GitHub changes externally.

**Source of truth:**

| Layer | Authority |
| --- | --- |
| Implementation & acceptance | [GitHub Issues](https://github.com/qnbs/Nexus-HEMS-Dash/issues) on `qnbs/Nexus-HEMS-Dash` |
| Roadmap / rebaseline / PR portfolio | [Linear](https://linear.app/qnbs) project **Nexus-HEMS-Dash — Security Recovery & Engineering** |

**Last curated:** 2026-11-09 (Europe/Berlin) via Linear MCP (`list_projects`, `get_project`).

## Primary Linear project (HEMS)

| Field | Value |
| --- | --- |
| Project | [Nexus-HEMS-Dash — Security Recovery & Engineering](https://linear.app/qnbs/project/nexus-hems-dash-security-recovery-and-engineering-811816354c80) (`P-QNB-13`) |
| Team | Qnbs (`QNB`) |
| Status | In Progress |
| Maintainer rebaseline | `main` `4d0f435`; governance **v11** (no merge without explicit SHA approval) |

Project summary (Linear, external) tracks open PR heads, CI failures, and stack relationships — agents should **read `get_project` on notification** and reconcile with [github-issues-curation.md](github-issues-curation.md).

## GitHub ↔ Linear map (Nexus-HEMS-Dash)

Unlike WorldScript Studio, most HEMS GitHub issues are **not** 1:1 `QNB-*` mirrors. Use this table plus the Linear **project description** for portfolio view.

| GitHub | Linear anchor | Active PR / notes |
| --- | --- | --- |
| [#448](https://github.com/qnbs/Nexus-HEMS-Dash/issues/448) offline sync | Project + GH comments | [#467](https://github.com/qnbs/Nexus-HEMS-Dash/pull/467) @ `a1e1282` — fail-closed diff + full resync; CAS/hardware open |
| [#452](https://github.com/qnbs/Nexus-HEMS-Dash/issues/452) K8s WAL | Project + GH | [#466](https://github.com/qnbs/Nexus-HEMS-Dash/pull/466) @ `dd90325` CI green |
| [#402](https://github.com/qnbs/Nexus-HEMS-Dash/issues/402) recovery ledger | Project + [ledger](recovery-evidence-ledger-402.md) | Evidence SHAs only after authorized merge |
| [#421](https://github.com/qnbs/Nexus-HEMS-Dash/issues/421) code scanning | Runbooks | Tool status still owner-required |
| [#432](https://github.com/qnbs/Nexus-HEMS-Dash/issues/432) Gitleaks | — | Security-full gate |
| Docs truth-sync | — | [#465](https://github.com/qnbs/Nexus-HEMS-Dash/pull/465) @ `2ad2ed5` docs-only (+ curation runbooks) |

**Note:** Linear project summary may lag GitHub HEAD (e.g. still naming #467 `bc30a08` after `e929951` type-check fix). Prefer `gh pr view` / CI over Linear text.

## Agent workflow (Linear)

1. **On external Linear update** (or maintainer mention): `get_project` → **Nexus-HEMS-Dash — Security Recovery & Engineering**; scan summary/description for PR SHAs, CI, blockers.
2. **Cross-check GitHub:** `gh issue view <n>` / `gh pr checks` for every PR/issue named in Linear text.
3. **Update repo docs:** this file + [github-issues-curation.md](github-issues-curation.md) + `FEATURE_STATUS.md` / `#402` ledger when status claims change.
4. **Do not** close GitHub issues or mark Linear Done from docs-only PRs; code PRs use `Refs #nnn` and leave acceptance to maintainer.
5. **Do not** treat stale Linear text as current — Linear project descriptions are often ahead/behind; **GitHub HEAD + CI** wins for implementation state.

## MCP tools (Cursor)

| Tool | Use |
| --- | --- |
| `list_projects` + query `HEMS` | Find project id/summary |
| `get_project` | Full rebaseline text, linked PR entities |
| `list_issues` + query | Per-repo mirrors (sparse for HEMS; richer for WSS) |
| `get_issue` | Deep read when a `QNB-*` issue is linked |

## Related

- [GitHub issues curation](github-issues-curation.md)
- [PR review correction loop](pr-review-correction-loop.md)
