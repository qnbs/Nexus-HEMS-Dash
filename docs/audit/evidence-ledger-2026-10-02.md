# Evidence ledger — full-scale audit baseline

**Date:** 2026-10-02 (UTC)  
**Repository:** `qnbs/Nexus-HEMS-Dash`  
**Baseline SHA:** `ef4f5d08fd58432bce9574a82bd4eb419a4b083c` (`docs: truth-sync post-Stream F closeout at c4e7939 (#357)`)  
**Closeout SHA:** `356266c` merged via PR **#363**; released as **`v1.12.0`** @ `698cf42` (2026-10-03, PR #364)

## Release / version provenance

| Signal | Value |
|--------|--------|
| `package.json` version | `1.12.0` (tagged) |
| Latest GitHub Release tag | `v1.12.0` (2026-10-03) |
| `main` ahead of tag | Docs-only (`b035318` Release-History pointer) — align on next release |

## Open dependency PRs (snapshot)

- #358–#362 — **Closed/merged** (2026-10-03 housekeeping)

## Seed findings (reproduced at baseline)

| ID | Severity | Topic | Status (this campaign) |
|----|----------|-------|-------------------------|
| AUD-HTTP-IDEM | P0 | HTTP idempotency keyed only by raw client key | **Fixed** — wave 2 composite scope + fingerprint |
| AUD-OFFLINE-REPLAY | P0 | Offline replay without server envelope | **Fixed** — required `envelope` + server TTL/skew checks |
| AUD-OCPP-AUTH | P0 | OCPP Authorize always Accepted | **Fixed** — fail-closed in live + allowlist |
| AUD-WS-TICKET-SCOPE | P1 | WS ticket scope default `readwrite` | **Fixed** — default `read` |
| AUD-EV-SCHEMA | P1 | `SET_EV_MODE` / `SET_EV_PHASES` schema drift | **Fixed** — shared-types + adapter false on unsupported |
| AUD-SETTINGS-CATCHALL | P1 | Settings sync catchall | **Fixed** — registry + blocked credential keys |
| AUD-SYNC-RACES | P1 | Redis settings/diff RMW races | **Partial** — atomic batch per PATCH; Redis RMW across replicas still open |
| AUD-OCPP-ADMISSION | P1 | CSMS station allowlist / frame size | **Fixed** — live allowlist + 64KiB cap |
| AUD-DEPLOY-CI | P1 | Pages deploy vs CI SHA | **Fixed** — `wait-for-ci` on push |
| AUD-COMMAND-RISK | P1 | Risk map exhaustiveness | **Fixed** — `COMMAND_RISK_MAP` + test |
| AUD-READONLY-DUAL | P1 | Backend vs frontend read-only flags | Partial — documented in `safety-invariants.md`; convergence wave 2+ |
| AUD-DEPLOY-CI | P1 | Pages deploy vs exact CI SHA | **Fixed** — `wait-for-ci` (wave 6) |
| AUD-PWA-SYNC-LOCK | P2 | Multi-tab offline replay races | **Fixed** — `navigator.locks` (wave 7) |
| AUD-BUILD-PROVENANCE | P2 | Deployed build ↔ git SHA traceability | **Fixed** — wave 9 |

## Wave execution log

| Wave | Branch | Scope |
|------|--------|--------|
| 0 | `cursor/audit-wave0-2-safety-988d` | This ledger + `docs/safety-invariants.md` |
| 2 | `cursor/audit-wave0-2-safety-988d` | Idempotency, offline replay, OCPP Authorize, EV schemas, WS ticket scope |
| 7 | `cursor/audit-wave0-2-safety-988d` | Offline sync `navigator.locks` exclusive lock |
| 8 | `cursor/audit-wave0-2-safety-988d` | `ENERGY_SIGN_CONVENTIONS` shared contract |
| 9 | `cursor/audit-wave0-2-safety-988d` | Build SHA/time in CI, Help About, `/api/health` |

## Verification commands (recorded on implementation SHA)

```bash
pnpm type-check
pnpm --filter @nexus-hems/api exec vitest run src/tests/http-idempotency.middleware.test.ts
pnpm --filter @nexus-hems/api exec vitest run src/tests/commands.routes.test.ts
pnpm --filter @nexus-hems/api exec vitest run src/tests/ocpp-authorize-policy.test.ts
pnpm --filter @nexus-hems/api exec vitest run src/tests/offline-replay-policy.test.ts
pnpm --filter @nexus-hems/web exec vitest run src/tests/background-sync.test.ts
pnpm --filter @nexus-hems/web exec vitest run src/tests/evcc-adapter.test.ts
pnpm --filter @nexus-hems/web exec vitest run src/tests/sync-lock.test.ts
pnpm --filter @nexus-hems/web exec vitest run src/tests/build-provenance.test.ts
pnpm --filter @nexus-hems/web exec vitest run src/tests/energy-sign-conventions.test.ts
pnpm --filter @nexus-hems/api exec vitest run src/tests/build-info.test.ts
pnpm --filter @nexus-hems/api exec vitest run src/tests/health.routes.test.ts
```

## Residual risk

- Redis idempotency claim uses `SET NX` when native ioredis is available; custom `IRedisClient` shims should expose atomic claim in a follow-up.
- OCPP backend listener remains SP0 plain WS — SP3 mTLS is via browser proxy path (documented HIGH-12).
- No hardware-in-the-loop validation performed in cloud audit (per master prompt §1).
