# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nexus-HEMS Dashboard is a production-grade, real-time Home Energy Management System dashboard. It consolidates 13 protocol adapters (7 core: Victron MQTT, Modbus/SunSpec, KNX, OCPP 2.1, EEBUS/SPINE, evcc, OpenEMS; 6 contrib: Home Assistant, Matter/Thread, Zigbee2MQTT, Shelly, OpenADR 3.1, Example) into a unified React 19 SPA served by an Express 5 backend. Deployable as PWA, Docker container, Tauri desktop app, Helm/Kubernetes release, or Capacitor mobile app. Current package version: `1.1.0`.

The shipped baseline is still `1.1.0`. Active `1.2.0` work tracked in `CHANGELOG.md` and `docs/Technical-Debt-Registry.md` should be treated as in-flight design and remediation context, not as guaranteed shipped behavior.

**Repository structure:** pnpm workspace monorepo managed by Turborepo.

```
apps/api/        — @nexus-hems/api   — Express 5 backend (entry: apps/api/index.ts)
apps/web/        — @nexus-hems/web   — React 19 Vite SPA  (entry: apps/web/src/main.tsx)
packages/shared-types/ — @nexus-hems/shared-types — Zod schemas + inferred types
```

## Commands

```bash
# Development (from repo root)
pnpm dev               # turbo dev → starts apps/api (port 3000) + apps/web (port 5173)
pnpm build             # turbo build → production builds for all packages
pnpm preview           # Preview apps/web production build

# Verification (staged; do not run heavyweight checks in parallel locally)
pnpm verify:basis      # turbo type-check lint test:run (full local gate)
pnpm type-check        # tsc --noEmit across all workspaces (strict mode)
pnpm lint              # biome check + eslint --max-warnings 0 (read-only)
pnpm lint:fix          # biome check --write + eslint --fix
pnpm format            # biome format --write apps/ packages/
pnpm format:check      # biome format apps/ packages/ (Biome 2.4 read-only)

# Testing
pnpm test:run          # All unit tests, one-shot
pnpm test:coverage     # With V8 coverage report
pnpm test:fuzz         # Security fuzz tests only
pnpm test:e2e          # Playwright (local Chromium-only; CI runs Chromium + Firefox)
pnpm test:e2e:ui       # Playwright interactive UI mode (for debugging E2E locally)
pnpm test:a11y         # Accessibility spec only

# Run a single test file (unit)
pnpm --filter @nexus-hems/web exec vitest run src/path/to/file.test.ts
pnpm --filter @nexus-hems/api exec vitest run src/path/to/file.test.ts

# Run a single E2E spec file
pnpm --filter @nexus-hems/web exec playwright test tests/e2e/accessibility.spec.ts

# Workspace-targeted scripts
pnpm --filter @nexus-hems/web <script>
pnpm --filter @nexus-hems/api <script>

# Docker
pnpm docker:build && pnpm docker:up   # Build and run on port 8080

# Storybook (component development, port 6006)
pnpm storybook         # Dev server
pnpm storybook:build   # Static build

# Bundle size check (enforced in CI)
pnpm size              # size-limit against gzipped bundles
```

**Local verification order:** `type-check` → `lint` → targeted unit tests. Do not run heavy checks in parallel on local hardware. Full E2E/Lighthouse/security scans are CI-first; only run locally when CI is unavailable or explicitly requested.

**Playwright policy:** local `pnpm test:e2e` is intentionally Chromium-only. CI installs and runs Chromium + Firefox. For GitHub Pages route tests, always use base-relative navigation (`page.goto('./')`, `page.goto('./settings')`) — never `page.goto('/')` or `page.goto('/settings')`. The `baseURL` is `http://127.0.0.1:4173/Nexus-HEMS-Dash/`; an absolute path like `/settings` strips the base and lands on the wrong origin path.

**Writing new E2E tests:** Every `test.describe` block must call `await page.addInitScript(setupLocalStorage)` in `beforeEach` (imported from `./e2e-setup`). This sets `onboardingCompleted: true` and dismisses all page-tour overlays via `nexus-tour-{id}` localStorage keys. Without it, the onboarding screen or tour modals block all interactions.

**`VITE_E2E_TESTING`:** When `VITE_E2E_TESTING=true` is set at build time (both CI workflows do this), the service-worker `controllerchange` auto-reload in `main.tsx` is disabled. This prevents mid-test page reloads caused by the SW installing fresh in each browser context. Do not remove this guard.

## Architecture

### Monorepo Layout

| Package | Name | Description |
|---|---|---|
| `apps/api` | `@nexus-hems/api` | Express 5 + WebSocket backend. Entry: `apps/api/index.ts` → `apps/api/src/index.ts` |
| `apps/web` | `@nexus-hems/web` | React 19 Vite SPA. Entry: `apps/web/src/main.tsx` |
| `packages/shared-types` | `@nexus-hems/shared-types` | Zod schemas + TS types shared between api and web |

**Key monorepo files:** `pnpm-workspace.yaml` · `turbo.json` · `tsconfig.base.json` (ultra-strict root)

In dev: `apps/web` (Vite, port 5173) proxies `/api/*`, `/metrics`, `/ws` → `apps/api` (Express, port 3000).

### Stack

React 19 · TypeScript ~5.8 (strict) · Vite 8 (Rolldown) · Tailwind CSS v4 · Zustand 5 · TanStack Query v5 · React Router DOM v7 · Dexie.js v4 · Express 5 · Zod · jose · MQTT · D3 + d3-sankey · Recharts · motion (Framer Motion successor) · Radix UI · Lucide React

### Dual Zustand Store Pattern (critical)

- **`useAppStore`** (`apps/web/src/store.ts`) — UI/settings with `persist` middleware → localStorage. Holds `EnergyData`, `FloorplanState`, `StoredSettings`, locale, theme.
- **`useEnergyStore`** (`apps/web/src/core/useEnergyStore.ts`) — adapter aggregation into `UnifiedEnergyModel`; no persistence. Synced back via `useAdapterBridge()`.
- Settings/UI state → `useAppStore`. Real-time energy data → `useEnergyStore`.
- Use `useAppStoreShallow` for multiple selectors — never two separate `useAppStore` calls in the same render path.

### Adapter System

All adapters implement `EnergyAdapter` interface (`apps/web/src/core/adapters/EnergyAdapter.ts`). Adapters extending `BaseAdapter` get circuit breaker, Zod validation, and reconnect logic for free.

**7 core adapters** (`apps/web/src/core/adapters/`):
- `VictronMQTTAdapter` — Victron Cerbo GX / Venus OS via MQTT-over-WebSocket
- `ModbusSunSpecAdapter` — SunSpec Models 103/124/201 via REST bridge
- `KNXAdapter` — KNX/IP via knxd WebSocket bridge
- `OCPP21Adapter` — EV charging, V2X, ISO 15118, §14a EnWG
- `EEBUSAdapter` — EEBUS SPINE/SHIP, mDNS, TLS 1.3 mTLS
- `EvccAdapter` — evcc backend (95%+ hardware support) via REST + WebSocket
- `OpenEMSAdapter` — OpenEMS Edge via JSON-RPC 2.0 over WebSocket

**6 contrib adapters** (`apps/web/src/core/adapters/contrib/`):
- `HomeAssistantMQTTAdapter`, `MatterThreadAdapter`, `Zigbee2MQTTAdapter`, `ShellyRESTAdapter`
- `OpenADR31Adapter` — OpenADR 3.1.0 VEN client for demand-response events
- `ExampleContribAdapter` — template for custom adapter development

`AdapterRegistry` (`apps/web/src/core/adapters/adapter-registry.ts`) handles three registration paths:
```typescript
registerAdapter('my-adapter', (config) => new MyAdapter(config));  // static
await loadContribAdapter('homeassistant-mqtt');                      // dynamic
const ids = await loadAllContribAdapters();                         // load all contrib
```

Plugin lifecycle (OSGi-inspired): install → resolve → start → stop → uninstall. Hot-loading from Settings UI supported. Activation timeout: 10 s. External adapters should export `{ id, factory }` or register through the local adapter registry; do not document a non-existent `@nexus-hems/adapter-registry` package.

### Key Infrastructure

- **Circuit Breaker** (`apps/web/src/core/circuit-breaker.ts`): FSM CLOSED → OPEN → HALF_OPEN. Failure threshold 5, cooldown 30 s, half-open success threshold 2. Built into BaseAdapter.
- **Command Safety** (`apps/web/src/core/command-safety.ts`): All hardware commands go through Zod schema validation, rate limiting (30 cmd/min), IndexedDB audit trail.
- **Web Workers**: AI inference (`ai-worker.ts`), Sankey layout (`sankey-worker.ts`), REST polling (`adapter-worker.ts`, SSRF-hardened URL allowlist).
- **MPC Optimizer** (`apps/web/src/lib/optimizer.ts`): EMHASS-inspired LP day-ahead scheduler with PV/load forecasting, battery constraints, tariff-aware cost minimization.
- **AI Client** (`apps/web/src/core/aiClient.ts`): Multi-provider (OpenAI, Anthropic, Gemini, xAI, Groq, Ollama). API keys encrypted AES-GCM 256-bit in IndexedDB via `apps/web/src/lib/ai-keys.ts` — never in env vars or plain text.
- **Shared Types** (`packages/shared-types/src/protocol.ts`): Zod schemas for `EnergyData`, `WSCommand`, `AuthToken`, `UnifiedEnergyModel`, etc. Import as `@nexus-hems/shared-types`.
- **VPP Service** (`apps/web/src/core/vpp-service.ts`): Virtual Power Plant aggregation per UC 2.6.2 / VDE-AR-E 2829-6 — composes flex offers from battery/EV/heat-pump, submits via OpenADR 3.1 API proxy.
- **UC26 Translator** (`apps/web/src/core/uc26-translator.ts`): Matter↔OpenADR 3.1 interworking (UC 2.6.1–2.6.3) — translates DR events to Matter DEM cluster commands.

### App Shell Structure

`AppShell` (`apps/web/src/components/layout/AppShell.tsx`) renders a `<main id="main-content">` that wraps all route content. All page components render their `<h1>` inside this element via `PageHeader`. E2E tests should use `page.locator('#main-content h1')` to target page-specific headings rather than a bare `h1` selector.

When `onboardingCompleted` is false, AppShell receives `inert` and the `<Onboarding>` overlay renders instead. `e2e-setup.ts` prevents this by writing the store state to localStorage before page load.

### Server

- `apps/api/index.ts` thin wrapper → `startServer()` in `apps/api/src/index.ts`
- All routes are Express Router factories (`createXxxRoutes()`) mounted via `app.use()`
- `requireJWT` protects all endpoints except `/api/health`
- JWT utilities: `apps/api/src/jwt-utils.ts`
- `ADAPTER_MODE=mock|live` controls mock vs live adapter data
- Production requires `JWT_SECRET`, `API_KEYS`, `WS_ORIGINS` env vars

### Backend Protocol Adapters

Distinct from the frontend adapter system. Lives in `apps/api/src/protocols/` and runs on edge hardware (Raspberry Pi / NUC) with direct network access.

Data flow: `Hardware → IProtocolAdapter → EventBus (500ms buffer) → InfluxDB + WebSocket Gateway → React UI`

- Implement `IProtocolAdapter` from `@nexus-hems/shared-types` (not `EnergyAdapter` — that's the frontend interface)
- Validate every datapoint with `energyDatapointSchema.safeParse()` before emitting; route failures to Dead-Letter Queue
- Register adapters in `apps/api/src/protocols/index.ts`
- Modbus-based adapters must also update `device-map.json`
- See `docs/Protocol-Adapter-Guide-Backend.md` for reconnect patterns, DLQ, and full testing checklist

### React Compiler

Auto-memoization via `babel-plugin-react-compiler`. Never add manual `useCallback`/`useMemo` unless confirmed React Compiler cannot handle the case.

## Toolchain Rules

**Biome 2.4.7 is the primary linter and formatter.** ESLint is retained only for React plugins Biome cannot replace: `react-compiler/react-compiler`, `react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps`, `react-refresh/only-export-components`.

**Do NOT re-add:** `prettier`, `prettier-plugin-tailwindcss`, `eslint-plugin-prettier`, `eslint-config-prettier`, `@eslint/js`, `typescript-eslint`, `@typescript-eslint/*`, `globals`, `eslint-plugin-react`.

Biome settings: line width 100, 2-space indent, LF, single quotes, trailing commas, semicolons always. `noExplicitAny`: error — use `unknown`, precise interfaces, or discriminated unions instead.

Current enforced coverage thresholds are package-specific:
- `apps/web/vitest.config.ts`: 52 statements / 42 branches / 53 functions / 53 lines
- `apps/api/vitest.config.ts`: 55 statements / 45 branches / 55 functions / 55 lines
- `docs/Testing-Coverage-Strategy.md` contains the higher staged roadmap targets; do not assume those targets are already enforced in config.

Biome 2.4 note: use `biome format apps/ packages/` for the read-only `format:check` script. Do not use `biome format --write=false`; this version rejects that flag/value combination.

Use `pnpm.overrides` (never top-level `"overrides"`) for dependency overrides. Keep `pnpm.onlyBuiltDependencies` in sync with approved native/postinstall packages (`esbuild`, `better-sqlite3`, serialport bindings, `core-js`, `protobufjs`, and all `@rolldown/binding-*` platform packages).

## Critical Constraints

- **Never break** `SankeyDiagram.tsx` (D3 Sankey energy flow) or `Floorplan.tsx` (KNX floorplan).
- **Never introduce** Redux, MobX, or alternative state libraries.
- **Never use** Tailwind v3 syntax (`@apply` in arbitrary selectors, `tailwind.config.js` as sole config) — use Tailwind v4 `@theme` / `@import 'tailwindcss'` syntax.
- **Never store** API keys in env vars or unencrypted.
- **Never skip i18n** — every user-visible string uses `t()`. Update both `apps/web/src/locales/en.ts` and `apps/web/src/locales/de.ts` (German is fallback).
- **Never remove** accessibility features. WCAG 2.2 AA mandatory. `type="button"` on all non-submit buttons; `aria-hidden` on decorative icons.
- All lazy-loaded pages use `React.lazy` + `Suspense`.

## Unified App Sections

8 primary routes across 7 navigation sections (legacy routes redirect to unified equivalents):

| Route | Page | Description |
|---|---|---|
| `/` | `CommandHub` | KPI cards, mini Sankey, quick-nav |
| `/energy-flow` | `LiveEnergyFlow` | Full Sankey + production/storage/grid tabs |
| `/devices` | `DevicesAutomation` | EV/OCPP, floorplan, controllers, plugins |
| `/optimization-ai` | `OptimizationAI` | MPC optimizer, schedules, AI forecast |
| `/tariffs` | `TariffsPage` | Live prices, tariff comparison, cost analytics |
| `/analytics` | `Analytics` | Historical charts, export/sharing |
| `/monitoring` | `Monitoring` | Adapter status, circuit breakers, system health |
| `/settings` | `SettingsUnified` | Config, adapters, language, theme |
| `/plugins` | `PluginsPage` | Adapter plugin browser & hot-loading (SettingsLayout) |
| `/settings/ai` | `AISettingsPage` | AI provider keys & model config (SettingsLayout) |
| `/help` | `Help` | Docs, FAQ, about, AI acknowledgments (SettingsLayout) |

## Design System

5 themes in `apps/web/src/design-tokens.ts`: `energy-dark`, `solar-light`, `ocean-dark` (default), `nature-green`, `minimal-white`. CSS custom properties via Tailwind v4 `@theme` in `apps/web/src/index.css`. Brand utilities: `glass-panel`, `neon-glow-green/blue/orange`, `energy-pulse`, `focus-ring`. See `DESIGN-SYSTEM.md` for full catalog.

## Performance Budgets

Enforced by `pnpm size` (size-limit) and Lighthouse CI. Do not exceed:

| Metric | Budget |
|---|---|
| Total JS (gzipped) | ≤ 1100 KB |
| Total CSS (gzipped) | ≤ 25 KB |
| Framework chunk | ≤ 85 KB |
| Vendor Recharts | ≤ 110 KB |
| FCP | ≤ 3000 ms |
| LCP | ≤ 4000 ms |
| TBT | ≤ 400 ms (Lighthouse error) |
| CLS | ≤ 0.1 (Lighthouse error) |
| Perf score | ≥ 85% |
| A11y score | ≥ 90% |

## Commit Convention

Conventional Commits enforced by commitlint. Types: `feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert, security, a11y, i18n`. Scopes include: `sankey, floorplan, adapter, victron, knx, eebus, ocpp, modbus, tariff, ai, pwa, store, ui, settings, auth, db, e2e, deps, docker, ci, theme`.

**Create an ADR** (`docs/adr/ADR-NNN-title.md`) when a change affects: state management approach, new external dependency >50 KB gzipped, protocol adapter architecture, security model, or build toolchain.

## Workflow for Every Change

1. Read relevant files before modifying: affected components, adapter interfaces, both Zustand stores.
2. Implement changes following all rules above.
3. Add/update i18n keys in both `apps/web/src/locales/en.ts` and `apps/web/src/locales/de.ts`.
4. Verify with staged, non-parallel checks: `time pnpm type-check` → `pnpm lint` → targeted tests. For docs/config-only changes, prefer targeted Markdown/diff checks plus CI instead of exhausting local hardware.

When CI is the source of truth, push focused commits and monitor GitHub Actions with non-interactive `gh` commands (`GH_PAGER=cat PAGER=cat gh run view ...`). Avoid terminal UI commands such as `gh run watch` in this workspace because they can leave control sequences in the shell.

## Key Docs

- `docs/Adapter-Dev-Guide.md` — how to write new frontend adapters
- `docs/Protocol-Adapter-Guide-Backend.md` — backend `IProtocolAdapter` implementation guide
- `docs/Toolchain-Architecture.md` — living toolchain reference
- `docs/Security-Architecture.md` — threat model, STRIDE, GDPR
- `docs/Deployment-Guide.md` — Docker/Helm/Tauri deployment

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
