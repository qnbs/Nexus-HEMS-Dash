# Container image provenance (#392)

**Status:** promotion proven on `main` run [`41860671937`](https://github.com/qnbs/Nexus-HEMS-Dash/actions/runs/41860671937) @ `898162f`. Optional follow-up: align Grype log digest string with OCI manifest in job summary.

## Verified evidence (2026-11-04, `898162f`)

| Component | Scanned tag suffix | Published / cosign / SLSA digest |
| --- | --- | --- |
| Frontend | `…-hems-dash:898162f…` | `sha256:163d28a356e1903339c0292eb9ac8103257a86ec7e749cdaea249e2c11fa94bd` |
| Server | `…-hems-server:898162f…` | `sha256:ff16ce46d100eb8587c8a79d11ea17a407fa204bf31d59c7a685784364e09a0b` |

**Follow-up @ `3de2b5d`:** run [`41861932895`](https://github.com/qnbs/Nexus-HEMS-Dash/actions/runs/41861932895) — frontend `sha256:63c9409846d4a44aac4b839a600f7f43203466247c45a5d7408e35d52dc5cc18`, server `sha256:2bab5ccd1d8642c24726a21bf74d83b8772a9eed5ad081ab79c8203b27128353`.

No second `build-push-action` after Grype. Grype’s stereoscope “digest” log line may differ from the registry manifest hash (Syft artifact ID vs OCI manifest); push/cosign/SLSA all reference the **same** manifest digest above.

Copy for issues: `/opt/cursor/artifacts/container-provenance-evidence-392.md` (agent run artifact).

## Observed pipeline (`container-publish.yml`)

On each matrix leg (frontend/server):

1. **Build (load)** — `docker/build-push-action` with `load: true`, tag `${{ matrix.image }}:${{ github.sha }}`.
2. **Grype** — scans that loaded tag (`anchore/scan-action`).
3. **Push** — promote scanned local tag with `docker tag` + `docker push` (no rebuild).
4. **Cosign** — signs `${{ matrix.image }}@${{ steps.push.outputs.digest }}` (published manifest digest).

## Remediation (PR pending)

`container-publish.yml` promotes the **Grype-scanned** local tag (`${{ matrix.image }}:${{ github.sha }}`) to registry tags via `docker tag` + `docker push` — **no second `build-push-action` build**. Job summary records scanned image ID and published digest.

**Closure criteria for #392:** satisfied on run `41860671937` — see **Verified evidence** above.

## Gap (historical — pre-promotion fix)

Grype and cosign operate on **different build invocations**. GHA layer cache usually makes them identical, but the workflow does not record or assert that the scanned image ID equals `steps.push.outputs.digest`. A cache miss, rebuild, or divergent tags would mean **green Grype ≠ guaranteed scanned digest published**.

## Evidence to collect (maintainer / CI artifact)

For a given `main` run (example: Container Publish on `8895eb6`, run `41840746198`):

| Field | Where |
| --- | --- |
| Source commit | `github.sha` |
| Scanned tag | `${{ matrix.image }}:${{ github.sha }}` (load step) |
| Published digest | `steps.push.outputs.digest` in push step log |
| Cosign subject | `cosign sign …@${digest}` line |
| GHCR manifest | `crane digest ghcr.io/qnbs/nexus-hems-dash@sha-<commit>` |

Compare `docker inspect --format='{{.Id}}'` on the loaded image vs pushed digest (or use `buildx imagetools inspect`).

## Remediation options (future PR)

1. ~~**Single build + push by digest**~~ — **implemented** in `container-publish.yml` (scan-then-promote).
2. **Attestation linkage:** SLSA/provenance predicate includes scan SARIF digest and image digest in one job output (optional follow-up).

Do not close #392 until one promotion path is implemented **and** evidenced on `main`. **Done** @ `898162f` / run `41860671937`.

## Pages vs container

GitHub Pages deploy promotes the CI `build` artifact (`docs/runbooks/pages-ci-artifact-promotion-392.md`). GHCR uses scan-then-promote in `container-publish.yml`. `build-info.json` proves **source SHA** on Pages; GHCR uses OCI digest + cosign/SLSA.
