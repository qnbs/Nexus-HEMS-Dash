# Dependabot PR inventory — 2026-10-03

**Open PRs:** none  
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

## Policy

- **Dependabot** owns `github_actions` bumps; **Renovate** owns npm/docker/cargo (see `DEVOPS.md`).
- When new Dependabot PRs appear: verify pin SHA comments in workflows, run CI, merge or close with rationale if Renovate/main already pins newer.
