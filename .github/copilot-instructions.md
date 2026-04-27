You are an expert full-stack React 19 + TypeScript architect specialized in real-time HEMS dashboards (Victron Cerbo GX, KNX, EEBUS SPINE/SHIP, OCPP 2.1, dynamic tariffs Tibber/aWATTar, SG Ready).

**Repository layout:** pnpm workspace monorepo (Turborepo). Three packages:
- `apps/api` (`@nexus-hems/api`) — Express 5 backend, entry `apps/api/index.ts`
- `apps/web` (`@nexus-hems/web`) — React 19 Vite SPA, entry `apps/web/src/main.tsx`
- `packages/shared-types` (`@nexus-hems/shared-types`) — Zod protocol schemas, import as `@nexus-hems/shared-types`

Root files: `pnpm-workspace.yaml` · `turbo.json` · `tsconfig.base.json` (ultra-strict, inherited by all workspaces).

The shipped baseline is `1.1.0`. Active `v1.2.0` work tracked in `CHANGELOG.md` and `docs/Technical-Debt-Registry.md` is authoritative roadmap context for in-flight work, but must not be described as guaranteed shipped functionality unless it is verified in code.

---

## PROJECT RULES — THIS IS LAW (always follow strictly)

### Core Stack (never deviate)

- **React 19** + **Vite 8** (Rolldown bundler) + **TypeScript ~5.8** (strict mode)
- **React Compiler** (`@rolldown/plugin-babel` + `babel-plugin-react-compiler` + `reactCompilerPreset`) — auto-memoization, never add manual `memo`/`useMemo`/`useCallback` unless React Compiler cannot handle it
- **Zustand v5** for state — never introduce Redux, MobX or other state libraries
- **TanStack React Query v5** for async data fetching/caching
- **React Router DOM v7** with `BrowserRouter`, `basename` from `import.meta.env.BASE_URL`
- **Tailwind CSS v4** (new `@theme` / `@import 'tailwindcss'` syntax) — no Tailwind v3 `@apply` patterns
- **`motion`** (successor of Framer Motion, import from `motion/react`) for all animations
- **D3.js** + **d3-sankey** for the Sankey energy-flow diagram
- **Recharts** for time-series charts and analytics
- **Dexie.js v4** for IndexedDB persistence (offline cache, encrypted AI keys, settings)
- **Radix UI** for accessible primitives (Dialog, Dropdown, Tooltip, VisuallyHidden)
- **Lucide React** as icon library
- **jsPDF** + **QRCode** for PDF reports and QR sharing

### State Architecture (dual Zustand stores)

- **`useAppStore`** (`apps/web/src/store.ts`) — UI/settings store with `persist` middleware (localStorage). Holds `EnergyData`, `FloorplanState`, `StoredSettings`, locale, theme, onboarding state.
- **`useEnergyStore`** (`apps/web/src/core/useEnergyStore.ts`) — Adapter aggregation store. Merges all active adapters into a `UnifiedEnergyModel`. No persistence. Bridge hook `useAdapterBridge()` syncs data back to `useAppStore`.
- When adding new state: settings/UI → `useAppStore`; real-time energy data → `useEnergyStore`.
- Use `useAppStoreShallow` for multiple selectors to merge subscriptions — never two separate `useAppStore` calls for data from the same render path.
- For selectors that access only one or two scalar values, use `useAppStore((s) => s.settings.x)` direct scalar selectors — never subscribe to the whole `settings` object.

### Adapter System (13 adapters: 7 core + 6 contrib)

All adapters in `apps/web/src/core/adapters/` implement the `EnergyAdapter` interface (`EnergyAdapter.ts`).
Contrib adapters extend `BaseAdapter` (`BaseAdapter.ts`) for simplified development.
The `AdapterRegistry` (`adapter-registry.ts`) manages registration, lifecycle, and dynamic loading.

**Core Adapters (7):**

- **VictronMQTTAdapter** — Victron Cerbo GX / Venus OS via MQTT-over-WebSocket
- **ModbusSunSpecAdapter** — SunSpec Models 103/124/201 via REST bridge (polling)
- **KNXAdapter** — KNX/IP via knxd WebSocket bridge
- **OCPP21Adapter** — EV charging, V2X, ISO 15118, §14a EnWG
- **EEBUSAdapter** — EEBUS SPINE/SHIP, VDE-AR-E 2829-6, mDNS, TLS 1.3 mTLS
- **EvccAdapter** — evcc backend (95%+ hardware support) via REST + WebSocket
- **OpenEMSAdapter** — OpenEMS Edge via JSON-RPC 2.0 over WebSocket

**Contrib Adapters (6) — Plugin System:**

- **HomeAssistantMQTTAdapter** — Home Assistant MQTT discovery / Mosquitto
- **MatterThreadAdapter** — Matter 1.3 / Thread 1.3 smart home devices
- **Zigbee2MQTTAdapter** — Zigbee devices via Zigbee2MQTT bridge
- **ShellyRESTAdapter** — Shelly Pro 3EM / Plus Plug S / Pro 4PM via HTTP/REST Gen2+
- **OpenADR31Adapter** — OpenADR 3.1.0 VEN client for demand-response events from a VTN
- **ExampleContribAdapter** — Template for custom adapter development

**Plugin System:**

```typescript
// Three registration paths via AdapterRegistry:
registerAdapter('my-adapter', (config) => new MyAdapter(config));   // static
await loadContribAdapter('homeassistant-mqtt');                       // dynamic (contrib/)
const ids = await loadAllContribAdapters();                          // load all contrib
```

- Plugin lifecycle: install → resolve → start → stop → uninstall (OSGi-inspired)
- `plugin-system.ts`: dependency injection, service registry, event bus, semver matching
- Plugin activation timeout: 10 s; hot-loading from Settings UI supported
- External adapter documentation must not reference a non-existent `@nexus-hems/adapter-registry` package. Use the local registry import for in-repo contrib adapters, or document external adapters as exporting `{ id, factory }`.

### Energy Controllers & Optimization

Eight real-time control loops in `apps/web/src/core/energy-controllers.ts` orchestrated by `ControllerPipeline`:

1. **ESS Symmetric** — bidirectional battery charge/discharge
2. **Peak Shaving** — grid peak demand limiting
3. **Grid-Optimized Charge** — charge when grid price is low
4. **Self-Consumption** — maximize PV self-consumption
5. **Emergency Capacity** — reserve battery for blackout
6. **HeatPump SG Ready** — SG Ready signals for heat pump control
7. **EV Smart Charge** — §14a EnWG-aware surplus charging and charge current control
8. **EV V2G Discharge** — ISO 15118-20 BPT discharge loop with SOC guardrails; disabled until BPT is negotiated

MPC optimizer (`apps/web/src/lib/optimizer.ts`): EMHASS-inspired LP day-ahead scheduler with PV/load forecasting, battery constraints, and tariff-aware cost minimization.

Command Safety Layer (`apps/web/src/core/command-safety.ts`): Zod schema validation, rate limiting (30 cmd/min), IndexedDB audit trail, danger command confirmation dialog.

VPP Service (`apps/web/src/core/vpp-service.ts`): Aggregates battery/EV/heat-pump into flex-market bids per UC 2.6.2 / VDE-AR-E 2829-6; submits via OpenADR 3.1 API proxy. DEV mode: bids are local-only.

UC26 Translator (`apps/web/src/core/uc26-translator.ts`): Translates OpenADR 3.1.0 DR events to Matter DEM cluster commands (UC 2.6.1–2.6.3 / Matter↔OpenADR interworking spec).

Circuit Breaker (`apps/web/src/core/circuit-breaker.ts`): FSM with CLOSED → OPEN → HALF_OPEN states; configurable failure threshold, cooldown, and `onStateChange` callbacks.

### Hardware Registry

`apps/web/src/core/hardware-registry.ts` — 120+ certified devices across 5 categories:

| Category    | Examples                                    |
| ----------- | ------------------------------------------- |
| Inverters   | Fronius Symo, SMA Sunny Boy, Victron Multi  |
| Wallboxes   | go-e Charger, ABB Terra, Webasto Live       |
| Meters      | Fronius Smart Meter, Eastron SDM630         |
| Batteries   | BYD HVS, Pylontech US5000, Victron Lynx     |
| Heat Pumps  | Vaillant aroTHERM, STIEBEL WPL, Nibe F1255 |

### Tariff Integration

5 providers via `apps/web/src/lib/tariff-providers.ts`: Tibber, aWATTar DE, aWATTar AT, Octopus Energy, Nordpool.

- `getDynamicGridFee()` — §14a EnWG time-of-use pricing
- `isPeakHour()` — morning/midday/evening peak detection
- `getGridFeeSchedule()` — 24-slot hourly fee array
- `applyDynamicGridFees()` — fee replacement + total recalculation

### i18n

- **react-i18next** with 2 locales: `de` (fallback) and `en`
- Locale files are TypeScript objects in `apps/web/src/locales/{de,en}.ts`
- Persistent language switcher in Settings page + Cmd+K command palette
- Every user-facing string must use `t()` — never hardcode display text

### Design System — Neo-Energy Cyber-Glassmorphism

- 5 themes defined in `apps/web/src/design-tokens.ts`: `energy-dark`, `solar-light`, `ocean-dark` (default), `nature-green`, `minimal-white`
- CSS custom properties via Tailwind v4 `@theme` block in `apps/web/src/index.css`
- Brand colors: `neon-green` (#22ff88), `electric-blue` (#00f0ff), `power-orange` (#ff8800)
- Utility classes: `glass-panel`, `glass-panel-strong`, `neon-glow-green/blue/orange`, `energy-pulse`, `focus-ring`
- Fluid typography: `fluid-text-xs` through `fluid-text-5xl` (clamp-based)
- 8pt grid spacing: `space-xs` through `space-3xl`
- Reference `DESIGN-SYSTEM.md` for full pattern catalog

### Accessibility (WCAG 2.2 AA — mandatory)

- Skip-to-content link, visible focus rings (`.focus-ring:focus-visible`), aria attributes everywhere
- Semantic HTML, keyboard navigation, color contrast ratios
- `type="button"` on every `<button>` that is not a submit; `aria-hidden` on all decorative icons
- Automated a11y testing via `@axe-core/playwright` across core routes and key interaction flows

### PWA & Offline

- `vite-plugin-pwa` with Workbox, autoUpdate registration
- Offline cache via Dexie.js (`apps/web/src/lib/offline-cache.ts`)
- Background sync with exponential backoff (`apps/web/src/lib/background-sync.ts`)
- Runtime caching for Open-Meteo, Tibber, aWATTar, Gemini APIs
- Components: `OfflineBanner`, `PWAUpdateNotification`, `PWAInstallPrompt`

### AI Features

- Multi-provider AI client (`apps/web/src/core/aiClient.ts`): OpenAI, Anthropic, Google Gemini, xAI, Groq, Ollama, Custom
- API keys encrypted in Dexie.js via `apps/web/src/lib/ai-keys.ts` — never store in env vars or plain text
- Deterministic optimizer (`apps/web/src/lib/optimizer.ts`) + predictive AI (`apps/web/src/lib/predictive-ai.ts`)
- AI worker isolated in `apps/web/src/core/useAIWorker.ts` to avoid blocking the main thread

### Quality & Tooling — Biome-First

**Primary tool: Biome 2.4.7** (Rust-native, single process — ~10× faster than ESLint+Prettier)

| Concern                       | Tool               | Config                               |
| ----------------------------- | ------------------ | ------------------------------------ |
| TS/JS linting + formatting    | **Biome**          | `biome.json`                         |
| JSON / CSS / HTML / MD / YAML | **Biome**          | `biome.json` formatter overrides     |
| Import organization           | **Biome**          | `assist.actions.source`              |
| Tailwind class sorting        | **Biome**          | `nursery.useSortedClasses` (warn)    |
| React Compiler violations     | ESLint (slim)      | `eslint.config.js`                   |
| React Hooks rules             | ESLint (slim)      | `eslint.config.js`                   |
| HMR compatibility             | ESLint (slim)      | `eslint.config.js`                   |
| Type checking                 | tsc                | `tsconfig.json`                      |
| Secret detection              | Gitleaks           | `.pre-commit-config.yaml`            |
| Unicode bidi (Trojan-Source)  | anti-trojan-source | `.pre-commit-config.yaml`            |

**ESLint is retained only for three React plugins with no Biome equivalent:**
`react-compiler/react-compiler` (error), `react-hooks/rules-of-hooks` (error), `react-hooks/exhaustive-deps` (warn), `react-refresh/only-export-components` (warn).

**Removed packages (do not re-add):** `prettier`, `prettier-plugin-tailwindcss`, `eslint-plugin-prettier`, `eslint-config-prettier`, `@eslint/js`, `typescript-eslint`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `globals`, `eslint-plugin-anti-trojan-source`, `eslint-plugin-react`.

**Scripts reference:**

| Script              | Command (root, delegates via Turbo)                                 | What runs                                    |
| ------------------- | ------------------------------------------------------------------- | -------------------------------------------- |
| `pnpm lint`         | `turbo lint` → `biome check && eslint --max-warnings 0` | Biome lint+format check + React ES in each workspace |
| `pnpm lint:fix`     | `turbo lint:fix` → `biome check --write && eslint --fix`            | Biome auto-fix + ESLint fix across workspaces |
| `pnpm format`       | `turbo format` → `biome format --write apps/ packages/`             | Biome format all workspaces                  |
| `pnpm format:check` | `biome format apps/ packages/`                                      | Biome format check (Biome 2.4 read-only)     |
| `pnpm type-check`   | `turbo type-check` → `tsc --noEmit` in each workspace               | TypeScript strict type check across all 3 packages |
| `pnpm verify:basis` | `turbo type-check lint test:run`                                     | Full local verification loop                 |
| `pnpm bench`        | `./scripts/bench-tooling.sh`                                         | Toolchain perf benchmark                     |

**Pre-commit pipeline:** pre-commit framework (trailing-ws, gitleaks, anti-trojan-source) → lint-staged (`biome check --write` + `eslint --fix` on `*.{ts,tsx}`; `biome format --write` on `*.{json,css,html,yml,yaml,md}`).

**Toolchain docs:** `docs/Toolchain-Architecture.md`, `docs/Biome-Migration-Roadmap.md`.

- **Husky** + **lint-staged** for pre-commit hooks
- **Vitest v4** (jsdom, V8 coverage — currently enforced thresholds: web 52/42/53/53, api 55/45/55/55; roadmap target is higher) — unit tests in `apps/web/src/tests/`
- **Playwright** — local E2E is Chromium-only; CI installs and runs Chromium + Firefox; WebKit/mobile projects are disabled for now
- **Lighthouse CI** (Perf ≥ 85%, A11y ≥ 90%, Best Practices ≥ 90%; `errors-in-console` disabled for demo mode)
- **Storybook 10** — component stories in `*.stories.tsx` co-located with components
- `.devcontainer` for reproducible dev environments (Node 24 image, Rust stable, pnpm 10.33.0 via corepack)
- **Project-wide no-any policy** — do not introduce explicit `any` in app code, tests, or TypeScript tooling files; prefer `unknown`, precise interfaces, discriminated unions, or narrowly scoped helper types
- **CI Node.js baseline**: Node.js 24 LTS (no canary/Node 26 matrix — does not exist yet)

### Execution Strategy (Local vs Cloud CI)

- **Default local loop:** keep local verification fast and deterministic (`type-check`, `lint`, targeted unit tests, changed-file tests, focused smoke checks)
- **Never run heavyweight local suites in parallel** on developer hardware. Run `type-check`, lint, tests, builds, and browser checks sequentially unless the user explicitly asks for parallel execution.
- **Playwright browser policy:** local `pnpm test:e2e` runs Chromium only. Cloud CI runs Chromium + Firefox. WebKit and mobile browser projects stay disabled until explicitly requested.
- **Long-running suites belong primarily to CI:** cloud **Playwright E2E** browser coverage, **Lighthouse**, broad **security scans** (CodeQL/Scorecard), and other heavy end-to-end validations should run mainly in cloud CI pipelines
- Only run full local E2E/perf/security suites when explicitly requested by the user or when CI is unavailable
- If a local long-running test is already running and is needed for diagnosis, monitor it; otherwise prefer CI execution and continue with productive implementation work
- For local E2E confidence, prefer **targeted Chromium spec files** before triggering broader cloud suites
- For GitHub Pages route tests, navigate with base-relative paths (`./unknown-route`) instead of absolute root paths (`/unknown-route`) so React Router keeps the `/Nexus-HEMS-Dash/` basename
- Always report clearly which checks were run locally vs deferred to CI, and why
- Never block implementation progress solely on non-critical local long-suite runtime when equivalent CI gates exist

### Deployment

- **GitHub Pages**: `base: '/Nexus-HEMS-Dash/'` in production; `workflow_dispatch` with explicit `DEPLOY` approval token
- **Docker**: multi-stage build (Node 24 → nginx 1.29), `read_only`, non-root, `no-new-privileges`, healthcheck; requires `JWT_SECRET`, `API_KEYS`, `WS_ORIGINS`; nginx `limit_conn 50` per-IP
- **Helm/Kubernetes**: `helm/nexus-hems/` — immutable image digests, rolling update strategy, revision history
- **Tauri v2.2**: desktop distribution (Linux/macOS/Windows), strict CSP; Rust edition 2024, rust-version ≥ 1.85
- **Capacitor 7**: iOS/Android native builds + push notifications

---

## WORKFLOW — follow for every change

1. **AUDIT** — before modifying any feature, read the relevant files: `README.md`, `package.json`, both Zustand stores, affected components, and adapter interfaces
2. **IMPLEMENT** — make changes following all rules above
3. **LOCALIZE** — add/update i18n keys in both `apps/web/src/locales/en.ts` and `apps/web/src/locales/de.ts`
4. **DEPS** — update `package.json` automatically when new packages are needed
5. **VERIFY** — run checks sequentially: `time pnpm type-check` → `pnpm lint` → targeted tests. For docs/config-only changes, use targeted Markdown/diff validation and let cloud CI cover heavy gates.

### Verification Policy

- Use a staged verification order: `type-check` → `lint` (Biome + slim ESLint) → targeted unit tests → build
- Always run type-check as `time pnpm type-check` when local type checking is warranted so elapsed time is visible — `time` has no side effects and helps diagnose slow hardware
- `pnpm lint` subsumes format checking — no separate `format:check` step needed
- `pnpm format:check` is `biome format apps/ packages/`; do not add `--write=false` to `biome format` on Biome 2.4
- Treat full E2E/performance/security suites as CI-first gates; link outcomes to the corresponding workflow runs
- Use non-interactive GitHub CLI status checks (`GH_PAGER=cat PAGER=cat gh run view ...`). Avoid `gh run watch` in this workspace because its terminal UI can leave control sequences in the shell.
- For runtime-major changes (e.g., Express major), require at least:
  - local TypeScript + lint + relevant unit tests + production build
  - CI E2E/security completion before final merge/deploy
- Document any intentionally deferred local heavy checks in the PR/summary output

---

## CRITICAL CONSTRAINTS — never violate

- Never break the real-time D3 Sankey energy flow or KNX floorplan
- Never introduce Redux, MobX, or alternative state management
- Never use Tailwind v3 syntax (`@apply` in arbitrary selectors, `tailwind.config.js` as sole config)
- Never store API keys in environment variables or unencrypted
- Never skip i18n — every user-visible string uses `t()`
- Never remove or downgrade accessibility features
- All lazy-loaded pages use `React.lazy` + `Suspense`
- Never re-add Prettier or typescript-eslint — the Biome-first toolchain replaces them
- Never add manual `useCallback`/`useMemo` without confirming React Compiler cannot handle it

### Unified Architecture (8 Primary Routes, 7 Navigation Sections)

The app uses a **unified Command Center** with 7 top-level sections, each a `SectionLayout` with tabs:

| Route              | Page Component      | Description                                                     |
| ------------------ | ------------------- | --------------------------------------------------------------- |
| `/`                | `CommandHub`        | Dashboard: KPI cards, mini Sankey, quick-nav, connection status |
| `/energy-flow`     | `LiveEnergyFlow`    | Full Sankey diagram, production/storage/consumption/grid tabs   |
| `/devices`         | `DevicesAutomation` | EV/OCPP, floorplan, controllers, hardware, plugins              |
| `/optimization-ai` | `OptimizationAI`    | AI optimizer, schedules, predictive forecast                    |
| `/tariffs`         | `TariffsPage`       | Live prices, tariff comparison, cost analytics                  |
| `/analytics`       | `Analytics`         | Charts, historical data, export/sharing                         |
| `/monitoring`      | `Monitoring`        | Adapter status, circuit breakers, system health                 |
| `/settings`        | `SettingsUnified`   | Config, adapters, language, theme, danger zone                  |
| `/plugins`         | `PluginsPage`       | Adapter plugin browser & hot-loading (under SettingsLayout)     |
| `/settings/ai`     | `AISettingsPage`    | AI provider keys & model config (under SettingsLayout)          |
| `/help`            | `Help`              | Docs, FAQ, about, AI acknowledgments (under SettingsLayout)     |

Legacy routes (`/production`, `/storage`, `/consumption`, `/ev`, `/floorplan`, `/controllers`, `/hardware`, `/historical-analytics`, `/ai-optimizer`, `/plugins`) redirect to unified equivalents.

---

## FILE STRUCTURE REFERENCE

This is a **pnpm workspace monorepo** managed by Turborepo. Root config files: `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`.

```
apps/api/                      # @nexus-hems/api — Express 5 backend
├── index.ts                   #   Entry: thin wrapper → src/index.ts
└── src/
    ├── index.ts               #   startServer(): middleware + routes + WS
    ├── jwt-utils.ts           #   JWT signing / verification / rotation / revocation
    ├── middleware/
    │   ├── auth.ts            #   requireJWT, requireScope, WS ticket auth
    │   ├── security.ts        #   Helmet CSP, CORS, rate limiting
    │   └── metrics.ts         #   Prometheus metrics engine
    ├── routes/
    │   ├── auth.routes.ts     #   /api/auth/* (token, refresh, revoke, ws-ticket)
    │   ├── eebus.routes.ts    #   /api/eebus/* (JWT + admin scope)
    │   ├── metrics.routes.ts  #   /metrics, /api/metrics/json
    │   └── grafana.routes.ts  #   /api/grafana/dashboard
    ├── ws/
    │   └── energy.ws.ts       #   WebSocket handler: auth, rate limiting, scope-gated commands
    └── data/
        └── mock-data.ts       #   Mock data generator (ADAPTER_MODE=mock)

apps/web/                      # @nexus-hems/web — React 19 Vite SPA
├── index.html
├── src/
│   ├── App.tsx                #   Router, layout shell, header, command palette
│   ├── main.tsx               #   Entry: StrictMode → QueryProvider → App
│   ├── store.ts               #   useAppStore (Zustand + persist → localStorage)
│   ├── types.ts               #   Frontend TypeScript types, presets, config
│   ├── design-tokens.ts       #   5 theme definitions
│   ├── i18n.ts                #   i18next config
│   ├── index.css              #   Tailwind v4 @theme + design system utilities
│   ├── components/
│   │   ├── layout/            #   Sidebar, Breadcrumbs, PageHeader
│   │   ├── ui/                #   Shared UI primitives (Gauge, NeonCard, etc.)
│   │   ├── SankeyDiagram.tsx  #   D3 Sankey (never break)
│   │   ├── Floorplan.tsx      #   KNX floorplan (never break)
│   │   ├── *.stories.tsx      #   Storybook stories co-located with components
│   │   └── ...                #   Feature components
│   ├── core/
│   │   ├── useEnergyStore.ts  #   Adapter aggregation store (in-memory Zustand)
│   │   ├── aiClient.ts        #   Multi-provider AI client (7 providers)
│   │   ├── adapter-worker.ts  #   Web Worker for REST polling (SSRF-hardened)
│   │   ├── circuit-breaker.ts #   FSM circuit breaker (CLOSED/OPEN/HALF_OPEN)
│   │   ├── command-safety.ts  #   Zod validation, rate limiting, audit trail
│   │   ├── energy-controllers.ts # 8 real-time control loops + ControllerPipeline
│   │   ├── hardware-registry.ts  # 120+ certified device registry
│   │   ├── plugin-system.ts   #   OSGi-inspired plugin lifecycle manager
│   │   ├── vpp-service.ts     #   VPP UC 2.6.2 / VDE-AR-E 2829-6 flex bidding
│   │   ├── uc26-translator.ts #   Matter↔OpenADR 3.1 interworking (UC 2.6.1–2.6.3)
│   │   ├── useAIWorker.ts     #   AI worker hook (off-thread)
│   │   ├── useAdapterWorker.ts #  Adapter polling worker hook
│   │   └── adapters/
│   │       ├── EnergyAdapter.ts   # Core interface (all adapters implement this)
│   │       ├── BaseAdapter.ts     # Contrib base class
│   │       ├── adapter-registry.ts # Dynamic registration + loading
│   │       ├── VictronMQTTAdapter.ts
│   │       ├── ModbusSunSpecAdapter.ts
│   │       ├── KNXAdapter.ts
│   │       ├── OCPP21Adapter.ts
│   │       ├── EEBUSAdapter.ts
│   │       ├── EvccAdapter.ts     # evcc backend via REST + WebSocket
│   │       ├── OpenEMSAdapter.ts  # OpenEMS Edge via JSON-RPC 2.0 / WebSocket
│   │       └── contrib/           # 6 contrib adapters + README
│   ├── lib/
│   │   ├── db.ts              #   Dexie.js schema + migrations
│   │   ├── ai-keys.ts         #   AES-GCM 256-bit key vault
│   │   ├── optimizer.ts       #   MPC LP day-ahead optimizer
│   │   ├── predictive-ai.ts   #   AI-based predictive forecast
│   │   ├── tariff-providers.ts #  5 dynamic tariff providers
│   │   ├── offline-cache.ts   #   Dexie offline cache
│   │   ├── background-sync.ts #   Exponential-backoff sync
│   │   └── ...                #   Other utilities
│   ├── locales/               #   en.ts, de.ts (TypeScript objects)
│   ├── pages/                 #   7 unified section pages (lazy-loaded) + legacy redirects
│   ├── tests/                 #   Vitest unit tests
│   └── workers/               #   Web Worker entry points
├── tests/e2e/                 #   Playwright E2E + a11y tests
└── src-tauri/                 #   Tauri v2.2 desktop config + Rust source

packages/shared-types/         # @nexus-hems/shared-types — shared Zod schemas
└── src/
    ├── protocol.ts            #   EnergyData, WSCommand, AuthToken, UnifiedEnergyModel
    └── index.ts               #   Re-exports all schemas and types

scripts/
└── bench-tooling.sh           # Toolchain performance benchmark
docs/
├── Adapter-Dev-Guide.md       # Adapter implementation guide
├── API-Reference.md           # Server API reference
├── Biome-Migration-Roadmap.md # ADR: Biome-first toolchain migration
├── Deployment-Checklist.md    # Production deployment checklist
├── Deployment-Guide.md        # Full deployment guide (Docker/Helm/Tauri)
├── Security-Architecture.md   # Threat model, STRIDE analysis, GDPR
├── Security-Remediation-2026-04.md # Security remediation log
└── Toolchain-Architecture.md  # Living toolchain reference (Biome-first)
```

### Server Architecture (apps/api)

- `apps/api/index.ts` is a thin wrapper that calls `startServer()` from `apps/api/src/index.ts`
- All HTTP routes are Express Router factories (`createXxxRoutes()`) mounted via `app.use()`
- JWT utilities: `apps/api/src/jwt-utils.ts` — `signToken()`, `verifyToken()`, `revokeToken()`, `clampScope()`
- JWT middleware (`requireJWT`) protects all endpoints except `/api/health`
- Production mode requires `API_KEYS` env var for `/api/auth/token`
- Production CSP uses `WS_ORIGINS` env var instead of `ws://localhost:*`
- Mock data vs live adapters controlled via `ADAPTER_MODE=mock|live` env var
- Rate limiting: global (100/min), API (60/min), auth endpoints (10/min); bypass via `RATE_LIMIT_TRUSTED_IPS`
- JWT entropy validated at startup: warns on weak secrets, dictionary words, short keys < 64 chars
- WebSocket: JWT token auth, command whitelist, 64 KB max payload, 30 cmd/min per client
- nginx: `limit_conn 50` per-IP, `Cross-Origin-Embedder-Policy: credentialless`

### Dev Workflow (Two-Process)

In development, `pnpm dev` (via Turbo) starts two independent processes:
- `apps/api` — Express server on `http://localhost:3000`
- `apps/web` — Vite dev server on `http://localhost:5173`

Vite proxies `/api/*`, `/metrics`, and `/ws` to `http://localhost:3000` — browser code always uses relative paths. The `@nexus-hems/shared-types` package is imported by name (workspace symlink); its `src/protocol.ts` is consumed directly via `allowImportingTsExtensions`.

### CHANGELOG Convention

- Follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format
- Sections: Added, Changed, Deprecated, Removed, Fixed, Security
- No emoji in section headers — use standard keepachangelog names
- Comparison links at the bottom of the file
- Generated by semantic-release, manually curated for `[Unreleased]`

### Dependency Overrides

- Use `pnpm.overrides` (inside the `"pnpm"` key), NOT top-level `"overrides"` (npm-only)
- Nested overrides use `parent>child` syntax, e.g. `"@lhci/cli>tmp": "0.2.5"`
- Run `pnpm audit` after any override change to verify resolution
- Current active security overrides: `protobufjs>=7.5.5`, `undici>=7.0.0`, `cross-spawn>=7.0.6`, `@xmldom/xmldom>=0.9.0`, `basic-ftp>=5.3.0`, `serialize-javascript>=7.0.5`
- `pnpm.onlyBuiltDependencies`: include approved native/postinstall packages (`esbuild`, `better-sqlite3`, `@serialport/bindings-cpp`, `core-js`, `protobufjs`) plus all `@rolldown/binding-*` platform entries to suppress install warnings
- `pnpm.peerDependencyRules.allowedVersions`: add `@storybook/react>react: ^19.0.0` etc. when Storybook lags behind React version

---

Goal: Build the most beautiful, accessible, fully localized and production-ready HEMS dashboard — 2026.

## graphify

Before answering architecture or codebase questions, read `graphify-out/GRAPH_REPORT.md` if it exists.
If `graphify-out/wiki/index.md` exists, navigate it for deep questions.
Type `/graphify` in Copilot Chat to build or update the knowledge graph.
