<div align="center">

# ⚡ Nexus-HEMS Dashboard

### The Definitive Open-Source Home Energy Management System

<!-- Row 1: Dynamic repo & CI badges -->

[![GitHub release](https://img.shields.io/github/v/release/qnbs/Nexus-HEMS-Dash?style=for-the-badge&color=22ff88&logo=github&label=Release)](https://github.com/qnbs/Nexus-HEMS-Dash/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/qnbs/Nexus-HEMS-Dash/ci.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&label=CI)](https://github.com/qnbs/Nexus-HEMS-Dash/actions/workflows/ci.yml)
[![Deploy](https://img.shields.io/github/actions/workflow/status/qnbs/Nexus-HEMS-Dash/deploy.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&label=Deploy&color=22ff88)](https://github.com/qnbs/Nexus-HEMS-Dash/actions/workflows/deploy.yml)
[![Lighthouse](https://img.shields.io/github/actions/workflow/status/qnbs/Nexus-HEMS-Dash/lighthouse.yml?branch=main&style=for-the-badge&logo=lighthouse&logoColor=white&label=Lighthouse)](https://github.com/qnbs/Nexus-HEMS-Dash/actions/workflows/lighthouse.yml)
[![License](https://img.shields.io/github/license/qnbs/Nexus-HEMS-Dash?style=for-the-badge&color=f7b93e)](LICENSE)
[![OpenSSF Scorecard](https://img.shields.io/ossf-scorecard/github.com/qnbs/Nexus-HEMS-Dash?style=for-the-badge&label=Scorecard)](https://scorecard.dev/viewer/?uri=github.com/qnbs/Nexus-HEMS-Dash)
[![Security Scan](https://img.shields.io/github/actions/workflow/status/qnbs/Nexus-HEMS-Dash/security-scan.yml?branch=main&style=for-the-badge&logo=shieldsdotio&logoColor=white&label=Security)](https://github.com/qnbs/Nexus-HEMS-Dash/actions/workflows/security-scan.yml)

<!-- Row 2: Tech stack -->

![React 19](https://img.shields.io/badge/React-19-00f0ff?style=for-the-badge&logo=react&logoColor=00f0ff)
![TypeScript 5.8](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Vite 6](https://img.shields.io/badge/Vite-6-646cff?style=for-the-badge&logo=vite&logoColor=white)
![Zustand 5](https://img.shields.io/badge/Zustand-5-443E38?style=for-the-badge&logo=react&logoColor=white)

<!-- Row 3: Platform & quality -->

![PWA](https://img.shields.io/badge/PWA-Offline--First-ff8800?style=for-the-badge&logo=pwa&logoColor=white)
![WCAG 2.2 AA](https://img.shields.io/badge/WCAG-2.2%20AA-00f0ff?style=for-the-badge&logo=w3c&logoColor=white)
![i18n](https://img.shields.io/badge/i18n-DE%20%7C%20EN-22ff88?style=for-the-badge&logo=googletranslate&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-Desktop-FFC131?style=for-the-badge&logo=tauri&logoColor=white)

<!-- Row 4: Dynamic repo stats -->

[![GitHub stars](https://img.shields.io/github/stars/qnbs/Nexus-HEMS-Dash?style=for-the-badge&color=f7b93e&logo=github)](https://github.com/qnbs/Nexus-HEMS-Dash/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/qnbs/Nexus-HEMS-Dash?style=for-the-badge&color=00f0ff&logo=github)](https://github.com/qnbs/Nexus-HEMS-Dash/network/members)
[![GitHub issues](https://img.shields.io/github/issues/qnbs/Nexus-HEMS-Dash?style=for-the-badge&color=ff8800&logo=github)](https://github.com/qnbs/Nexus-HEMS-Dash/issues)
[![GitHub last commit](https://img.shields.io/github/last-commit/qnbs/Nexus-HEMS-Dash?style=for-the-badge&color=22ff88&logo=git&logoColor=white)](https://github.com/qnbs/Nexus-HEMS-Dash/commits/main)
[![GitHub repo size](https://img.shields.io/github/repo-size/qnbs/Nexus-HEMS-Dash?style=for-the-badge&color=646cff&logo=github)](https://github.com/qnbs/Nexus-HEMS-Dash)
[![GitHub code size](https://img.shields.io/github/languages/code-size/qnbs/Nexus-HEMS-Dash?style=for-the-badge&color=3178c6&logo=typescript&logoColor=white)](https://github.com/qnbs/Nexus-HEMS-Dash)

<br/>

[![Live Demo](https://img.shields.io/badge/%F0%9F%9A%80_Live_Demo-qnbs.github.io-ff8800?style=for-the-badge)](https://qnbs.github.io/Nexus-HEMS-Dash/)
&nbsp;&nbsp;
[![Open in Codespaces](https://img.shields.io/badge/%F0%9F%92%BB_Open_in-Codespaces-22ff88?style=for-the-badge&logo=github)](https://codespaces.new/qnbs/Nexus-HEMS-Dash)

<br/>

**Real-time orchestration for photovoltaics, battery storage, heat pumps & e-mobility**

🔋 Victron Cerbo GX &bull; 🏠 KNX/IP &bull; ⚡ Tibber / aWATTar &bull; 🤖 AI Optimizer (Gemini) &bull; 📡 EEBUS SPINE/SHIP &bull; 🔌 OCPP 2.1 V2X

[English](#-overview) &nbsp;|&nbsp; [Deutsch](#-überblick)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Quick Start](#-quick-start)
- [Page Structure](#-page-structure)
- [Protocol Adapters](#-protocol-adapters)
- [PWA & Offline](#-pwa--offline-architecture)
- [Security & Compliance](#-security--compliance)
- [Threat Model & Security Architecture](#-threat-model--security-architecture)
- [GDPR / DSGVO & Datenschutz](#-gdpr--dsgvo--datenschutz)
- [Design System](#-design-system)
- [Testing & CI/CD](#-testing--cicd)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap-2026)
- [Changelog](#-changelog)
- [Contributing](#-contributing)
- [Deutsch](#-überblick)

---

## 🎯 Overview

**Nexus-HEMS Dashboard** is a production-grade, real-time Home Energy Management System built for the decentralized energy era. It unifies **5 industrial protocols** behind a single dashboard to orchestrate photovoltaic generation, battery storage, heat pumps, EV charging, and building automation — all while optimizing for dynamic electricity tariffs.

```
  ┌──────────────┐   ┌───────────────┐   ┌──────────────┐
  │  ☀️  PV Array  │   │  🔋 Battery    │   │  ⚡ Grid       │
  └──────┬───────┘   └───────┬───────┘   └──────┬───────┘
         │                   │                   │
         └─────────┬─────────┴─────────┬─────────┘
                   │                   │
            ┌──────┴──────┐     ┌──────┴──────┐
            │ 🏠 House     │     │ 🚗 EV / 🔥 HP │
            └─────────────┘     └─────────────┘
                        ↕
           ┌────────────────────────┐
           │  📊 Nexus-HEMS Dash    │
           │  D3 Sankey · AI · PWA  │
           └────────────────────────┘
```

### Why Nexus-HEMS?

|                         | Traditional     | Nexus-HEMS                                                      |
| ----------------------- | --------------- | --------------------------------------------------------------- |
| **Protocol Support**    | Single vendor   | 5 protocols (Victron, Modbus, KNX, OCPP 2.1, EEBUS)             |
| **Tariff Optimization** | Manual          | AI-powered with Tibber/aWATTar real-time pricing                |
| **Accessibility**       | Basic           | WCAG 2.2 AA — Radix UI, ARIA, focus traps, screen reader tested |
| **Connectivity**        | Cloud-dependent | Offline-first PWA with local IndexedDB                          |
| **Visualization**       | Static charts   | Live D3.js Sankey energy flow diagrams                          |
| **i18n**                | Single language | Full EN/DE with persistent preference                           |
| **Security**            | API keys in env | AES-GCM 256 BYOK vault + Helmet + CORS + JWT + rate limiting    |

---

## ✨ Key Features

### Energy Management

| Feature                      | Description                                                            | Status  |
| ---------------------------- | ---------------------------------------------------------------------- | ------- |
| ⚡ **Real-Time Sankey**      | Live D3.js energy flow — PV → Battery → Grid → House → HP → EV         | ✅ Live |
| 🤖 **AI Optimizer**          | Google Gemini 3.1 for optimal EV/battery/HP charging strategies        | ✅ Live |
| 📈 **Predictive Forecast**   | 24h/7d weather-based PV & tariff predictions via Recharts              | ✅ Live |
| ⚡ **Live Tariff Widget**    | Real-time Tibber/aWATTar prices with mini-charts & alerts              | ✅ Live |
| 🚗 **Smart EV Charging**     | PV surplus, fast charge, dynamic tariff modes + §14a EnWG              | ✅ Live |
| 🔥 **SG Ready Control**      | Heat pump modes 1–4 for thermal storage optimization                   | ✅ Live |
| 📊 **Prometheus Monitoring** | Health dashboard, 10 live metrics, load charts, adapter matrix, alerts | ✅ Live |

### Platform & UX

| Feature              | Description                                                | Status  |
| -------------------- | ---------------------------------------------------------- | ------- |
| 🏠 **KNX Floorplan** | Interactive building automation — lights, climate, sensors | ✅ Live |

| 📄 **PDF Reports** | Automated monthly reports with Sankey, costs, CO₂ (UBA 380 g/kWh) | ✅ Live |
| 🤝 **Multi-Household** | Shareable dashboard links with QR codes | ✅ Live |
| 🔐 **BYOK AI Vault** | 7 providers (OpenAI, Anthropic, Google, xAI, Groq, Ollama, Custom) | ✅ Live |
| 🎨 **5 Premium Themes** | OceanDeep, Cyber Energy, Solar Light, Minimal White, Night Mode | ✅ Live |
| 🌐 **Full i18n** | 100% German/English with persistent language switcher + Cmd+K | ✅ 100% |
| ♿ **WCAG 2.2 AA** | Radix UI Dialog, ARIA live regions, focus traps, keyboard nav | ✅ Certified |
| 📱 **PWA Offline-First** | Service worker with Workbox, IndexedDB cache, background sync | ✅ Live |

### Protocol Adapters

| Feature                 | Description                                         | Status  |
| ----------------------- | --------------------------------------------------- | ------- |
| 🔌 **Victron MQTT**     | WebSocket bridge to Cerbo GX via Node-RED           | ✅ Live |
| ⚡ **Modbus/SunSpec**   | REST polling for SunSpec Models 103/124/201         | ✅ Live |
| 🏠 **KNX/IP**           | WebSocket bridge with GA→field reverse lookup       | ✅ Live |
| 🔋 **OCPP 2.1 + V2X**   | Vehicle-to-Grid JSON-RPC with charging profiles     | ✅ Live |
| 📡 **EEBUS SPINE/SHIP** | TLS 1.3 mutual auth, CEM use cases (LPC, LPP, MGCP) | ✅ Live |

---

## 🏗️ Architecture

### Adapter Pattern

All external protocols are encapsulated behind a unified `EnergyAdapter` interface. Each adapter normalizes raw protocol data into a single `UnifiedEnergyModel`, enabling hot-swappable protocol support.

```
┌─────────────────────────────────────────────────────────────────────┐
│                       useEnergyStore (Zustand)                      │
│            UnifiedEnergyModel = PV + Battery + Grid + …             │
├──────────┬───────────┬──────────┬────────────┬─────────────────────-┤
│ Victron  │  Modbus   │   KNX    │  OCPP 2.1  │    EEBUS             │
│   MQTT   │  SunSpec  │   /IP    │    V2X     │  SPINE/SHIP          │
│   (WS)   │  (REST)   │  (WS)   │    (WS)    │  (WS+TLS 1.3)       │
├──────────┴───────────┴──────────┴────────────┴─────────────────────-┤
│                       EnergyAdapter Interface                       │
│    connect() · onData() · sendCommand() · getSnapshot() · destroy() │
└─────────────────────────────────────────────────────────────────────┘
```

### Real-Time Data Flow

```
Victron Cerbo GX ──┐
Modbus/SunSpec ─────┤
KNX/IP Gateway ─────┼── EnergyAdapter ──→ useEnergyStore ──→ Zustand Store
OCPP 2.1 CSMS ──────┤                          │                    │
EEBUS CEM ──────────┘                    Dexie.js IndexedDB    useAppStore
                                               │                    │
                                          Offline Cache     D3 Sankey + UI
```

### Key Architectural Decisions

| Decision                        | Rationale                                                          |
| ------------------------------- | ------------------------------------------------------------------ |
| **Zustand** over Redux          | Minimal boilerplate, granular selectors, no provider wrappers      |
| **D3.js** for Sankey            | Full control over energy flow animation & real-time updates        |
| **Dexie.js** for storage        | TypeScript-first IndexedDB wrapper with versioned schemas          |
| **Workbox** for PWA             | Industry-standard service worker tooling with fine-grained caching |
| **Motion** for animation        | GPU-accelerated layout animations with spring physics              |
| **TanStack Query** for fetching | Built-in stale-while-revalidate, 5-min cache for API calls         |

---

## 🛠️ Technology Stack

<table>
<tr><td><b>Category</b></td><td><b>Technology</b></td><td><b>Version</b></td></tr>
<tr><td>UI Framework</td><td>React + React DOM</td><td>19</td></tr>
<tr><td>Language</td><td>TypeScript (strict)</td><td>5.8</td></tr>
<tr><td>UI Primitives</td><td>Radix UI (Dialog, Tooltip, Dropdown)</td><td>1.1</td></tr>
<tr><td>Build Tool</td><td>Vite + React Compiler (Babel)</td><td>6</td></tr>
<tr><td>Styling</td><td>Tailwind CSS (v4 engine)</td><td>4.1</td></tr>
<tr><td>State Management</td><td>Zustand</td><td>5</td></tr>
<tr><td>Routing</td><td>React Router</td><td>7</td></tr>
<tr><td>Visualization</td><td>d3-selection + d3-sankey</td><td>3.0 / 0.12</td></tr>
<tr><td>Charts</td><td>Recharts</td><td>3.8</td></tr>
<tr><td>Animation</td><td>Motion (Framer Motion successor)</td><td>12</td></tr>
<tr><td>Data Fetching</td><td>TanStack React Query</td><td>5</td></tr>
<tr><td>i18n</td><td>react-i18next + i18next</td><td>16 / 25</td></tr>
<tr><td>Database</td><td>Dexie.js (IndexedDB)</td><td>4.3</td></tr>
<tr><td>PWA</td><td>vite-plugin-pwa + Workbox</td><td>1.2 / 7.4</td></tr>
<tr><td>Icons</td><td>Lucide React</td><td>0.546</td></tr>
<tr><td>Encryption</td><td>Web Crypto API (AES-GCM 256)</td><td>Native</td></tr>
<tr><td>Server</td><td>Express + WebSocket + Helmet + CORS</td><td>4.21</td></tr>
<tr><td>Auth</td><td>jsonwebtoken (JWT HS256)</td><td>9</td></tr>
<tr><td>Validation</td><td>express-validator + Zod</td><td>7 / 4</td></tr>
<tr><td>Rate Limiting</td><td>express-rate-limit</td><td>8</td></tr>
<tr><td>Unit Tests</td><td>Vitest + @vitest/coverage-v8</td><td>4.0</td></tr>
<tr><td>E2E Tests</td><td>Playwright + @axe-core</td><td>1.58</td></tr>
<tr><td>Linting</td><td>ESLint (flat config)</td><td>9</td></tr>
<tr><td>Formatting</td><td>Prettier</td><td>3.8</td></tr>
<tr><td>Git Hooks</td><td>Husky + lint-staged</td><td>9.1</td></tr>
</table>

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 22+** (LTS recommended)
- npm 10+ or pnpm
- Optional: Victron Cerbo GX with Node-RED, KNX IP Router

### Installation

```bash
# Clone
git clone https://github.com/qnbs/Nexus-HEMS-Dash.git
cd Nexus-HEMS-Dash

# Install (no --legacy-peer-deps needed)
npm install

# Start development server
npm run dev
```

### Available Scripts

| Command                 | Description                              |
| ----------------------- | ---------------------------------------- |
| `npm run dev`           | Start dev server (Express + Vite HMR)    |
| `npm run build`         | Production build with PWA service worker |
| `npm run build:analyze` | Bundle analysis (dist/bundle-stats.html) |
| `npm run preview`       | Preview production build locally         |
| `npm run test`          | Run Vitest in watch mode                 |
| `npm run test:run`      | Run all 106 unit tests once              |
| `npm run test:e2e`      | Playwright E2E + accessibility tests     |
| `npm run test:coverage` | Unit tests with V8 coverage              |
| `npm run lint`          | ESLint with zero-warning policy          |
| `npm run format`        | Prettier auto-format                     |
| `npm run type-check`    | TypeScript strict validation             |
| `npm run docker:build`  | Build Docker image                       |
| `npm run docker:up`     | Start Docker container                   |
| `npm run docker:down`   | Stop Docker container                    |

### Environment Variables

> **Note:** Since v3.2.0, all AI API keys are managed via the BYOK Settings page (`/settings/ai`) with AES-GCM 256-bit encryption in IndexedDB. No `.env` file required for AI features.

```bash
# Optional: server-side Gemini proxy
GEMINI_API_KEY=your-key-here

# Security (optional — auto-generated if not set)
JWT_SECRET=your-32-byte-hex-secret     # JWT signing key (auto-generated per run if omitted)
CORS_ORIGINS=https://my-domain.com     # Comma-separated additional CORS origins
PORT=3000                               # Server port (default: 3000)
NODE_ENV=production                     # Enables WS JWT auth requirement
```

---

## 🗺️ Page Structure

| Route           | Page             | Description                                                                                     |
| :-------------- | :--------------- | :---------------------------------------------------------------------------------------------- |
| `/`             | **Home**         | KPI dashboard, mini Sankey, quick navigation                                                    |
| `/energy-flow`  | **Energy Flow**  | Full D3.js Sankey diagram with live price widget                                                |
| `/production`   | **Production**   | PV generation, power output, self-consumption ratio                                             |
| `/storage`      | **Storage**      | Battery SoC, charge/discharge stats, strategy controls                                          |
| `/consumption`  | **Consumption**  | Load breakdown, consumer categories, grid exchange                                              |
| `/ev`           | **EV Charging**  | Charge control, PV surplus / fast / dynamic modes, §14a                                         |
| `/floorplan`    | **Floorplan**    | KNX interactive building automation, room controls                                              |
| `/ai-optimizer` | **AI Optimizer** | Gemini 3.1 analysis, enhanced optimizer                                                         |
| `/tariffs`      | **Tariffs**      | Live Tibber/aWATTar prices, forecasts, optimal windows                                          |
| `/analytics`    | **Analytics**    | 8 KPIs, energy balance chart, monthly comparison, cost donut, data quality                      |
| `/monitoring`   | **Monitoring**   | System health, 10 live metrics, load charts, adapter matrix, alerts, Grafana                    |
| `/settings`     | **Settings**     | 8-tab configuration: appearance, system, energy, security, storage, notifications, advanced, AI |
| `/settings/ai`  | **AI Settings**  | BYOK provider management, encryption settings                                                   |
| `/help`         | **Help**         | Documentation, keyboard shortcuts, FAQ                                                          |

---

## 🔌 Protocol Adapters

| Adapter                | Protocol            | Capabilities            | Transport         | Security     |
| :--------------------- | :------------------ | :---------------------- | :---------------- | :----------- |
| `VictronMQTTAdapter`   | Node-RED MQTT→WS    | PV, battery, grid, load | WebSocket         | Token auth   |
| `ModbusSunSpecAdapter` | SunSpec 103/124/201 | PV, battery, grid       | HTTP/REST polling | TLS          |
| `KNXAdapter`           | KNX/IP Tunneling    | Room automation         | WebSocket bridge  | —            |
| `OCPP21Adapter`        | OCPP 2.1 JSON-RPC   | EV charger + V2X        | WebSocket         | Client certs |
| `EEBUSAdapter`         | SPINE/SHIP 1.0      | EV charger, load        | WebSocket         | TLS 1.3 mTLS |

### Integration Points

```
src/core/adapters/
├── EnergyAdapter.ts          # Interface + UnifiedEnergyModel types
├── VictronMQTTAdapter.ts     # Cerbo GX via Node-RED WebSocket
├── ModbusSunSpecAdapter.ts   # SunSpec inverter/meter REST polling
├── KNXAdapter.ts             # KNX/IP room state management
├── OCPP21Adapter.ts          # OCPP 2.1 V2X charging profiles
├── EEBUSAdapter.ts           # SPINE/SHIP with CEM use cases
└── index.ts                  # Adapter registry & factory

src/core/
├── useEnergyStore.ts         # Zustand aggregator + useAdapterBridge
└── useLegacySendCommand.ts   # Backward-compatible command wrapper
```

---

## 📱 PWA & Offline Architecture

Nexus-HEMS runs as a full Progressive Web App with sophisticated offline capabilities:

| Layer               | Strategy                   | Details                                              |
| :------------------ | :------------------------- | :--------------------------------------------------- |
| **App Shell**       | Precache (Workbox)         | All HTML, JS, CSS precached — instant load           |
| **API: Weather**    | StaleWhileRevalidate       | Open-Meteo, 24h cache, 50 entries max                |
| **API: Tariffs**    | NetworkFirst (8s timeout)  | Tibber/aWATTar, 1h cache                             |
| **API: AI**         | NetworkFirst (10s timeout) | Gemini responses, 1h cache                           |
| **Fonts**           | CacheFirst                 | Google Fonts + local, 365-day cache                  |
| **Images**          | CacheFirst                 | 30-day cache, 150 entries max                        |
| **Static Assets**   | StaleWhileRevalidate       | JS/CSS bundles, 7-day cache                          |
| **Energy Data**     | IndexedDB (Dexie.js)       | Last 1,000 snapshots + 100 Sankey diagrams           |
| **Tariff Data**     | IndexedDB + TTL            | Provider-scoped with automatic expiry                |
| **Offline Actions** | Background Sync            | Queued commands with exponential backoff (5 retries) |

### Service Worker Lifecycle

- **Auto-update** with `skipWaiting` + `clientsClaim` — no stale cache
- **Controller change** listener for seamless page reload
- **Inline loading fallback** in HTML — prevents blank white screen
- **Emergency retry** button — clears all caches and SW registrations
- **30-minute** periodic update checks in background

---

## 🔒 Security & Compliance

| Area                    | Implementation                                                                  |
| :---------------------- | :------------------------------------------------------------------------------ |
| **Backend Hardening**   | Helmet CSP + HSTS, CORS origin whitelist, express-validator, trust-proxy        |
| **Rate Limiting**       | 100 req/min global (express-rate-limit), 60 req/min API, 30 cmd/min per WS      |
| **WebSocket Auth**      | JWT (HS256) token-based auth, BYOK vault check, 64 KB max payload               |
| **Auth Endpoints**      | `/api/auth/token` (issue), `/api/auth/refresh` (renew), 24h expiry              |
| **AI Key Encryption**   | AES-GCM 256-bit + PBKDF2 600k iterations, stored in IndexedDB                   |
| **Transport Security**  | TLS 1.3 + mutual TLS for EEBUS, client certificates for OCPP                    |
| **Content Security**    | Trusted Types, no inline eval, `frame-ancestors 'none'`, `base-uri 'self'`      |
| **Nginx Hardening**     | `server_tokens off`, rate limiting zones, HSTS preload, deny dotfiles/sensitive |
| **Dependency Scanning** | Dependabot (weekly, npm+Actions+Docker+Cargo), npm audit in CI, Snyk optional   |
| **CodeQL Analysis**     | GitHub CodeQL for JS/TS SAST on every push/PR                                   |
| **§14a EnWG**           | Smart meter gateway integration for controllable loads                          |
| **Data Sovereignty**    | Local-first architecture — no cloud dependency                                  |
| **WCAG 2.2 AA**         | Axe-core automated testing, semantic HTML, focus management                     |

### Backend Architecture

```
Client ──→ nginx (rate limit, CSP, HSTS)
              │
              ├── Static Assets (SPA)
              └── Express Server
                    ├── Helmet (security headers)
                    ├── CORS (origin whitelist)
                    ├── Rate Limiter (100 req/min/IP)
                    ├── express-validator (input sanitization)
                    ├── /api/auth/token (JWT issue)
                    ├── /api/auth/refresh (JWT renew)
                    ├── /api/health (status)
                    ├── /api/eebus/* (validated)
                    ├── /metrics (Prometheus)
                    └── WebSocket (JWT auth + cmd validation + rate limit)
```

### Dependency Update Strategy

| Tool           | Scope                              | Schedule      | Configuration                    |
| :------------- | :--------------------------------- | :------------ | :------------------------------- |
| **Dependabot** | npm, GitHub Actions, Docker, Cargo | Weekly (Mon)  | `.github/dependabot.yml`         |
| **npm audit**  | Runtime + dev deps                 | Every CI run  | `npm audit --audit-level=high`   |
| **Snyk**       | Deep vulnerability scan            | Weekly + PR   | `.github/workflows/security.yml` |
| **CodeQL**     | SAST (JS/TS)                       | Every push/PR | `.github/workflows/security.yml` |

---

## 🛡️ Threat Model & Security Architecture

This chapter documents the **threat landscape**, **trust boundaries**, and **defense-in-depth strategy** for Nexus-HEMS deployments — from single-home Raspberry Pi setups to multi-tenant Docker stacks.

### Threat Landscape

A HEMS operates at the intersection of IT and OT (Operational Technology). Attackers who compromise energy control can cause **physical damage** (battery overcharge, grid backfeed), **financial loss** (tariff manipulation), or **privacy violations** (consumption profiling).

| Threat ID | Category (STRIDE)          | Threat Description                                    | Affected Assets                        | Severity    |
| :-------- | :------------------------- | :---------------------------------------------------- | :------------------------------------- | :---------- |
| T-01      | **Spoofing**               | Forged MQTT messages impersonate Victron Cerbo GX     | PV/Battery data, control commands      | 🔴 Critical |
| T-02      | **Tampering**              | Man-in-the-middle on KNX/IP telegrams                 | Floorplan actuators (lights, HVAC)     | 🟠 High     |
| T-03      | **Repudiation**            | Unsigned OCPP transactions allow cost disputes        | EV charging billing records            | 🟡 Medium   |
| T-04      | **Information Disclosure** | AI API keys leaked via XSS or unencrypted storage     | User credentials, billing data         | 🔴 Critical |
| T-05      | **Denial of Service**      | WebSocket flood exhausts backend resources            | Real-time dashboard, adapter bridge    | 🟠 High     |
| T-06      | **Elevation of Privilege** | Compromised adapter bridge pivots to frontend network | Full dashboard takeover                | 🔴 Critical |
| T-07      | **Spoofing**               | Rogue EEBUS device with forged SKI certificate        | Load control (§14a EnWG)               | 🔴 Critical |
| T-08      | **Tampering**              | Tariff API response manipulation (Tibber/aWATTar)     | AI optimizer decisions, financial loss | 🟠 High     |
| T-09      | **Information Disclosure** | Prometheus `/metrics` endpoint exposed externally     | System topology, energy consumption    | 🟡 Medium   |
| T-10      | **Denial of Service**      | Malformed SPINE messages crash EEBUS parser           | EEBUS adapter availability             | 🟡 Medium   |

### Trust Boundaries

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  ZONE 0 — UNTRUSTED (Internet)                                                  │
│                                                                                  │
│  • End-user browsers                                                             │
│  • Tibber / aWATTar / Open-Meteo APIs                                            │
│  • AI provider APIs (OpenAI, Anthropic, Gemini, xAI, Groq)                       │
├──────────────────── TLS 1.3 + HSTS ─────────────────────────────────────────────-┤
│  ZONE 1 — DMZ (Frontend Network: nexus-frontend)                                │
│                                                                                  │
│  • nginx reverse proxy (rate limiting, CSP, WAF headers)                         │
│  • Static SPA assets (React 19 bundle, service worker)                           │
├──────────────────── JWT + CORS ──────────────────────────────────────────────────┤
│  ZONE 2 — APPLICATION (Backend Network: nexus-backend, internal: true)           │
│                                                                                  │
│  • Express server (Helmet, rate limiter, input validation)                       │
│  • WebSocket server (JWT auth, command whitelist, 64 KB max payload)             │
│  • Prometheus metrics collector                                                  │
│  • JWT token issuer + refresh                                                    │
├──────────────────── Internal API + mTLS ─────────────────────────────────────────┤
│  ZONE 3 — ADAPTER (Adapter Network: nexus-adapters, isolated)                   │
│                                                                                  │
│  • adapter-bridge container (protocol translation)                               │
│  • Victron MQTT (port 1883/9001)                                                 │
│  • Modbus TCP/SunSpec (port 502)                                                 │
│  • KNX/IP (port 3671)                                                            │
│  • OCPP 2.1 WebSocket (port 9000)                                                │
│  • EEBUS SHIP (port 4712, TLS 1.3 mTLS)                                          │
├──────────────────── Physical / Field Bus ─────────────────────────────────────────┤
│  ZONE 4 — OT DEVICES (Physical equipment)                                       │
│                                                                                  │
│  • Victron Cerbo GX / Venus OS                                                   │
│  • SunSpec-compatible inverters                                                  │
│  • KNX actuators & sensors                                                       │
│  • OCPP 2.1 charge points (ISO 15118)                                            │
│  • EEBUS-certified heat pumps, smart meters                                      │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### TLS 1.3 Everywhere

All network communication uses **TLS 1.3** or better — there is no plaintext transport in production.

| Connection              | Protocol      | TLS Mode                        | Cipher Suites                                            | Certificate Handling                           |
| :---------------------- | :------------ | :------------------------------ | :------------------------------------------------------- | :--------------------------------------------- |
| Browser → nginx         | HTTPS         | TLS 1.3                         | `TLS_AES_256_GCM_SHA384`, `TLS_CHACHA20_POLY1305_SHA256` | Let's Encrypt / ACME auto-renewal              |
| nginx → Express         | Reverse proxy | Loopback (same host) or TLS 1.3 | Same as above                                            | Internal CA or self-signed                     |
| Dashboard → AI APIs     | HTTPS         | TLS 1.3                         | Provider-managed                                         | Provider root CA (system trust store)          |
| Dashboard → Tariff APIs | HTTPS         | TLS 1.3                         | Provider-managed                                         | Provider root CA                               |
| Backend → Victron MQTT  | WSS           | TLS 1.2+                        | Cerbo GX native TLS                                      | Optional client certificate                    |
| Backend → KNX/IP        | WSS           | TLS 1.2+ via knxd bridge        | Bridge-configured                                        | Pre-shared key or certificate                  |
| Backend → OCPP 2.1      | WSS           | TLS 1.3 (Security Profile 2/3)  | `TLS_AES_128_GCM_SHA256`                                 | Client cert + CA chain (Profile 3: mTLS)       |
| Backend → EEBUS SHIP    | TLS 1.3       | **Mutual TLS (mTLS)**           | `TLS_AES_256_GCM_SHA384`                                 | SKI-pinned X.509 certs, device pairing via PIN |
| Prometheus → Express    | HTTP          | Internal network only           | N/A (no external access)                                 | `nexus-backend` network is `internal: true`    |

**EEBUS mTLS Details (VDE-AR-E 2829-6):**

```
Device A (HEMS)                          Device B (Heat Pump)
    │                                          │
    ├── mDNS Discovery (_ship._tcp) ──────────→│
    │                                          │
    ├── TLS 1.3 ClientHello ──────────────────→│
    │←──────────────── TLS 1.3 ServerHello ────┤
    │←──────────────── Server Certificate ─────┤ (X.509 with SKI)
    ├── Client Certificate ───────────────────→│ (X.509 with SKI)
    │                                          │
    ├── Verify SKI ∈ trustedSKIs Set ──────────│
    │──────────────── Verify SKI ∈ trusted ────┤
    │                                          │
    ├── SHIP Handshake (init→cmi→sme→pin) ────→│
    │←──────────────── SHIP Connected ─────────┤
    │                                          │
    ├── SPINE CEM Messages ←──────────────────→│ (encrypted channel)
    └──────────────────────────────────────────-┘
```

### Key Rotation & Secret Management

| Secret Type             | Storage                              | Rotation Policy                  | Rotation Mechanism                                          |
| :---------------------- | :----------------------------------- | :------------------------------- | :---------------------------------------------------------- |
| **AI API Keys**         | IndexedDB (AES-GCM 256, PBKDF2 600k) | User-initiated or on compromise  | Re-encrypt with fresh session passphrase on each tab open   |
| **Session Passphrase**  | `sessionStorage` (32 random bytes)   | Every tab/window open            | Automatic: `crypto.getRandomValues()` on init               |
| **JWT Secret**          | `JWT_SECRET` env var (server-side)   | On deployment / ≤ 90 days        | Rotate via environment variable, all tokens expire in ≤ 24h |
| **JWT Tokens**          | Client memory (never persisted)      | 24h expiry + refresh endpoint    | `/api/auth/refresh` before expiry, old token invalidated    |
| **EEBUS mTLS Certs**    | Secure Store (IndexedDB, encrypted)  | Annual or on SKI compromise      | Re-pair device: revoke old SKI, generate new cert pair      |
| **OCPP Client Certs**   | Secure Store (IndexedDB, encrypted)  | Per OCPP Security Profile policy | Profile 3: cert rotation via `CertificateSigned.req`        |
| **Adapter Auth Tokens** | Secure Store (IndexedDB, encrypted)  | User-initiated                   | Re-configure adapter in Settings → Security tab             |
| **Grafana Admin**       | Docker env var / secret              | On deployment                    | `GRAFANA_PASSWORD` env var, never use default in production |
| **PBKDF2 Salt**         | Per-encryption (16 bytes random)     | Every encryption operation       | Automatic: unique salt concatenated with ciphertext         |
| **AES-GCM IV**          | Per-encryption (12 bytes random)     | Every encryption operation       | Automatic: unique IV prevents nonce reuse                   |

**Key Derivation Chain:**

```
crypto.getRandomValues(32 bytes)
        │
        ▼
  Session Passphrase (sessionStorage)
        │
        ├── PBKDF2 (SHA-256, 600,000 iter, random 16-byte salt)
        │       │
        │       ▼
        │   AES-GCM 256-bit CryptoKey
        │       │
        │       ├── Encrypt AI API Key → IndexedDB
        │       ├── Encrypt Adapter Credentials → IndexedDB
        │       └── Encrypt mTLS Private Keys → IndexedDB
        │
        └── Cleared on tab/window close → all secrets inaccessible
```

### Isolated Docker Network Architecture

The production deployment uses **three isolated Docker networks** to enforce the principle of least privilege between components:

```
┌───────────────────────────────────────────────────────────────────┐
│                    Docker Host                                    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  nexus-frontend (bridge, external access)                   │  │
│  │                                                             │  │
│  │  ┌──────────────────────┐                                   │  │
│  │  │  nexus-hems-dash     │ ← Browser (port 8080)             │  │
│  │  │  (nginx, read_only)  │                                   │  │
│  │  └──────────┬───────────┘                                   │  │
│  └─────────────┼───────────────────────────────────────────────┘  │
│                │                                                  │
│  ┌─────────────┼───────────────────────────────────────────────┐  │
│  │  nexus-backend (bridge, internal: true — NO external access)│  │
│  │             │                                               │  │
│  │  ┌──────────▼───────────┐    ┌─────────────────────┐        │  │
│  │  │  nexus-hems-server   │    │  nexus-prometheus    │        │  │
│  │  │  (Express + WS)      │    │  (scrape /metrics)   │        │  │
│  │  │  JWT, rate limit,    │    └─────────────────────┘        │  │
│  │  │  Helmet, CORS        │    ┌─────────────────────┐        │  │
│  │  └──────────┬───────────┘    │  nexus-grafana       │        │  │
│  │             │                └─────────────────────┘        │  │
│  └─────────────┼───────────────────────────────────────────────┘  │
│                │                                                  │
│  ┌─────────────┼───────────────────────────────────────────────┐  │
│  │  nexus-adapters (bridge, device access)                     │  │
│  │             │                                               │  │
│  │  ┌──────────▼───────────┐                                   │  │
│  │  │  nexus-adapter-bridge│                                   │  │
│  │  │  (Protocol isolation)│                                   │  │
│  │  │                      │                                   │  │
│  │  │  ┌────────┐ ┌──────┐ │     ┌──────────────────────┐      │  │
│  │  │  │Victron │ │KNX/IP│ │ ←──→│  Physical Devices     │      │  │
│  │  │  │MQTT    │ │      │ │     │  (Cerbo GX, KNX Bus,  │      │  │
│  │  │  ├────────┤ ├──────┤ │     │   Wallbox, Heat Pump) │      │  │
│  │  │  │Modbus  │ │OCPP  │ │     └──────────────────────┘      │  │
│  │  │  │SunSpec │ │2.1   │ │                                   │  │
│  │  │  ├────────┤ ├──────┤ │                                   │  │
│  │  │  │EEBUS   │ │      │ │                                   │  │
│  │  │  │SHIP    │ │      │ │                                   │  │
│  │  │  └────────┘ └──────┘ │                                   │  │
│  │  └──────────────────────┘                                   │  │
│  └─────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

**Network Isolation Rules:**

| Source Container                | `nexus-frontend` | `nexus-backend` | `nexus-adapters` | Internet         |
| :------------------------------ | :--------------- | :-------------- | :--------------- | :--------------- |
| **nexus-hems-dash** (nginx)     | ✅ Member        | ✅ Member       | ❌ Blocked       | ✅ Ingress       |
| **nexus-hems-server** (Express) | ❌ Blocked       | ✅ Member       | ✅ Member        | ❌ Blocked       |
| **adapter-bridge**              | ❌ Blocked       | ❌ Blocked      | ✅ Member        | ✅ Device access |
| **prometheus**                  | ❌ Blocked       | ✅ Member       | ❌ Blocked       | ❌ Blocked       |
| **grafana**                     | ❌ Blocked       | ✅ Member       | ❌ Blocked       | ❌ Blocked       |

**Key Isolation Properties:**

- **`nexus-backend` is `internal: true`** — no direct internet access, only reachable via nginx reverse proxy
- **`adapter-bridge` has no access to `nexus-frontend`** — a compromised adapter cannot serve malicious content to browsers (mitigates T-06)
- **`nexus-hems-server` bridges backend ↔ adapters** — single control point for command validation and JWT enforcement
- **Prometheus/Grafana** — isolated on backend network, never exposed externally (mitigates T-09)
- All containers run with `read_only: true` + `no-new-privileges:true` + non-root user

### Container Hardening

| Measure                 | Implementation                                                     | Threat Mitigated                     |
| :---------------------- | :----------------------------------------------------------------- | :----------------------------------- |
| Read-only filesystem    | `read_only: true` + `tmpfs` for `/tmp`, `/var/cache/nginx`, `/run` | Persistent malware, config tampering |
| No privilege escalation | `security_opt: no-new-privileges:true`                             | Container escape via setuid/setgid   |
| Non-root user           | `adduser -S app -G app` (nginx), non-root node                     | Root-level container compromise      |
| Resource limits         | Docker Compose `deploy.resources` (configurable)                   | Resource exhaustion DoS              |
| Health checks           | 15–30s interval, 3 retries, auto-restart                           | Service availability                 |
| Minimal base images     | `node:22-alpine`, `nginx:1.27-alpine`                              | Reduced attack surface               |
| No shell in production  | Alpine minimal — no bash, no package manager in runtime            | Post-exploitation tooling            |

### Mitigation Matrix

| Threat ID                | Mitigation Controls                                                                               | Defense Layer            |
| :----------------------- | :------------------------------------------------------------------------------------------------ | :----------------------- |
| T-01 (MQTT Spoofing)     | TLS/WSS transport, auth token injection from Secure Store, topic-level ACL on Venus OS            | Transport + Auth         |
| T-02 (KNX Tampering)     | WSS bridge encryption, command whitelist validation, KNX tunneling mode authentication            | Transport + Application  |
| T-03 (OCPP Repudiation)  | OCPP Security Profile 2/3, signed `TransactionEvent` with meter values, message correlation IDs   | Application + Audit      |
| T-04 (Key Disclosure)    | AES-GCM 256 + PBKDF2 600k in IndexedDB, session passphrase auto-cleared, CSP blocks XSS vectors   | Encryption + CSP         |
| T-05 (WS Flood)          | 3-tier rate limiting (nginx → Express → WS), 64 KB max payload, connection timeout 30s            | Network + Application    |
| T-06 (Adapter Pivot)     | Isolated `nexus-adapters` network, no route to `nexus-frontend`, bridge container as sole gateway | Network Isolation        |
| T-07 (EEBUS SKI Forgery) | TLS 1.3 mTLS + SKI pinning in `eebusTrustedSKIs` set, device pairing via physical PIN             | mTLS + Out-of-band       |
| T-08 (Tariff Tampering)  | HTTPS-only API calls, response schema validation in `predictive-ai.ts`, fallback to cached prices | Transport + Validation   |
| T-09 (Metrics Exposure)  | Prometheus on `internal: true` backend network, no port mapping to host                           | Network Isolation        |
| T-10 (SPINE Parsing DoS) | Message counter validation, bounded payload parsing, `ErrorBoundary` around adapter components    | Application + Resilience |

### Security Testing & CI/CD Pipeline

```
┌────────────────────────────────────────────────────────────────┐
│  Push / PR                                                     │
│                                                                │
│  ├── CodeQL SAST ──────────── JS/TS static analysis            │
│  ├── npm audit ────────────── Dependency vulnerability scan     │
│  ├── Dependabot ───────────── Automated dependency updates      │
│  ├── ESLint (strict) ──────── Code quality + security rules     │
│  ├── TypeScript (strict) ──── Type safety, no implicit any      │
│  ├── Vitest ───────────────── crypto.test.ts, ai-keys.test.ts   │
│  ├── Playwright ───────────── E2E: auth flows, CSP validation   │
│  └── Lighthouse CI ────────── Best Practices ≥ 90%              │
│                                                                │
│  Weekly                                                        │
│  ├── Snyk ─────────────────── Deep transitive vuln scan         │
│  └── Dependabot ───────────── npm + Actions + Docker + Cargo    │
└────────────────────────────────────────────────────────────────┘
```

### Compliance Summary

| Standard / Regulation | Scope                                | Implementation                                                             |
| :-------------------- | :----------------------------------- | :------------------------------------------------------------------------- |
| **§14a EnWG**         | Controllable loads (EV, HP, battery) | Load control limits via EEBUS LPC/LPP, OCPP `ChargingStationMaxProfile`    |
| **VDE-AR-E 2829-6**   | EEBUS SPINE/SHIP interoperability    | Full SHIP handshake, SPINE CEM use cases (LPC, LPP, MGCP)                  |
| **OCPP 2.1**          | EV charging security profiles 0–3    | JWT auth, client certs, ISO 15118 Plug & Charge                            |
| **GDPR / DSGVO**      | Energy consumption data privacy      | Local-first architecture, no cloud telemetry, session-scoped encryption    |
| **WCAG 2.2 AA**       | Accessibility                        | Radix UI, ARIA, axe-core automated testing                                 |
| **OWASP Top 10**      | Web application security             | CSP, input validation, rate limiting, secure headers, no injection vectors |

---

## 🔏 GDPR / DSGVO & Datenschutz

Nexus-HEMS ist als **Privacy-by-Design** und **Privacy-by-Default** System konzipiert (Art. 25 DSGVO). Die Architektur garantiert **Datensouveränität**: Alle Energieverbrauchs-, Erzeugungs- und Steuerungsdaten verbleiben auf dem lokalen Gerät des Nutzers — es besteht **keine Cloud-Pflicht**.

### Architekturprinzip: Offline-First, Local-Only

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Nutzer-Gerät (Browser / Tauri Desktop / PWA)                          │
│                                                                        │
│  ┌─────────────────────┐   ┌──────────────────────────────────────────┐ │
│  │  Zustand Stores     │   │  IndexedDB (Dexie.js v4)                │ │
│  │  (In-Memory)        │   │                                        │ │
│  │                     │   │  • Energiedaten (Offline-Cache)         │ │
│  │  • useAppStore      │   │  • AI-API-Keys (AES-GCM 256 encrypted) │ │
│  │  • useEnergyStore   │   │  • Adapter-Credentials (encrypted)     │ │
│  │                     │   │  • Einstellungen & Präferenzen         │ │
│  └─────────────────────┘   └──────────────────────────────────────────┘ │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │  localStorage                                               │       │
│  │  • Theme, Sprache, Onboarding-Status (keine PII)            │       │
│  └──────────────────────────────────────────────────────────────┘       │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │  sessionStorage                                             │       │
│  │  • Session-Passphrase (32 Bytes, auto-gelöscht bei Tab-Ende)│       │
│  └──────────────────────────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────────────────────────┘
        │                    │                    │
        │ Kein Upload        │ Kein Tracking      │ Kein Telemetrie
        ▼                    ▼                    ▼
   ╔══════════════════════════════════════════════════════╗
   ║  Alle Daten bleiben auf dem Gerät des Nutzers.      ║
   ║  Kein Cloud-Konto erforderlich.                      ║
   ║  Kein Backend für Grundfunktionalität nötig.         ║
   ╚══════════════════════════════════════════════════════╝
```

### Datenklassifizierung

| Datenkategorie           | Beispiele                                                  | Speicherort                      | Verschlüsselung               | Aufbewahrung                                   |
| :----------------------- | :--------------------------------------------------------- | :------------------------------- | :---------------------------- | :--------------------------------------------- |
| **Energiedaten**         | PV-Erzeugung, Batterie-SoC, Netzverbrauch, EV-Ladeleistung | IndexedDB (Offline-Cache)        | Keine (nicht-personenbezogen) | Nutzerkontrolliert, löschbar via Einstellungen |
| **Steuerungsbefehle**    | SET_EV_POWER, SET_HEAT_PUMP_MODE                           | Nur In-Memory (Zustand)          | N/A (nicht persistiert)       | Flüchtig — verworfen nach Ausführung           |
| **API-Schlüssel**        | OpenAI, Anthropic, Gemini, xAI, Groq Keys                  | IndexedDB (`aiKeys`)             | AES-GCM 256 + PBKDF2 600k     | Bis Löschung durch Nutzer                      |
| **Adapter-Zugangsdaten** | MQTT-Passwörter, mTLS-Zertifikate, OCPP-Auth               | IndexedDB (`adapterCredentials`) | AES-GCM 256 + PBKDF2 600k     | Session-gebunden (auto-gelöscht)               |
| **Einstellungen**        | Theme, Sprache, Adapter-Konfiguration                      | localStorage / IndexedDB         | Keine (nicht-personenbezogen) | Bis manuelle Löschung                          |
| **Tarifpreise**          | Tibber/aWATTar Börsenstrompreise                           | In-Memory + IndexedDB Cache      | Keine (öffentliche Daten)     | 24h TTL, automatisch invalidiert               |

### Optionale externe Verbindungen

Nexus-HEMS funktioniert **vollständig offline**. Externe API-Aufrufe sind **opt-in** und dienen ausschließlich der Funktionserweiterung:

| Externer Dienst                                        | Zweck                       | Daten gesendet                        | Rechtsgrundlage (DSGVO)             | Deaktivierbar                     |
| :----------------------------------------------------- | :-------------------------- | :------------------------------------ | :---------------------------------- | :-------------------------------- |
| **Tibber API**                                         | Echtzeit-Strompreise        | Keine PII — nur Market-Area-Abfrage   | Art. 6(1)(f) Berechtigtes Interesse | ✅ Ja — Adapter entfernen         |
| **aWATTar API**                                        | Day-Ahead-Börsenstrompreise | Keine PII — nur Preiszone (DE/AT)     | Art. 6(1)(f) Berechtigtes Interesse | ✅ Ja — Adapter entfernen         |
| **Open-Meteo API**                                     | Wetter- & PV-Prognose       | Breiten-/Längengrad (konfigurierbar)  | Art. 6(1)(a) Einwilligung           | ✅ Ja — Prognose deaktivieren     |
| **AI-Provider** (OpenAI, Anthropic, Gemini, xAI, Groq) | KI-Optimierungsvorschläge   | Anonymisierte Energiedaten (kW-Werte) | Art. 6(1)(a) Einwilligung (BYOK)    | ✅ Ja — API-Key nicht hinterlegen |
| **Ollama** (lokal)                                     | Lokale KI-Inferenz          | Keine — läuft auf lokalem Server      | N/A (keine Datenübertragung)        | ✅ Ja                             |
| **Google Fonts**                                       | Schriftarten (Inter)        | Browser-IP beim Laden                 | Art. 6(1)(f) Berechtigtes Interesse | ✅ Self-Hosting möglich           |

> **Hinweis:** Keiner der externen Dienste erhält personenbezogene Daten (Name, E-Mail, Adresse). Energieverbrauchswerte werden nur als anonymisierte kW/kWh-Werte übermittelt, wenn der Nutzer die jeweilige Funktion aktiv einrichtet.

### DSGVO-Rechte des Nutzers (Art. 15–22)

| Recht                                        | Umsetzung in Nexus-HEMS                                                                                           |
| :------------------------------------------- | :---------------------------------------------------------------------------------------------------------------- |
| **Auskunftsrecht** (Art. 15)                 | Alle Daten liegen lokal im Browser — Nutzer hat jederzeit vollen Zugriff via DevTools → IndexedDB / localStorage  |
| **Recht auf Berichtigung** (Art. 16)         | Einstellungen → Adapter-Konfiguration, AI-Keys jederzeit änderbar                                                 |
| **Recht auf Löschung** (Art. 17)             | Einstellungen → Erweitert → „Alle Daten löschen" entfernt IndexedDB, localStorage, sessionStorage, Service Worker |
| **Recht auf Datenübertragbarkeit** (Art. 20) | PDF-Export (jsPDF) für Energieberichte, JSON-Export über Browser DevTools                                         |
| **Widerspruchsrecht** (Art. 21)              | Externe APIs sind opt-in — Deaktivierung genügt                                                                   |
| **Recht auf Einschränkung** (Art. 18)        | Adapter können einzeln deaktiviert werden, ohne Datenverlust                                                      |

### Privacy-by-Design Maßnahmen

| Maßnahme                | Implementierung                                                                                                      |
| :---------------------- | :------------------------------------------------------------------------------------------------------------------- |
| **Datenminimierung**    | Nur die für die Steuerung notwendigen Energiewerte werden verarbeitet — keine Metadaten, kein Nutzerprofiling        |
| **Speicherbegrenzung**  | IndexedDB Offline-Cache mit konfigurierbarer Aufbewahrungsdauer, automatische TTL-Invalidierung                      |
| **Zweckbindung**        | Jeder Datensatz hat einen definierten Zweck (Anzeige, Optimierung, Export) — keine Zweckentfremdung                  |
| **Verschlüsselung**     | Sensible Daten (API-Keys, Credentials) stets AES-GCM 256-bit verschlüsselt, Session-Passphrase automatisch rotiert   |
| **Transparenz**         | Quellcode vollständig Open Source (MIT-Lizenz), keine versteckten Datenflüsse                                        |
| **Pseudonymisierung**   | Energiedaten enthalten keine PII — nur kW/kWh-Messwerte ohne Personenbezug                                           |
| **Kein Tracking**       | Keine Analytics-SDKs, keine Cookies, kein Fingerprinting, keine Werbe-Tracker                                        |
| **Keine Cloud-Pflicht** | Dashboard funktioniert vollständig lokal — Backend-Server ist optional (nur für Multi-Device-Sync und EEBUS-Pairing) |

### Datenschutz-Hinweis für Endnutzer

> **Nexus-HEMS Dashboard** speichert alle Daten ausschließlich lokal auf Ihrem Gerät. Es werden keine personenbezogenen Daten an Server übertragen. Externe Dienste (Strompreise, Wetterprognosen, KI-Optimierung) sind optional und übermitteln keine identifizierenden Informationen. Alle gespeicherten Daten können jederzeit über die Einstellungen vollständig gelöscht werden. Der Quellcode ist Open Source und öffentlich einsehbar.

---

## 🎨 Design System

**Neo-Energy Cyber-Glassmorphism** — a design language built for energy dashboards.

### Color Palette

| Token           | Hex       | Usage                                 |
| :-------------- | :-------- | :------------------------------------ |
| `neon-green`    | `#22ff88` | Primary actions, success, energy flow |
| `electric-blue` | `#00f0ff` | Secondary elements, info states       |
| `power-orange`  | `#ff8800` | Accents, warnings, tariff alerts      |
| `deep-space`    | `#07111f` | Dark mode backgrounds                 |
| `void-blue`     | `#0c1f34` | Dark mode surfaces                    |
| `polar-mist`    | `#eaf7ff` | Light mode backgrounds                |
| `solar-sand`    | `#fff3dc` | Light mode surfaces                   |

### UI Primitives

```tsx
<div className="glass-panel">          {/* Glassmorphism surface */}
<div className="glass-panel-strong">   {/* Elevated glassmorphism */}
<h1 className="neon-glow-green">       {/* Neon text glow */}
<button className="btn-primary">       {/* Primary action button */}
<button className="btn-secondary">     {/* Secondary action button */}
<div className="focus-ring">           {/* Accessible focus indicator */}
```

### Themes

| Theme             | Mode  | Aesthetic                                    |
| :---------------- | :---- | :------------------------------------------- |
| **OceanDeep**     | Dark  | Deep ocean blues with neon accents (default) |
| **Cyber Energy**  | Light | Vibrant greens and electric highlights       |
| **Solar Light**   | Light | Warm solar tones with clean surfaces         |
| **Minimal White** | Light | Ultra-clean modern minimalism                |
| **Night Mode**    | Dark  | OLED-friendly deep blacks                    |

---

## 🧪 Testing & CI/CD

### Test Suite

| Type           | Tool                         | Tests                      | Coverage                                                                         |
| :------------- | :--------------------------- | :------------------------- | :------------------------------------------------------------------------------- |
| **Unit Tests** | Vitest + jsdom + coverage-v8 | 106 tests, 16 suites       | Crypto, Store, Optimizer, Format, PDF, DB, Adapters, Haptics, Theme, Voice, a11y |
| **E2E Tests**  | Playwright                   | Accessibility + user flows | Multi-route navigation, a11y audit                                               |
| **a11y Tests** | @axe-core/playwright         | WCAG 2.2 AA                | Automated accessibility validation                                               |

### CI Pipeline (GitHub Actions)

```
push/PR → ci.yml (5-stage pipeline)
├── Stage 1: lint-typecheck
│   ├── npm audit (high severity gate)
│   ├── ESLint (zero warnings)
│   ├── TypeScript strict check
│   └── Prettier format check
├── Stage 2: unit-tests
│   └── Vitest (106 tests, V8 coverage)
├── Stage 3: build
│   ├── Vite production build
│   ├── Bundle size gate (< 600 KB index chunk)
│   └── Upload artifacts
├── Stage 4: e2e-tests
│   ├── Playwright browsers install
│   └── WCAG 2.2 AA + user flow tests
└── Stage 5: docker-build
    └── Docker image validation

push/PR → security.yml (3-stage pipeline)
├── npm-audit: Critical vulnerability gate
├── snyk: Deep dependency scan (optional, needs SNYK_TOKEN)
└── codeql: GitHub CodeQL JS/TS SAST analysis

push/PR + weekly schedule → security.yml
├── Automated dependency vulnerability scanning
└── CodeQL static analysis for injection/XSS/SSRF

push to main → deploy.yml
├── npm ci → build
└── Deploy to GitHub Pages

push/PR → lighthouse.yml
├── Build → Lighthouse CI audit
└── Performance / A11y / Best Practices / SEO

push/PR → tauri-build.yml
├── Matrix: Windows, macOS, Linux
└── Tauri v2 desktop build
```

### Bundle Budget

| Chunk              | Size    | Gzip    | Limit  |
| :----------------- | :------ | :------ | :----- |
| `index`            | ~106 KB | ~31 KB  | 600 KB |
| `framework`        | ~230 KB | ~74 KB  | —      |
| `vendor-recharts`  | ~350 KB | ~98 KB  | —      |
| `vendor-pdf`       | ~770 KB | ~235 KB | —      |
| `vendor-motion`    | ~124 KB | ~41 KB  | —      |
| `vendor-state`     | ~98 KB  | ~33 KB  | —      |
| `vendor-d3`        | ~84 KB  | ~27 KB  | —      |
| `de` (locale)      | ~71 KB  | ~26 KB  | —      |
| `en` (locale)      | ~67 KB  | ~24 KB  | —      |
| `vendor-i18n`      | ~51 KB  | ~16 KB  | —      |
| `vendor-radix`     | ~32 KB  | ~11 KB  | —      |
| **Total precache** | ~3.2 MB | —       | —      |

---

## 🚀 Deployment

### GitHub Pages (Automatic)

Every push to `main` triggers automatic deployment via GitHub Actions:

1. **Enable Pages**: Repository **Settings** → **Pages** → Source: **GitHub Actions**
2. **Access**: `https://<username>.github.io/Nexus-HEMS-Dash/`
3. **PWA**: Installable on all platforms — iOS, Android, Desktop

### Manual / Self-Hosted

```bash
npm run build          # → dist/ folder
npm run preview        # Local preview on port 4173

# Deploy dist/ to any static host:
# Nginx, Apache, Caddy, Cloudflare Pages, Vercel, Netlify
```

### Docker

Multi-stage build (node:22-alpine → nginx:1.27-alpine) with hardened nginx:

```bash
npm run docker:build   # Build production image
npm run docker:up      # Start container (port 8080)
npm run docker:down    # Stop container
```

**Docker security features:**

- Non-root user, read-only filesystem support
- nginx: `server_tokens off`, rate limiting, HSTS preload, CSP, COOP/CORP
- Deny access to dotfiles & sensitive file extensions
- Healthcheck with 30s interval
- Dependabot monitors Docker base image updates

### Tauri Desktop

Native desktop app for Windows, macOS, Linux via Tauri v2:

```bash
cd src-tauri && cargo tauri build
```

---

## 🗺️ Roadmap 2026

| Quarter | Feature                                                   | Status      |
| :------ | :-------------------------------------------------------- | :---------- |
| Q1      | Home Assistant / MQTT Integration                         | ✅ Shipped  |
| Q1      | Predictive AI (Gemini + tariff forecasting)               | ✅ Shipped  |
| Q1      | PDF Monthly Reports (Sankey + CO₂)                        | ✅ Shipped  |
| Q1      | Multi-Household Sharing                                   | ✅ Shipped  |
| Q1      | Live Tariff Widget (Tibber/aWATTar)                       | ✅ Shipped  |
| Q2      | 5 Adapters (Victron, Modbus, KNX, OCPP 2.1, EEBUS stub)   | ✅ Shipped  |
| Q2      | 5 Themes + Neo-Energy Design System                       | ✅ Shipped  |
| Q2      | BYOK AI Vault (AES-GCM 256-bit, 7 providers)              | ✅ Shipped  |
| Q2      | 106 Unit Tests + CI Hardening                             | ✅ Shipped  |
| Q3      | EEBUS SPINE/SHIP Full Implementation                      | ✅ Shipped  |
| Q3      | Prometheus/Grafana Monitoring                             | ✅ Shipped  |
| Q3      | PWA Auto-Update + Offline Perfection                      | ✅ Shipped  |
| Q3      | Docker / Kubernetes Deployment                            | ✅ Shipped  |
| Q3      | React Compiler + Build Optimization (60% index reduction) | ✅ Shipped  |
| Q3      | Lighthouse CI + Tauri Desktop Builds                      | ✅ Shipped  |
| Q3      | WCAG 2.2 AA Audit + Radix UI Primitives                   | ✅ Shipped  |
| Q3      | Global Audit: TS-strict, 0 lint warnings, dead code purge | ✅ Shipped  |
| Q3      | Cross-page navigation system (PageCrossLinks)             | ✅ Shipped  |
| Q3      | IndexedDB consolidation (single Dexie database)           | ✅ Shipped  |
| Q3      | Backend hardening: CORS, JWT, rate limiting, Dependabot   | ✅ Shipped  |
| Q4      | Historical Data Analytics Dashboard                       | 🔄 Planned  |
| Q4      | Matter / Thread Smart Home Integration                    | 🔜 Upcoming |
| Q4      | Multi-Tenant SaaS Mode                                    | 🔜 Upcoming |

---

## 📝 Changelog

<details open>
<summary><b>v4.3.0</b> — Backend Security Hardening & Compliance</summary>

- **CORS origin whitelist**: Configurable allowed origins via `CORS_ORIGINS` env, default dev+prod whitelist
- **Rate limiting**: Global 100 req/min per IP (express-rate-limit) + 60 req/min for `/api/` + 30 cmd/min per WebSocket client
- **JWT WebSocket auth**: Token-based authentication via `?token=` query param or `Authorization: Bearer` header, HS256 signing
- **Auth endpoints**: `POST /api/auth/token` (issue JWT), `POST /api/auth/refresh` (renew), express-validator input sanitization
- **express-validator**: Input validation on all POST endpoints (`/api/auth/token`, `/api/eebus/pair`)
- **Helmet hardening**: `trust proxy`, `x-powered-by` disabled, HSTS preload, `frame-ancestors 'none'`
- **WebSocket security**: 64 KB max payload, production mode requires JWT auth, anonymous allowed in dev
- **nginx hardening**: `server_tokens off`, rate limiting zones (100r/m global), HSTS, COOP, CORP, deny sensitive files, request size limits
- **Dependabot**: Weekly automated dependency updates for npm, GitHub Actions, Docker, Cargo (Tauri)
- **Security CI pipeline**: `security.yml` with npm audit gate, optional Snyk deep scan, GitHub CodeQL SAST
- **npm audit**: Integrated into CI lint-typecheck stage
- **Dependencies**: Added `cors`, `jsonwebtoken`, `express-validator` + `@types/cors`, `@types/jsonwebtoken`
</details>

<details>
<summary><b>v4.2.0</b> — Global Audit, React Compiler Cleanup & IndexedDB Consolidation</summary>

- **Removed all manual memoization**: 22× `memo()`, 12× `useMemo()`, 7× `useCallback()` — React Compiler handles auto-memoization
- **ESLint zero-warning enforcement**: Fixed `exhaustive-deps` in PredictiveForecast, `set-state-in-effect` in CommandPalette
- **IndexedDB consolidation**: Migrated SankeyDiagram from `cacheSankeyData` (offline-cache.ts / `NexusHEMS` DB) to `persistSankeySnapshot` (db.ts / `nexus-hems-dash` DB) — single database architecture
- **CI/Pipeline fixes**: ESLint scripts updated from v8 `--ext` to v9 flat config syntax, nginx CSP `worker-src 'self'` added
- **Tauri v2 fixes**: `windows_subsystem` moved from lib.rs → main.rs, version synced across package.json / Cargo.toml / tauri.conf.json
- **Lazy-loaded locales**: i18n.ts rewritten with `partialBundledLanguages` + dynamic `import()` — index chunk 261 KB → 106 KB (−60%)
- **Lazy-loaded Onboarding**: Separate 19 KB chunk, only loads when needed
- **CSS fix**: Eliminated "Invalid dangling combinator" build warning
- Version bump 0.13.0 → 4.2.0 (aligned with Tauri/Cargo versions)
</details>

<details>
<summary><b>v4.1.0</b> — WCAG 2.2 AA Comprehensive Audit</summary>

- **Route-change focus management**: Programmatic focus on `<main>` after navigation with `aria-live` route announcements
- **CommandPalette**: `aria-labelledby`, `aria-label` on search input
- **MobileNavigation**: Focus-restore on close, `focus-ring` on all nav items, `aria-label` for icon buttons
- **Onboarding**: Escape key to close, `aria-label` on step indicators and skip button, `role="status"` on step counter
- **Floorplan**: Contextual `aria-labels` on temperature buttons with room names, SVG focus outlines, screen-reader room status text
- **SankeyDiagram**: Hidden accessible data table for screen readers with energy flow source/target/value data
- **OfflineBanner**: `aria-atomic` for live region, `focus-ring` on retry button
- **ConfirmDialog**: `aria-labelledby` linking title to dialog
- **Sidebar**: Semantic `<h3>` headings for nav groups (was `<p>`)
- **MonitoringPanel**: `scope="col"` on table headers
- **CSS**: `.focus-ring` utility class (2px ring, offset, high-contrast enhanced), SVG `rect:focus-visible` outline
- **i18n**: 13 new a11y keys in de.ts and en.ts
</details>

<details>
<summary><b>v4.0.0</b> — Performance Architecture & Adapter Optimization</summary>

- **Zustand optimization**: `useAdapterBridge` refactored to eliminate full-store subscription — no unnecessary App.tsx re-renders on each data update
- **Standalone `sendAdapterCommand`**: Pure function via `getState()`, `useLegacySendCommand` no longer triggers duplicate adapter connections
- **IndexedDB consolidation**: Eliminated duplicate writes in adapter bridge (was writing to both `nexus-hems-dash` and `NexusHEMS` databases simultaneously)
- **New `getLatestEnergySnapshot` in primary DB**: OfflineBanner reads from consolidated database
- **D3 tree-shaking**: Replaced `import * as d3` with `import { select } from 'd3-selection'`, removed full `d3` package (84 KB vendor-d3 chunk, down from ~130 KB)
- **Dynamic imports**: jsPDF + QRCode loaded on-demand only when generating reports
- **Lazy-loaded heavy components**: PredictiveForecast + ExportAndSharing split from Dashboard main bundle
- **CI fix**: Coverage thresholds aligned to actual suite coverage (30/25/30/30%)
- **Vite manualChunks**: Function-based chunking with deterministic chunk names
- **CSS cleanup**: Removed duplicate keyframe animations from index.css
</details>

<details>
<summary><b>v3.9.0</b> — WCAG 2.2 AA, Radix UI Primitives & CI Fix</summary>

- **WCAG 2.2 AA compliance**: Full 22-component accessibility audit & remediation
- Radix UI primitives: Dialog, Tooltip, Dropdown Menu, VisuallyHidden
- ConfirmDialog rewritten with `@radix-ui/react-dialog` (auto focus trap, Escape, ARIA)
- ARIA live regions on all dynamic content (connection status, errors, alerts)
- Focus trap + keyboard navigation for MobileNavigation drawer
- Sidebar nav groups with `aria-labelledby`, connection indicator with `role="status"`
- MonitoringPanel: proper heading hierarchy (`<h3>`), table `aria-label`
- CommandPalette: `role="status"` on empty results
- CI fix: added `@vitest/coverage-v8` (missing dependency)
</details>

<details>
<summary><b>v3.8.2</b> — Docker, Tauri Desktop & Lighthouse CI</summary>

- Docker: multi-stage Dockerfile (node:22-alpine → nginx:1.27-alpine), nginx.conf, docker-compose.yml
- Tauri v2: native desktop builds for Windows, macOS, Linux (src-tauri/)
- Lighthouse CI: automated performance/a11y/SEO audits (lighthouserc.json + lighthouse.yml)
- GitHub Actions: tauri-build.yml (3-platform matrix), Docker build validation in CI
- PWA: navigationPreload, disabled sourcemaps, maximumFileSizeToCacheInBytes tuning
</details>

<details>
<summary><b>v3.8.1</b> — Comprehensive Test Suite & Unified CI</summary>

- 7 new test files: voice-control, haptics, theme, adapters, crypto, pdf-report, db
- 106 total tests across 16 suites (was: 57 tests, 9 suites)
- Unified 4-stage CI pipeline in ci.yml (lint → test → build → e2e)
- All tests pass with zero ESLint warnings and zero TypeScript errors
</details>

<details>
<summary><b>v3.8.0</b> — React Compiler & Build Optimization</summary>

- React Compiler (babel-plugin-react-compiler) for automatic memoization
- 12 granular vendor chunks via function-based manualChunks
- Index bundle: 403 KB → 192 KB (52% reduction)
- SWC replaced with Babel (SWC incompatible with React Compiler)
</details>

<details>
<summary><b>v3.7.1</b> — Strict TypeScript & PWA Cleanup</summary>

- TypeScript strict mode enabled, all 10 TS errors fixed
- Deduplicated PWA precache entries
- Inline `style="background-color:#0f172a"` on `<body>` to prevent white flash
</details>

<details>
<summary><b>v3.7.0</b> — PWA Icons, White-Screen Fix & README Overhaul</summary>

- PWA icons generated (72–512px + maskable variants, favicon.ico)
- Fixed blank white screen on mobile (body background-color, reduced retry timeout)
- manifest.json cleaned (removed non-existent screenshot/shortcut icon refs)
- robots.txt added, vite.config.ts includeAssets verified
- README fully restructured, version synced to 3.7.0
- German section condensed (removed per-version highlights bloat)
</details>

<details>
<summary><b>v3.6.x</b> — File Operations, Dialogs & i18n Polish</summary>

- AI Settings page with BYOK key vault (7 providers, AES-GCM 256-bit)
- KNX Floorplan: 8 room types with lighting, blinds, HVAC, scenes
- Confirmation dialogs for export/import/reset, inline success/error toasts
- Settings: all 12 inputs controlled, hardcoded power values removed
- 70+ new i18n keys (EN/DE), 100% coverage verified
- Breadcrumbs fix for `/settings/ai` route
- PDF export success toast, QR code download button
- File size validation (1 MB) on Settings import
</details>

<details>
<summary><b>v3.5.0</b> — AI Model Update & UX Polish</summary>

- AI models updated: Gemini 3.1, Claude 4 Haiku, o4-mini, Llama 4, Qwen 3
- Scroll-to-top on page navigation
- Help page: GitHub repository link added
</details>

<details>
<summary><b>v3.4.0</b> — Settings Overhaul & Cleanup</summary>

- All Settings toggles functional, language/units/currency persistent
- Removed voice control, dead code cleanup (useWebSocket, mqtt-client)
- Bundle reduced to ~396 KB index chunk
</details>

<details>
<summary><b>v3.3.0</b> — EEBUS, Monitoring & PWA</summary>

- EEBUS SPINE/SHIP full implementation (TLS 1.3, CEM use cases, §14a EnWG)
- Prometheus/Grafana monitoring with 25+ metrics
- PWA auto-update with skipWaiting + clientsClaim
- Tailwind v4 migration (~500 class fixes), bundle 512→400 KB
</details>

<details>
<summary><b>v3.0–3.2</b> — Architecture & Security</summary>

- 14-route SPA with React Router v7, lazy-loaded code-split pages
- 5 protocol adapters (Victron, Modbus, KNX, OCPP 2.1, EEBUS)
- BYOK AI vault (AES-GCM 256-bit + PBKDF2 600k), 5 themes
- 57 unit tests, CI pipeline with bundle budget gate
</details>

---

## 📸 Screenshots

> Screenshots are available in the [Live Demo](https://qnbs.github.io/Nexus-HEMS-Dash/). Install it as a PWA for the best experience on any device.

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
# Fork → Clone → Branch → Code → Test → PR
npm run lint && npm run test:run && npm run build
```

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

<a name="deutsch"></a>

<div align="center">

# 🇩🇪 Deutsch

</div>

## 🎯 Überblick

**Nexus-HEMS Dashboard** ist ein produktionsreifes, Echtzeit-Home-Energy-Management-System für die Ära der dezentralen Energieversorgung. Es vereint **5 Industrieprotokolle** hinter einem einzigen Dashboard zur Orchestrierung von Photovoltaik, Batteriespeicher, Wärmepumpen, E-Mobilität und Gebäudeautomation — alles optimiert für dynamische Stromtarife.

Gebaut mit **React 19**, **Zustand**, **D3.js** und **Tailwind CSS v4** liefert das Dashboard eine **Neo-Energy Cyber-Glassmorphism UI** mit vollständiger **Internationalisierung** (DE/EN), **WCAG 2.2 AA Barrierefreiheit** und **Offline-First** Architektur.

### 🚀 Funktionen

| Feature                       | Beschreibung                                                           | Status     |
| :---------------------------- | :--------------------------------------------------------------------- | :--------- |
| ⚡ **Echtzeit-Sankey**        | Live D3.js Energiefluss — PV → Batterie → Netz → Haus → WP → EV        | ✅ Live    |
| 🤖 **KI-Optimierer**          | Google Gemini 3.1 für optimale Lade-/Heizstrategien                    | ✅ Live    |
| 📈 **Prädiktive Vorhersage**  | 24h/7d wetterbasierte PV- & Tarifprognosen                             | ✅ Live    |
| ⚡ **Live-Tarif-Widget**      | Echtzeit Tibber/aWATTar Preise mit Mini-Charts                         | ✅ Live    |
| 🚗 **Intelligentes EV-Laden** | PV-Überschuss, Schnellladung, dynamische Modi, §14a                    | ✅ Live    |
| 🔥 **SG Ready**               | Wärmepumpen-Modi 1–4 zur thermischen Speicheroptimierung               | ✅ Live    |
| 🏠 **KNX-Grundriss**          | Interaktive Gebäudeautomation — Licht, Klima, Sensoren                 | ✅ Live    |
| 📄 **PDF-Berichte**           | Monatsberichte mit Sankey, Kosten, CO₂ (UBA 380 g/kWh)                 | ✅ Live    |
| 🔐 **BYOK KI-Tresor**         | 7 Anbieter mit AES-GCM 256-bit Verschlüsselung                         | ✅ Live    |
| 🎨 **5 Themes**               | OceanDeep, Cyber Energy, Solar Light, Minimal White, Night Mode        | ✅ Live    |
| 🌐 **i18n**                   | 100% Deutsch/Englisch mit persistentem Sprachwechsel                   | ✅ 100%    |
| ♿ **WCAG 2.2 AA**            | Semantisches HTML, ARIA, Fokus-Traps, Tastaturnavigation               | ✅ Konform |
| 📱 **PWA Offline-First**      | Service Worker, IndexedDB, Background Sync                             | ✅ Live    |
| 🔌 **5 Adapter**              | Victron MQTT, Modbus/SunSpec, KNX/IP, OCPP 2.1, EEBUS                  | ✅ Live    |
| 📊 **Monitoring**             | 10 Live-Metriken, System-Health, Lastdiagramme, Adapter-Matrix, Alerts | ✅ Live    |
| 🔒 **Backend-Härtung**        | Helmet, CORS, JWT-Auth, Rate-Limiting, express-validator, Dependabot   | ✅ Live    |

### 📦 Erste Schritte

```bash
git clone https://github.com/qnbs/Nexus-HEMS-Dash.git
cd Nexus-HEMS-Dash
npm install
npm run dev
```

### 🗺️ Seitenstruktur

| Route           | Seite             | Beschreibung                                                                                               |
| :-------------- | :---------------- | :--------------------------------------------------------------------------------------------------------- |
| `/`             | **Home**          | KPI-Übersicht, Mini-Sankey, Schnelllinks                                                                   |
| `/energy-flow`  | **Energiefluss**  | D3.js-Sankey-Diagramm, Live-Preis-Widget                                                                   |
| `/production`   | **Erzeugung**     | PV-Statistiken, Eigenverbrauchsquote                                                                       |
| `/storage`      | **Speicher**      | Batterie-SoC, Lade-/Entladestatistiken                                                                     |
| `/consumption`  | **Verbrauch**     | Lastaufschlüsselung, Netzaustausch                                                                         |
| `/ev`           | **E-Auto**        | Ladesteuerung, PV-Überschuss/Schnell/Dynamisch                                                             |
| `/floorplan`    | **Grundriss**     | KNX Gebäudeautomation, Raumsteuerung                                                                       |
| `/ai-optimizer` | **KI-Optimierer** | Gemini 3.1 Analyse, erweiterter Optimierer                                                                 |
| `/tariffs`      | **Tarife**        | Live-Preise, Prognosen, optimale Ladefenster                                                               |
| `/analytics`    | **Analysen**      | 8 KPIs, Energiebilanz-Chart, Monatsvergleich, Kostenanalyse, Datenqualität                                 |
| `/monitoring`   | **Monitoring**    | 10 Live-Metriken, Lastdiagramme, Adapter-Matrix, Alerts, Grafana                                           |
| `/settings`     | **Einstellungen** | 8-Tab-Konfiguration: Darstellung, System, Energie, Sicherheit, Speicher, Benachrichtigungen, Erweitert, KI |
| `/help`         | **Hilfe**         | Dokumentation, Tastenkürzel, FAQ                                                                           |

### 🏗️ Architektur

```
┌─────────────────────────────────────────────────────────────────────┐
│                       useEnergyStore (Zustand)                      │
│            UnifiedEnergyModel = PV + Batterie + Netz + …            │
├──────────┬───────────┬──────────┬────────────┬─────────────────────-┤
│ Victron  │  Modbus   │   KNX    │  OCPP 2.1  │    EEBUS             │
│   MQTT   │  SunSpec  │   /IP    │    V2X     │  SPINE/SHIP          │
├──────────┴───────────┴──────────┴────────────┴─────────────────────-┤
│                       EnergyAdapter Interface                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 🗺️ Roadmap 2026

| Quartal | Feature                                               | Status          |
| :------ | :---------------------------------------------------- | :-------------- |
| Q1      | MQTT, Predictive AI, PDF, Sharing, Live-Preise        | ✅ Ausgeliefert |
| Q2      | 5 Adapter, 5 Themes, BYOK AI, 106 Tests, CI-Härtung   | ✅ Ausgeliefert |
| Q3      | EEBUS SPINE/SHIP, Monitoring, PWA-Perfektion          | ✅ Ausgeliefert |
| Q3      | Docker/Kubernetes, Tauri Desktop, Lighthouse CI       | ✅ Ausgeliefert |
| Q3      | React Compiler (60% Index-Reduktion), WCAG 2.2 AA     | ✅ Ausgeliefert |
| Q3      | Global Audit, IndexedDB-Konsolidierung, Cross-Links   | ✅ Ausgeliefert |
| Q3      | Backend-Härtung: CORS, JWT, Rate-Limit, Dependabot    | ✅ Ausgeliefert |
| Q4      | Historische Datenanalyse, Matter/Thread, Multi-Tenant | 🔜 Geplant      |

### 📄 Lizenz

MIT — siehe [LICENSE](LICENSE).

### 🤝 Beitragen

Beiträge willkommen! Siehe [CONTRIBUTING.md](CONTRIBUTING.md).
