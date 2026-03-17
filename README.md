<div align="center">

# ⚡ Nexus-HEMS Dashboard

**Production-grade Home Energy Management System for the decentralized energy era**

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

Nexus-HEMS unifies **10 protocol adapters** (5 core + 5 contrib) behind a single dashboard to orchestrate photovoltaic generation, battery storage, heat pumps, EV charging, and building automation — optimized for dynamic electricity tariffs. A **plugin system** with adapter registry allows dynamic loading and third-party extensions via npm packages.

**Stack:** React 19 · TypeScript 5.8 · Vite 6 · Tailwind CSS v4 · Zustand 5 · D3.js Sankey · Recharts · Motion · Dexie.js · Radix UI · React Compiler

## Key Features

| Category                | Features                                                                                                                                                                                                 |
| :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Energy**              | Real-time D3.js Sankey flow · AI optimizer (Gemini 3.1) · 24h/7d predictive forecast · Live tariff widget (Tibber/aWATTar/Octopus/Nordpool) · Smart EV charging (§14a EnWG) · SG Ready heat pump control |
| **Protocols (Core)**    | Victron MQTT (Cerbo GX / Venus OS) · Modbus/SunSpec (103/124/201) · KNX/IP floorplan · OCPP 2.1 V2X (ISO 15118) · EEBUS SPINE/SHIP (TLS 1.3 mTLS)                                                        |
| **Protocols (Contrib)** | Home Assistant MQTT · Matter/Thread · Zigbee2MQTT · Shelly REST (Gen2+) · Example template                                                                                                               |
| **Plugin System**       | Adapter Registry with dynamic `import()` loading · npm-package format · `BaseAdapter` class for rapid development · Hot-loading from Settings UI                                                         |
| **Platform**            | PWA offline-first (Workbox + IndexedDB) · 5 themes · Full i18n (DE/EN) · WCAG 2.2 AA · PDF reports + QR sharing · Prometheus monitoring                                                                  |
| **Security**            | BYOK AI vault (AES-GCM 256) · JWT WebSocket auth · Helmet CSP · Rate limiting · CORS · express-validator                                                                                                 |
| **Desktop & Mobile**    | Tauri v2 (Windows/macOS/Linux) · Capacitor 7 (iOS/Android)                                                                                                                                               |

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
                     ├──→ AI Optimizer (Gemini / OpenAI / Anthropic / xAI / Groq / Ollama)
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

**Requirements:** Node.js 22+, npm 10+

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

## Pages

| Route           | Page         | Description                              |
| :-------------- | :----------- | :--------------------------------------- |
| `/`             | Home         | KPI dashboard, mini Sankey, quick nav    |
| `/energy-flow`  | Energy Flow  | Full D3.js Sankey + live price widget    |
| `/production`   | Production   | PV generation, self-consumption          |
| `/storage`      | Storage      | Battery SoC, charge/discharge            |
| `/consumption`  | Consumption  | Load breakdown, grid exchange            |
| `/ev`           | EV Charging  | PV surplus / fast / dynamic modes        |
| `/floorplan`    | Floorplan    | KNX room automation                      |
| `/ai-optimizer` | AI Optimizer | Gemini analysis + optimizer              |
| `/tariffs`      | Tariffs      | Live prices, forecasts, optimal windows  |
| `/analytics`    | Analytics    | 8 KPIs, energy balance, costs            |
| `/monitoring`   | Monitoring   | System health, metrics, adapter matrix   |
| `/settings`     | Settings     | Appearance, system, energy, security, AI |
| `/help`         | Help         | Docs, keyboard shortcuts, FAQ            |

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

- **Backend:** Helmet CSP + HSTS, CORS whitelist, express-validator, JWT (HS256) auth, rate limiting (100 req/min)
- **WebSocket:** JWT token auth, command whitelist, 64 KB max payload, 30 cmd/min per client
- **Encryption:** AES-GCM 256-bit + PBKDF2 600k iterations for API keys in IndexedDB
- **Transport:** TLS 1.3 everywhere, mTLS for EEBUS, client certs for OCPP
- **Docker:** Non-root, read-only filesystem, `no-new-privileges`, isolated networks
- **CI:** CodeQL SAST, npm audit, Dependabot (npm + Actions + Docker + Cargo)

For the full threat model, trust boundaries, STRIDE analysis, and GDPR/DSGVO compliance details, see [SECURITY.md](SECURITY.md).

## Testing

| Type       | Tool                                 | Scope                   |
| :--------- | :----------------------------------- | :---------------------- |
| Unit       | Vitest + jsdom + V8 coverage         | 106 tests, 16 suites    |
| E2E        | Playwright (Chromium/Firefox/WebKit) | Multi-route, a11y audit |
| a11y       | @axe-core/playwright                 | WCAG 2.2 AA (15 tests)  |
| Lighthouse | Lighthouse CI                        | Perf ≥ 85%, A11y ≥ 90%  |

## Deployment

**GitHub Pages** — automatic on push to `main` via GitHub Actions.

**Docker** — multi-stage build (node:22-alpine → nginx:1.27-alpine):

```bash
npm run docker:build && npm run docker:up
```

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
| Q4      | Historical analytics, multi-tenant SaaS, contrib marketplace                                                                   | 🔜 Planned |

## Changelog

<details open>
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

- CORS whitelist, JWT WebSocket auth, express-validator, rate limiting
- Helmet CSP + HSTS, 64 KB max payload, Dependabot, CodeQL SAST
</details>

<details>
<summary><b>v4.0–4.2</b> — Performance & Audit</summary>

- React Compiler, lazy-loaded locales (index chunk −60%), D3 tree-shaking
- IndexedDB consolidation, WCAG 2.2 AA audit, Radix UI, 106 unit tests
</details>

Full changelog: [git history](https://github.com/qnbs/Nexus-HEMS-Dash/commits/main)

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

**Nexus-HEMS Dashboard** ist ein produktionsreifes Echtzeit-Home-Energy-Management-System. Es vereint **10 Protokolladapter** (5 Core + 5 Contrib) zur Orchestrierung von PV, Batteriespeicher, Wärmepumpen und E-Mobilität — optimiert für dynamische Stromtarife (Tibber/aWATTar/Octopus/Nordpool).

- ⚡ Echtzeit D3.js Sankey-Energiefluss mit KI-Optimierung (Gemini 3.1)
- 🔌 10 Adapter: Victron, Modbus, KNX, OCPP, EEBUS + Home Assistant, Matter/Thread, Zigbee2MQTT, Shelly
- 🧩 Plugin-System: Adapter-Registry mit dynamischem Laden, npm-Paket-Format, BaseAdapter-Klasse
- 🚗 Intelligentes EV-Laden (PV-Überschuss, §14a EnWG, SG Ready, V2X)
- 🏠 KNX-Grundriss mit interaktiver Gebäudeautomation
- 📈 Prädiktive Vorhersage + Live-Tarif-Widget (5 Anbieter)
- 🔐 BYOK KI-Tresor (7 Anbieter, AES-GCM 256-bit)
- 📱 PWA Offline-First + Tauri Desktop + Capacitor Mobile
- ♿ WCAG 2.2 AA · 🌐 i18n DE/EN · 🎨 5 Themes
- 📊 Prometheus Monitoring · 📄 PDF-Berichte · 🔒 JWT + Helmet + CORS

```bash
git clone https://github.com/qnbs/Nexus-HEMS-Dash.git && cd Nexus-HEMS-Dash
npm install && npm run dev
```

**Docs:** [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) · [CONTRIBUTING.md](CONTRIBUTING.md) · [SECURITY.md](SECURITY.md) · [Adapter-Dev-Guide](docs/Adapter-Dev-Guide.md) · [Contrib-Adapter-README](src/core/adapters/contrib/README.md)

**Lizenz:** MIT — siehe [LICENSE](LICENSE).
