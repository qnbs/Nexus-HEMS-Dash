<div align="center">

# ⚡ Nexus-HEMS Dashboard

**Production-grade Home Energy Management System — One Command Center for the decentralized energy era**

[![CI](https://img.shields.io/github/actions/workflow/status/qnbs/Nexus-HEMS-Dash/ci.yml?branch=main&style=flat-square&logo=githubactions&logoColor=white&label=CI)](https://github.com/qnbs/Nexus-HEMS-Dash/actions/workflows/ci.yml)
[![Deploy](https://img.shields.io/github/actions/workflow/status/qnbs/Nexus-HEMS-Dash/deploy.yml?branch=main&style=flat-square&logo=githubactions&logoColor=white&label=Deploy)](https://github.com/qnbs/Nexus-HEMS-Dash/actions/workflows/deploy.yml)
[![License](https://img.shields.io/github/license/qnbs/Nexus-HEMS-Dash?style=flat-square)](LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/qnbs/Nexus-HEMS-Dash?style=flat-square&label=Release)](https://github.com/qnbs/Nexus-HEMS-Dash/releases)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](tsconfig.json)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](package.json)
[![Adapters](<https://img.shields.io/badge/Adapters-10_(5+5)-22ff88?style=flat-square>)](#protocol-adapters)

**[Live Demo](https://qnbs.github.io/Nexus-HEMS-Dash/)** · **[Open in Codespaces](https://codespaces.new/qnbs/Nexus-HEMS-Dash)** · **[Adapter Dev Guide](docs/Adapter-Dev-Guide.md)**

</div>

---

Nexus-HEMS is a **unified Command Center** that consolidates **10 protocol adapters** (5 core + 5 contrib) into **7 focused sections** — orchestrating photovoltaic generation, battery storage, heat pumps, EV charging, and building automation with dynamic electricity tariffs. Instead of 18+ separate pages, every feature is accessible from a **single streamlined interface** with guided tours, contextual help, and zero-config onboarding.

**Stack:** React 19 · TypeScript 5.8 · Vite 6 · Tailwind CSS v4 · Zustand 5 · D3.js Sankey · Recharts · Motion · Dexie.js · Radix UI · React Compiler

## Key Features

| Category                | Features                                                                                                                                                                                                                                                                                                 |
| :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Energy**              | Real-time D3.js Sankey flow · AI optimizer (multi-provider BYOK) · MPC day-ahead optimizer · 7 real-time controllers · 24h/7d predictive forecast · Live tariff widget (Tibber/aWATTar/Octopus/Nordpool) · Smart EV charging (§14a EnWG) · SG Ready heat pump control · Hardware registry (120+ devices) |
| **Protocols (Core)**    | Victron MQTT (Cerbo GX / Venus OS) · Modbus/SunSpec (103/124/201) · KNX/IP floorplan · OCPP 2.1 V2X (ISO 15118) · EEBUS SPINE/SHIP (TLS 1.3 mTLS)                                                                                                                                                        |
| **Protocols (Contrib)** | Home Assistant MQTT · Matter/Thread · Zigbee2MQTT · Shelly REST (Gen2+) · Example template                                                                                                                                                                                                               |
| **Plugin System**       | Adapter Registry with dynamic `import()` loading · npm-package format · `BaseAdapter` class for rapid development · Hot-loading from Settings UI                                                                                                                                                         |
| **Platform**            | Unified Command Center (7 sections) · PWA offline-first (Workbox + IndexedDB) · 5 themes · Full i18n (DE/EN) · WCAG 2.2 AA · PDF reports + QR sharing · Prometheus monitoring                                                                                                                            |
| **Security**            | BYOK AI vault (AES-GCM 256) · JWT WebSocket auth · Helmet CSP · Rate limiting · CORS · Zod schema validation                                                                                                                                                                                             |
| **Desktop & Mobile**    | Tauri v2 (Windows/macOS/Linux) · Capacitor 7 (iOS/Android)                                                                                                                                                                                                                                               |

## Architecture

```
┌─────────────────── Core Adapters ─────────────────────┐
│  Victron Cerbo GX ──┐                                 │
│  Modbus/SunSpec ─────┤                                │
│  KNX/IP Gateway ─────┼── EnergyAdapter ──┐            │
│  OCPP 2.1 CSMS ──────┤     interface     │            │
│  EEBUS CEM ──────────┘                   │            │
└──────────────────────────────────────────┘            │
┌──────────── Contrib Adapters (Plugin) ───────────────┐│
│  Home Assistant MQTT ──┐                             ││
│  Matter/Thread ────────┤                             ││
│  Zigbee2MQTT ──────────┼── BaseAdapter ──────────────┼┤
│  Shelly REST ──────────┤   (extends EnergyAdapter)   ││
│  Custom (npm pkg) ─────┘                             ││
└──────────────────────────────────────────────────────┘│
                                                        ▼
          useEnergyStore (Zustand) ──→ UnifiedEnergyModel
                     │
                     ├──→ D3.js Sankey + Recharts (UI)
                     ├──→ ControllerPipeline (7 real-time controllers)
                     ├──→ MPC Optimizer (LP day-ahead scheduling)
                     ├──→ AI Optimizer (Gemini / OpenAI / Anthropic / xAI / Groq / Ollama)
                     ├──→ Hardware Registry (120+ certified devices)
                     └──→ Dexie.js IndexedDB (Offline Cache)
```

All adapters implement the `EnergyAdapter` interface (`src/core/adapters/EnergyAdapter.ts`). Contrib adapters extend `BaseAdapter` (`src/core/adapters/BaseAdapter.ts`) for simplified development. The `AdapterRegistry` (`src/core/adapters/adapter-registry.ts`) manages registration, lifecycle, and dynamic loading.

## Quick Start

```bash
git clone https://github.com/qnbs/Nexus-HEMS-Dash.git
cd Nexus-HEMS-Dash
npm install
npm run dev
```

**Requirements:** Node.js 22 LTS (production baseline), npm 10+

Node.js 25 is validated as a non-blocking CI canary only and is not used for production runtime images.

### Scripts

| Command                 | Description                     |
| :---------------------- | :------------------------------ |
| `npm run dev`           | Dev server (Express + Vite HMR) |
| `npm run build`         | Production build with PWA       |
| `npm run test`          | Vitest watch mode               |
| `npm run test:run`      | All unit tests once             |
| `npm run test:e2e`      | Playwright E2E + a11y           |
| `npm run test:coverage` | V8 coverage report              |
| `npm run lint`          | ESLint (zero-warning policy)    |
| `npm run type-check`    | TypeScript strict check         |
| `npm run docker:build`  | Build Docker image              |
| `npm run docker:up`     | Start container (port 8080)     |

### Environment Variables

All AI API keys are managed via the BYOK Settings page (`/settings/ai`) with AES-GCM 256-bit encryption — no `.env` file needed for AI features.

```bash
GEMINI_API_KEY=...           # Optional: server-side Gemini proxy
JWT_SECRET=...               # Optional: auto-generated if omitted
CORS_ORIGINS=https://...     # Optional: additional CORS origins
PORT=3000                    # Default: 3000
```

## Pages — 7 Unified Sections

| Section                  | Route              | Description                                                      |
| :----------------------- | :----------------- | :--------------------------------------------------------------- |
| **Command Hub**          | `/`                | KPI dashboard, mini Sankey, quick-nav to all sections            |
| **Live Energy Flow**     | `/energy-flow`     | Full D3.js Sankey + live price widget + fullscreen mode          |
| **Devices & Automation** | `/devices`         | Device cards, KNX floorplan, controllers, hardware — all in one  |
| **AI Optimization**      | `/optimization-ai` | 3-step AI wizard (Gemini + MPC), predictive forecast             |
| **Tariffs**              | `/tariffs`         | Live prices, forecasts, optimal charging windows                 |
| **Analytics**            | `/analytics`       | 8 KPIs, energy balance, costs, historical trends                 |
| **Monitoring**           | `/monitoring`      | System health, adapter matrix, metrics, power-user mode          |
| **Settings**             | `/settings`        | Appearance, system, energy, security, adapters, plugins, AI keys |
| **Help**                 | `/help`            | Docs, FAQ, glossary, shortcuts, troubleshooting, about & credits |

> Legacy routes (`/production`, `/storage`, `/consumption`, `/ev`, `/floorplan`, `/ai-optimizer`, `/controllers`, `/hardware`) automatically redirect to their new unified sections.

## Protocol Adapters

### Core Adapters (5)

| Adapter              | Protocol            | Transport        | Security     | Capabilities               |
| :------------------- | :------------------ | :--------------- | :----------- | :------------------------- |
| VictronMQTTAdapter   | Node-RED MQTT→WS    | WebSocket        | Token auth   | PV, Battery, Grid, Load    |
| ModbusSunSpecAdapter | SunSpec 103/124/201 | HTTP/REST        | TLS          | PV, Battery, Grid          |
| KNXAdapter           | KNX/IP Tunneling    | WebSocket bridge | —            | KNX building automation    |
| OCPP21Adapter        | OCPP 2.1 JSON-RPC   | WebSocket        | Client certs | EV Charger, V2X, ISO 15118 |
| EEBUSAdapter         | SPINE/SHIP 1.0      | WebSocket        | TLS 1.3 mTLS | EV Charger, Load, Grid     |

### Contrib Adapters (5) — Plugin System

| Adapter                  | Protocol                | Transport    | Use Case                                |
| :----------------------- | :---------------------- | :----------- | :-------------------------------------- |
| HomeAssistantMQTTAdapter | MQTT Discovery          | WebSocket    | Home Assistant integration (Mosquitto)  |
| MatterThreadAdapter      | Matter 1.3 / Thread 1.3 | WebSocket    | Matter-certified smart home devices     |
| Zigbee2MQTTAdapter       | MQTT (Z2M bridge)       | WebSocket    | Zigbee devices via Zigbee2MQTT bridge   |
| ShellyRESTAdapter        | HTTP/REST Gen2+         | HTTP polling | Shelly Pro 3EM, Plus Plug S, Pro 4PM    |
| ExampleContribAdapter    | —                       | —            | Template for custom adapter development |

### Plugin System & Adapter Registry

The adapter registry (`src/core/adapters/adapter-registry.ts`) supports three ways to add adapters:

```typescript
// 1. Static registration
import { registerAdapter } from './adapter-registry';
registerAdapter('my-adapter', (config) => new MyAdapter(config));

// 2. Dynamic loading from contrib/
await loadContribAdapter('homeassistant-mqtt');

// 3. Load all contrib adapters at once
const ids = await loadAllContribAdapters();
```

Contrib adapters extend `BaseAdapter` for simplified development:

```typescript
import { BaseAdapter } from '../BaseAdapter';
import type { EnergyAdapter, UnifiedEnergyModel } from '../EnergyAdapter';

export class MyAdapter extends BaseAdapter implements EnergyAdapter {
  readonly id = 'my-adapter';
  readonly protocol = 'my-protocol';
  // ... implement connect(), disconnect(), getData()
}
```

See [Adapter Dev Guide](docs/Adapter-Dev-Guide.md) and [Contrib README](src/core/adapters/contrib/README.md) for full documentation.

## Security

- **Backend:** Helmet CSP + HSTS, CORS whitelist, Zod schema validation, JWT (HS256) auth, rate limiting (100 req/min)
- **WebSocket:** JWT token auth, command whitelist, 64 KB max payload, 30 cmd/min per client
- **Encryption:** AES-GCM 256-bit + PBKDF2 600k iterations for API keys in IndexedDB
- **Transport:** TLS 1.3 everywhere, mTLS for EEBUS, client certs for OCPP
- **Docker:** Non-root, read-only filesystem, `no-new-privileges`, isolated networks
- **Runtime Hardening:** strict OpenEMS component/property validation, worker URL allowlist + private-IP checks, sanitized plugin/event logging
- **CI:** CodeQL SAST, npm audit, Dependabot (npm + Actions + Docker + Cargo), SHA-pinned GitHub Actions, Node 25 canary matrix

For the full threat model, trust boundaries, STRIDE analysis, and GDPR/DSGVO compliance details, see [SECURITY.md](SECURITY.md).

## Testing

| Type       | Tool                                 | Scope                   |
| :--------- | :----------------------------------- | :---------------------- |
| Unit       | Vitest + jsdom + V8 coverage         | 265 tests, 26 suites    |
| E2E        | Playwright (Chromium/Firefox/WebKit) | Multi-route, a11y audit |
| a11y       | @axe-core/playwright                 | WCAG 2.2 AA (15 tests)  |
| Lighthouse | Lighthouse CI                        | Perf ≥ 85%, A11y ≥ 90%  |

## Deployment

**GitHub Pages** — manual deployment via GitHub Actions `workflow_dispatch` with explicit `DEPLOY` approval token.

**Docker** — multi-stage build (node:22-alpine → nginx:1.27-alpine):

```bash
npm run docker:build && npm run docker:up
```

**Helm/Kubernetes** — supports immutable image digests (`repository@sha256:...`), rolling update strategy controls, and revision history for rollback.

**Tauri Desktop** — native builds for Windows, macOS, Linux:

```bash
cd src-tauri && cargo tauri build
```

## Design System

**Neo-Energy Cyber-Glassmorphism** with 5 themes:

| Theme         | Mode  | Aesthetic                                 |
| :------------ | :---- | :---------------------------------------- |
| OceanDeep     | Dark  | Deep ocean blues + neon accents (default) |
| Cyber Energy  | Dark  | Vibrant greens + electric highlights      |
| Solar Light   | Light | Warm solar tones                          |
| Minimal White | Light | Ultra-clean minimalism                    |
| Nature Green  | Dark  | Forest greens + earth tones               |

Brand colors: `neon-green` (#22ff88) · `electric-blue` (#00f0ff) · `power-orange` (#ff8800). See [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) for the full pattern catalog.

## Roadmap 2026

| Quarter | Feature                                                                                                                        | Status     |
| :------ | :----------------------------------------------------------------------------------------------------------------------------- | :--------- |
| Q1–Q3   | 5 core adapters, 5 themes, AI optimizer, EEBUS, PWA, Monitoring, Docker, Tauri, WCAG 2.2 AA, React Compiler, Backend hardening | ✅ Shipped |
| Q3      | Plugin system, adapter registry, 5 contrib adapters (Home Assistant, Matter/Thread, Zigbee2MQTT, Shelly), Capacitor Mobile     | ✅ Shipped |
| Q3–Q4   | Energy controllers (7 loops), MPC optimizer, hardware registry (120+ devices), plugin lifecycle, command safety, 265 tests     | ✅ Shipped |
| Q4      | **Unified Command Center** — 7 focused sections, guided tours, contextual help, zero-config onboarding, full a11y audit        | ✅ Shipped |
| Q4+     | Historical analytics, multi-tenant SaaS, contrib marketplace                                                                   | 🔜 Planned |

## Changelog

<details open>
<summary><b>v5.0.0</b> — Unified Command Center</summary>

- **One Command Center:** Consolidated 18+ pages into 7 focused sections with unified navigation
- **Command Hub** (`/`): KPI dashboard with mini Sankey, metric cards, and quick-nav to all sections
- **Live Energy Flow** (`/energy-flow`): Full D3.js Sankey with draggable panels, fullscreen mode, live price widget
- **Devices & Automation** (`/devices`): Device cards, KNX floorplan, controllers, hardware — all unified with filter/search
- **AI Optimization** (`/optimization-ai`): 3-step AI wizard with multi-provider BYOK, MPC day-ahead, predictive forecast
- **Guided Tours:** First-visit modal tours for every section (PageTour component, localStorage tracking)
- **Contextual Help:** HelpTooltip on every page, WizardStepper for multi-step flows
- **Empty States:** Animated empty-state components with energy-pulse, action buttons
- **A11y Audit:** 26 fixes — `type="button"` on all buttons, `aria-hidden` on decorative icons, i18n for hardcoded strings
- **React Compiler:** Full compliance — all manual `useCallback`/`useMemo` removed
- **Storybook:** 20+ stories covering all new components (PageTour, HelpTooltip, WizardStepper, EmptyState)
- **E2E Tests:** Updated Playwright tests for unified navigation, legacy route redirects, Command Hub + Live Energy Flow
- **Design System:** Extended with EnergyCard, ControlPanel, FloatingActionBar, WizardStep, LiveMetric utility classes
</details>

<details>
<summary><b>v4.6.0</b> — Energy Controllers + MPC Optimizer + Hardware Registry</summary>

- **Energy Controllers:** 7 real-time control loops (ESS Symmetric, Peak Shaving, Grid-Optimized Charge, Self-Consumption, Emergency Capacity, HeatPump SG Ready, EV Smart Charge) with ControllerPipeline orchestration
- **MPC Optimizer:** EMHASS-inspired LP day-ahead scheduler with PV/load forecasting, battery constraints, and tariff-aware cost minimization
- **Hardware Registry:** 120+ certified devices across 5 categories (inverters, wallboxes, meters, batteries, heat pumps) with manufacturer specs and protocol support
- **Plugin System Lifecycle:** OSGi-inspired plugin manager with install → resolve → start → stop → uninstall lifecycle, dependency injection, service registry, event bus, semver matching
- **3 New Pages:** Controllers (`/controllers`), Plugins (`/plugins`), Hardware (`/hardware`) with full i18n, a11y, and cross-page navigation
- **Command Safety Layer:** Zod schema validation, rate limiting (30 cmd/min), audit trail in IndexedDB, danger command confirmation dialog
- **Hardening:** Null guards on all controller data fields, div-by-zero protection in MPC, plugin activation timeout (10s), WebSocket leak fix, settings hash cache invalidation
- **Testing:** 265 unit tests across 26 suites (was 106/16), edge case coverage for MPC and controllers
</details>

<details>
<summary><b>v4.5.0</b> — Plugin System + 5 Contrib Adapters + Full Integration</summary>

- **Plugin System:** Adapter Registry with dynamic `import()` loading, npm-package format, `BaseAdapter` class
- **5 Contrib Adapters:** Home Assistant MQTT, Matter/Thread, Zigbee2MQTT, Shelly REST, Example template
- **MonitoringPage:** Contrib adapter health monitoring with connectivity status, latency tracking, contrib badge
- **AdapterConfigPanel:** Contrib adapter section with load-all button, capability display, registration status
- **i18n:** Complete DE/EN localization for all contrib adapter keys, plugin system labels
- **README:** Comprehensive update with 10-adapter architecture, plugin docs, updated roadmap
</details>

<details>
<summary><b>v4.4.0</b> — Capacitor Mobile + Tariff Providers + a11y Audit</summary>

- Capacitor 7 config for iOS/Android native builds + push notifications
- 5 tariff providers (Tibber, aWATTar DE/AT, Octopus Energy, Nordpool) + dynamic grid fees
- ARIA-live region for Sankey screen reader announcements (debounced 5s)
- High-contrast mode: forced-colors support, stronger contrast ratios, solid backgrounds
- Reduced-motion: graceful transform disabling, explicit animation kills
- Playwright a11y tests expanded (7 → 15 tests)
</details>

<details>
<summary><b>v4.3.0</b> — Backend Security Hardening</summary>

- CORS whitelist, JWT WebSocket auth, Zod schema validation, rate limiting
- Helmet CSP + HSTS, 64 KB max payload, Dependabot, CodeQL SAST
</details>

<details>
<summary><b>v4.0–4.2</b> — Performance & Audit</summary>

- React Compiler, lazy-loaded locales (index chunk −60%), D3 tree-shaking
- IndexedDB consolidation, WCAG 2.2 AA audit, Radix UI, 106 unit tests
</details>

Full changelog: [git history](https://github.com/qnbs/Nexus-HEMS-Dash/commits/main)

## Acknowledgments

This project was built with the assistance of cutting-edge AI tools that accelerated development, improved code quality, and enabled rapid iteration:

| AI Assistant        | Provider                   | Contribution                                                                               |
| :------------------ | :------------------------- | :----------------------------------------------------------------------------------------- |
| **Gemini 2.5 Pro**  | Google AI Studio           | Energy optimization algorithms, predictive forecasting, MPC solver design, tariff analysis |
| **Claude Opus 4.6** | Anthropic (GitHub Copilot) | Architecture design, React Compiler compliance, a11y audit, E2E tests, design system, i18n |
| **Grok**            | xAI                        | Code review, debugging assistance, protocol adapter research                               |

We are deeply grateful to these AI platforms for enabling a solo developer to build what would traditionally require a full engineering team. The combination of human domain expertise in energy management with AI-assisted development has made Nexus-HEMS possible.

**Additional thanks to:**

- **Victron Energy** — Cerbo GX, VE.Bus, Venus OS open documentation
- **KNX Association** — KNX/IP building automation standard
- **Tibber & aWATTar** — Dynamic electricity tariff APIs
- **D3.js community** — Data-driven visualization excellence
- **EMHASS** — MPC/LP optimization concepts and research
- **OpenEMS** — OSGi controller architecture inspiration
- **evcc** — EV charging integration patterns
- **React, Vite, Tailwind CSS** — The incredible open-source ecosystem that powers everything

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

```bash
npm run lint && npm run test:run && npm run build
```

## License

MIT — see [LICENSE](LICENSE).

---

<div align="center">

## 🇩🇪 Überblick

</div>

**Nexus-HEMS Dashboard** ist ein produktionsreifes Echtzeit-Home-Energy-Management-System — **ein einziges Command Center** für die dezentrale Energiewende. Es vereint **10 Protokolladapter** (5 Core + 5 Contrib) in **7 fokussierten Sektionen** zur Orchestrierung von PV, Batteriespeicher, Wärmepumpen und E-Mobilität — optimiert für dynamische Stromtarife (Tibber/aWATTar/Octopus/Nordpool).

- ⚡ Echtzeit D3.js Sankey-Energiefluss mit KI-Optimierung (Gemini 2.5 Pro)
- 🎯 Unified Command Center: 7 Sektionen statt 18+ Einzelseiten
- 🔌 10 Adapter: Victron, Modbus, KNX, OCPP, EEBUS + Home Assistant, Matter/Thread, Zigbee2MQTT, Shelly
- 🧩 Plugin-System: Adapter-Registry mit dynamischem Laden, npm-Paket-Format, BaseAdapter-Klasse
- 🎛️ 7 Echtzeit-Energieregler: ESS, Peak Shaving, Netz-optimiert, Eigenverbrauch, Notstrom, SG Ready, EV Smart
- 📐 MPC-Optimierer: EMHASS-inspirierter LP Day-Ahead-Scheduler mit Tariferkennung
- 🗃️ Hardware-Registry: 120+ zertifizierte Geräte (Wechselrichter, Wallboxen, Zähler, Batterien, Wärmepumpen)
- 🚗 Intelligentes EV-Laden (PV-Überschuss, §14a EnWG, SG Ready, V2X)
- 🏠 KNX-Grundriss mit interaktiver Gebäudeautomation
- 📈 Prädiktive Vorhersage + Live-Tarif-Widget (5 Anbieter)
- 🔐 BYOK KI-Tresor (7 Anbieter, AES-GCM 256-bit)
- 📱 PWA Offline-First + Tauri Desktop + Capacitor Mobile
- ♿ WCAG 2.2 AA · 🌐 i18n DE/EN · 🎨 5 Themes
- 🧪 265 Unit-Tests · 📄 PDF-Berichte · 🔒 JWT + Helmet + CORS
- 🤖 KI-unterstützt: Gemini 2.5 Pro, Claude Opus 4.6, Grok (xAI)

```bash
git clone https://github.com/qnbs/Nexus-HEMS-Dash.git && cd Nexus-HEMS-Dash
npm install && npm run dev
```

**Docs:** [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) · [CONTRIBUTING.md](CONTRIBUTING.md) · [SECURITY.md](SECURITY.md) · [Adapter-Dev-Guide](docs/Adapter-Dev-Guide.md) · [Contrib-Adapter-README](src/core/adapters/contrib/README.md)

**Lizenz:** MIT — siehe [LICENSE](LICENSE).
