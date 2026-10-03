# Campaign Handoff — v1.12.0 release (Oct 2026)

> **Status:** Closed  
> **Tag:** `v1.12.0` @ `698cf42` (2026-10-03)  
> **`main` HEAD:** `b035318` (docs pointer after release)

## What shipped

- **Security audit waves 0–9** — PR #363 (`cursor/audit-wave0-2-safety-988d`): command authority, HTTP idempotency, offline replay envelopes, OCPP Authorize fail-closed, settings sync hardening, deploy `wait-for-ci`, build provenance, offline `navigator.locks`.
- **Post-v1.11.1 product work** — offline sync slices 2–4 + Stream C (#344–#354), Stream F protocol depth (#355–#356), demo i18n (#353), CI/review policy (#347–#351).
- **Release** — manual version sync PR #364; GitHub Release + tag `v1.12.0`; Tauri + container publish workflows green on release event.

## Evidence

- `docs/audit/evidence-ledger-2026-10-02.md` — wave log and finding status
- `docs/safety-invariants.md` — safety contract
- `CHANGELOG.md` — `[1.12.0]`

## Residual (not blocking patch line)

| Item | Owner |
|------|--------|
| Redis multi-replica atomic settings sync | Backend / ADR follow-up |
| Org GitHub ruleset (branch protection UI) | Maintainer |
| `READ_ONLY_MODE` single env convergence (API + Vite) | Wave 2+ audit backlog |
| Hardware-in-the-loop certification | Out of scope for cloud agents |

## Next maintainer actions

1. Rotate `GH_TOKEN` if using semantic-release dispatch (optional; Option B tag flow works without).
2. Dispatch **Tauri Desktop Build** manually only when desktop artifacts need rebuild outside a release.
3. Track new debt in `docs/Technical-Debt-Registry.md`; cut **v1.12.1+** via `release.yml` or Option B when `[Unreleased]` warrants.
