# Container image provenance (#392)

**Status:** open — workflow succeeds; byte-identical scan-to-publish promotion is **not** proven yet.

## Observed pipeline (`container-publish.yml`)

On each matrix leg (frontend/server):

1. **Build (load)** — `docker/build-push-action` with `load: true`, tag `${{ matrix.image }}:${{ github.sha }}`.
2. **Grype** — scans that loaded tag (`anchore/scan-action`).
3. **Push** — second `docker/build-push-action` with `push: true` and metadata tags (`type=sha`, `latest`, …).
4. **Cosign** — signs `${{ matrix.image }}@${{ steps.push.outputs.digest }}` (published manifest digest).

## Remediation (PR pending)

`container-publish.yml` promotes the **Grype-scanned** local tag (`${{ matrix.image }}:${{ github.sha }}`) to registry tags via `docker tag` + `docker push` — **no second `build-push-action` build**. Job summary records scanned image ID and published digest.

**Closure criteria for #392:** one successful `main` publish run where Grype digest matches cosign `subject-digest` (and scanned image ID matches promoted manifest).

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

Do not close #392 until one promotion path is implemented **and** evidenced on `main`.

## Pages vs container

GitHub Pages deploy may rebuild the SPA independently (`deploy.yml`). `build-info.json` proves **source SHA** on Pages, not OCI digest parity with GHCR. Treat Pages and GHCR provenance separately.
