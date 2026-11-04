# GitHub Pages CI artifact promotion (#392)

**Goal:** Publish the same `apps/web/dist` tree that passed CI `Build` (size-limit + smoke + downstream E2E), instead of rebuilding in `deploy.yml`.

## Mechanism (`deploy.yml` `build` job)

1. Wait for `✅ CI Passed` on the push SHA (`wait-for-ci`).
2. Resolve the newest successful `ci.yml` run for `github.sha`.
3. `deploy.yml` downloads artifact, validates `build-info.json` + full `digest-manifest.json` via `.github/scripts/verify-promoted-pages-artifact.sh`, then uploads to Pages.

## Notes

- CI `Build` uses `VITE_E2E_TESTING=true` and `VITE_BACKEND_WS=true` (same bundle E2E and smoke exercised). Pages demo intentionally matches that artifact until a split production artifact is added.
- **`turbo.json`** must list `VITE_BUILD_SHA`, `VITE_BUILD_TIME`, `GIT_SHA`, `BUILD_TIME_ISO`, `GITHUB_SHA`, and `NEXUS_DEPLOYABLE_PAGES_BUILD` under `@nexus-hems/web#build` `env` so cached builds do not emit empty `build-info.json`.
- CI `Build` runs size/smoke after the SPA build; **`generate-web-dist-digest-manifest.mjs` runs last**, immediately before artifact upload, so turbo size cannot drop the manifest.
- Artifact retention: 7 days (`ci.yml`). Manual `deploy.yml` dispatch on an old SHA fails if the artifact expired.
- Container GHCR promotion remains separate; see `container-image-provenance-392.md`.

## Evidence to record after merge

| Field | Source |
| --- | --- |
| Commit | `github.sha` |
| CI run id | deploy job step summary |
| `build-info.json` sha256 | deploy promote step summary |
| Live manifest | `verify-pages` / `verify-pages-build-sha.sh` |
