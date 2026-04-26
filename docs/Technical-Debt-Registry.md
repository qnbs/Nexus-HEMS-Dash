# Technical Debt Registry — Nexus-HEMS-Dash

**Last audited:** 2026-04-26
**Version at audit:** 1.1.0
**Last updated:** 2026-05-03
**Updated version:** 1.2.0
**Auditor:** Claude Sonnet 4.6 (automated deep-scan)

This file is the canonical issue tracker for known technical debt, security gaps, incomplete implementations, and quality issues. It is **not** a substitute for GitHub Issues — use it for context, rationale, and multi-sprint planning.

---

## Legend

| Tag | Meaning |
|-----|---------|
| `CRIT` | Blocks shipping or causes data loss / security breach |
| `HIGH` | Significant bug or risk; fix before next minor release |
| `MED`  | Quality / incomplete feature; fix within 2 sprints |
| `LOW`  | Nice-to-have; backlog |
| ✅ | Fixed |
| 🔄 | In progress |
| ⏳ | Scheduled |
| ❌ | Won't fix (with reason) |

---

## Active Remediation — 2026-04-26 CI Recovery

These items are part of the active all-green remediation pass. Here, **"all green" means every currently triggered `push` check passes**, not only the aggregate status jobs.

### CI-R1 — Aggregate CI Status Jobs Were Too Weak
**Files:** `.github/workflows/ci.yml`, `.github/workflows/perf-optimized-ci.yml`
**Status:** 🔄 In progress

Both `✅ CI Passed` jobs could still report success while relevant downstream jobs were red or only emitted warnings. This made the branch-protection signal weaker than the actual repository quality requirement.

**Fix in progress:** Make aggregate status jobs fail on every non-successful prerequisite in their workflow.

### CI-R2 — Browser-Test Build Artifacts Were Not Built with Consistent E2E Env
**Files:** `.github/workflows/ci.yml`, `.github/workflows/perf-optimized-ci.yml`, `turbo.json`
**Status:** 🔄 In progress

`web#build` declares `VITE_E2E_TESTING` as a relevant build env in `turbo.json`, but the CI build jobs were not consistently building with that env while E2E depended on the resulting artifacts.

**Fix in progress:** Build workflow artifacts with `VITE_E2E_TESTING='true'` wherever those artifacts are later consumed by E2E/browser checks.

### CI-R3 — Lighthouse Preview Server Parity Drift on Node 24
**Files:** `apps/web/lighthouserc.json`, `apps/web/playwright.config.ts`
**Status:** 🔄 In progress

Playwright already used an explicit `--host 0.0.0.0` preview-server workaround for Node 24 / Ubuntu IPv4-vs-IPv6 binding behavior, while Lighthouse still used the older preview command.

**Fix in progress:** Align Lighthouse preview startup with the same host-binding strategy used by Playwright.

### CI-R4 — Central Documentation Drifted from Verified Repo Truth
**Files:** `README.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `docs/Toolchain-Architecture.md`, `docs/Testing-Coverage-Strategy.md`
**Status:** ✅ Core docs synchronized on 2026-04-26

Central docs and agent-instruction files diverged from code on shipped-vs-in-flight version language, controller count, coverage thresholds, and CI semantics.

**Fix applied:** Synchronized the canonical docs and agent instructions to the verified repository state, including current controller inventory, active coverage thresholds, root script semantics, and current CI behavior.

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

### CRIT-02 — Tauri Updater Signing Key Missing
**File:** `apps/web/src-tauri/tauri.conf.json:66-68`
**Status:** ❌ Won't fix until auto-update is activated (`active: false`)

`pubkey: ""` is set alongside `active: false`. Safe for now but must be populated before enabling auto-updates.

**Fix:** Run `tauri signer generate`, add public key to `pubkey`, set `endpoints` to a real release server URL, then set `active: true`.

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
**File:** `apps/api/src/protocols/modbus/ModbusAdapter.ts:265`
**Status:** ⏳ Scheduled for v1.2

UINT64 and STRING register types throw at runtime instead of being pre-validated at config parse time.

**Fix:** Add a `validateRegisterConfig(registers)` call before the polling loop starts. Log unsupported types as warnings and skip them, rather than crashing.

---

### HIGH-03 — InfluxDB Flux Query Built via String Concatenation
**File:** `apps/web/src/lib/influxdb-client.ts:239-300`
**Status:** ⏳ Scheduled for v1.2

Flux queries use string interpolation with an allowlist guard. The guard relies on `^[a-z_][a-z0-9_]*$` regex (solid), but any future addition to the allowlist without re-auditing the interpolation site introduces Flux injection risk.

**Fix:** Migrate to InfluxDB v3 parameterized queries or a Flux AST builder. Eliminate all string concatenation from query construction.

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
**File:** `apps/api/src/jwt-utils.ts:200-310`
**Status:** ⏳ Scheduled for v1.3

`JWT_SECRET_NEW` → `JWT_SECRET` rotation procedure requires a restart, causing token invalidation for in-flight sessions.

**Fix:** Read both env vars at request time (not startup time). Verify against both keys without restart. Add a `/api/auth/rotate-key` admin endpoint for zero-downtime rotation.

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
**File:** `apps/api/src/routes/*.ts`
**Status:** ⏳ Scheduled for v1.2

Several routes use `console.error` / `console.warn` directly. Request context (request ID, user, duration) is not attached to logs.

**Fix:** Wire a Pino logger instance through `req.log` (via `express-pino-logger`). Replace all `console.*` calls in routes.

---

### MED-03 — nginx WS_ORIGINS Env Var Not Validated at Startup
**File:** `apps/web/nginx.conf:37`, `Dockerfile:60`
**Status:** ⏳ Scheduled for v1.2

If `WS_ORIGINS` is empty or contains special chars, the CSP header becomes malformed. No startup validation.

**Fix:** Add a Docker `ENTRYPOINT` wrapper script that validates `WS_ORIGINS` matches `^wss?://[a-zA-Z0-9._:-]+$` before starting nginx.

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
**File:** `apps/api/src/middleware/security.ts:164`, `apps/api/src/index.ts:33`
**Status:** ⏳ Acceptable for single-proxy deployments

`app.set('trust proxy', 1)` handles single reverse proxy. Multi-hop deployments (CDN + reverse proxy) will see CDN IP as client IP, breaking per-user rate limiting.

**Fix:** For multi-hop setups, set `trust proxy` to the exact number of hops or use CIDR: `app.set('trust proxy', ['loopback', '10.0.0.0/8'])`.

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
**Status:** ⏳ Backlog

`pnpm size || echo "::warning::..."` emits a warning but does not fail CI.

**Fix:** Remove the `|| echo` fallback to make the check blocking. Update limits in `.size-limit` when intentionally adding features.

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

## Fixed Items

| ID | Description | Fixed In |
|----|-------------|----------|
| ✅ CRIT-03 | JWT weak-pattern secrets throw in production | v1.1.1 |
| ✅ CI-01 | Docker Build jobs removed from CI pipelines | v1.1.1 |
| ✅ CI-02 | Unconfigured scanners (Snyk, Socket, Aikido) removed | v1.1.1 |
| ✅ TEST-01 | normalize-unified.test.ts timeout fixed with beforeAll | v1.1.1 |
| ✅ TEST-02 | supertest installed, API test files added | v1.1.0 |
| ✅ MED-03 | nginx CSP `apk` fix (exit-99 in BuildKit) | v1.1.1 |

---

## Dependency Override Rationale

The following `pnpm.overrides` in root `package.json` exist for security reasons and must not be removed without re-auditing:

| Package | Reason |
|---------|--------|
| `micromatch@^4.0.8` | Prototype pollution via glob pattern (CVE-2024-4067) |
| `braces@^3.0.3` | ReDoS via malformed pattern (CVE-2024-4068) |
| `send@^1.1.0` | Path traversal in static file serving (CVE-2024-43799) |
| `path-to-regexp@^8.2.0` | Backtracking ReDoS (CVE-2024-45296) |
| `cross-spawn@^7.0.6` | Shell injection via malformed env var (CVE-2024-21538) |
| `vite@^6.3.5` | Arbitrary file read via crafted URL (CVE-2025-31125) |
| `esbuild@^0.25.0` | Arbitrary request forwarding via dev server (CVE-2025-25193) |
| `cookie@^0.7.0` | Prototype pollution (CVE-2024-47764) |

---

*This file is updated after each sprint and before each minor/major release.*
