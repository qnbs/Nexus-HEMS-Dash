# Dependabot PR triage (#393)

**Date:** 2026-11-04 (post Wave A merges)  
**Canonical npm updates:** Renovate (`renovate.yml`) — prefer Renovate for application dependencies.

## Superseded by batch PR (close after merge)

| PR | Topic | Disposition |
| --- | --- | --- |
| #380 | `ossf/scorecard-action` v2.4.4 | Integrated in `cursor/ci-actions-dependabot-sync-79f6` |
| #381 | `docker/login-action` v4.6.0 | Same batch |
| #382 | `actions/checkout` v7.0.1 | Same batch |
| #383 | `docker/build-push-action` v7.4.0 | Same batch (major — CI must pass) |
| #384 | `actions/cache/save` v6.1.0 | Same batch |

## Separate triage

| PR | Disposition |
| --- | --- |
| #385 | npm group — **defer** to Renovate unless audit-critical; Dependabot npm PRs duplicate Renovate ownership per `DEVOPS.md`. Close with comment if versions already on `main` or superseded. |
| #373 | Draft ledger doc — **conflicts** with post-recovery `main`; close as superseded by #402 / merged runbooks unless maintainer revives content manually. |

## After batch merge

- Container promotion evidenced on `898162f` / `3de2b5d` — see `container-image-provenance-392.md`.
- Close superseded Dependabot PRs **#380–#384** on GitHub when still open (content on `main` via #407).
- **#385** merged via #409; close Dependabot PR if still open.
- **#373** — close as superseded by #402 runbooks unless revived manually.
