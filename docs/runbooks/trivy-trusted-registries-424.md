# Trivy trusted registry alerts (#424)

Code scanning alerts **#180** (frontend deployment) and **#181** (server deployment): *Restrict container images to trusted registries* (KSV034 / KSV-0125).

## Enforcement model

| Layer | Mechanism |
| --- | --- |
| **Render-time (authoritative)** | `nexus-hems.assertTrustedImageRepository` in `helm/nexus-hems/templates/_helpers.tpl` — normalizes prefixes with trailing `/`, requires repository to extend past prefix, `fail()` on violation. Used by `nexus-hems.imageRef` in both deployments. |
| **Values schema** | `values.schema.json` — `trustedRegistries` entries must match `host/path/` pattern; `minItems: 1`. |
| **Defaults** | `values.yaml` — `trustedRegistries: [ghcr.io/qnbs/]`, GHCR repos under `ghcr.io/qnbs/`. |
| **CI proof** | `scripts/verify-helm-trusted-registries.mjs` in **Helm Chart Lint** (`ci.yml`) — positive default render, negative untrusted/spoof/empty-list cases. |
| **Trivy static (Helm templates)** | `.trivyignore` KSV034/KSV-0125 — Trivy config scan reads unrendered `{{ include "nexus-hems.imageRef" … }}` text; cannot execute Helm. **Not** a substitute for render-time control. |
| **Trivy SARIF** | `trivy-code-scanning.yml` uploads Helm chart config SARIF for Tool status (#421); separate from Grype image gates. |

## Alert disposition (maintainer)

| alert_id | location | disposition |
| --- | --- | --- |
| **180** | `deployment-frontend.yaml` | **Exception** — static Trivy false positive; render-time allowlist + CI negative tests. Close only after fresh Trivy SARIF / Security tab evidence. |
| **181** | `deployment-server.yaml` | Same as #180. |

## Immutable production images

Set `image.frontend.digest` / `image.server.digest` (and publish digests via container workflow #392) to avoid mutable `:tag`-only references in cluster.

## Related

- [#424](https://github.com/qnbs/Nexus-HEMS-Dash/issues/424)
- [#421](https://github.com/qnbs/Nexus-HEMS-Dash/issues/421) tool health
- [#402](https://github.com/qnbs/Nexus-HEMS-Dash/issues/402) audit tracker
