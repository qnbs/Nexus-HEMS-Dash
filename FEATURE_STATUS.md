# Feature Status — Nexus-HEMS-Dash

**Version:** 1.3.0 shipped (2026-06-30; v1.3.x → v1.4.0 campaign work in `[Unreleased]`)  
**Last updated:** 2026-07-02  
**Purpose:** Single source of truth for what is actually implemented, partial, or planned. Use this file to keep README/marketing claims synchronized with the codebase.

> **Rule:** Any PR that changes a feature's implementation status must update this file and the relevant docs before merging.

---

## Legend

| Symbol | Meaning |
| ------ | ------- |
| ✅ Shipped | Implemented and covered by tests in `main` |
| ⚠️ Partial | Core pieces exist but not end-to-end complete |
| 🔄 In Progress | Active work in current sprint/phase |
| ⏳ Planned | Roadmap item, not yet implemented |
| ❌ Not Planned | Explicitly deferred or removed |

---

## Protocol Adapters

| Protocol | Frontend Adapter | Backend Adapter | Notes |
| :------- | :--------------- | :-------------- | :---- |
| Victron MQTT (Cerbo GX / Venus OS) | ✅ | ✅ | Browser adapter supports direct MQTT-over-WebSocket. Backend `MqttAdapter` (`apps/api/src/protocols/mqtt/MqttAdapter.ts`) subscribes role-tagged Victron Venus OS topic patterns and emits Zod-validated datapoints to the EventBus; in live mode these reach the UI via the `LiveEnergyAggregator` WebSocket bridge (HIGH-17). |
| Modbus/SunSpec (103/124/201) | ✅ | ✅ | `GET /api/modbus/sunspec` + `POST /api/modbus/write` REST proxy (`routes/modbus.routes.ts`) serves the in-browser `ModbusSunSpecAdapter` a mock SunSpec gateway (validated, audited writes; live register writes via an external bridge). The backend `ModbusAdapter` polls `device-map.json` into the EventBus; role-tagged registers reach the UI in live mode via the `LiveEnergyAggregator` bridge (HIGH-17). |
| KNX/IP floorplan | ✅ | ⏳ | Browser adapter exists; no backend KNX/IP adapter. |
| OCPP 2.1 V2X (ISO 15118) | ✅ | ⏳ | Browser adapter implements JSON-RPC over WebSocket; no backend CSMS gateway. |
| EEBUS SPINE/SHIP | ✅ | ⚠️ | Backend SHIP handshake service, trust store, and REST API exist (`apps/api/src/services/ShipHandshakeService.ts`, `routes/eebus.routes.ts`). Continuous SPINE data adapter is not yet implemented. |
| evcc backend | ✅ | ⏳ | Browser adapter exists; no backend evcc adapter. |
| OpenEMS Edge (JSON-RPC) | ✅ | ⏳ | Browser adapter exists; no backend OpenEMS adapter. |
| Home Assistant MQTT | ✅ (contrib) | ⏳ | Frontend contrib adapter only. |
| Matter/Thread | ✅ (contrib) | ⏳ | Frontend contrib adapter only. |
| Zigbee2MQTT | ✅ (contrib) | ⏳ | Frontend contrib adapter only. |
| Shelly REST (Gen2+) | ✅ (contrib) | ⏳ | Frontend contrib adapter only. |
| OpenADR 3.1 VEN | ✅ (contrib) | ⚠️ | Frontend contrib adapter + backend OAuth2 proxy (`routes/openadr.routes.ts`). Full VTN integration and event handling is partial. |
| Example template | ✅ (contrib) | ⏳ | Template for custom adapters. |

> **Backend keystone (HIGH-17, ADR-018) — RESOLVED:** the WebSocket gateway now subscribes to the
> EventBus via `LiveEnergyAggregator` (`apps/api/src/services/LiveEnergyAggregator.ts`), which folds
> role-tagged datapoints into the `EnergyData` snapshot. In live mode with fresh data the gateway
> broadcasts real adapter data; otherwise it falls back to mock byte-for-byte. This unblocks backend
> protocol parity (MED-20) and per-adapter metrics (MED-18). See `docs/Audit-Report-2026-07-02.md`.

---

## Core Application

| Feature | Status | Evidence / Notes |
| :------ | :----- | :--------------- |
| Unified Command Center (7 sections, 8 routes) | ✅ | `apps/web/src/App.tsx` |
| PWA offline-first | ✅ | `vite-plugin-pwa`, service worker handling in `main.tsx`, Dexie cache |
| 5 themes | ✅ | `apps/web/src/design-tokens.ts` |
| Full i18n DE/EN | ✅ | `apps/web/src/locales/en.ts`, `de.ts`; parity test |
| WCAG 2.2 AA automated | ✅ | axe-core Playwright tests |
| WCAG 2.2 AA manual screen-reader pass | ⏳ | Documented in `docs/Accessibility-Testing-Guide.md`; no executed run evidenced |
| Real-time D3.js Sankey flow | ✅ | `apps/web/src/components/SankeyDiagram.tsx` |
| AI optimizer (multi-provider BYOK) | ✅ | `apps/web/src/core/aiClient.ts`, encrypted key storage |
| MPC day-ahead optimizer | ✅ | `apps/web/src/lib/optimizer.ts` |
| 8 real-time controllers | ✅ | `apps/web/src/core/energy-controllers.ts` |
| 24h/7d predictive forecast | ✅ | `apps/web/src/components/PredictiveForecast.tsx`, `lib/ml-forecast.ts` |
| Live tariff widget (Tibber/aWATTar/Octopus/Nordpool) | ✅ | `apps/web/src/lib/tariff-providers.ts` |
| Smart EV charging (§14a EnWG) | ⚠️ | Frontend support exists; no real backend grid-signal integration |
| SG Ready heat pump control | ⚠️ | Frontend command types exist; backend execution path limited |
| Hardware registry (113 devices, ~30 brands) | ⚠️ | Exists in code: `apps/web/src/core/hardware-registry.ts` — 113 devices across inverter/wallbox/meter/battery/heatpump with tested query helpers (`hardware-registry.test.ts`). **Not surfaced in any UI and no add-adapter-instance wizard yet** (MED-19, ADR-019). |
| PDF reports + QR sharing | ✅ | `apps/web/src/components/ExportAndSharing.tsx`, `lib/sharing.ts` |
| Prometheus monitoring | ✅ | `apps/api/src/middleware/metrics.ts`, `routes/metrics.routes.ts`; per-backend-adapter series via `adapter-metrics.ts` (MED-18) |
| Adapter health endpoint | ✅ | `GET /api/health` returns mode, overall status, and per-adapter state (`apps/api/src/routes/health.routes.ts`) |
| Live/Mock mode safety indicator | ✅ | Header banner (live) + simulation badge, Settings status, and live-hardware warning in the command-confirmation dialog — driven by `/api/health` mode (`apps/web/src/lib/adapter-mode.ts`, `AppShell.tsx`, `useSafeCommand.tsx`) |
| Built-in adapters disabled by default | ✅ | `isBuiltinAdapterEnabledByDefault()` returns `false`; user enables adapters in Settings (`apps/web/src/lib/adapter-mode.ts`) |
| Demo data without hardware | ✅ | Mock/simulated energy data when effective adapter mode is `mock` (`apps/api/src/data/mock-data.ts`, `EnergyContext`) |

---

## Security

| Feature | Status | Evidence / Notes |
| :------ | :----- | :--------------- |
| JWT signing/verification | ✅ | `apps/api/src/jwt-utils.ts` |
| JWT dual-key rotation (zero-downtime) | ✅ | `reloadJwtKeysFromEnv()`, `POST /api/auth/rotate-key` |
| JTI revocation (Redis + in-memory fallback) | ✅ | `apps/api/src/jwt-utils.ts` |
| JWT scopes (read/readwrite/admin) | ✅ | `apps/api/src/middleware/auth.ts` |
| API key scope clamping | ✅ | `clampScope()` in `apps/api/src/middleware/auth.ts` |
| Helmet CSP (dev + prod) | ✅ | `apps/api/src/middleware/security.ts` |
| CORS origin filtering (localhost removed in prod) | ✅ | `configureCors()` in `apps/api/src/middleware/security.ts` |
| Rate limiting (HTTP + WS) | ✅ | Express rate-limit + WS command rate limiter |
| Server-side command audit log | ✅ | `apps/api/src/data/command-audit.ts` — every WS command (accepted / rejected-validation / rejected-scope / rejected-ratelimit) appended to NDJSON with clientId, scope, and effective mode; `GET /api/v1/command-audit` (admin scope) |
| Trust proxy config | ⚠️ | `TRUST_PROXY` env supported; defaults to 1 hop with warning |
| BYOK AI vault (AES-GCM 256) | ✅ | `apps/web/src/lib/ai-keys.ts` |
| PII sanitization | ✅ | `@nexus-hems/shared-types/src/sanitize-text.ts` |
| Adapter mode mock default (double opt-in for live) | ✅ | Backend: `ADAPTER_MODE` + `ALLOW_LIVE_HARDWARE`; frontend: `VITE_ADAPTER_MODE` + `VITE_ALLOW_LIVE_HARDWARE` + Settings toggle (`adapter-mode.ts` both sides) |
| SLSA build attestation | ✅ | `actions/attest-build-provenance` in `ci.yml` |
| SBOM generation (syft SPDX) | ✅ | `.github/workflows/sbom-scan.yml` — frontend, backend, and source images |
| Container CVE scan (Grype) in CI | ✅ | `sbom-scan.yml` + `container-publish.yml` — critical cutoff, blocking; `.grype.yaml` targeted ignores (`docs/Supply-Chain-Grype-Policy.md`) |
| Cosign image signing in CI | ✅ | `container-publish.yml` — keyless cosign + SLSA provenance on GHCR push (`ghcr.io/qnbs/nexus-hems-dash`, `nexus-hems-server`) |
| OpenSSF Scorecard | ✅ | `.github/workflows/scorecard.yml` |
| DeepSource static analysis | ⚠️ | `.deepsource.toml` connected; advisory mode (see PRF-01) |
| Unified PR feedback comment | ✅ | `.github/workflows/pr-feedback-summary.yml` |
| Multi-user RBAC | ⏳ | ADR-009 deferred |

---

## Testing & Quality

| Feature | Status | Evidence / Notes |
| :------ | :----- | :--------------- |
| Unit tests (web) | ✅ | 55+ test files; v1.3.x campaign added `settings-tabs` (21), `adapter-worker-target` (12), `hardware-registry` (11), `use-safe-command` (3); #194 added contrib-adapter tests |
| Unit tests (api) | ✅ | 10+ test files |
| E2E tests (Playwright) | ⚠️ | 6 spec files; missing auth, command-safety, backend-integration coverage |
| Fuzz/property tests | ✅ | `apps/web/src/tests/security-fuzz.test.ts` |
| i18n parity test | ✅ | `apps/web/src/tests/i18n-sync.test.ts` |
| Coverage gates | ⚠️ | Enforced thresholds: API 55/45/55/55, web 70/70/70/70 (`vitest.config.ts`, raised in #195). PRF-03 baseline gate via `pnpm check:coverage-baseline` (web floor 78/72/70/80). Staged roadmap target 70%+ (MED-01). |
| Lighthouse CI | ✅ | `.github/workflows/lighthouse.yml` |
| Chromatic visual regression | ✅ | `.github/workflows/chromatic.yml` |

---

## Deployment & Operations

| Feature | Status | Evidence / Notes |
| :------ | :----- | :--------------- |
| Docker frontend image | ✅ | `Dockerfile` |
| Docker server image | ✅ | `Dockerfile.server` |
| Helm chart | ✅ | `helm/nexus-hems/` |
| GitHub Pages deploy | ✅ | `.github/workflows/deploy.yml` |
| Automated container registry push | ⏳ | Images built locally only; no CI push to GHCR |
| Automated Helm deploy / lint in CI | ⏳ | No workflow validates the chart in CI |
| Tauri desktop build | ⚠️ | `apps/web/src-tauri/` exists; auto-updater removed |
| Capacitor mobile build | ⚠️ | Core/cli at 8.x, plugins aligned in `package.json`; verify with `cap sync` |

---

## Deferred / Removed

| Feature | Status | Reason |
| :------ | :----- | :----- |
| Tauri auto-updater | ❌ Removed | Key-management overhead disproportionate for single-maintainer homelab project |
| Multi-user RBAC | ⏳ Deferred | ADR-009; planned for future release |

---

## How to update this file

1. After implementing a feature, change its status symbol and add evidence.
2. If a feature moves from ⏳ to ✅ or ⚠️, update README.md and any affected docs.
3. If a feature is removed, mark ❌ and explain why.
