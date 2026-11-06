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
| 2026-11-04 | `b8d7246` | #429 CodeQL Advanced + Gitleaks (#421) | Security Full push `41908058281` **success**; CodeQL in `codeql.yml` |
| 2026-11-04 | `5951aef` | #431 Scorecard/Trivy SARIF (#421) | Scorecard `41909771826` (explicit SARIF upload), Trivy `41909772215`, Security Full dispatch `41909627237` **success** |
| 2026-11-04 | `1406658` | #435 Gitleaks integrity (#432) | Security Full `41919025824` Gitleaks + integrity **pass** |
| 2026-11-04 | `d398c3f` | #436 Helm trusted registries (#424) | CI `41924473440`, Trivy `41924473477`, Deploy `41924473500` **success** |
| 2026-11-05 | `54715ab` | #437 Gitleaks MQTT + runtime canaries (#432/#424) | PR Security Full + GitGuardian **pass**; squash merge (admin); push CI `41943847050` |
| 2026-11-05 | `3bdca6f` | #439 freshness pagination + Gitleaks Tibber/aWATTar (#387/#432) | Squash merge (admin); ingest runs `42047974425`–`42047974888` **success**; PR SBOM syft **504** flake |

**Pages provenance (#392):** first green end-to-end push deploy @ `d95020c` — CI `build` artifact promoted (113 files + digest manifest), `verify-pages` passed on run `41887360783`. Subsequent deploys promote the same CI artifact pattern with matching live SHA.

**Security audit wave (#421–#425):** **#439** merged @ `3bdca6f`. Workflow ingest green on push (§421 runbook §10). **Tool status / alert export** still owner-required (API 403). **#411** Grype DB: rely on **`cache-db: true`** in `anchore/scan-action` (same Grype binary as scan); no separate CLI warm step.

**Open tracker items:** #387/#391 schedule delivery (SBOM cron verified 2026-11-05 `41959107523` — monitor recurrence); #401 release (explicit approval only); #423–#425 acceptance ledger; #421 UI Tool status + alert inventory.

**Runner queue (#411 issue):** intermittent queue delays observed; `deploy-recovery.yml` uses `gh run list --repo "$GITHUB_REPOSITORY"` (#413). Grype **`database does not exist`** flake tracked in [grype-db-resilience-411.md](grype-db-resilience-411.md).
