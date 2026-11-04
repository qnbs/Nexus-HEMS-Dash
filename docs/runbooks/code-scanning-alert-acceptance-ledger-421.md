# Code scanning alert acceptance ledger (#421)

Template for **Wave B–G** disposition. Do not mark an alert **Fixed** until a **fresh accepted scan** on `main` confirms closure (or owner documents a narrow exception).

| alert_id | tool | rule | severity | main_sha | location | report_summary | exploitability | root_cause | fix_or_exception | PR | tests | analysis_id_time | github_state | reviewer | owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 208 | Scorecard | Token-Permissions | High | TBD | sbom-scan.yml | TBD | TBD | TBD | #422 | — | — | TBD | open | pending | maintainer |
| … | … | … | … | … | … | … | … | … | … | … | … | … | open | pending | maintainer |

## Batch status (owner-supplied 22 IDs)

| Status | Count |
| --- | --- |
| Mapped to issues | 22/22 |
| Evidence-backed fix merged | 0/22 |
| Remaining 60 findings | **Not inventoried** (dashboard/API access required) |

## Workflow health evidence (2026-11-04)

| Check | Result |
| --- | --- |
| `Security Full` workflow state | **`disabled_manually`** — see [code-scanning-tool-health-421.md](code-scanning-tool-health-421.md) |
| Agent `code-scanning/alerts` API | 403 (integration) |
| Push CI / SBOM / Scorecard on `main` | Green on snapshot SHAs in [#402 ledger](recovery-evidence-ledger-402.md) |

Update rows as PRs land; never auto-dismiss from green CI alone.
