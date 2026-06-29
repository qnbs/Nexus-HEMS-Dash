# Technical Debt Registry — Nexus-HEMS-Dash

**Last audited:** 2026-06-29
**Version at audit:** 1.2.0 (main @ b91a5f7)
**Last updated:** 2026-06-29
**Updated version:** 1.3.0 in flight
**Auditor:** Cursor Cloud Agent (full-scale deep audit — see `docs/Audit-Report-2026-06-29.md`; docs truth-sync pass #129)

This file is the canonical issue tracker for known technical debt, security gaps, incomplete implementations, and quality issues. It is **not** a substitute for GitHub Issues — use it for context, rationale, and multi-sprint planning.

## Truth-Sync Note (2026-04-26)

The registry is aligned to the verified repository state. Items marked `✅` are implemented in the
codebase already. Items marked `⏳` remain genuine follow-up work. Where documentation previously
mixed roadmap intent with shipped status, this file now treats `1.1.0` as the shipped baseline and
`v1.2.0` as in-flight scope only.

---

## Legend

| Tag    | Meaning                                                |
| ------ | ------------------------------------------------------ |
| `CRIT` | Blocks shipping or causes data loss / security breach  |
| `HIGH` | Significant bug or risk; fix before next minor release |
| `MED`  | Quality / incomplete feature; fix within 2 sprints     |
| `LOW`  | Nice-to-have; backlog                                  |
| ✅     | Fixed                                                  |
| 🔄     | In progress                                            |
| ⏳     | Scheduled                                              |
| ❌     | Won't fix (with reason)                                |

---

## Active Remediation — 2026-04-26 CI Recovery

These items are part of the active all-green remediation pass. Here, **"all green" means every currently triggered `push` check passes**, not only the aggregate status jobs.

### CI-R1 — Aggregate CI Status Jobs Were Too Weak

**Files:** `.github/workflows/ci.yml`, `.github/workflows/perf-optimized-ci.yml`
**Status:** ✅ Fixed in v1.2.0

Both `ci-passed` aggregate jobs now fail with `exit 1` when any prerequisite job result is not `success`. Additionally, the `size-limit check` step in `perf-optimized-ci.yml` had its `|| true` fallback removed — `pnpm size` now fails the build job directly on budget overrun, consistent with `ci.yml`.

### CI-R2 — Browser-Test Build Artifacts Were Not Built with Consistent E2E Env

**Files:** `.github/workflows/ci.yml`, `.github/workflows/perf-optimized-ci.yml`, `turbo.json`
**Status:** ✅ Fixed in v1.2.0

Both `ci.yml` and `perf-optimized-ci.yml` build with `VITE_E2E_TESTING=true`. `turbo.json` `web#build` lists `VITE_E2E_TESTING` in `env` so the Turbo cache keys differ between E2E-enabled and standard builds. E2E jobs consume the `build-${{ github.sha }}` artifact produced by the `VITE_E2E_TESTING=true` build.

### CI-R3 — Lighthouse Preview Server Parity Drift on Node 24

**Files:** `apps/web/lighthouserc.json`, `apps/web/playwright.config.ts`
**Status:** ✅ Fixed in v1.2.0

`lighthouserc.json` `startServerCommand` uses `--host 0.0.0.0 --port 9876 --strictPort`, matching the `--host 0.0.0.0` flag already present in `playwright.config.ts`. Both preview servers now bind to all interfaces, resolving the Node 24 / Ubuntu IPv6-only localhost binding issue.

### CI-R4 — Central Documentation Drifted from Verified Repo Truth

**Files:** `README.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `docs/Toolchain-Architecture.md`, `docs/Testing-Coverage-Strategy.md`
**Status:** ✅ Core docs synchronized on 2026-04-26

Central docs and agent-instruction files diverged from code on shipped-vs-in-flight version language, controller count, coverage thresholds, and CI semantics.

**Fix applied:** Synchronized the canonical docs and agent instructions to the verified repository state, including current controller inventory, active coverage thresholds, root script semantics, and current CI behavior.

---

## PR Feedback & Static Analysis Rollout

Items introduced by the 2026-06-28 PR-feedback improvement initiative.

### PRF-01 — DeepSource Integrated (Advisory Mode)

**Files:** `.deepsource.toml`, `docs/runbooks/deepsource-integration.md`  
**Status:** 🔄 In progress

DeepSource is connected and configured for the monorepo. Quality gates are advisory until tuning and remediation of existing HIGH-severity dependency advisories are complete.

### PRF-02 — CodeAnt.ai AI Reviewer Integrated (Advisory Mode)

**Files:** `docs/runbooks/codeant-ai-integration.md`  
**Status:** 🔄 In progress

CodeAnt.ai GitHub App installation and dashboard configuration must be completed by a repository owner. It remains advisory to avoid replacing human judgment on control logic.

### PRF-03 — Coverage Diff Not Yet Enforced

**Files:** `.github/workflows/ci.yml`, `apps/web/vitest.config.ts`, `apps/api/vitest.config.ts`  
**Status:** ⏳ Backlog

DeepSource coverage report card is visible, but a hard "coverage may not decrease" gate is not enabled until MED-01 coverage targets are closer to the 70% goal.

### PRF-04 — Unified PR Feedback Comment Missing

**Files:** `.github/workflows/pr-feedback-summary.yml`  
**Status:** ✅ Fixed in v1.3.0 prep (#91)

Workflow posts/updates a single PR comment with links to Lighthouse, coverage, bundle analysis, and static-analysis dashboards. DeepSource/CodeAnt links appear when those integrations are configured.

### PRF-05 — Branch Protection Settings Not Codified

**Files:** `.github/CI-AUDIT.md`, `docs/runbooks/pr-status-checks.md`  
**Status:** ⏳ Backlog

Required checks are documented but must be applied manually in GitHub Settings → Branches → main.

---

## Safety

### SAF-01 — Implicit Live Hardware Connection on Dev/CI Startup

**Files:** `apps/api/src/config/adapter-mode.ts`, `apps/web/src/lib/adapter-mode.ts`, `apps/web/src/core/useEnergyStore.ts`, `docker-compose.yml`, `helm/nexus-hems/values.yaml`  
**Status:** ✅ Fixed in v1.3.0 (#128)

`ADAPTER_MODE` / `VITE_ADAPTER_MODE` default to `mock`. Live hardware requires explicit double opt-in (`ALLOW_LIVE_HARDWARE=true` backend, `VITE_ALLOW_LIVE_HARDWARE=true` frontend build) plus per-adapter enablement in Settings. All built-in frontend adapters start disabled.

---

## Supply Chain

### SUPPLY-01 — Grype CVE Scan and Cosign Signing Not Wired in CI

**Files:** `.github/workflows/sbom-scan.yml`, `.github/workflows/deploy.yml`, `docs/Master-Improvement-Roadmap.md`  
**Status:** ⏳ Backlog

`sbom-scan.yml` generates syft SPDX SBOMs and runs `pnpm audit --audit-level=high`. Grype image/filesystem scanning and cosign signing are documented in roadmap/CHANGELOG v1.2.0 notes but are **not** present in current workflows. `deploy.yml` is GitHub Pages only (no container push). Reconcile docs and add Grype + cosign when a GHCR push workflow lands.

---

## CRITICAL

### CRIT-01 — EEBUS SHIP Handshake Not Implemented

**File:** `apps/api/src/routes/eebus.routes.ts:61`
**Status:** ✅ Fixed in v1.2.0 (see `docs/EEBUS-SHIP-Handshake-Implementation.md`)

Full SHIP v1.0.1 handshake implemented:

- `apps/api/src/services/ShipHandshakeService.ts` — SHIP FSM (10 states), TLS 1.3, ECDSA P-256 auto-gen cert, SKI extraction
- `apps/api/src/services/EEBusTrustStore.ts` — atomic JSON file trust store, survives restarts
- `apps/api/src/routes/eebus.routes.ts` — full REST API (discover/pair/pin/status/trust), SSRF guard
- `packages/shared-types/src/protocol.ts` — 5 new Zod schemas (EEBUSDeviceInfo, pair/pin/status/trust)
- `apps/web/src/lib/db.ts` — v13 migration, `eebusDevices` IndexedDB table
- `apps/web/src/components/CertificateManagement.tsx` — SHIP Trust Store UI with PIN dialog
- `docs/EEBUS-SHIP-Handshake-Implementation.md` — complete technical spec
- VDE-AR-E 2829-6 compliance: SKI fingerprint auth, PIN exchange, TLS 1.3 mTLS

---

### CRIT-02 — Tauri Updater Signing Key (Removed)

**Status:** 🗑️ Removed 2026-05-08 — auto-updater dropped from project

The Tauri auto-updater plugin and Minisign signing infrastructure have been removed entirely (`tauri-plugin-updater`, `plugins.updater`, `bundle.createUpdaterArtifacts`, `TAURI_SIGNING_*` CI env vars, `.secrets/` directory, `docs/Tauri-Desktop-Updater-Setup.md`, `TauriAutoUpdater.tsx`). Desktop users update by downloading a new release from GitHub.

**Why removed:** Maintenance burden of key management (generation, rotation, GitHub secret setup) was disproportionate for a single-maintainer homelab project. Auto-updates can be re-introduced later by following the official Tauri v2 docs.

---

### CRIT-03 — JWT Weak-Entropy Secrets Warn But Don't Block in Production

**File:** `apps/api/src/jwt-utils.ts:167-194`
**Status:** ✅ Fixed in v1.1.1 (see commit history)

`checkSecretEntropy()` called with weak-pattern secrets logs `console.error` but the server still starts. In production, a known-weak pattern (e.g. `JWT_SECRET=password123`) should throw.

**Fix applied:** Changed weak-pattern detection in production mode to `throw new Error(...)` instead of `console.error(...)`.

---

## HIGH

### HIGH-01 — Hardcoded Localhost Fallbacks in Adapters

**File:** Multiple — `apps/web/src/core/adapters/EEBUSAdapter.ts`, `ModbusSunSpecAdapter.ts`, `KNXAdapter.ts`
**Status:** ✅ Fixed in v1.2.0

Added constructor guard in all three adapters: throws `Error` if `config.host` is absent/empty and `config.mock !== true`. Fast-fail with clear message instead of silent fallback to localhost.

---

### HIGH-02 — Modbus SunSpec Unsupported Register Types Crash at Runtime

**File:** `apps/api/src/protocols/modbus/ModbusAdapter.ts`
**Status:** ✅ Fixed in v1.2.0

`validateRegisterConfig()` called in the `ModbusAdapter` constructor filters registers to the five supported data types (`INT16`, `UINT16`, `INT32`, `UINT32`, `FLOAT32`). Unsupported types (e.g. `UINT64`, `STRING` from JSON device-map) log a structured warning and are skipped instead of crashing the polling loop at runtime.

---

### HIGH-03 — InfluxDB Flux Query Built via String Concatenation

**File:** `apps/web/src/lib/influxdb-client.ts`, `apps/api/src/routes/history.routes.ts`
**Status:** ✅ Fixed in v1.2.0

Both Flux query paths now enforce strict allowlists before any interpolation:

- `influxdb-client.ts`: `validateFluxField`, `validateFluxMetric`, `validateFluxRange`, `validateFluxAggregateWindow` functions with Set-based and regex allowlists.
- `history.routes.ts`: Zod schema tightened — `metric` requires `^[a-zA-Z][a-zA-Z0-9_]{0,63}$`, `deviceId` requires `^[a-zA-Z0-9_:.-]{1,128}$`, `granularity` uses `z.enum` (closed set).

---

### HIGH-04 — CORS Localhost Exclusion Relies Solely on NODE_ENV

**File:** `apps/api/src/middleware/security.ts:16-31`
**Status:** ✅ Fixed in v1.2.0

Added post-construction filter in `configureCors()`: when `isProduction`, iterate `allowedOriginSet` and delete any origin containing `localhost`, `127.`, `[::1]`, or `0.0.0.0`, with `console.warn` for each removal. Defence-in-depth against `CORS_ORIGINS` misconfiguration.

---

### HIGH-05 — AI Key Storage: No Guard Against IndexedDB Unavailability

**File:** `apps/web/src/lib/ai-keys.ts`
**Status:** ✅ Fixed in v1.2.0

Added `isKeyStorageAvailable(): Promise<boolean>` helper that probes Dexie with `.count()`. `saveAIKey()` now calls it first and throws a user-visible error if storage is unavailable (private browsing, quota exceeded, etc.).

---

### HIGH-06 — WebSocket Broadcast Lacks Per-Connection Rate Limiting

**File:** `apps/api/src/ws/energy.ws.ts`
**Status:** ✅ Fixed in v1.2.0

WS command rate limit is now configurable via `WS_RATE_LIMIT` env var (default 30 cmd/min). When the limit is exceeded, the connection is closed with code `4429 Rate limit exceeded` in addition to the error frame.

---

### HIGH-07 — JWT Key Rotation Requires Server Restart

**File:** [`apps/api/src/jwt-utils.ts`](apps/api/src/jwt-utils.ts), [`apps/api/src/routes/auth.routes.ts`](apps/api/src/routes/auth.routes.ts)
**Status:** ✅ Fixed in v1.3.0

Dual-key mode loads `JWT_SECRET` + optional `JWT_SECRET_NEW` (and optional `JWT_SECRET_NEW_FILE`) without restart via `reloadJwtKeysFromEnv()`; `POST /api/auth/rotate-key` (admin JWT) triggers reload; verification tries signing key then legacy secret.

**Fix:** Shipped — see [`SECURITY.md`](SECURITY.md) env table.

### HIGH-09 — Security/Performance Roadmaps Need Truth-Sync Boundaries

**Files:** `docs/Security-Roadmap-2026.md`, `docs/Performance-Optimization-Plan.md`, `CHANGELOG.md`, `README.md`
**Status:** ✅ Fixed in v1.2.0

Roadmap and release-facing docs reclassified. JTI revocation, audit automation, Renovate, AI-side PII masking, CSP partial state, EEBUS certificate UX, and LTTB integration status all now reflect verified shipped state vs. active v1.2 targets.

---

### HIGH-08 — Docker Secret Path Hardcoded

**File:** `apps/api/src/jwt-utils.ts:35`
**Status:** ✅ Fixed in v1.2.0

Changed to `process.env.JWT_SECRET_FILE ?? '/run/secrets/jwt_secret'`.

---

## MEDIUM

### MED-01 — Test Coverage Below Industry Standard

**File:** `apps/web/vitest.config.ts:18-22`, `apps/api/vitest.config.ts:13-17`
**Status:** ⏳ Scheduled for v1.2

Current thresholds:

- Web: statements 52%, branches 42%, functions 53%, lines 53%
- API: statements 55%, branches 45%, functions 55%, lines 55%

Target: 70%+ for all metrics.

**Fix:** Prioritize branch coverage for adapters (circuit breaker transitions), JWT utilities (key rotation paths), and MPC optimizer (constraint validation).

---

### MED-02 — Structured Logging Missing in API Routes

**File:** `apps/api/src/routes/*.ts`, `apps/api/src/index.ts`
**Status:** ✅ Fixed in v1.2.0

Created `apps/api/src/core/logger.ts` — a zero-dependency NDJSON structured logger that outputs `{ time, level, msg, ...ctx }` lines to stdout (compatible with Loki, Datadog, etc.). Express namespace augmented in `apps/api/src/types/express.d.ts` to add `req.requestId`. `configureRequestTracking()` now attaches the UUID to `req.requestId` so route handlers can include it in log context. All `console.error`/`console.warn` calls in `eebus.routes.ts`, `openadr.routes.ts`, `history.routes.ts`, and `index.ts` replaced with `logger.error`/`logger.warn` carrying `{ requestId, error }` context.

---

### MED-03 — nginx WS_ORIGINS Env Var Not Validated at Startup

**File:** `apps/web/nginx.conf`, `Dockerfile`, `apps/web/docker-entrypoint.sh`
**Status:** ✅ Fixed in v1.2.0

Added `apps/web/docker-entrypoint.sh` — a POSIX shell script that validates every space-separated token in `WS_ORIGINS` against a strict character allowlist (`ws://`/`wss://` scheme + alphanumeric/dot/hyphen/underscore/colon/brackets only) and exits 1 with a clear error message on violation. The Dockerfile uses this as the `ENTRYPOINT`; it delegates to the nginx-unprivileged base image's `/docker-entrypoint.sh` (which runs `envsubst`) before starting nginx.

### MED-11 — LTTB Sampling Exists But Is Not Fully Wired Into Chart Surfaces

**Files:** `apps/web/src/lib/chart-sampling.ts`, `apps/web/src/components/HistoricalChart.tsx`, `apps/web/src/pages/HistoricalAnalyticsPage.tsx`
**Status:** ✅ Fixed in v1.2.0

`sampleIfNeeded(filteredData, 500, 300)` wired into `HistoricalChart.tsx` (the shared historical rendering path) and `HistoricalAnalyticsPage.tsx` (time series + forecast accuracy charts). All other chart pages (Analytics, TariffsPage, OptimizationAI, MonitoringPage, PredictiveForecast) use static bounded series ≤ 168 points and are well below the sampling threshold — no additional wiring needed there.

---

### MED-04 — React Compiler ESLint Plugin Still RC

**File:** `package.json`
**Status:** ⏳ Monitor — upgrade when stable

`eslint-plugin-react-compiler: ^19.1.0-rc.2` is a release candidate. Pin to stable when available.

---

### MED-05 — Contrib Adapter Glob Discovery Fails Silently on Empty Directory

**File:** `apps/web/src/core/adapters/adapter-registry.ts:175`
**Status:** ✅ Fixed in v1.2.0

`if (!loader)` block now enumerates available adapter IDs from `Object.keys(contribModules)` and includes them in the error message for easy diagnosis.

---

### MED-06 — AI Response Output Not Schema-Validated

**File:** `apps/web/src/core/aiClient.ts:82-98`
**Status:** ✅ Fixed in v1.2.0

Added `OptimizationSuggestionSchema`, `OptimizationResponseSchema`, and `ForecastResponseSchema` Zod schemas. New `parseAIStructuredOutput<T>(text, schema)` helper extracts JSON from markdown code fences and validates via `safeParse`, returning `null` on failure (graceful degradation).

---

### MED-07 — Tauri Mobile Build Config Incomplete

**File:** `apps/web/src-tauri/tauri.conf.json:54-59`
**Status:** ❌ Won't fix in v1.2 — mobile support is planned for v1.3

iOS and Android sections are defined but empty. No CI mobile build jobs.

**Fix (v1.3):** Add complete iOS/Android config, provisioning profiles, and a Tauri mobile CI job.

---

### MED-08 — i18n Sync Not Automatically Validated

**File:** `apps/web/src/locales/en.ts` vs `apps/web/src/locales/de.ts`
**Status:** ✅ Fixed in v1.2.0

Created `apps/web/src/tests/i18n-sync.test.ts` — recursive key walker comparing EN↔DE for bidirectional parity. Runs as part of `pnpm test:run`.

---

### MED-09 — Circuit Breaker Has No Jitter on Cooldown

**File:** `apps/web/src/core/circuit-breaker.ts:25`
**Status:** ✅ Fixed in v1.2.0

Added `openCount` field; each OPEN transition increments it. `currentState` getter computes `effectiveCooldown = min(cooldown × 2^(openCount-1), 300_000) × jitter(0.8–1.2)`. `reset()` also clears `openCount`.

---

### MED-10 — req.ip Rate Limiting on `trust proxy: 1` (Single Level Only)

**File:** [`apps/api/src/config/trust-proxy.ts`](apps/api/src/config/trust-proxy.ts), [`apps/api/src/index.ts`](apps/api/src/index.ts), [`docs/Deployment-Guide.md`](docs/Deployment-Guide.md) §2.1
**Status:** ✅ Fixed in v1.3.0

`TRUST_PROXY` configures Express `trust proxy` (default `1`). Multi-hop deployments set hop count or subnet list (e.g. `loopback,10.0.0.0/8`) so `req.ip` reflects the real client for rate limiting.

**Fix:** Documented in Deployment Guide; env-driven via `resolveTrustProxy()`.

---

## LOW

### LOW-01 — SSRF Allowlist Missing mDNS `.local` Hostnames

**File:** `apps/web/src/core/adapter-worker.ts:168`
**Status:** ✅ Fixed in v1.2.0

Added `/\.local$/` to `ALLOWED_HOSTNAME_PATTERNS`. Security note in comment: mDNS is unauthenticated, so `.local` hostnames should only be used on trusted LAN.

---

### LOW-02 — OpenEMS Writable Property Allowlist Hardcoded

**File:** `apps/web/src/core/adapters/OpenEMSAdapter.ts:491`
**Status:** ⏳ Backlog

Custom OpenEMS installations cannot add new writable properties without forking the adapter.

**Fix:** Allow users to provide an `additionalWritableProperties` array in adapter config.

---

### LOW-03 — Bundle Size CI Check Is Non-Blocking

**File:** `.github/workflows/ci.yml`
**Status:** ✅ Fixed in v1.2.0

Removed `|| echo "::warning::..."` fallback from the Size Limit Check step. `pnpm size` now exits non-zero when any bundle exceeds its limit, failing the CI job immediately.

---

### LOW-04 — API Scope Map Not Validated at Startup

**File:** `apps/api/src/middleware/auth.ts:26`
**Status:** ✅ Fixed in v1.2.0

Added post-construction validation loop that calls `console.warn` for each `API_KEY_SCOPES` entry dropped due to missing colon separator or invalid scope value.

---

### LOW-05 — Offline Cache Has No Quota Warning

**File:** `apps/web/src/lib/offline-cache.ts`
**Status:** ⏳ Backlog

No monitoring of `navigator.storage.estimate()`. IndexedDB operations may silently fail when storage quota is exceeded.

**Fix:** On app init, check `estimate().usage / estimate().quota > 0.8` and surface a toast warning. Implement LRU eviction in offline cache.

---

### LOW-06 — Commitlint Has Unused Scopes

**File:** `commitlint.config.js`
**Status:** ⏳ Backlog

~20 allowed scopes defined but only ~5 used in practice. Developers are confused about correct scope.

**Fix:** Audit `git log --oneline` for scope usage. Remove unused scopes or document them in a `CONTRIBUTING.md` scope guide.

---

### LOW-07 — No Font Preload Directives in index.html

**File:** `apps/web/index.html`
**Status:** ✅ Already done (pre-existing in v1.1.0)

All 4 font preloads with SRI hashes are already present in `apps/web/index.html`. No action needed.

---

### LOW-08 — Storybook References Placeholder Components

**File:** `.storybook/main.ts`
**Status:** ⏳ Backlog — depends on Storybook 10.3 support

Storybook config references component paths that may not have stories written yet.

**Fix:** Add stories for `SankeyDiagram`, `FloorplanEditor`, `AdapterConfigPanel` — the three highest-complexity components with no visual regression tests.

---

---

## June 2026 Deep Audit — New & Reclassified Items

> Source: `docs/Audit-Report-2026-06-29.md` · Execution plan: `docs/Perfection-Roadmap.md`

### CRITICAL (new)

### CRIT-04 — Backend ADAPTER_MODE Defaults to `live` (Contradicts Safety Docs)
**File:** `apps/api/src/config/adapter-mode.ts`, `apps/api/src/protocols/index.ts`
**Status:** ✅ Fixed in v1.3.0 (#128)

`ADAPTER_MODE` defaults to `mock`. Live hardware requires `ADAPTER_MODE=live` **and** `ALLOW_LIVE_HARDWARE=true`. `getEffectiveAdapterMode()` drives health checks and adapter startup consistently.

---

### CRIT-05 — Auth Token Read Path Without Write Path (HIGH-05 Incomplete)
**Files:** `apps/web/src/lib/auth-token.ts`, `background-sync.ts`, `sharing.ts`, `CertificateManagement.tsx`
**Status:** ⚠️ Partial — Phase 0 (Perfection Roadmap 0.2)

`auth-token.ts` provides `setAuthToken()` / `getAuthHeader()` and `exchangeApiKeyForJwt()`. `background-sync.ts` and `sharing.ts` consume the read path. **EEBUS Certificate UI** (`CertificateManagement.tsx`) still omits `Authorization` on `/api/eebus/*` fetches (see HIGH-10).

**Fix:** Wire `getAuthHeader()` into all EEBUS UI fetches; expose token exchange in Settings when API base URL is configured.

---

### HIGH (new / reclassified)

### HIGH-10 — EEBUS Certificate UI Calls Unauthenticated
**File:** `apps/web/src/components/CertificateManagement.tsx`
**Status:** ✅ Fixed in v1.3.0 prep (#129)

`/api/eebus/trust`, `/api/eebus/trust/:ski`, and `/api/eebus/pair/pin` fetches now attach `Authorization` via `getAuthHeader()` from `auth-token.ts`.

---

### HIGH-11 — WebSocket Scope Authorization Incomplete for Write Commands
**File:** `apps/api/src/ws/energy.ws.ts:17–20`
**Status:** ⏳ Scheduled — Phase 0

Only 4 command types mapped in `SCOPE_COMMAND_MAP`. `WSCommandTypeSchema` defines additional write commands (`START_CHARGING`, `SET_V2X_DISCHARGE`, `KNX_*`, OpenADR, VPP) that pass with `read` scope.

**Fix:** Extend map; add Vitest matrix in `energy-ws.test.ts`.

---

### HIGH-12 — OCPP Security Profile 3 Not Operational
**File:** `apps/web/src/core/adapters/OCPP21Adapter.ts`
**Status:** ⏳ Scheduled — Phase 2 (Perfection Roadmap 2.1)

`securityProfile` config stored but unused in `_connect()`. No client cert, Basic Auth, or CRL/OCSP per `docs/Security-Roadmap-2026.md` partial classification.

---

### HIGH-13 — EvccAdapter Has Zero Test Coverage
**File:** `apps/web/src/core/adapters/EvccAdapter.ts`
**Status:** ⏳ Scheduled — Phase 1

Core adapter (7th) with REST + WebSocket paths controlling EV hardware. No dedicated test file.

**Fix:** `apps/web/src/tests/evcc-adapter.test.ts`

---

### HIGH-14 — Command Audit Trail (`logCommandAudit`) Untested
**File:** `apps/web/src/core/command-safety.ts:164–191`
**Status:** ⏳ Scheduled — Phase 1

Safety-critical IndexedDB audit with 5000-entry cleanup has no unit tests.

---

### HIGH-15 — Grype Container Scan Documented But Not in CI
**Files:** `.github/workflows/sbom-scan.yml`, `CHANGELOG.md`, `docs/Master-Improvement-Roadmap.md`
**Status:** ⏳ Backlog — see **SUPPLY-01** (docs truth-sync applied in #129; Grype step still pending)

`sbom-scan.yml` generates Syft SBOMs and runs `pnpm audit`. Grype/cosign not yet wired.

**Fix:** Add `anchore/scan-action` step when GHCR image push workflow lands.

---

### HIGH-16 — Cosign Image Signing Documented But Not Implemented
**Files:** `SECURITY.md`, `CHANGELOG.md` vs `.github/workflows/deploy.yml` (GitHub Pages only)
**Status:** ⏳ Scheduled — Phase 1

Cosign verify instructions reference container images; no signing workflow exists for GHCR publish.

---

### MEDIUM (new)

### MED-12 — Adapter Worker Hook Exists But Has No Consumers
**File:** `apps/web/src/core/useAdapterWorker.ts`
**Status:** ⏳ Scheduled — Phase 1

Modbus/Shelly still poll on main thread. Performance plan marks REST worker "implemented" but integration is missing.

---

### MED-13 — Unthrottled Bridge Side Effects in useAdapterBridge
**File:** `apps/web/src/core/useEnergyStore.ts:443–457`
**Status:** ⏳ Scheduled — Phase 1

`mergeData` throttled to 250 ms but `bridgeToAppStore`, React Query writes, and `persistSnapshot` fire at full adapter message rate.

---

### MED-14 — API Test Coverage Not Enforced in CI
**Files:** `.github/workflows/ci.yml:54–55`, `apps/api/vitest.config.ts`
**Status:** ⏳ Scheduled — Phase 1

API has 55% thresholds in config but CI runs `test:run` without `--coverage`.

---

### MED-15 — In-Memory WS Tickets and Share Store (HA Risk)
**Files:** `apps/api/src/routes/auth.routes.ts:13`, `shares.routes.ts:25`
**Status:** ⏳ Backlog — Phase 2

JTI revocation supports Redis; WS tickets and share redemption do not. Multi-instance deployments have split-brain risk.

---

### MED-16 — Settings.tsx Monolith (~3,500 Lines)
**File:** `apps/web/src/pages/Settings.tsx`
**Status:** ⏳ Backlog — Phase 2

Maintainability hotspot. Split into tab submodules per Perfection Roadmap 2.3.

---

### MED-17 — Performance Plan LTTB Scope Table Drift
**File:** `docs/Performance-Optimization-Plan.md` (line 20 vs 156)
**Status:** ⏳ Scheduled — Phase 0

Scope table says "not fully integrated"; P3 section says "Fully Implemented". Code confirms LTTB is wired.

**Fix:** Update scope table to ✅ Implemented.

---

### LOW (new)

### LOW-09 — Fuzz Workflow Not in ci-passed Aggregate
**File:** `.github/workflows/fuzz.yml`
**Status:** ⏳ Backlog — Phase 1

Fuzz gate runs in parallel; not required for `ci-passed` success.

---

### LOW-10 — A11y E2E Uses 240s waitForSelector
**File:** `apps/web/tests/e2e/accessibility.spec.ts:26`
**Status:** ⏳ Backlog — Phase 1

Extreme timeout may mask real failures; reduce after stabilization.

---

## Fixed Items

| ID         | Description                                                                              | Fixed In |
| ---------- | ---------------------------------------------------------------------------------------- | -------- |
| ✅ CRIT-03 | JWT weak-pattern secrets throw in production                                             | v1.1.1   |
| ✅ CI-01   | Docker Build jobs removed from CI pipelines                                              | v1.1.1   |
| ✅ CI-02   | Unconfigured scanners (Snyk, Socket, Aikido) removed                                     | v1.1.1   |
| ✅ TEST-01 | normalize-unified.test.ts timeout fixed with beforeAll                                   | v1.1.1   |
| ✅ TEST-02 | supertest installed, API test files added                                                | v1.1.0   |
| ✅ MED-03  | nginx CSP `apk` fix (exit-99 in BuildKit)                                                | v1.1.1   |
| ✅ MED-10  | LTTB sampling wired into HistoricalChart + HistoricalAnalyticsPage                       | v1.2.0   |
| ✅ HIGH-09 | Security/Performance roadmap truth-sync completed                                        | v1.2.0   |
| ✅ SEC-01  | CSP harmonized: worker-src, AI providers, img-src, Express nonce bridge                  | v1.2.0   |
| ✅ SEC-02  | PII sanitization extracted to shared-types; wired at WS egress, store ingress, AI client | v1.2.0   |
| ✅ CI-R1   | Aggregate CI status jobs + size-limit check now fail on any non-success prerequisite     | v1.2.0   |
| ✅ CI-R2   | E2E build artifacts consistently built with VITE_E2E_TESTING=true; turbo.json keyed      | v1.2.0   |
| ✅ CI-R3   | Lighthouse preview server uses --host 0.0.0.0 matching Playwright; IPv6 binding fixed    | v1.2.0   |
| ✅ SAFETY  | Safety-Certification-Notice.md created; mock-vs-live hazards, checklist, updater guide   | v1.2.0   |
| ✅ AUDIT-2026-06 | Full-scale deep audit report + Perfection Roadmap published                          | v1.3.0-prep |
| ✅ SAF-01  | Adapter mode mock default; double opt-in for live hardware (backend + frontend)            | v1.3.0   |
| ✅ PRF-04  | Unified PR feedback summary workflow (`pr-feedback-summary.yml`)                           | v1.3.0   |

---

## Dependency Override Rationale

The following `pnpm.overrides` in root `package.json` exist for security reasons and must not be removed without re-auditing:

| Package                 | Reason                                                       |
| ----------------------- | ------------------------------------------------------------ |
| `micromatch@^4.0.8`     | Prototype pollution via glob pattern (CVE-2024-4067)         |
| `braces@^3.0.3`         | ReDoS via malformed pattern (CVE-2024-4068)                  |
| `send@^1.1.0`           | Path traversal in static file serving (CVE-2024-43799)       |
| `path-to-regexp@^8.2.0` | Backtracking ReDoS (CVE-2024-45296)                          |
| `cross-spawn@^7.0.6`    | Shell injection via malformed env var (CVE-2024-21538)       |
| `vite@^6.3.5`           | Arbitrary file read via crafted URL (CVE-2025-31125)         |
| `esbuild@^0.25.0`       | Arbitrary request forwarding via dev server (CVE-2025-25193) |
| `cookie@^0.7.0`         | Prototype pollution (CVE-2024-47764)                         |

---

## Release Roadmap

| Version | Scope | Status |
| ------- | ----- | ------ |
| **v1.3.0** | **Perfection Roadmap Phase 0–1** — CRIT-04/05 auth+safety defaults, HIGH-10–16 test/supply-chain gaps, MED-12–14 perf/CI | ⏳ In flight |
| **v1.4.0** | **Perfection Roadmap Phase 2–3** — OCPP Profile 3, EEBUS E2E, RBAC (ADR-009), certification package | ⏳ Planned |

---

_This file is updated after each sprint and before each minor/major release._
