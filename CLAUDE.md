# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nexus-HEMS Dashboard is a production-grade, real-time Home Energy Management System dashboard. It consolidates 10 protocol adapters (Victron MQTT, Modbus/SunSpec, KNX, OCPP 2.1, EEBUS/SPINE, and 5 contrib adapters) into a unified React 19 SPA served by an Express 5 backend. Deployable as PWA, Docker container, Tauri desktop app, or Capacitor mobile app.

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

# Verification (run before every commit)
pnpm verify:basis      # type-check + lint + test:run (the local gate)
pnpm type-check        # tsc --noEmit across all workspaces (strict mode)
pnpm lint              # biome check + eslint --max-warnings 0 (read-only)
pnpm lint:fix          # biome check --write + eslint --fix
pnpm format            # biome format --write apps/ packages/
pnpm format:check      # biome format apps/ packages/ (Biome 2.4 read-only)

# Testing
pnpm test              # Vitest watch mode (apps/web)
pnpm test:run          # All unit tests, one-shot
pnpm test:coverage     # With V8 coverage report
pnpm test:fuzz         # Security fuzz tests only
pnpm test:e2e          # Playwright (local Chromium-only; CI runs Chromium + Firefox)
pnpm test:a11y         # Accessibility spec only

# Workspace-targeted (when you need to act on a single package)
pnpm --filter @nexus-hems/web <script>
pnpm --filter @nexus-hems/api <script>

# Docker
pnpm docker:build && pnpm docker:up   # Build and run on port 8080
```

**Local verification order:** `type-check` → `lint` → targeted unit tests. Do not run heavy checks in parallel on local hardware. Full E2E/Lighthouse/security scans are CI-first; only run locally when CI is unavailable or explicitly requested.

**Playwright policy:** local `pnpm test:e2e` is intentionally Chromium-only. CI installs and runs Chromium + Firefox. WebKit and mobile browser projects are disabled until explicitly re-enabled.

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

All adapters implement `EnergyAdapter` interface (`apps/web/src/core/adapters/EnergyAdapter.ts`). Contrib adapters extend `BaseAdapter` for circuit breaker, Zod validation, reconnect logic.

`AdapterRegistry` (`apps/web/src/core/adapters/adapter-registry.ts`) handles three registration paths:
```typescript
registerAdapter('my-adapter', (config) => new MyAdapter(config));  // static
await loadContribAdapter('homeassistant-mqtt');                      // dynamic
const ids = await loadAllContribAdapters();                         // load all contrib
```

Plugin lifecycle (OSGi-inspired): install → resolve → start → stop → uninstall. Hot-loading from Settings UI supported. Activation timeout: 10 s.

### Key Infrastructure

- **Circuit Breaker** (`apps/web/src/core/circuit-breaker.ts`): FSM CLOSED → OPEN → HALF_OPEN. Failure threshold 5, cooldown 30 s, half-open success threshold 2. Built into BaseAdapter.
- **Command Safety** (`apps/web/src/core/command-safety.ts`): All hardware commands go through Zod schema validation, rate limiting (30 cmd/min), IndexedDB audit trail.
- **Web Workers**: AI inference (`ai-worker.ts`), Sankey layout (`sankey-worker.ts`), REST polling (`adapter-worker.ts`, SSRF-hardened URL allowlist).
- **MPC Optimizer** (`apps/web/src/lib/optimizer.ts`): EMHASS-inspired LP day-ahead scheduler with PV/load forecasting, battery constraints, tariff-aware cost minimization.
- **AI Client** (`apps/web/src/core/aiClient.ts`): Multi-provider (OpenAI, Anthropic, Gemini, xAI, Groq, Ollama). API keys encrypted AES-GCM 256-bit in IndexedDB via `apps/web/src/lib/ai-keys.ts` — never in env vars or plain text.
- **Shared Types** (`packages/shared-types/src/protocol.ts`): Zod schemas for `EnergyData`, `WSCommand`, `AuthToken`, `UnifiedEnergyModel`, etc. Import as `@nexus-hems/shared-types`.

### Server

- `apps/api/index.ts` thin wrapper → `startServer()` in `apps/api/src/index.ts`
- All routes are Express Router factories (`createXxxRoutes()`) mounted via `app.use()`
- `requireJWT` protects all endpoints except `/api/health`
- JWT utilities: `apps/api/src/jwt-utils.ts`
- `ADAPTER_MODE=mock|live` controls mock vs live adapter data
- Production requires `JWT_SECRET`, `API_KEYS`, `WS_ORIGINS` env vars

### React Compiler

Auto-memoization via `babel-plugin-react-compiler`. Never add manual `useCallback`/`useMemo` unless confirmed React Compiler cannot handle the case.

## Toolchain Rules

**Biome 2.4.7 is the primary linter and formatter.** ESLint is retained only for three React plugins Biome cannot replace: `react-compiler/react-compiler`, `react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps`, `react-refresh/only-export-components`.

**Do NOT re-add:** `prettier`, `prettier-plugin-tailwindcss`, `eslint-plugin-prettier`, `eslint-config-prettier`, `@eslint/js`, `typescript-eslint`, `@typescript-eslint/*`, `globals`, `eslint-plugin-react`.

Biome settings: line width 100, 2-space indent, LF, single quotes, trailing commas, semicolons always. `noExplicitAny`: error — use `unknown`, precise interfaces, or discriminated unions instead.

Biome 2.4 note: use `biome format apps/ packages/` for the read-only `format:check` script. Do not use `biome format --write=false`; this version rejects that flag/value combination.

Use `pnpm.overrides` (never top-level `"overrides"`) for dependency overrides.

## Critical Constraints

- **Never break** `SankeyDiagram.tsx` (D3 Sankey energy flow) or `Floorplan.tsx` (KNX floorplan).
- **Never introduce** Redux, MobX, or alternative state libraries.
- **Never use** Tailwind v3 syntax (`@apply` in arbitrary selectors, `tailwind.config.js` as sole config) — use Tailwind v4 `@theme` / `@import 'tailwindcss'` syntax.
- **Never store** API keys in env vars or unencrypted.
- **Never skip i18n** — every user-visible string uses `t()`. Update both `apps/web/src/locales/en.ts` and `apps/web/src/locales/de.ts` (German is fallback).
- **Never remove** accessibility features. WCAG 2.2 AA mandatory. `type="button"` on all non-submit buttons; `aria-hidden` on decorative icons.
- All lazy-loaded pages use `React.lazy` + `Suspense`.

## Unified App Sections

7 top-level routes (legacy routes redirect to unified equivalents):

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

## Design System

5 themes in `apps/web/src/design-tokens.ts`: `energy-dark`, `solar-light`, `ocean-dark` (default), `nature-green`, `minimal-white`. CSS custom properties via Tailwind v4 `@theme` in `apps/web/src/index.css`. Brand utilities: `glass-panel`, `neon-glow-green/blue/orange`, `energy-pulse`, `focus-ring`. See `DESIGN-SYSTEM.md` for full catalog.

## Commit Convention

Conventional Commits enforced by commitlint. Types: `feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert, security, a11y, i18n`. Scopes include: `sankey, floorplan, adapter, victron, knx, eebus, ocpp, modbus, tariff, ai, pwa, store, ui, settings, auth, db, e2e, deps, docker, ci, theme`.

## Workflow for Every Change

1. Read relevant files before modifying: affected components, adapter interfaces, both Zustand stores.
2. Implement changes following all rules above.
3. Add/update i18n keys in both `apps/web/src/locales/en.ts` and `apps/web/src/locales/de.ts`.
4. Verify with staged, non-parallel checks: `time pnpm type-check` → `pnpm lint` → targeted tests. For docs/config-only changes, prefer targeted Biome/format checks plus CI instead of exhausting local hardware.

## Key Docs

- `docs/Adapter-Dev-Guide.md` — how to write new adapters
- `docs/Toolchain-Architecture.md` — living toolchain reference
- `docs/Security-Architecture.md` — threat model, STRIDE, GDPR
- `docs/Deployment-Guide.md` — Docker/Helm/Tauri deployment
