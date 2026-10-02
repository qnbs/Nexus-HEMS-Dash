# Full-scale audit — final report (campaign slice)

**Date:** 2026-10-02  
**Repository:** `qnbs/Nexus-HEMS-Dash`  
**Campaign branches:** `cursor/audit-wave0-2-safety-988d` (PR #363)

## Acceptance matrix (partial — waves 0–2, 1, 3–4, 6–9)

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Evidence ledger before edits | Done | `docs/audit/evidence-ledger-2026-10-02.md` |
| Safety invariants documented | Done | `docs/safety-invariants.md` |
| HTTP idempotency composite scope | Done | `http-idempotency.middleware.test.ts` |
| Offline replay server envelope | Done | `commands.routes.test.ts`, `background-sync.test.ts` |
| OCPP Authorize fail-closed (live) | Done | `ocpp-authorize-policy.test.ts` |
| WS ticket scope fail-closed | Done | `auth.routes.ts` default `read` |
| EV command schema parity | Done | `evcc-adapter.test.ts`, shared-types `evcc.ts` |
| Settings sync registry | Done | `settings-sync-validation.test.ts`, `sync.routes.test.ts` |
| Settings patch atomic version | Done | `applySettingsBatch` in `sync-persistence.ts` |
| OCPP CSMS admission (live) | Done | `ocpp-csms-admission.test.ts` |
| Command risk map exhaustive | Done | `command-risk-map.test.ts` |
| Deploy after CI rollup (push) | Done | `deploy.yml` `wait-for-ci` job |
| Actions supply-chain bumps | Done | Workflow SHA pins (wave 1) |
| Offline sync cross-tab lock | Done | `sync-lock.ts`, `background-sync.ts` |
| Energy sign conventions (docs contract) | Done | `energy-sign-conventions.ts` |
| Build provenance (web + API health) | Done | `build-provenance.ts`, `build-info.ts`, CI `VITE_BUILD_*` |
| No live hardware exercised | Done | Mock-only tests; no `ALLOW_LIVE_HARDWARE` in CI |

## Open / deferred (manual or follow-up PRs)

| Item | Wave | Notes |
|------|------|-------|
| GitHub ruleset (0 approvals, bypass actors) | 6 | Maintainer org settings |
| Read-only single authority (browser direct adapters) | 2/9 | Documented; needs product decision |
| Redis authoritative multi-replica sync | 4 | TTL + RMW races partially mitigated |
| API coverage gate in CI | 6 | Threshold exists; not yet blocking rollup |
| SW lifecycle / message bridge hardening | 7 | Follow-up |
| DST/tariff domain proofs | 8 | Conventions only in this slice |
| Full docs truth-sync (`FEATURE_STATUS`) | 9 | Follow-up |
| Regulatory certification | — | Explicitly **not** claimed |

## Verification log (agent)

See `docs/audit/evidence-ledger-2026-10-02.md` § Verification commands and `/opt/cursor/artifacts/audit-wave2-unit-tests.log`.

## Certification disclaimer

This engineering audit does **not** constitute VDE/IEC/CE/GDPR certification. See `docs/Safety-Certification-Notice.md`.
