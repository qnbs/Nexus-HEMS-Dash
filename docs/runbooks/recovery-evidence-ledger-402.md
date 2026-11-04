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
| 2026-11-04 | `51b4b8a` | #412 Pages CI artifact promote | Deploy failed: empty `gitSha` (turbo cache) |
| 2026-11-04 | `9f01f04` | #413 Pages provenance | Deploy `41881368601`: missing digest manifest |
| 2026-11-04 | `a331e59` | #414 digest after size/smoke | Deploy `41884659538`: manifest file-set mismatch |
| 2026-11-04 | `d95020c` | #415 verify relax + chain complete | CI `41887360493`, Deploy `41887360783` **success**, live `build-info.json` SHA match, Container `41887360476` |
| 2026-11-04 | `949d094` | #417 contrib chunk + heartbeat hook | CI `41892150084`, Deploy `41892150035` success, Heartbeat `41892929820` (schedule stale advisory) |
| 2026-11-04 | `35f4c06` | #418 lazy OCPP + heartbeat CI fix (#405, #387) | CI `41897433479`, Deploy `41897433554` **success** (verify-pages OK), live `build-info.json` SHA match, Heartbeat `41898093286` **success** |
| 2026-11-04 | `d310436` | #420 lazy evcc/OpenEMS (#405) | CI `41903529044`, Deploy `41903528984`; `adapters-core-*` ~84.8 kB gzip |

**Pages provenance (#392):** first green end-to-end push deploy @ `d95020c` — CI `build` artifact promoted (113 files + digest manifest), `verify-pages` passed on run `41887360783`. Subsequent deploys promote the same CI artifact pattern with matching live SHA.

**Security audit wave (#421–#425):** `Security Full` **re-enabled** 2026-11-04; dispatch run **`41905375510`** failed **CodeQL** (default vs advanced setup) + **Gitleaks** (11 FPs — **#428**). Maintainer Security tab screenshot (**2026-11-04 ~21:20 CET**): **37** code scanning, **60** Dependabot, banner **Scorecard + Trivy configuration errors** — see `code-scanning-tool-health-421.md` §8. **22/22** owner IDs mapped; **0/22** closed without fresh scan. Agent alerts API **403**.

**Open tracker items:** #387/#391 schedule delivery; #401 release (explicit approval only); #421 CodeQL default-setup conflict (**maintainer** UI) + Gitleaks allowlist PR; #422–#425 per acceptance ledger.

**Runner queue (#411):** intermittent queue delays observed; deploy/CI eventually completed on `d95020c`. `deploy-recovery.yml` uses `gh run list --repo "$GITHUB_REPOSITORY"` (#413).
