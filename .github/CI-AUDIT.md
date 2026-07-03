# CI Audit — Phase 2 Hardening (May 2026)

This document captures the **Phase-2 CI hardening** rolled out across the
GitHub Actions workflows on `main`. It complements the Phase-1 work
([`ci-pipelines_stabilisieren_af1cc5a3`](../.cursor/plans/ci-pipelines_stabilisieren_af1cc5a3.plan.md))
and the [`security-fixes_v1.3`](../.cursor/plans/security-fixes_v1.3_bcecf232.plan.md)
plan, both already merged.

## Goals

1. **DRY**: every workflow that needs Node + pnpm uses the shared
   composite action `./.github/actions/setup-node-pnpm`.
2. **Security single-gate**: one push/PR security gate
   (`security-full.yml`), one weekly deep-scan (`security-scan.yml`),
   one independent Scorecard schedule (`scorecard.yml`).
3. **2026 best-practices**: SLSA-Level-3 build-provenance attestations,
   `step-security/harden-runner` on high-trust workflows, no mutable
   action tags (`@v0`, `# latest`, `# stable`-without-version).
4. **Configuration consistency**: `size-limit` is the single bundle-size
   source of truth; Renovate config matches the actual dependency tree.

## Fixes applied

| #   | Fix                                                                                 | Why                                                                                                                                                                                                                  | Files                                                                                                                                                                                     |
| --- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Roll out `setup-node-pnpm` composite action to 10 workflows (28 use-sites)          | Eliminate ~52 redundant `pnpm/action-setup` + `setup-node` + `corepack enable` + `pnpm install` step quartets — one place to bump Node/pnpm versions                                                                 | `release.yml`, `lighthouse.yml`, `chromatic.yml`, `tauri-build.yml`, `fuzz.yml`, `perf-benchmark.yml`, `perf-optimized-ci.yml`, `security-scan.yml`, `security-full.yml`, `sbom-scan.yml` |
| 2   | Delete `security.yml`                                                               | Fully redundant with `security-full.yml` (same CodeQL, same audit) — was running 3× CodeQL on every push                                                                                                             | _deleted_ `.github/workflows/security.yml`                                                                                                                                                |
| 3   | `security-scan.yml` schedule-only                                                   | Push/PR coverage now lives in `security-full.yml`; this workflow becomes a Monday deep-scan (license + full audit incl. dev-deps)                                                                                    | `security-scan.yml`                                                                                                                                                                       |
| 4   | Renovate: drop removed packages                                                     | `prettier`, `prettier-plugin-tailwindcss`, `eslint-plugin-prettier`, `eslint-config-prettier`, `typescript-eslint`, `@typescript-eslint/*`, `eslint-plugin-react` are no longer in this repo (Biome-first toolchain) | `.renovaterc.json`                                                                                                                                                                        |
| 5   | Renovate: `matchPackagePatterns` → `matchPackageNames` globs                        | `matchPackagePatterns` is deprecated as of Renovate 38+                                                                                                                                                              | `.renovaterc.json`                                                                                                                                                                        |
| 6   | Renovate: add Biome / Storybook / React-Compiler / Sentry / TanStack / Radix groups | Single PR per ecosystem instead of per-package noise                                                                                                                                                                 | `.renovaterc.json`                                                                                                                                                                        |
| 7   | Drop inline `MAX_KB=600` bundle-size check                                          | Inconsistent with `size-limit` (uncompressed vs gzipped, 600 KB vs 70 KB Entry budget). `size-limit` is now the only enforcer                                                                                        | `ci.yml`, `perf-optimized-ci.yml`                                                                                                                                                         |
| 8   | SLSA Level-3 build-provenance attestation                                           | Cryptographic attestation of every JS asset shipped from `main`; verify with `gh attestation verify`                                                                                                                 | `ci.yml` (build job)                                                                                                                                                                      |
| 9   | `step-security/harden-runner` on high-trust workflows                               | Audit egress traffic; can later be tightened to `block` mode after reviewing the audit log                                                                                                                           | `release.yml`, `deploy.yml`, `tauri-build.yml`, `security-full.yml`                                                                                                                       |
| 10  | Concurrency groups for missing workflows                                            | Prevents stacked runs on rapid pushes / re-runs                                                                                                                                                                      | `fuzz.yml`, `security-full.yml`, `tauri-build.yml`, `release.yml`                                                                                                                         |
| 11  | Replace mutable action tags with version SHAs + accurate comments                   | `chromaui/action # latest`, `anchore/sbom-action@v0`, `tauri-apps/tauri-action@fce9c61… # v0`                                                                                                                        | `chromatic.yml`, `sbom-scan.yml`, `tauri-build.yml`, `release.yml`                                                                                                                        |
| 12  | Fix dangling `tauri-action` SHA                                                     | The previous pin `fce9c6108b31ea247710505d3aaaa893ee6768d4` was deleted upstream (404). Pinned to `84b9d35b…` # action-v0.6.2                                                                                        | `tauri-build.yml`, `release.yml`                                                                                                                                                          |
| 13  | Lighthouse `resource-summary:script:size` aligned with size-limit                   | Old budget (512 KB warn) was 2× stricter than `size-limit` `Total JS: 1120 kB` and would falsely fail PRs                                                                                                            | `apps/web/lighthouserc.json`                                                                                                                                                              |
| 14  | Sentry source-maps: read version from `apps/web/package.json`                       | Root and web app share `1.2.0` today, but the explicit web-version step prevents drift                                                                                                                               | `ci.yml` (build job)                                                                                                                                                                      |

## Stabilization update — 2026-05-11

| #   | Fix                                                             | Why                                                                                                                      | Files                                                                                                           |
| --- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| 15  | Repaired broken `pnpm-lock.yaml` duplicate package key          | `pnpm install --frozen-lockfile` failed before any CI gate could run                                                     | `pnpm-lock.yaml`                                                                                                |
| 16  | Raised Node engine floor and added `.nvmrc`                     | Local `engine-strict=true` must reflect the actual dependency floor; CI remains Node 24                                  | `package.json`, `.nvmrc`                                                                                        |
| 17  | Removed vulnerable `@log4brains/cli` dev tool                   | Full dev audit had critical/high CVEs, including unpatched transitive `parse-git-config`                                 | `package.json`, `pnpm-lock.yaml`                                                                                |
| 18  | Tightened `basic-ftp` override                                  | Removes LHCI transitive high-severity advisory from full audit                                                           | `package.json`, `pnpm-lock.yaml`                                                                                |
| 19  | Stabilized Vitest workers and crypto/JWT timeouts               | Local and CI runs no longer fail on fork-worker startup or WebCrypto/PBKDF2 5s timeouts                                  | `apps/web/vitest.config.ts`, `apps/api/vitest.config.ts`, `apps/api/src/tests/jwt-dual-key.test.ts`             |
| 20  | Stabilized Playwright under load                                | E2E waits for `#main-content`, uses 30s expect timeout, fixed `NO_COLOR`/`FORCE_COLOR` warning                           | `apps/web/playwright.config.ts`, `apps/web/tests/e2e/command-hub-energy-flow.spec.ts`                           |
| 21  | Restored missing PWA assets and removed missing font references | Lighthouse/PWA checks no longer depend on non-existent PNG/font files                                                    | `apps/web/public/*`, `apps/web/index.html`, `apps/web/vite.config.ts`                                           |
| 22  | Hardened security gates                                         | Gitleaks, Semgrep, production audit, SBOM image builds, and SBOM generation now fail on real errors                      | `.github/workflows/security-full.yml`, `.github/workflows/sbom-scan.yml`, `.github/workflows/security-scan.yml` |
| 23  | Fixed Tauri release version resolution                          | Removes non-production `v__VERSION__` placeholder and requires manual version input                                      | `.github/workflows/tauri-build.yml`                                                                             |
| 24  | Added portable local secret scan wrapper                        | Local agents no longer need a globally installed `gitleaks`; native/Docker are preferred, limited fallback is documented | `scripts/run-gitleaks.mjs`, `package.json`                                                                      |

### Local verification snapshot

All commands below passed on this checkout. Because the local machine runs Node `22.22.0` while the repository now requires `>=22.22.1`, local verification used `--config.engine-strict=false`; CI runs Node 24 and does not need that override.

| Gate                                                            | Result                                                        |
| --------------------------------------------------------------- | ------------------------------------------------------------- |
| `pnpm install --frozen-lockfile --config.engine-strict=false`   | Passed                                                        |
| `pnpm --config.engine-strict=false lint`                        | Passed, zero Biome/ESLint findings                            |
| `pnpm --config.engine-strict=false type-check`                  | Passed                                                        |
| `pnpm --config.engine-strict=false test:run`                    | Passed: API 70 tests, Web 627 tests                           |
| `pnpm --config.engine-strict=false test:coverage`               | Passed: Web V8 coverage above thresholds                      |
| `VITE_E2E_TESTING=true pnpm --config.engine-strict=false build` | Passed                                                        |
| `pnpm --config.engine-strict=false size`                        | Passed: Total JS 1.04 MB gzip, CSS 20.27 kB gzip              |
| `pnpm --config.engine-strict=false audit --audit-level=high`    | Passed                                                        |
| `pnpm --config.engine-strict=false security:trojan`             | Passed                                                        |
| `pnpm --config.engine-strict=false security:secrets`            | Passed via limited fallback; native Gitleaks/Docker preferred |
| `pnpm test:e2e` with `VITE_E2E_TESTING=true`                    | Passed: 54 Chromium tests                                     |

### External prerequisites

- Snyk local scan requires authentication. `pnpm dlx snyk test --severity-threshold=high --all-projects` downloaded the CLI successfully but returned `SNYK-0005 / 401 Unauthorized`.
- Native Gitleaks or a running Docker daemon gives full local Gitleaks coverage. The committed wrapper falls back to a limited first-party regex scan only when both are unavailable.
- `graphify update .` could not run because the `graphify` CLI is not installed in this environment.
- API coverage thresholds remain configured but are not yet part of the root CI coverage gate. API tests are a hard gate; API coverage ratcheting remains tracked in `docs/Testing-Coverage-Strategy.md`.

## CI Health Dashboard

### Required PR / push-to-main checks

| Workflow / App        | Trigger                              | Job(s) used as required                                                       | Notes                                                                                                                                               |
| --------------------- | ------------------------------------ | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`              | push: `main`, `develop`; PR: `main`  | `lint-typecheck`, `unit-tests`, `build`, `e2e-tests`, `security`, `fuzz-tests`, `ci-passed` | `ci-passed` is the single rollup gate. API unit tests and Web coverage both run in `unit-tests`; `fuzz-tests` runs `pnpm test:fuzz`; build emits SLSA attestation on `push: main` only. |
| `security-full.yml`   | push/PR `main`, weekly Mon 05:00 UTC | `security-gate`                                                               | Aggregates CodeQL, Gitleaks, Semgrep, Anti-Trojan-Source, Dependency Audit, Branch Protection. Gitleaks/Semgrep/audit are hard gates.               |
| `sbom-scan.yml`       | push: `main`, PR, manual             | dependency-audit, sbom-frontend, sbom-backend, sbom-source                  | Syft SBOM + Grype (critical, blocking, `.grype.yaml`) on frontend/backend images and source; `scripts/verify-grype-policy.sh` guardrail.              |
| `container-publish.yml` | push: `main`, tags `v*`, manual    | `publish` (matrix: frontend + server)                                       | Build → Grype gate → push GHCR → cosign keyless sign + SLSA provenance. Not a PR gate; runs on main/tags only.                                      |
| `lighthouse.yml`      | PR, manual                           | `lighthouse`                                                                  | Builds with `VITE_E2E_TESTING=true`, waits up to 30s for preview readiness, enforces LHCI budgets.                                                  |
| DeepSource GitHub App | PR                                   | `DeepSource: JavaScript`, `DeepSource: Secrets`                               | Advisory initially; will become required after the 2–4 week tuning period and remediation of existing HIGH-severity dependency advisories.          |
| CodeAnt.ai GitHub App | PR                                   | `CodeAnt AI`                                                                  | Advisory only. Provides high-level AI review comments.                                                                                              |

### Weekly / schedule-only

| Workflow             | Schedule           | Purpose                                              |
| -------------------- | ------------------ | ---------------------------------------------------- |
| `security-scan.yml`  | Mon 06:00 UTC      | License compliance, full pnpm audit (incl. dev-deps) |
| `scorecard.yml`      | (existing)         | OpenSSF Scorecard publish                            |
| `lighthouse.yml`     | (on PR + manual)   | Lighthouse CI (perf budgets)                         |
| `chromatic.yml`      | (on PR + manual)   | Visual regression                                    |
| `sbom-scan.yml`      | (on push + manual) | SBOM (Syft) for frontend, backend, source            |
| `perf-benchmark.yml` | (on PR + manual)   | Bundle / depcheck / Biome timing                     |

### Manual / release-only

| Workflow                | Trigger                       | Purpose                               |
| ----------------------- | ----------------------------- | ------------------------------------- |
| `deploy.yml`            | `push: main`, `workflow_dispatch` (`approveDeploy=DEPLOY`) | GitHub Pages live demo |
| `release.yml`           | `workflow_dispatch` (`approveRelease=RELEASE`) | Manual semantic-release only |
| `container-publish.yml` | push `main`, tags `v*`, manual | GHCR image publish + Grype + cosign |
| `tauri-build.yml`       | `workflow_dispatch`, `release: published` | Cross-platform desktop builds |
| `fuzz.yml`              | manual / scheduled            | Security fuzz tests                   |
| `perf-optimized-ci.yml` | `workflow_dispatch` only      | Optimized CI variant (cache-first)    |

## Pinned action versions

All third-party actions are SHA-pinned with a comment denoting the
version. Recurring actions:

| Action                            | Pin                                        | Version                      |
| --------------------------------- | ------------------------------------------ | ---------------------------- |
| `actions/checkout`                | `de0fac2e4500dabe0009e67214ff5f5447ce83dd` | v6.0.2                       |
| `actions/setup-node`              | `49933ea5288caeca8642d1e84afbd3f7d6820020` | v4                           |
| `pnpm/action-setup`               | `fc06bc1257f339d1d5d8b3a19a8cae5388b55320` | v4.4.0                       |
| `actions/cache*`                  | `0057852bfaa89a56745cba8c7296529d2fc39830` | v4                           |
| `actions/upload-artifact`         | `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` | v7.0.1                       |
| `actions/download-artifact`       | `d3f86a106a0bac45b974a628896c90dbdf5c8093` | v4                           |
| `actions/attest-build-provenance` | `a2bbfa25375fe432b6a289bc6b6cd05ecd0c4c32` | v4.1.0                       |
| `step-security/harden-runner`     | `fe104658747b27e96e4f7e80cd0a94068e53901d` | v2.16.1                      |
| `anchore/sbom-action`             | `e22c389904149dbc22b58101806040fa8d37a610` | v0.24.0                      |
| `tauri-apps/tauri-action`         | `84b9d35b5fc46c1e45415bdb6144030364f7ebc5` | action-v0.6.2                |
| `chromaui/action`                 | `0794e6939fe40ce46a88963f818092afc427da5b` | v15.3.0                      |
| `github/codeql-action/*`          | `68bde559dea0fdcac2102bfdf6230c5f70eb485e` | v4.35.4                      |
| `dtolnay/rust-toolchain`          | `631a55b12751854ce901bb631d5902ceb48146f7` | (rolling stable, 2026-02-13) |

## Known limitations

1. **`harden-runner` egress is `audit`-only.** After ~2 weeks of audit
   logs we should review `actions/runner-images` egress allowlist, then
   flip to `block` mode for `release.yml`, `deploy.yml`,
   `tauri-build.yml`. Do **not** skip the audit window — false-blocks
   are very disruptive in CI.
2. **`dtolnay/rust-toolchain` rolling stable**. Upstream uses a
   force-pushed `stable` branch; the SHA pin captures whichever stable
   was current on `2026-02-13`. Re-pin manually after the next major
   Rust release if you want a newer stable.
3. **Branch-protection `Required Checks`**. After this Phase-2 push,
   you may have stale required-check entries in
   `Settings → Branches → main` referencing the deleted `security.yml`.
   Update to: `CI Passed`, `Security Gate`, `DeepSource: JavaScript`,
   `DeepSource: Secrets`, `Lighthouse CI`, `chromatic`, `Security Fuzz`.
   DeepSource checks are advisory until the tuning period ends; add them
   to required checks only after existing HIGH-severity dependency
   advisories are remediated.
4. **DeepSource and CodeAnt.ai are newly integrated.** DeepSource is
   running in advisory mode while false positives are tuned. CodeAnt.ai
   remains advisory permanently. See `docs/runbooks/deepsource-integration.md`
   and `docs/runbooks/codeant-ai-integration.md`.

## Next steps (out of scope for Phase 2)

- Reusable workflows (`workflow_call`) once a second repo consumes the
  same setup pattern.
- Additional SAST engines (CodeQL coverage is sufficient today).
- Coverage threshold ratchet — tracked in
  `docs/Testing-Coverage-Strategy.md`.
- `harden-runner` egress allowlist promotion (`audit` → `block`).
- Cloudflare Pages / Vercel deploy paths (not required; GH Pages is
  stable).

## How to verify the SLSA build-provenance attestation

```bash
# Download the latest CI artifact for a specific commit
gh run download <run-id> -n build

# Verify the attestation
gh attestation verify ./assets/index-*.js \
  --repo qnbs/Nexus-HEMS-Dash
```

A passing verification confirms the bundle was produced by the
`build` job in `ci.yml` from a tagged main-branch commit, signed by
GitHub's Sigstore-backed key.
