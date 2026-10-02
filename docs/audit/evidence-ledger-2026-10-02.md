# Evidence ledger — full-scale audit baseline

**Date:** 2026-10-02 (UTC)  
**Repository:** `qnbs/Nexus-HEMS-Dash`  
**Baseline SHA:** `ef4f5d08fd58432bce9574a82bd4eb419a4b083c` (`docs: truth-sync post-Stream F closeout at c4e7939 (#357)`)

## Release / version provenance

| Signal | Value |
|--------|--------|
| `package.json` version | `1.11.1` |
| Latest GitHub Release tag | `v1.11.1` (2026-09-01) |
| `main` ahead of tag | Yes — Stream F + docs closeout landed after release |

## Open dependency PRs (snapshot)

- #358–#362 — GitHub Actions bumps (Dependabot)

## Seed findings (reproduced at baseline)

| ID | Severity | Topic | Status (this campaign) |
|----|----------|-------|-------------------------|
| AUD-HTTP-IDEM | P0 | HTTP idempotency keyed only by raw client key | **Fixed** — wave 2 composite scope + fingerprint |
| AUD-OFFLINE-REPLAY | P0 | Offline replay without server envelope | **Fixed** — required `envelope` + server TTL/skew checks |
| AUD-OCPP-AUTH | P0 | OCPP Authorize always Accepted | **Fixed** — fail-closed in live + allowlist |
| AUD-WS-TICKET-SCOPE | P1 | WS ticket scope default `readwrite` | **Fixed** — default `read` |
| AUD-EV-SCHEMA | P1 | `SET_EV_MODE` / `SET_EV_PHASES` schema drift | **Fixed** — shared-types + adapter false on unsupported |
| AUD-SETTINGS-CATCHALL | P1 | Settings sync catchall | Open — wave 4 |
| AUD-SYNC-RACES | P1 | Redis settings/diff RMW races | Open — wave 4 |
| AUD-READONLY-DUAL | P1 | Backend vs frontend read-only flags | Partial — documented in `safety-invariants.md`; convergence wave 2+ |
| AUD-DEPLOY-CI | P1 | Pages deploy vs exact CI SHA | Open — wave 6 |

## Wave execution log

| Wave | Branch | Scope |
|------|--------|--------|
| 0 | `cursor/audit-wave0-2-safety-988d` | This ledger + `docs/safety-invariants.md` |
| 2 | `cursor/audit-wave0-2-safety-988d` | Idempotency, offline replay, OCPP Authorize, EV schemas, WS ticket scope |

## Verification commands (recorded on implementation SHA)

```bash
pnpm type-check
pnpm --filter @nexus-hems/api exec vitest run src/tests/http-idempotency.middleware.test.ts
pnpm --filter @nexus-hems/api exec vitest run src/tests/commands.routes.test.ts
pnpm --filter @nexus-hems/api exec vitest run src/tests/ocpp-authorize-policy.test.ts
pnpm --filter @nexus-hems/api exec vitest run src/tests/offline-replay-policy.test.ts
pnpm --filter @nexus-hems/web exec vitest run src/tests/background-sync.test.ts
pnpm --filter @nexus-hems/web exec vitest run src/tests/evcc-adapter.test.ts
```

## Residual risk

- Redis idempotency claim uses `SET NX` when native ioredis is available; custom `IRedisClient` shims should expose atomic claim in a follow-up.
- OCPP backend listener remains SP0 plain WS — SP3 mTLS is via browser proxy path (documented HIGH-12).
- No hardware-in-the-loop validation performed in cloud audit (per master prompt §1).
