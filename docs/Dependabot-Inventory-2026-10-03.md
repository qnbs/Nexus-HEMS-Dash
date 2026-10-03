# Dependabot PR inventory — 2026-10-03

**Last checked:** 2026-10-03 (post `v1.12.1`)  
**Open PRs:** none (re-check after Dependabot `npm_and_yarn` workflow completes)  
**Open `dependabot/*` branches on remote:** none  
**Dependabot alerts API:** not available to cloud agent token (403); production risk tracked via `pnpm audit --prod` in CI Security Gate.

## PRs #358–#362 (Oct 2026 audit follow-up)

| PR | Title | Resolution | On `main` |
|----|--------|------------|-----------|
| [#358](https://github.com/qnbs/Nexus-HEMS-Dash/pull/358) | anchore/scan-action 7.4.0 → 7.4.2 | **Closed** (superseded) | `anchore/scan-action@…` v7.4.2 |
| [#359](https://github.com/qnbs/Nexus-HEMS-Dash/pull/359) | deploy-pages 5.0.0 → 5.0.1 | **Closed** (superseded) | `actions/deploy-pages@…` v5.0.1 |
| [#360](https://github.com/qnbs/Nexus-HEMS-Dash/pull/360) | attest-build-provenance 4.1.1 → 4.2.2 | **Closed** (superseded) | v4.2.2 |
| [#361](https://github.com/qnbs/Nexus-HEMS-Dash/pull/361) | renovatebot/github-action 46.1.14 → 46.2.5 | **Merged** | v46.2.5 |
| [#362](https://github.com/qnbs/Nexus-HEMS-Dash/pull/362) | harden-runner 2.21.0 → 2.21.1 | **Closed** (superseded) | v2.21.1 |

## Dependabot `npm_and_yarn` run (2026-10-03)

- Workflow run **failed** on `main` (no PR opened): many transitive `security_update_not_possible` (e.g. `tar`, `undici`, `semver`) and `vitest` peer-deps resolution error in Dependabot’s sandbox.
- **Action:** no agent PR to merge; keep prod surface clean via `pnpm.overrides` + CI `pnpm audit --prod` (#366–#367). Let **Renovate** (`renovate.yml`) propose resolvable npm bumps.

## Policy

- **Dependabot** owns `github_actions` bumps; **Renovate** owns npm/docker/cargo (see `DEVOPS.md`).
- When new Dependabot PRs appear: verify pin SHA comments in workflows, run CI, merge or close with rationale if Renovate/main already pins newer.
