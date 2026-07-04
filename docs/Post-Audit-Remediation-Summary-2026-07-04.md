# Post-Audit Remediation Summary — 2026-07-04

**Repository:** Nexus-HEMS-Dash v1.9.0 (`main` @ post-PR #260)  
**Auditor:** Cursor Cloud Agent (Composer 2.5)  
**Scope:** Full monorepo — `apps/api`, `apps/web`, `packages/shared-types`, docs, CI, Docker/Helm  
**Method:** Evidence-based code review + `pnpm verify:basis` + security scans + sub-agent deep dives

---

## Executive summary

The project is in **strong shape** for a safety-conscious HEMS dashboard: mock-by-default hardware access, layered JWT/scope/rate-limit controls, comprehensive CI (lint, type-check, unit, E2E, Lighthouse, SBOM, CodeQL), and recent large-scale UI/settings/help remediation (PR #260).

**Pre-work baseline (2026-07-04):**

| Gate | Result |
|------|--------|
| `pnpm verify:basis` (type-check + lint + test:run) | ✅ 1155 web tests + api tests pass |
| `pnpm security:trojan` | ✅ 571 files, 0 issues |
| `pnpm audit --audit-level=high` | ✅ No known high vulnerabilities |
| DeepSource (post #260) | ✅ JavaScript green on `main` |

**Remaining work** clusters into backend contrib parity, E2E depth, documentation sync, and hardening edge deployment paths (CSP/nginx/Helm).

---

## Critical findings & remediation status

### C1 — Backend protocol adapter parity (contrib MQTT ecosystem)

| Adapter | Frontend | Backend `IProtocolAdapter` | Status |
|---------|----------|------------------------------|--------|
| Home Assistant MQTT | ✅ contrib | ❌ missing | ⏳ **Planned** — largest parity gap |
| Zigbee2MQTT | ✅ contrib | ❌ missing | ⏳ |
| Matter/Thread | ✅ contrib | ❌ missing | ⏳ |
| OpenEMS | ✅ | ⚠️ telemetry-only (6 channels, no writes) | Partial |
| OCPP CSMS gateway | ✅ | ⚠️ SP0 inbound only; no outbound smart charging | Partial |
| OCPP SP3 mTLS proxy | ✅ browser | ✅ `/api/ocpp/proxy-session` + `/ws/ocpp` | Shipped; CRL/OCSP stored but not enforced in relay |

**Evidence:** `apps/api/src/protocols/index.ts` registers 8 adapters; no `homeassistant` under `apps/api/src/protocols/`.

**Plan:** Phase 1 — `HomeAssistantProtocolAdapter` (WS API + MQTT discovery). Phase 2 — Zigbee2MQTT generic MQTT bridge. Phase 3 — deepen OpenEMS/OCPP CSMS command paths.

---

### C2 — E2E test coverage gaps

**Current:** 8 Playwright specs (`accessibility`, `command-hub-energy-flow`, `eebus-pairing`, `header-fixed`, `ocpp-charging-sankey`, `pwa-offline`, `settings-navigation`, `user-flow`).

**Missing (per FEATURE_STATUS + audit):** auth flows, command-safety rejection paths, adapter live/mock switching, WebSocket handling, read-only enforcement.

**Remediation started:** `apps/web/tests/e2e/safety-indicators.spec.ts` — mocks `/api/health` for live/mock/read-only banners.

**Plan:** Add `command-safety.spec.ts`, `auth-scopes.spec.ts`, `adapter-mode.spec.ts` in next sprint.

---

### C3 — Documentation sync

| Doc | Drift risk | Action |
|-----|-----------|--------|
| `FEATURE_STATUS.md` | Last updated 2026-07-03; PR #260 landed 2026-07-04 | Update dates + settings/help remediation notes |
| `Technical-Debt-Registry.md` | Helmet fallback description stale | Fix DOC-03 row (fail-closed, not unsafe-inline fallback) |
| `README.md` protocol matrix | Mostly accurate | Cross-check contrib backend ⏳ rows quarterly |
| `CHANGELOG.md` | Manual release | Next release entry when tagging |

**Rule enforced:** PRs changing feature status must update `FEATURE_STATUS.md` (already documented in file header).

---

### C4 — CSP / Helmet / nonce across targets

| Target | Status | Notes |
|--------|--------|-------|
| Vite production build | ✅ | Per-build nonce via `cspNoncePlugin` |
| Express Helmet | ✅ | Fail-closed without nonce (`csp-nonce.ts`) |
| Docker `Dockerfile` (frontend) | ✅ | `docker-entrypoint.sh` extracts nonce + validates `WS_ORIGINS` |
| Tauri | ✅ | `sync-tauri-csp.ts` + `tauri-csp.test.ts` |
| `docker-compose.prod.yml` | ✅ **Fixed this audit** | Now builds hardened `Dockerfile` instead of raw `nginx.conf` mount |
| nginx API proxy | ✅ **Added** | `/api/`, `/ws`, `/metrics` → `api:3000` for full-stack compose |
| Helm frontend | ⚠️ | No `WS_ORIGINS` in chart values — uses image default |
| Capacitor | ⚠️ | Meta CSP only; no platform-specific sync |

---

### C5 — Command path safety (scope, rate limit, audit, read-only)

**Strong paths:**

- Frontend: `command-safety.ts` → `BaseAdapter.sendCommand` (Zod, 30/min, IndexedDB audit)
- Backend WS: `energy.ws.ts` — rate → schema → scope → read-only → NDJSON audit
- Exec: `ExecService` respects `READ_ONLY_MODE`

**Gaps closed this audit:**

1. ✅ `POST /api/modbus/write` now rejects when `READ_ONLY_MODE=true`
2. ✅ `/api/health` exposes `readOnly: boolean`
3. ✅ Frontend polls `readOnly` at runtime (no longer build-time only)

**Remaining gaps:**

- OCPP/EEBUS proxy relays lack `isReadOnlyMode()` guard
- `WSCommandSchema` weaker than frontend `commandSchemas` (caps, enums)
- Split audit trails (IndexedDB vs NDJSON) — no unified view
- Dev mode disables JWT scope on REST (`auth.ts`)

---

## High-priority backlog (not started this pass)

| ID | Item | Files / notes |
|----|------|---------------|
| H1 | Raise branch coverage on adapters/controllers | `BaseAdapter`, `energy-controllers.ts`, `EventBus` |
| H2 | AdapterRegistry plugin hardening | activation timeout, error surfaces |
| H3 | Sankey performance profiling | `SankeyDiagram.tsx`, worker path |
| H4 | Tauri/Capacitor CI verification | `tauri-build.yml`, Capacitor smoke |
| H5 | Per-adapter Prometheus completeness | `adapter-metrics.ts` — verify all 8 backend adapters |
| H6 | Property-based tests for protocol parsers | extend `security-fuzz.test.ts` |

---

## Medium / low backlog (summary)

- WCAG 2.2 AA manual screen-reader pass (documented, not executed)
- Storybook coverage for Sankey, Floorplan, AdapterConfig
- i18n parity automation (existing `i18n-sync.test.ts` — extend key coverage)
- BYOK vault rotation docs
- ADRs for PR #260 refactor wave (optional)
- Renovate policy — respect `pnpm.overrides`

---

## Changes shipped in this remediation branch

| Change | Rationale |
|--------|-----------|
| `/api/health` → `readOnly` field | Runtime read-only sync (DOC-03) |
| `fetchBackendHealthStatus()` + store `backendReadOnly` | Single health poll for mode + read-only |
| Modbus write `READ_ONLY_MODE` guard | Close API bypass |
| `docker-compose.prod.yml` hardened nginx image | Fix broken `${CSP_NONCE}` literal headers |
| nginx `/api` + `/ws` proxy | Full-stack compose parity |
| E2E `safety-indicators.spec.ts` | Health-driven banner regression guard |

---

## Verification commands

```bash
pnpm verify:basis
pnpm security:trojan
pnpm audit --audit-level=high
pnpm --filter @nexus-hems/api exec vitest run src/tests/health.routes.test.ts src/tests/modbus.routes.test.ts
pnpm --filter @nexus-hems/web exec vitest run src/tests/adapter-mode.test.ts
pnpm --filter @nexus-hems/web exec playwright test tests/e2e/safety-indicators.spec.ts
```

---

## Success criteria tracker

| Criterion | Status |
|-----------|--------|
| Critical items completed or documented with plan | ✅ This document + partial fixes |
| Documentation in sync with code | 🔄 Ongoing — FEATURE_STATUS update pending |
| Test coverage improved on critical paths | 🔄 Started (read-only + E2E safety) |
| Security scans green | ✅ |
| Production-ready with hardware safeguards | ✅ Mock default; read-only hardened |
| Maintainable, documented codebase | ✅ Strong; debt registry maintained |

---

## Related documents

- `FEATURE_STATUS.md` — shipped vs partial matrix
- `docs/Technical-Debt-Registry.md` — canonical debt tracker
- `docs/Audit-Report-2026-07-04-CloudAgent-Verification.md` — prior verification
- `docs/Safety-Certification-Notice.md` — live hardware checklist
- `docs/runbooks/deepsource-integration.md` — static analysis rollout

---

*Next review recommended after Home Assistant backend adapter MVP or v1.10.0 release planning.*
