# Code scanning alert acceptance ledger (#421)

Template for **Wave B–G** disposition. Do not mark an alert **Fixed** until a **fresh accepted scan** on `main` confirms closure (or owner documents a narrow exception).

| alert_id | tool | rule | severity | main_sha | location | report_summary | exploitability | root_cause | fix_or_exception | PR | tests | analysis_id_time | github_state | reviewer | owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 208 | Scorecard | Token-Permissions | High | TBD | sbom-scan.yml | TBD | TBD | TBD | #422 / #434 | — | — | TBD | open | pending | maintainer |
| 180 | Trivy | KSV034 / trusted registry | Medium | TBD | deployment-frontend.yaml | Static template scan | Low | Unrendered Helm template | #424 render-time + CI tests | TBD | verify-helm-trusted-registries.mjs | TBD | open | exception | maintainer |
| 181 | Trivy | KSV034 / trusted registry | Medium | TBD | deployment-server.yaml | Static template scan | Low | Unrendered Helm template | #424 render-time + CI tests | TBD | verify-helm-trusted-registries.mjs | TBD | open | exception | maintainer |
| … | … | … | … | … | … | … | … | … | … | … | … | … | open | pending | maintainer |

## Batch status (owner-supplied 22 IDs)

| Status | Count |
| --- | --- |
| Mapped to issues | 22/22 (owner-supplied batch) |
| Evidence-backed fix merged | 0/22 |
| Dashboard **Code scanning** (2026-11-04 UI) | **37** open — full inventory pending |
| Dashboard **Dependabot** (same UI) | **60** — separate from code-scanning ledger |

## Workflow health evidence (2026-11-05)

| Check | Result |
| --- | --- |
| `Security Full` + ingest workflows on `main` @ `3bdca6f` | Runs `42047974425`, `42047974534`, `42047974501`, `42047974888` **success** — see [code-scanning-tool-health-421.md](code-scanning-tool-health-421.md) §10 |
| Automated ingest helper | `scripts/verify-code-scanning-workflow-health.mjs` (Security Full gate, advisory) |
| Agent `code-scanning/alerts` API | 403 (integration) |
| Maintainer Security tab / Tool status | Still required for alert inventory + configuration banner |
| Push CI / SBOM / Scorecard on `main` | Green on recent SHAs; **Tool status** may still show historical configuration errors until UI export |

Update rows as PRs land; never auto-dismiss from green CI alone.
