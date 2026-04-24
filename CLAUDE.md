# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nexus-HEMS Dashboard is a production-grade, real-time Home Energy Management System dashboard. It consolidates 10 protocol adapters (Victron MQTT, Modbus/SunSpec, KNX, OCPP 2.1, EEBUS/SPINE, and 5 contrib adapters) into a unified React 19 SPA served by an Express 5 backend. Deployable as PWA, Docker container, Tauri desktop app, or Capacitor mobile app.

## Commands

```bash
# Development
pnpm dev               # Express + Vite HMR dev server
pnpm build             # Production build → dist/
pnpm preview           # Preview production build

# Verification (run before every commit)
pnpm verify:basis      # type-check + lint + test:run (the local gate)
pnpm type-check        # tsc --noEmit (strict mode)
pnpm lint              # biome check + eslint --max-warnings 0 (read-only)
pnpm lint:fix          # biome check --write + eslint --fix
pnpm format            # biome format --write src/

# Testing
pnpm test              # Vitest watch mode
pnpm test:run          # All unit tests, one-shot
pnpm test:coverage     # With V8 coverage report
pnpm test:fuzz         # Security fuzz tests only
pnpm test:e2e          # Playwright (CI-first — prefer targeted specs locally)
pnpm test:a11y         # Accessibility spec only

# Docker
pnpm docker:build && pnpm docker:up   # Build and run on port 8080
```

**Local verification order:** `type-check` → `lint` → targeted unit tests. Full E2E/Lighthouse/security scans are CI-first; only run locally when CI is unavailable or explicitly requested.

## Architecture

### Stack

React 19 · TypeScript ~5.8 (strict) · Vite 8 (Rolldown) · Tailwind CSS v4 · Zustand 5 · TanStack Query v5 · React Router DOM v7 · Dexie.js v4 · Express 5 · Zod · jose · MQTT · D3 + d3-sankey · Recharts · motion (Framer Motion successor) · Radix UI · Lucide React

### Dual Zustand Store Pattern (critical)

- **`useAppStore`** (`src/store.ts`) — UI/settings with `persist` middleware → localStorage. Holds `EnergyData`, `FloorplanState`, `StoredSettings`, locale, theme.
- **`useEnergyStore`** (`src/core/useEnergyStore.ts`) — adapter aggregation into `UnifiedEnergyModel`; no persistence. Synced back via `useAdapterBridge()`.
- Settings/UI state → `useAppStore`. Real-time energy data → `useEnergyStore`.
- Use `useAppStoreShallow` for multiple selectors — never two separate `useAppStore` calls in the same render path.

### Adapter System

All adapters implement `EnergyAdapter` interface (`src/core/adapters/EnergyAdapter.ts`). Contrib adapters extend `BaseAdapter` for circuit breaker, Zod validation, reconnect logic.

`AdapterRegistry` (`src/core/adapters/adapter-registry.ts`) handles three registration paths:
```typescript
registerAdapter('my-adapter', (config) => new MyAdapter(config));  // static
await loadContribAdapter('homeassistant-mqtt');                      // dynamic
const ids = await loadAllContribAdapters();                         // load all contrib
```

Plugin lifecycle (OSGi-inspired): install → resolve → start → stop → uninstall. Hot-loading from Settings UI supported. Activation timeout: 10 s.

### Key Infrastructure

- **Circuit Breaker** (`src/core/circuit-breaker.ts`): FSM CLOSED → OPEN → HALF_OPEN. Failure threshold 5, cooldown 30 s, half-open success threshold 2. Built into BaseAdapter.
- **Command Safety** (`src/core/command-safety.ts`): All hardware commands go through Zod schema validation, rate limiting (30 cmd/min), IndexedDB audit trail.
- **Web Workers**: AI inference (`ai-worker.ts`), Sankey layout (`sankey-worker.ts`), REST polling (`adapter-worker.ts`, SSRF-hardened URL allowlist).
- **MPC Optimizer** (`src/lib/optimizer.ts`): EMHASS-inspired LP day-ahead scheduler with PV/load forecasting, battery constraints, tariff-aware cost minimization.
- **AI Client** (`src/core/aiClient.ts`): Multi-provider (OpenAI, Anthropic, Gemini, xAI, Groq, Ollama). API keys encrypted AES-GCM 256-bit in IndexedDB via `src/lib/ai-keys.ts` — never in env vars or plain text.

### Server

- `server.ts` (root) thin wrapper → `startServer()` in `src/server/index.ts`
- All routes are Express Router factories (`createXxxRoutes()`) mounted via `app.use()`
- `requireJWT` protects all endpoints except `/api/health`
- `ADAPTER_MODE=mock|live` controls mock vs live adapter data
- Production requires `JWT_SECRET`, `API_KEYS`, `WS_ORIGINS` env vars

### React Compiler

Auto-memoization via `babel-plugin-react-compiler`. Never add manual `useCallback`/`useMemo` unless confirmed React Compiler cannot handle the case.

## Toolchain Rules

**Biome 2.4.7 is the primary linter and formatter.** ESLint is retained only for three React plugins Biome cannot replace: `react-compiler/react-compiler`, `react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps`, `react-refresh/only-export-components`.

**Do NOT re-add:** `prettier`, `prettier-plugin-tailwindcss`, `eslint-plugin-prettier`, `eslint-config-prettier`, `@eslint/js`, `typescript-eslint`, `@typescript-eslint/*`, `globals`, `eslint-plugin-react`.

Biome settings: line width 100, 2-space indent, LF, single quotes, trailing commas, semicolons always. `noExplicitAny`: error — use `unknown`, precise interfaces, or discriminated unions instead.

Use `pnpm.overrides` (never top-level `"overrides"`) for dependency overrides.

## Critical Constraints

- **Never break** `SankeyDiagram.tsx` (D3 Sankey energy flow) or `Floorplan.tsx` (KNX floorplan).
- **Never introduce** Redux, MobX, or alternative state libraries.
- **Never use** Tailwind v3 syntax (`@apply` in arbitrary selectors, `tailwind.config.js` as sole config) — use Tailwind v4 `@theme` / `@import 'tailwindcss'` syntax.
- **Never store** API keys in env vars or unencrypted.
- **Never skip i18n** — every user-visible string uses `t()`. Update both `src/locales/en.ts` and `src/locales/de.ts` (German is fallback).
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

5 themes in `src/design-tokens.ts`: `energy-dark`, `solar-light`, `ocean-dark` (default), `nature-green`, `minimal-white`. CSS custom properties via Tailwind v4 `@theme` in `src/index.css`. Brand utilities: `glass-panel`, `neon-glow-green/blue/orange`, `energy-pulse`, `focus-ring`. See `DESIGN-SYSTEM.md` for full catalog.

## Commit Convention

Conventional Commits enforced by commitlint. Types: `feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert, security, a11y, i18n`. Scopes include: `sankey, floorplan, adapter, victron, knx, eebus, ocpp, modbus, tariff, ai, pwa, store, ui, settings, auth, db, e2e, deps, docker, ci, theme`.

## Workflow for Every Change

1. Read relevant files before modifying: affected components, adapter interfaces, both Zustand stores.
2. Implement changes following all rules above.
3. Add/update i18n keys in both `src/locales/en.ts` and `src/locales/de.ts`.
4. Run `pnpm type-check && pnpm lint` — zero TypeScript errors, zero lint warnings.

## Key Docs

- `docs/Adapter-Dev-Guide.md` — how to write new adapters
- `docs/Toolchain-Architecture.md` — living toolchain reference
- `docs/Security-Architecture.md` — threat model, STRIDE, GDPR
- `docs/Deployment-Guide.md` — Docker/Helm/Tauri deployment
