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

**Pages provenance (#392):** first green end-to-end push deploy @ `d95020c` — CI `build` artifact promoted (113 files + digest manifest), `verify-pages` passed on run `41887360783`. Subsequent deploys @ `949d094` / `35f4c06` promote the same CI artifact pattern with matching live SHA.

**Open tracker items:** #387/#391 GitHub `schedule` delivery still stale (~30d); push/dispatch scans + heartbeat `workflow_run` green (run `41898093286`). #405: `adapters-core-*` ~88.5 kB gzip after OCPP lazy split — further lazy-load optional. #401 release dispatch (explicit approval only).

**Runner queue (#411):** intermittent queue delays observed; deploy/CI eventually completed on `d95020c`. `deploy-recovery.yml` uses `gh run list --repo "$GITHUB_REPOSITORY"` (#413).
