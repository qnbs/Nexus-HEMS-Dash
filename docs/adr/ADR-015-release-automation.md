# ADR-015: Release automation, version sourcing & the release trigger chain

- **Status:** Accepted
- **Date:** 2026-06-30
- **Deciders:** Maintainer

## Context

Releases had stalled: the latest GitHub Release was `v1.1.0` while the code was at
`1.2.0`, and the accumulated post-1.2.0 work was never tagged. Investigation showed
the release pipeline is **semantic-release** (`pnpm release`, config in
`.releaserc.json`) running from `release.yml` on every push to `main`. It had been
**silently failing**:

1. **Branch-protection blocker.** `main` is governed by GitHub **rulesets**
   (`required_signatures`, strict status checks, etc.). semantic-release needs to push
   a `chore(release): … [skip ci]` commit + tag back to `main`. The default
   `GITHUB_TOKEN` cannot satisfy the rulesets, so the push is rejected.
2. **False-green.** The Semantic Release step is `continue-on-error: true`, so the
   `Release` workflow reported **success** while actually doing nothing — masking the
   failure for months.
3. **Broken desktop build.** Independently, `tauri-build.yml` (triggered on
   `release: published`) failed on **every** release because `tauri.conf.json` had an
   invalid `app.title` property (Tauri v2 only allows the title per-window), so no
   desktop binaries were ever attached.

## Decision

1. **semantic-release stays the intended automation**, but requires a **`GH_TOKEN`
   PAT secret** (classic PAT with `repo` scope, or a fine-grained token with
   Contents: read/write + the ruleset bypass) so it can push tags/commits past the
   `main` rulesets. `release.yml` already prefers `secrets.GH_TOKEN || secrets.GITHUB_TOKEN`.
   **Action item (maintainer):** create the `GH_TOKEN` secret, or add the
   `github-actions[bot]` to a ruleset bypass list. Until then, releases are cut
   **manually** (procedure below).
2. **Honest reporting.** `release.yml` writes an explicit release-status line to the
   job summary so a no-op run is no longer indistinguishable from a successful release.
3. **Fix the desktop build** by removing the invalid `app.title` from `tauri.conf.json`.
4. **Version sourcing.** The canonical version is the root `package.json`. The
   workspace packages (`apps/api`, `apps/web`, `packages/shared-types`) and
   `tauri.conf.json` are kept **in sync** with it on each release.

## The release trigger chain

```
merge to main ──► release.yml      (semantic-release: bump + CHANGELOG + tag + GitHub Release)
                          │
   GitHub Release published ──► tauri-build.yml      (signed desktop binaries → release assets)
   tag v* pushed          ──► container-publish.yml  (GHCR images + Grype gate + cosign sign)
push to main             ──► deploy.yml              (live demo to GitHub Pages + prune old deployments)
```

`container-publish.yml` and `deploy.yml` are healthy. `release.yml` (semantic-release)
and `tauri-build.yml` were the broken links addressed here.

## Manual release procedure (fallback until the PAT is configured)

1. `git switch -c chore/release-X.Y.Z origin/main`
2. Bump `version` in root + `apps/{api,web}` + `packages/shared-types` `package.json`
   and `apps/web/src-tauri/tauri.conf.json`.
3. `CHANGELOG.md`: move `[Unreleased]` → `[X.Y.Z] - <date>`, open a fresh `[Unreleased]`.
4. Open PR, get CI green, squash-merge.
5. `git tag -a vX.Y.Z <merge-sha> -m "…" && git push origin vX.Y.Z` (tags are not
   ruleset-blocked); `gh release create vX.Y.Z --notes-file <changelog-section> --verify-tag`.
6. The tag + release then drive `container-publish.yml` and `tauri-build.yml` automatically.

## Consequences

- Releases are reliable today via the manual procedure; v1.2.0 and v1.3.0 were
  reconciled this way. Desktop binaries build again once v1.3.1+ is released with the
  `tauri.conf.json` fix in place.
- Full automation returns the moment the `GH_TOKEN` PAT (or bot bypass) is configured —
  no code change required.
- A future enhancement is a dedicated **Capacitor mobile build-check** workflow
  (`capacitor.config.ts` exists but has no CI); tracked separately.
