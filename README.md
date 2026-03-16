<div align="center">

# ⚡ Nexus-HEMS Dashboard

**Production-grade Home Energy Management System for the decentralized energy era**

[![CI](https://img.shields.io/github/actions/workflow/status/qnbs/Nexus-HEMS-Dash/ci.yml?branch=main&style=flat-square&logo=githubactions&logoColor=white&label=CI)](https://github.com/qnbs/Nexus-HEMS-Dash/actions/workflows/ci.yml)
[![Deploy](https://img.shields.io/github/actions/workflow/status/qnbs/Nexus-HEMS-Dash/deploy.yml?branch=main&style=flat-square&logo=githubactions&logoColor=white&label=Deploy)](https://github.com/qnbs/Nexus-HEMS-Dash/actions/workflows/deploy.yml)
[![License](https://img.shields.io/github/license/qnbs/Nexus-HEMS-Dash?style=flat-square)](LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/qnbs/Nexus-HEMS-Dash?style=flat-square&label=Release)](https://github.com/qnbs/Nexus-HEMS-Dash/releases)

**[Live Demo](https://qnbs.github.io/Nexus-HEMS-Dash/)** · **[Open in Codespaces](https://codespaces.new/qnbs/Nexus-HEMS-Dash)**

</div>

---

Nexus-HEMS unifies **5 industrial protocols** behind a single dashboard to orchestrate photovoltaic generation, battery storage, heat pumps, EV charging, and building automation — optimized for dynamic electricity tariffs.

**Stack:** React 19 · TypeScript 5.8 · Vite 6 · Tailwind CSS v4 · Zustand 5 · D3.js Sankey · Recharts · Motion · Dexie.js · Radix UI

## Key Features

| Category             | Features                                                                                                                                                                                |
| :------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Energy**           | Real-time D3.js Sankey flow · AI optimizer (Gemini 3.1) · 24h/7d predictive forecast · Live tariff widget (Tibber/aWATTar) · Smart EV charging (§14a EnWG) · SG Ready heat pump control |
| **Protocols**        | Victron MQTT (Cerbo GX) · Modbus/SunSpec · KNX/IP floorplan · OCPP 2.1 V2X · EEBUS SPINE/SHIP (TLS 1.3 mTLS)                                                                            |
| **Platform**         | PWA offline-first (Workbox + IndexedDB) · 5 themes · Full i18n (DE/EN) · WCAG 2.2 AA · PDF reports + QR sharing · Prometheus monitoring                                                 |
| **Security**         | BYOK AI vault (AES-GCM 256) · JWT WebSocket auth · Helmet CSP · Rate limiting · CORS · express-validator                                                                                |
| **Desktop & Mobile** | Tauri v2 (Windows/macOS/Linux) · Capacitor 7 (iOS/Android)                                                                                                                              |

## Architecture

```
Victron Cerbo GX ──┐
Modbus/SunSpec ─────┤
KNX/IP Gateway ─────┼── EnergyAdapter ──→ useEnergyStore ──→ UI (D3 Sankey + Recharts)
OCPP 2.1 CSMS ──────┤         │
EEBUS CEM ──────────┘    Dexie.js IndexedDB ──→ Offline Cache
```

All adapters implement a unified `EnergyAdapter` interface in `src/core/adapters/`, normalizing protocol data into a single `UnifiedEnergyModel`.

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

| Adapter              | Protocol            | Transport        | Security     |
| :------------------- | :------------------ | :--------------- | :----------- |
| VictronMQTTAdapter   | Node-RED MQTT→WS    | WebSocket        | Token auth   |
| ModbusSunSpecAdapter | SunSpec 103/124/201 | HTTP/REST        | TLS          |
| KNXAdapter           | KNX/IP Tunneling    | WebSocket bridge | —            |
| OCPP21Adapter        | OCPP 2.1 JSON-RPC   | WebSocket        | Client certs |
| EEBUSAdapter         | SPINE/SHIP 1.0      | WebSocket        | TLS 1.3 mTLS |

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

| Quarter | Feature                                                                                                                   | Status     |
| :------ | :------------------------------------------------------------------------------------------------------------------------ | :--------- |
| Q1–Q3   | 5 adapters, 5 themes, AI optimizer, EEBUS, PWA, Monitoring, Docker, Tauri, WCAG 2.2 AA, React Compiler, Backend hardening | ✅ Shipped |
| Q4      | Historical analytics, Matter/Thread, Multi-tenant SaaS                                                                    | 🔜 Planned |

## Changelog

<details open>
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

**Nexus-HEMS Dashboard** ist ein produktionsreifes Echtzeit-Home-Energy-Management-System. Es vereint **5 Industrieprotokolle** (Victron, Modbus, KNX, OCPP 2.1, EEBUS) zur Orchestrierung von PV, Batteriespeicher, Wärmepumpen und E-Mobilität — optimiert für dynamische Stromtarife (Tibber/aWATTar).

- ⚡ Echtzeit D3.js Sankey-Energiefluss mit KI-Optimierung (Gemini 3.1)
- 🚗 Intelligentes EV-Laden (PV-Überschuss, §14a EnWG, SG Ready)
- 🏠 KNX-Grundriss mit interaktiver Gebäudeautomation
- 📈 Prädiktive Vorhersage + Live-Tarif-Widget
- 🔐 BYOK KI-Tresor (7 Anbieter, AES-GCM 256-bit)
- 📱 PWA Offline-First + Tauri Desktop + Capacitor Mobile
- ♿ WCAG 2.2 AA · 🌐 i18n DE/EN · 🎨 5 Themes
- 📊 Prometheus Monitoring · 📄 PDF-Berichte · 🔒 JWT + Helmet + CORS

```bash
git clone https://github.com/qnbs/Nexus-HEMS-Dash.git && cd Nexus-HEMS-Dash
npm install && npm run dev
```

**Docs:** [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) · [CONTRIBUTING.md](CONTRIBUTING.md) · [SECURITY.md](SECURITY.md) · [Adapter-Dev-Guide](docs/Adapter-Dev-Guide.md)

**Lizenz:** MIT — siehe [LICENSE](LICENSE).
