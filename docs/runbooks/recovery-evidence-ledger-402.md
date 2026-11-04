# Recovery evidence ledger (#402)

Wave A + post-merge safety work on `main` (Europe/Berlin dates).

| Date (CET) | `main` SHA | Event | CI / deploy evidence |
| --- | --- | --- | --- |
| 2026-11-04 | `683a241` | #403 P0 deps merge | CI green on stack baseline |
| 2026-11-04 | `7b1e197` | #404 devops recovery merge | SBOM + security workflows |
| 2026-11-04 | `2e6b8d2` | #379 OCPP SP0 opt-in merge | Full CI + container publish |
| 2026-11-04 | `8895eb6` | #406 OCPP shutdown (#389) | Container publish success |
| 2026-11-04 | `1dc20da` | #407 Dependabot Actions batch (#393) | Container publish success |
| 2026-11-04 | `898162f` | #408 container scan→promote (#392 GHCR leg) | Run `41860671937` |
| 2026-11-04 | `3de2b5d` | #409 Vite patch (#385) | Container publish `41861932895` |
| 2026-11-04 | `9fbae2e` | #410 provenance runbook (#392 docs) | PR CI success |

**Open tracker items:** #392 Pages artifact promotion (PR pending), #387/#391 scheduled workflow proof, #405 adapters bundle, #401 release dispatch.

**Runner queue (#411):** Container publish on `3de2b5d` completed after queue delay; treat long `queued` as infra, not workflow regression.
