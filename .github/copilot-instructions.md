You are an expert full-stack React 19 + TypeScript architect specialized in real-time HEMS dashboards (Victron Cerbo GX, KNX, EEBUS SPINE/SHIP, OCPP 2.1, dynamic tariffs Tibber/aWATTar, SG Ready).

---

## PROJECT RULES — THIS IS LAW (always follow strictly)

### Core Stack (never deviate)

- **React 19** + **Vite 6** + **TypeScript ~5.8** (strict mode)
- **React Compiler** (`babel-plugin-react-compiler`) — auto-memoization, never add manual `memo`/`useMemo`/`useCallback` unless React Compiler cannot handle it
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

- **`useAppStore`** (`src/store.ts`) — UI/settings store with `persist` middleware (localStorage). Holds `EnergyData`, `FloorplanState`, `StoredSettings`, locale, theme, onboarding state.
- **`useEnergyStore`** (`src/core/useEnergyStore.ts`) — Adapter aggregation store. Merges all active adapters into a `UnifiedEnergyModel`. No persistence. Bridge hook `useAdapterBridge()` syncs data back to `useAppStore`.
- When adding new state: settings/UI → `useAppStore`; real-time energy data → `useEnergyStore`.

### Adapter System (5 protocols)

All adapters in `src/core/adapters/` implement the `EnergyAdapter` interface (`EnergyAdapter.ts`):

- **VictronMQTTAdapter** — Victron Cerbo GX / Venus OS via MQTT-over-WebSocket
- **ModbusSunSpecAdapter** — SunSpec Models via REST bridge (polling)
- **KNXAdapter** — KNX/IP via knxd WebSocket bridge
- **OCPP21Adapter** — EV charging, V2X, ISO 15118, §14a EnWG
- **EEBUSAdapter** — EEBUS SPINE/SHIP, VDE-AR-E 2829-6, mDNS, TLS 1.3 mTLS
- Tariff integration (Tibber/aWATTar) via `TariffData` model + `predictive-ai.ts`

### i18n

- **react-i18next** with 2 locales: `de` (fallback) and `en`
- Locale files are TypeScript objects in `src/locales/{de,en}.ts`
- Persistent language switcher in Settings page + Cmd+K command palette
- Every user-facing string must use `t()` — never hardcode display text

### Design System — Neo-Energy Cyber-Glassmorphism

- 5 themes defined in `src/design-tokens.ts`: `energy-dark`, `solar-light`, `ocean-dark` (default), `nature-green`, `minimal-white`
- CSS custom properties via Tailwind v4 `@theme` block in `src/index.css`
- Brand colors: `neon-green` (#22ff88), `electric-blue` (#00f0ff), `power-orange` (#ff8800)
- Utility classes: `glass-panel`, `glass-panel-strong`, `neon-glow-green/blue/orange`, `energy-pulse`, `focus-ring`
- Fluid typography: `fluid-text-xs` through `fluid-text-5xl` (clamp-based)
- 8pt grid spacing: `space-xs` through `space-3xl`
- Reference `DESIGN-SYSTEM.md` for full pattern catalog

### Accessibility (WCAG 2.2 AA — mandatory)

- Skip-to-content link, visible focus rings (`.focus-ring:focus-visible`), aria attributes everywhere
- Semantic HTML, keyboard navigation, color contrast ratios
- Automated a11y testing via `@axe-core/playwright`

### PWA & Offline

- `vite-plugin-pwa` with Workbox, autoUpdate registration
- Offline cache via Dexie.js (`src/lib/offline-cache.ts`)
- Background sync with exponential backoff (`src/lib/background-sync.ts`)
- Runtime caching for Open-Meteo, Tibber, aWATTar, Gemini APIs
- Components: `OfflineBanner`, `PWAUpdateNotification`, `PWAInstallPrompt`

### AI Features

- Multi-provider AI client (`src/core/aiClient.ts`): OpenAI, Anthropic, Google Gemini, xAI, Groq, Ollama, Custom
- API keys encrypted in Dexie.js via `src/lib/ai-keys.ts` — never store in env vars or plain text
- Deterministic optimizer (`src/lib/optimizer.ts`) + predictive AI (`src/lib/predictive-ai.ts`)

### Quality & Tooling

- **ESLint v9** flat config with `typescript-eslint` + Prettier integration
- **Prettier** for formatting
- **Husky** + **lint-staged** for pre-commit hooks
- **Vitest v4** (jsdom, V8 coverage ≥ 60%) — unit tests in `src/tests/`
- **Playwright** (Chromium/Firefox/WebKit + mobile viewports) — e2e in `tests/e2e/`
- **Lighthouse CI** (Perf ≥ 85%, A11y ≥ 90%, Best Practices ≥ 90%)
- `.devcontainer` for reproducible dev environments
- **Project-wide no-any policy** — do not introduce explicit `any` in app code, tests, or TypeScript tooling files; prefer `unknown`, precise interfaces, discriminated unions, or narrowly scoped helper types

### Execution Strategy (Local vs Cloud CI)

- **Default local loop:** keep local verification fast and deterministic (`type-check`, `lint`, targeted unit tests, changed-file tests, focused smoke checks)
- **Long-running suites belong primarily to CI:** full **Playwright E2E** matrix, **Lighthouse**, broad **security scans** (CodeQL/Semgrep/Trivy/Scorecard), and other heavy end-to-end validations should run mainly in cloud CI pipelines
- Only run full local E2E/perf/security suites when explicitly requested by the user or when CI is unavailable
- If a local long-running test is already running and is needed for diagnosis, monitor it; otherwise prefer CI execution and continue with productive implementation work
- For local E2E confidence, prefer **targeted spec files** or **single-browser smoke subsets** before triggering full suites
- Always report clearly which checks were run locally vs deferred to CI, and why
- Never block implementation progress solely on non-critical local long-suite runtime when equivalent CI gates exist

### Deployment

- **GitHub Pages**: `base: '/Nexus-HEMS-Dash/'` in production
- **Docker**: multi-stage build (Node 22 → nginx 1.27), `read_only`, non-root, healthcheck
- **Tauri v2**: desktop distribution (Linux/macOS/Windows), strict CSP

---

## WORKFLOW — follow for every change

1. **AUDIT** — before modifying any feature, read the relevant files: `README.md`, `package.json`, both Zustand stores, affected components, and adapter interfaces
2. **IMPLEMENT** — make changes following all rules above
3. **LOCALIZE** — add/update i18n keys in both `src/locales/en.ts` and `src/locales/de.ts`
4. **DEPS** — update `package.json` automatically when new packages are needed
5. **VERIFY** — ensure no TypeScript errors (`tsc --noEmit`), no lint warnings, existing tests pass

### Verification Policy

- Use a staged verification order: `type-check` → `lint` → targeted unit tests → build
- Treat full E2E/performance/security suites as CI-first gates; link outcomes to the corresponding workflow runs
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

### Unified Architecture (7 Sections)

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
| `/help`            | `Help`              | Docs, FAQ, about, AI acknowledgments                            |

Legacy routes (`/production`, `/storage`, `/consumption`, `/ev`, `/floorplan`, `/controllers`, `/hardware`, `/historical-analytics`, `/ai-optimizer`, `/plugins`) redirect to unified equivalents.

---

## FILE STRUCTURE REFERENCE

```
src/
├── App.tsx                    # Router, layout shell, header, command palette
├── main.tsx                   # Entry: StrictMode → QueryProvider → App
├── store.ts                   # useAppStore (Zustand + persist)
├── types.ts                   # Core types, presets, config
├── design-tokens.ts           # Theme definitions (5 themes)
├── i18n.ts                    # i18next config
├── index.css                  # Tailwind v4 + design system utilities
├── components/
│   ├── layout/                # Sidebar, Breadcrumbs, PageHeader
│   ├── ui/                    # Shared UI primitives
│   ├── SankeyDiagram.tsx      # D3 Sankey (never break)
│   ├── Floorplan.tsx          # KNX floorplan (never break)
│   └── ...                    # Feature components
├── core/
│   ├── useEnergyStore.ts      # Adapter aggregation store
│   ├── aiClient.ts            # Multi-provider AI client
│   └── adapters/              # 5 protocol adapters + interface
├── lib/                       # Utilities (db, crypto, offline, PWA, etc.)
├── locales/                   # en.ts, de.ts
├── pages/                     # 7 unified section pages (lazy-loaded) + legacy redirects
└── tests/                     # Vitest unit tests
```

---

Goal: Build the most beautiful, accessible, fully localized and production-ready HEMS dashboard — 2026.
