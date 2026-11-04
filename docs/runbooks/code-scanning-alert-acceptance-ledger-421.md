# Code scanning alert acceptance ledger (#421)

Template for **Wave B–G** disposition. Do not mark an alert **Fixed** until a **fresh accepted scan** on `main` confirms closure (or owner documents a narrow exception).

| alert_id | tool | rule | severity | main_sha | location | report_summary | exploitability | root_cause | fix_or_exception | PR | tests | analysis_id_time | github_state | reviewer | owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 208 | Scorecard | Token-Permissions | High | TBD | sbom-scan.yml | TBD | TBD | TBD | #422 | — | — | TBD | open | pending | maintainer |
| … | … | … | … | … | … | … | … | … | … | … | … | … | open | pending | maintainer |

## Batch status (owner-supplied 22 IDs)

| Status | Count |
| --- | --- |
| Mapped to issues | 22/22 (owner-supplied batch) |
| Evidence-backed fix merged | 0/22 |
| Dashboard **Code scanning** (2026-11-04 UI) | **37** open — full inventory pending |
| Dashboard **Dependabot** (same UI) | **60** — separate from code-scanning ledger |

## Workflow health evidence (2026-11-04)

| Check | Result |
| --- | --- |
| `Security Full` workflow state | **`active`** — dispatch run `41905375510`; Gitleaks fix in PR #428 |
| Agent `code-scanning/alerts` API | 403 (integration) |
| Maintainer Security tab screenshot | See [code-scanning-tool-health-421.md](code-scanning-tool-health-421.md) §8 |
| Push CI / SBOM / Scorecard on `main` | Green on recent SHAs; **Tool status** still reports Scorecard + Trivy configuration errors |

Update rows as PRs land; never auto-dismiss from green CI alone.
