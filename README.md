# Nexus-HEMS Dash 3.0

<div align="center">

![Version](https://img.shields.io/badge/Version-3.1.0-22ff88?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-00f0ff?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=for-the-badge&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-4.1-38bdf8?style=for-the-badge&logo=tailwindcss)
![PWA Ready](https://img.shields.io/badge/PWA-Ready-ff8800?style=for-the-badge)
![Production](https://img.shields.io/badge/Production-Ready-22ff88?style=for-the-badge)
![i18n](https://img.shields.io/badge/i18n-100%25-22ff88?style=for-the-badge)
![WCAG](https://img.shields.io/badge/WCAG-2.2%20AA-00f0ff?style=for-the-badge)

[![Live Demo](https://img.shields.io/badge/🚀-Live%20Demo-ff8800?style=for-the-badge)](https://qnbs.github.io/Nexus-HEMS-Dash/)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/qnbs/Nexus-HEMS-Dash)

**Real-time orchestration for PV, storage, heat & mobility**  
🔋 Victron Cerbo GX • 🏠 KNX • ⚡ Tibber/aWATTar • 🤖 AI Optimizer • 📱 Mobile PWA

[🇬🇧 English](#english) | [🇩🇪 Deutsch](#deutsch)

</div>

---

<a name="english"></a>

## 🇬🇧 English

### 🎯 Overview

**Nexus-HEMS Dash** is a production-ready, real-time Home Energy Management System (HEMS) dashboard designed for the decentralized energy era. Seamlessly integrating **Victron Energy**, **KNX building automation**, and **dynamic electricity tariffs** (Tibber, aWATTar), it provides intelligent orchestration for PV generation, battery storage, heat pumps, and EV charging.

Built with **React 19**, **Zustand**, **D3.js**, and **Tailwind CSS 4**, the dashboard delivers a stunning **Neo-Energy Cyber-Glassmorphism UI** with full **i18n** (German/English), **WCAG 2.2 AA accessibility**, and **offline-first** architecture.

### ✨ What's New in 3.1.0

- 🔌 **Adapter Pattern for HEMS Protocols**: Pluggable protocol layer with 5 adapters (VictronMQTT, ModbusSunSpec, KNX, OCPP 2.1, EEBUS stub)
- 🧩 **UnifiedEnergyModel**: Typed data model aggregating PV, battery, grid, load, EV charger, KNX, and tariff data
- 🔋 **OCPP 2.1 + V2X**: Full Vehicle-to-Grid support with JSON-RPC messaging and charging profile management
- 🏠 **KNX WebSocket Bridge**: Real-time room state management with GA→field reverse lookup
- ⚡ **Modbus/SunSpec Polling**: HTTP/REST gateway for SunSpec-compliant inverters and meters
- 🔀 **Central useEnergyStore**: Zustand aggregator merging all adapter data with legacy bridge
- 🛡️ **TLS/mTLS + Auth**: Adapter-level security with client certificates and token auth
- 🔄 **Exponential Backoff**: Automatic reconnection across all WebSocket adapters

### ✨ What's New in 3.0.0

- 🏗️ **Multi-Page Architecture**: Full refactoring from single-page to 11-route SPA with React Router v7
- 📁 **Code-Split Pages**: Lazy-loaded routes for Home, Energy Flow, Production, Storage, Consumption, EV, Floorplan, AI Optimizer, Tariffs, Analytics
- 🧭 **Desktop Sidebar Navigation**: Collapsible sidebar with grouped navigation (Energy, Tools, System)
- 📱 **Redesigned Mobile Navigation**: Bottom tab bar with "More" sheet for all pages
- 🗺️ **Breadcrumbs & Page Headers**: Context-aware breadcrumb navigation on every page
- ⌨️ **Enhanced Command Palette**: Navigate to all 11 pages via ⌘K with bilingual keywords
- 📦 **Optimized Bundle Splitting**: Vendor chunks for react, d3, motion, recharts, i18n, tanstack-query
- 🔀 **404 Page**: Custom Not Found page with navigation back to dashboard
- 🧪 **Updated E2E Tests**: Accessibility & user flow tests for all routes

### ✨ What's New in 2.3.0

- 🚀 **TanStack Query Integration**: Optimized data fetching with 5-min cache for forecasts & tariff APIs
- ♿ **Full WCAG 2.2 AA Compliance**: aria-live regions for real-time Sankey + metrics, keyboard navigation
- 💾 **Offline Mode with Dexie.js**: Caches last 1000 energy snapshots, "Last updated: 3 min ago" banner
- 🧪 **Professional Testing**: Vitest unit tests + Playwright E2E tests with @axe-core for accessibility validation
- ⚡ **Performance Optimizations**: React.memo on Sankey, virtualized device list support (react-virtual)
- 🔧 **Best Practices Stack**: Husky git hooks, ESLint airbnb-typescript, Prettier, .devcontainer ready

### ✨ What's New in 2.1.0

- 🤖 **AI Optimizer with Google Gemini 2.5**: Real AI analysis for optimal charging strategies (EV, battery, heat pump)
- 📈 **Predictive 24h/7d Forecast**: Weather-based PV predictions + tariff forecasts with Recharts visualization
- 🎤 **Voice Control**: Hands-free dashboard control with Web Speech API (German & English)
- 📄 **PDF Monthly Reports**: Automated energy reports with Sankey screenshots, costs, and CO₂ balance
- 🤝 **Multi-Household Sharing**: Shareable dashboard links with QR codes for community projects
- ⚡ **Live Tibber/aWATTar Widget**: Real-time price displays with mini-charts and optimization hints
- 🏠 **Home Assistant / MQTT**: Bidirectional device control via WebSocket MQTT integration
- 🌈 **Enhanced Dashboard Layout**: All features integrated in unified, responsive grid design

### ⚡ What's New in 2.0.0

- 🎨 **3 Premium Themes**: Cyber Energy Dark (default), Solar Light, Night Mode with smooth Framer Motion transitions
- 🌐 **Full i18n**: Complete German/English localization with persistent language switcher
- 📊 **Enhanced Sankey Diagram**: Live flow animations, mobile-optimized responsive layout
- 🏠 **Interactive KNX Floorplan**: Real-time control of lights, climate, and window sensors
- ♿ **WCAG 2.2 AA**: Full accessibility compliance with semantic HTML and ARIA labels
- 📦 **Local-First**: Dexie.js-powered IndexedDB with 30-day rolling history
- 🔒 **Enterprise Security**: mTLS enforcement, 2FA, telemetry opt-out, §14a EnWG compliance

### 📸 Screenshots

<details>
<summary>🖼️ View all screenshots (8)</summary>

1. **Dashboard - Real-Time Sankey Flow**
   ![Sankey Live](./docs/screenshots/sankey-live.png)

2. **KNX Floorplan - Building Automation**
   ![KNX Floorplan](./docs/screenshots/knx-floorplan.png)

3. **EV Charging Control**
   ![EV Charging](./docs/screenshots/ev-charging.png)

4. **AI Optimizer - Dynamic Tariff Strategies**
   ![AI Optimizer](./docs/screenshots/ai-optimizer.png)

5. **Mobile-Responsive View**
   ![Mobile](./docs/screenshots/mobile-view.png)

6. **Theme Switcher - 3 Themes**
   ![Themes](./docs/screenshots/themes.png)

7. **Settings - System Configuration**
   ![Settings](./docs/screenshots/settings.png)

8. **Offline Mode - PWA**
   ![Offline](./docs/screenshots/offline-mode.png)

</details>

### 🚀 Features

| Feature | Description | Status |
|---------|-------------|--------|
| ⚡ **Real-Time Sankey** | Live energy flow visualization (PV → Battery → Grid → House → HP → EV) | ✅ Live |
| 🏠 **KNX Integration** | Interactive floorplan for lights, climate, sensors | ✅ Live |
| 🤖 **AI Optimizer (Gemini 2.5)** | Real AI-powered optimization for EV, battery, heat pump strategies | ✅ Live |
| 📈 **Predictive Forecast** | 24h/7d weather-based PV & tariff predictions with Recharts | ✅ Live |
| 🎤 **Voice Control** | Hands-free dashboard control with Web Speech API | ✅ Live |
| 📄 **PDF Reports** | Monthly energy reports with Sankey, costs, CO₂ balance | ✅ Live |
| 🤝 **Shareable Dashboards** | Multi-household support with QR codes & read-only links | ✅ Live |
| ⚡ **Live Price Widget** | Real-time Tibber/aWATTar tariff display with mini-charts | ✅ Live |
| 🏠 **Home Assistant / MQTT** | Bidirectional device control via WebSocket MQTT | ✅ Live |
| 🚗 **Smart EV Charging** | PV surplus, fast charging, dynamic tariff modes | ✅ Live |
| 🔥 **SG Ready Control** | Heat pump modes (1-4) for thermal storage optimization | ✅ Live |
| 🤖 **AI Optimizer** | Tariff-aware recommendations (Tibber, aWATTar) | ✅ Live |
| 🌐 **i18n** | German/English with persistent localStorage | ✅ 100% |
| 🎨 **3 Themes** | Cyber Dark, Solar Light, Night Mode | ✅ Live |
| ♿ **WCAG 2.2 AA** | Full accessibility (semantic, ARIA, focus) | ✅ Compliant |
| 📦 **Local-First** | Dexie.js IndexedDB, 30-day history retention | ✅ Live |
| 🔒 **Enterprise Security** | mTLS, 2FA, telemetry opt-out, §14a compliance | ✅ Live || 🔌 **Adapter Pattern** | Pluggable protocol adapters (Victron, Modbus, KNX, OCPP 2.1, EEBUS) | ✅ Live |
| 🔋 **OCPP 2.1 + V2X** | Vehicle-to-Grid charging with JSON-RPC and charging profiles | ✅ Live |
| ⚡ **Modbus/SunSpec** | REST gateway polling for SunSpec inverters and meters | ✅ Live |
### 🛠️ Technology Stack

### 🗺️ Page Structure (v3.0)

| Route | Page | Description |
|-------|------|-------------|
| `/` | **Home** | KPI overview, mini Sankey, quick links to all sections |
| `/energy-flow` | **Energy Flow** | Full D3.js Sankey diagram, live price widget, flow statistics |
| `/production` | **Production** | PV generation stats, power output, self-consumption ratio |
| `/storage` | **Storage** | Battery SoC visualization, charge/discharge stats, strategy controls |
| `/consumption` | **Consumption** | Total consumption breakdown, consumer categories, grid exchange |
| `/ev` | **EV Charging** | EV charging control, modes (PV surplus/fast/dynamic), §14a EnWG |
| `/floorplan` | **Floorplan** | KNX interactive building floorplan, room-level controls |
| `/ai-optimizer` | **AI Optimizer** | Gemini 2.5 AI analysis, voice control, enhanced optimizer |
| `/tariffs` | **Tariffs** | Live Tibber/aWATTar prices, forecasts, optimal charging windows |
| `/analytics` | **Analytics** | Energy statistics, predictive forecasts, PDF export & sharing |
| `/settings` | **Settings** | System configuration, connections, preferences |
| `/help` | **Help** | Documentation, keyboard shortcuts, FAQ |

### 🛠️ Technology Stack

**Backend & Real-Time**
- ![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs) + WebSocket server
- ![Dexie.js](https://img.shields.io/badge/Dexie.js-4.3-22ff88) for IndexedDB persistence

**i18n & Accessibility**
- ![react-i18next](https://img.shields.io/badge/react--i18next-16-22ff88) with German/English locales
- **WCAG 2.2 AA** compliance (semantic HTML, ARIA, keyboard nav)

**Quality & Testing**
- ![ESLint](https://img.shields.io/badge/ESLint-9-4b32c3?logo=eslint) + ![Prettier](https://img.shields.io/badge/Prettier-3.8-f7b93e?logo=prettier)
- ![Vitest](https://img.shields.io/badge/Vitest-4.0-fcc72b?logo=vitest) + ![Playwright](https://img.shields.io/badge/Playwright-1.58-2ead33?logo=playwright) with @axe-core/playwright
- ![Husky](https://img.shields.io/badge/Husky-9.1-22ff88?logo=git) for pre-commit hooks

### 📦 Getting Started

#### Prerequisites
- Node.js 22+ (LTS recommended)
- npm or pnpm
- Victron Cerbo GX with Node-RED (optional)
- KNX IP Router (optional)

#### Installation

```bash
# Clone the repository
git clone https://github.com/qnbs/Nexus-HEMS-Dash.git
cd Nexus-HEMS-Dash

# Install dependencies
npm install

# Start development server
npm run dev
```

#### Docker / Docker Compose (coming soon)

```bash
docker-compose up -d
```

### 🚀 Deployment

#### GitHub Pages (Automatic)

GitHub Actions automatically deploys to GitHub Pages on every push to `main`:

1. **Enable GitHub Pages**:
   - Go to your repository **Settings** → **Pages**
   - Under **Build and deployment**, select:
     - **Source**: GitHub Actions
   - Save settings

2. **Access your deployed dashboard**:
   ```
   https://<your-username>.github.io/Nexus-HEMS-Dash/
   ```

3. **Workflows**:
   - `.github/workflows/ci.yml` - Lint, type-check, build on push/PR
   - `.github/workflows/deploy.yml` - Deploy to GitHub Pages (main branch only)
   - `.github/workflows/playwright.yml` - E2E tests on push/PR

#### Manual Deployment

```bash
# Build production bundle
npm run build

# Preview production build locally
npm run preview

# Deploy dist/ folder to your hosting provider
```

#### Environment Variables (Optional)

Create `.env` for API integrations:

```env
GEMINI_API_KEY=your_google_gemini_api_key
MQTT_BROKER_URL=ws://your-mqtt-broker:9001
TIBBER_API_TOKEN=your_tibber_api_token
AWATTAR_API_KEY=your_awattar_api_key
```

### 🏗️ Architecture

**Adapter Pattern (v3.1)**

All external protocols are encapsulated behind a unified `EnergyAdapter` interface. Each adapter normalizes raw protocol data into a single `UnifiedEnergyModel`.

```
┌─────────────────────────────────────────────────────────────────┐
│                    useEnergyStore (Zustand)                     │
│         UnifiedEnergyModel = PV + Battery + Grid + ...         │
├─────────┬───────────┬─────────┬───────────┬────────────────────┤
│ Victron │  Modbus   │   KNX   │ OCPP 2.1  │  EEBUS (2027)     │
│  MQTT   │  SunSpec  │   /IP   │   V2X     │                    │
│  (WS)   │  (REST)   │  (WS)   │   (WS)    │   (stub)          │
├─────────┴───────────┴─────────┴───────────┴────────────────────┤
│                    EnergyAdapter Interface                       │
│ connect() · onData() · sendCommand() · getSnapshot() · destroy()│
└─────────────────────────────────────────────────────────────────┘
```

| Adapter | Protocol | Capabilities | Transport |
|---------|----------|--------------|-----------|
| `VictronMQTTAdapter` | Node-RED WebSocket | pv, battery, grid, load | WebSocket |
| `ModbusSunSpecAdapter` | SunSpec Models 103/124/201 | pv, battery, grid | HTTP/REST polling |
| `KNXAdapter` | KNX/IP Tunneling | knx | WebSocket bridge |
| `OCPP21Adapter` | OCPP 2.1 JSON-RPC | evCharger (V2X) | WebSocket |
| `EEBUSAdapter` | SPINE/SHIP (stub) | evCharger, load | — |

**Key files:**
- `src/core/adapters/EnergyAdapter.ts` — Interface + `UnifiedEnergyModel` types
- `src/core/useEnergyStore.ts` — Zustand aggregator + `useAdapterBridge` hook
- `src/core/useLegacySendCommand.ts` — Backward-compatible wrapper

**Local-First Design**
- Adapter data merged into central Zustand store, bridged to legacy `useAppStore`
- Dexie.js IndexedDB for 30-day rolling history (persisted via `useAdapterBridge`)
- Offline-capable PWA architecture

**Real-Time Data Flow**
```
Victron Cerbo GX ──┐
Modbus/SunSpec ─────┤
KNX/IP Gateway ─────┤── EnergyAdapter ──→ useEnergyStore ──→ Zustand
OCPP 2.1 CSMS ──────┤                                        ↓
EEBUS (planned) ────┘                              Dexie.js + useAppStore
```

### 🗺️ Roadmap 2026

| Quarter | Feature | Status |
|---------|---------|--------|
| Q1 2026 | **Home Assistant / MQTT Integration** | ✅ Completed |
| Q1 2026 | **Predictive AI** (Google Gemini + tariff prediction) | ✅ Completed |
| Q1 2026 | **Voice Control** (Web Speech API) | ✅ Completed |
| Q1 2026 | **PDF Monthly Reports** (Sankey + CO₂ balance) | ✅ Completed |
| Q1 2026 | **Multi-Household Support** (shareable dashboards) | ✅ Completed |
| Q1 2026 | **Live Price Widget** (Tibber/aWATTar auto-optimization) | ✅ Completed |
| Q2 2026 | **Adapter Pattern** (Victron, Modbus, KNX, OCPP 2.1) | ✅ Completed |
| Q2 2026 | **Tailwind Config & Custom Utilities** (.neon-glow, .glass-panel) | 🚧 In Progress |
| Q3 2026 | **EEBUS SPINE/SHIP Integration** | 🔄 Planned |
| Q3 2026 | **Focus Traps for Modals** (WCAG 2.2 AA compliance) | 🔄 Planned |
| Q3 2026 | **Docker/Kubernetes Deployment** | 🔄 Planned |
| Q4 2026 | **Prometheus/Grafana Monitoring** | 🔄 Planned |

### 📄 License

MIT License - see [LICENSE](LICENSE) for details.

### 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

<a name="deutsch"></a>

## 🇩🇪 Deutsch

### 🎯 Überblick

**Nexus-HEMS Dash** ist ein produktionsreifes, Echtzeit Home Energy Management System (HEMS) Dashboard für die Ära der dezentralen Energie. Nahtlose Integration von **Victron Energy**, **KNX-Gebäudeautomation** und **dynamischen Stromtarifen** (Tibber, aWATTar) ermöglicht intelligente Orchestrierung von PV-Erzeugung, Batteriespeicher, Wärmepumpen und EV-Ladung.

Gebaut mit **React 19**, **Zustand**, **D3.js** und **Tailwind CSS 4**, liefert das Dashboard eine atemberaubende **Neo-Energy Cyber-Glassmorphism UI** mit vollständiger **i18n** (Deutsch/Englisch), **WCAG 2.2 AA Barrierefreiheit** und **Offline-First** Architektur.

### ✨ Neu in 3.1.0

- 🔌 **Adapter-Pattern für HEMS-Protokolle**: Pluggable Protokollschicht mit 5 Adaptern (VictronMQTT, ModbusSunSpec, KNX, OCPP 2.1, EEBUS-Stub)
- 🧩 **UnifiedEnergyModel**: Typisiertes Datenmodell, das PV, Batterie, Netz, Last, E-Auto-Lader, KNX und Tarife aggregiert
- 🔋 **OCPP 2.1 + V2X**: Vollständige Vehicle-to-Grid-Unterstützung mit JSON-RPC und Ladeprofil-Management
- 🏠 **KNX-WebSocket-Bridge**: Echtzeit-Raumzustandsverwaltung mit GA→Feld-Reverse-Lookup
- ⚡ **Modbus/SunSpec-Polling**: HTTP/REST-Gateway für SunSpec-konforme Wechselrichter und Zähler
- 🔀 **Zentraler useEnergyStore**: Zustand-Aggregator mit Legacy-Bridge
- 🛡️ **TLS/mTLS + Auth**: Adapter-Level-Sicherheit mit Client-Zertifikaten und Token-Auth
- 🔄 **Exponential Backoff**: Automatische Wiederverbindung über alle WebSocket-Adapter

### ✨ Neu in 3.0.0

- 🏗️ **Multi-Page-Architektur**: Vollständiges Refactoring von Single-Page zu 11-Routen-SPA mit React Router v7
- 📁 **Code-Split Seiten**: Lazy-geladene Routen für Home, Energiefluss, Erzeugung, Speicher, Verbrauch, E-Auto, Grundriss, KI-Optimierer, Tarife, Analysen
- 🧭 **Desktop-Sidebar-Navigation**: Sidebar mit gruppierter Navigation (Energie, Tools, System)
- 📱 **Redesigntes Mobile-Menü**: Untere Tab-Leiste mit „Mehr"-Sheet für alle Seiten
- 🗺️ **Breadcrumbs & Seitenheader**: Kontextabhängige Breadcrumb-Navigation auf jeder Seite
- ⌨️ **Erweiterte Kommandopalette**: Navigation zu allen 11 Seiten via ⌘K mit zweisprachigen Stichwörtern
- 📦 **Optimiertes Bundle-Splitting**: Vendor-Chunks für React, D3, Motion, Recharts, i18n, TanStack Query
- 🔀 **404-Seite**: Eigene Not-Found-Seite mit Navigation zurück zum Dashboard
- 🧪 **Aktualisierte E2E-Tests**: Barrierefreiheit- & User-Flow-Tests für alle Routen

### ✨ Neu in 2.3.0

- 🚀 **TanStack Query Integration**: Optimiertes Data Fetching mit 5-Min-Cache für Forecasts & Tarif-APIs
- ♿ **Vollständige WCAG 2.2 AA**: aria-live Regionen für Echtzeit-Sankey + Metriken, Tastaturnavigation
- 💾 **Offline-Modus mit Dexie.js**: Cached die letzten 1000 Energie-Snapshots, "Letzter Stand: vor 3 Min."-Banner
- 🧪 **Professionelles Testing**: Vitest Unit-Tests + Playwright E2E-Tests mit @axe-core für Barrierefreiheit
- ⚡ **Performance-Optimierungen**: React.memo auf Sankey, virtualisierte Geräteliste (react-virtual)
- 🔧 **Best-Practices-Stack**: Husky Git-Hooks, ESLint airbnb-typescript, Prettier, .devcontainer bereit

### ✨ Neu in 2.1.0

- 🤖 **AI-Optimizer mit Google Gemini 2.5**: Echte KI-Analyse für optimale Ladestrategien (EV, Batterie, Wärmepumpe)
- 📈 **Prädiktive 24h/7d-Vorhersage**: Wetterbasierte PV-Prognosen + Tarifvorhersagen mit Recharts-Visualisierung
- 🎤 **Sprachsteuerung**: Freihändige Dashboard-Steuerung mit Web Speech API (Deutsch & Englisch)
- 📄 **PDF-Monatsberichte**: Automatisierte Energieberichte mit Sankey-Screenshots, Kosten und CO₂-Bilanz
- 🤝 **Multi-Haushalt-Sharing**: Teilbare Dashboard-Links mit QR-Codes für Community-Projekte
- ⚡ **Live Tibber/aWATTar Widget**: Echtzeit-Preisanzeigen mit Mini-Charts und Optimierungs-Hinweisen
- 🏠 **Home Assistant / MQTT**: Bidirektionale Gerätesteuerung via WebSocket MQTT-Integration
- 🌈 **Verbessertes Dashboard-Layout**: Alle Features in einheitlichem, responsivem Grid integriert

### ⚡ Neu in 2.0.0

- 🎨 **3 Premium-Themes**: Cyber Energy Dark (Standard), Solar Light, Night Mode mit flüssigen Framer Motion Übergängen
- 🌐 **Vollständige i18n**: Komplette Deutsch/Englisch-Lokalisierung mit persistentem Sprachwechsel
- 📊 **Verbessertes Sankey-Diagramm**: Live-Flow-Animationen, mobil-optimiertes responsives Layout
- 🏠 **Interaktiver KNX-Grundriss**: Echtzeitsteuerung von Licht, Klima und Fenstersensoren
- ♿ **WCAG 2.2 AA**: Vollständige Barrierefreiheit mit semantischem HTML und ARIA-Labels
- 📦 **Local-First**: Dexie.js-basierte IndexedDB mit 30-Tage-Rolling-History
- 🔒 **Enterprise-Sicherheit**: mTLS-Enforcement, 2FA, Telemetrie-Opt-out, §14a EnWG Konformität

### 📸 Screenshots

<details>
<summary>🖼️ Alle Screenshots anzeigen (8)</summary>

1. **Dashboard - Echtzeit-Sankey-Fluss**
   ![Sankey Live](./docs/screenshots/sankey-live.png)

2. **KNX-Grundriss - Gebäudeautomation**
   ![KNX Floorplan](./docs/screenshots/knx-floorplan.png)

3. **EV-Ladesteuerung**
   ![EV Charging](./docs/screenshots/ev-charging.png)

4. **AI-Optimizer - Dynamische Tarifstrategien**
   ![AI Optimizer](./docs/screenshots/ai-optimizer.png)

5. **Mobile-Responsive Ansicht**
   ![Mobile](./docs/screenshots/mobile-view.png)

6. **Theme-Wechsler - 3 Themes**
   ![Themes](./docs/screenshots/themes.png)

7. **Einstellungen - Systemkonfiguration**
   ![Settings](./docs/screenshots/settings.png)

8. **Offline-Modus - PWA**
   ![Offline](./docs/screenshots/offline-mode.png)

</details>

### 🚀 Funktionen

| Feature | Beschreibung | Status |
|---------|--------------|--------|
| ⚡ **Echtzeit-Sankey** | Live-Energiefluss-Visualisierung (PV → Batterie → Netz → Haus → WP → EV) | ✅ Live |
| 🏠 **KNX-Integration** | Interaktiver Grundriss für Licht, Klima, Sensoren | ✅ Live |
| 🤖 **AI-Optimizer (Gemini 2.5)** | Echte KI-gestützte Optimierung für EV-, Batterie-, Wärmepumpen-Strategien | ✅ Live |
| 📈 **Prädiktive Vorhersage** | 24h/7d wetterbasierte PV- & Tarifvorhersagen mit Recharts | ✅ Live |
| 🎤 **Sprachsteuerung** | Freihändige Dashboard-Steuerung mit Web Speech API | ✅ Live |
| 📄 **PDF-Berichte** | Monats-Energieberichte mit Sankey, Kosten, CO₂-Bilanz | ✅ Live |
| 🤝 **Teilbare Dashboards** | Multi-Haushalt-Support mit QR-Codes & Read-Only-Links | ✅ Live |
| ⚡ **Live-Preis-Widget** | Echtzeit Tibber/aWATTar Tarifanzeige mit Mini-Charts | ✅ Live |
| 🏠 **Home Assistant / MQTT** | Bidirektionale Gerätesteuerung via WebSocket MQTT | ✅ Live |
| 🚗 **Intelligentes EV-Laden** | PV-Überschuss, Schnellladung, dynamische Tarifmodi | ✅ Live |
| 🔥 **SG Ready Steuerung** | Wärmepumpen-Modi (1-4) zur thermischen Speicheroptimierung | ✅ Live |
| 🌐 **i18n** | Deutsch/Englisch mit persistentem localStorage | ✅ 100% |
| 🎨 **3 Themes** | Cyber Dark, Solar Light, Night Mode | ✅ Live |
| ♿ **WCAG 2.2 AA** | Vollständige Barrierefreiheit (Semantik, ARIA, Fokus) | ✅ Konform |
| 📦 **Local-First** | Dexie.js IndexedDB, 30-Tage-Historie-Retention | ✅ Live |
| 🔒 **Enterprise-Sicherheit** | mTLS, 2FA, Telemetrie-Opt-out, §14a Konformität | ✅ Live || 🔌 **Adapter-Pattern** | Pluggable Protokoll-Adapter (Victron, Modbus, KNX, OCPP 2.1, EEBUS) | ✅ Live |
| 🔋 **OCPP 2.1 + V2X** | Vehicle-to-Grid-Laden mit JSON-RPC und Ladeprofilen | ✅ Live |
| ⚡ **Modbus/SunSpec** | REST-Gateway-Polling für SunSpec-Wechselrichter und -Zähler | ✅ Live |
### �️ Seitenstruktur (v3.0)

| Route | Seite | Beschreibung |
|-------|-------|--------------|
| `/` | **Home** | KPI-Übersicht, Mini-Sankey, Schnelllinks zu allen Bereichen |
| `/energy-flow` | **Energiefluss** | Vollständiges D3.js-Sankey-Diagramm, Live-Preis-Widget, Flussstatistiken |
| `/production` | **Erzeugung** | PV-Erzeugungsstatistiken, Leistungsausgabe, Eigenverbrauchsquote |
| `/storage` | **Speicher** | Batterie-SoC-Visualisierung, Lade-/Entladestatistiken, Strategiesteuerung |
| `/consumption` | **Verbrauch** | Gesamtverbrauchsaufschlüsselung, Verbraucherkategorien, Netzaustausch |
| `/ev` | **E-Auto** | EV-Ladesteuerung, Modi (PV-Überschuss/Schnell/Dynamisch), §14a EnWG |
| `/floorplan` | **Grundriss** | KNX interaktiver Gebäudegrundriss, raumweise Steuerung |
| `/ai-optimizer` | **KI-Optimierer** | Gemini 2.5 KI-Analyse, Sprachsteuerung, erweiterter Optimierer |
| `/tariffs` | **Tarife** | Live Tibber/aWATTar-Preise, Prognosen, optimale Ladefenster |
| `/analytics` | **Analysen** | Energiestatistiken, prädiktive Prognosen, PDF-Export & Sharing |
| `/settings` | **Einstellungen** | Systemkonfiguration, Verbindungen, Präferenzen |
| `/help` | **Hilfe** | Dokumentation, Tastenkürzel, FAQ |

### 🛠️ Technologie-Stack

**Backend & Echtzeit**
- ![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs) + WebSocket-Server
- ![Dexie.js](https://img.shields.io/badge/Dexie.js-4.3-22ff88) für IndexedDB-Persistierung

**i18n & Barrierefreiheit**
- ![react-i18next](https://img.shields.io/badge/react--i18next-16-22ff88) mit Deutsch/Englisch-Locales
- **WCAG 2.2 AA** Konformität (semantisches HTML, ARIA, Tastaturnavigation)

**Qualität & Testing**
- ![ESLint](https://img.shields.io/badge/ESLint-9-4b32c3?logo=eslint) + ![Prettier](https://img.shields.io/badge/Prettier-3.8-f7b93e?logo=prettier)
- ![Vitest](https://img.shields.io/badge/Vitest-4.0-fcc72b?logo=vitest) + ![Playwright](https://img.shields.io/badge/Playwright-1.58-2ead33?logo=playwright) mit @axe-core/playwright
- ![Husky](https://img.shields.io/badge/Husky-9.1-22ff88?logo=git) für Pre-Commit-Hooks

### 📦 Erste Schritte

#### Voraussetzungen
- Node.js 22+ (LTS empfohlen)
- npm oder pnpm
- Victron Cerbo GX mit Node-RED (optional)
- KNX IP Router (optional)

#### Installation

```bash
# Repository klonen
git clone https://github.com/qnbs/Nexus-HEMS-Dash.git
cd Nexus-HEMS-Dash

# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev
```

#### Docker / Docker Compose (demnächst)

```bash
docker-compose up -d
```

### 🏗️ Architektur

**Adapter-Pattern (v3.1)**

Alle externen Protokolle sind hinter einem einheitlichen `EnergyAdapter`-Interface gekapselt. Jeder Adapter normalisiert Rohdaten in ein einheitliches `UnifiedEnergyModel`.

```
┌─────────────────────────────────────────────────────────────────┐
│                    useEnergyStore (Zustand)                     │
│         UnifiedEnergyModel = PV + Batterie + Netz + ...        │
├─────────┬───────────┬─────────┬───────────┬────────────────────┤
│ Victron │  Modbus   │   KNX   │ OCPP 2.1  │  EEBUS (2027)     │
│  MQTT   │  SunSpec  │   /IP   │   V2X     │                    │
│  (WS)   │  (REST)   │  (WS)   │   (WS)    │   (Stub)          │
├─────────┴───────────┴─────────┴───────────┴────────────────────┤
│                    EnergyAdapter Interface                       │
│ connect() · onData() · sendCommand() · getSnapshot() · destroy()│
└─────────────────────────────────────────────────────────────────┘
```

| Adapter | Protokoll | Fähigkeiten | Transport |
|---------|-----------|-------------|-----------|
| `VictronMQTTAdapter` | Node-RED WebSocket | pv, battery, grid, load | WebSocket |
| `ModbusSunSpecAdapter` | SunSpec Models 103/124/201 | pv, battery, grid | HTTP/REST-Polling |
| `KNXAdapter` | KNX/IP Tunneling | knx | WebSocket-Bridge |
| `OCPP21Adapter` | OCPP 2.1 JSON-RPC | evCharger (V2X) | WebSocket |
| `EEBUSAdapter` | SPINE/SHIP (Stub) | evCharger, load | — |

**Wichtige Dateien:**
- `src/core/adapters/EnergyAdapter.ts` — Interface + `UnifiedEnergyModel`-Typen
- `src/core/useEnergyStore.ts` — Zustand-Aggregator + `useAdapterBridge`-Hook
- `src/core/useLegacySendCommand.ts` — Abwärtskompatible Wrapper

**Local-First Design**
- Adapter-Daten werden in zentralem Zustand-Store zusammengeführt, gebrückt zu Legacy-`useAppStore`
- Dexie.js IndexedDB für 30-Tage-Rolling-History (persistiert via `useAdapterBridge`)
- Offline-fähige PWA-Architektur

**Echtzeit-Datenfluss**
```
Victron Cerbo GX ──┐
Modbus/SunSpec ─────┤
KNX/IP-Gateway ─────┤── EnergyAdapter ──→ useEnergyStore ──→ Zustand
OCPP 2.1 CSMS ──────┤                                        ↓
EEBUS (geplant) ────┘                              Dexie.js + useAppStore
```

### 🗺️ Roadmap 2026

| Quartal | Feature | Status |
|---------|---------|--------|
| Q1 2026 | **Home Assistant / MQTT Integration** | ✅ Abgeschlossen |
| Q1 2026 | **Predictive AI** (Wettervorhersage + Tarifvorhersage) | ✅ Abgeschlossen |
| Q1 2026 | **Sprachsteuerung** (Web Speech API) | ✅ Abgeschlossen |
| Q1 2026 | **PDF-Monatsberichte** (Sankey + CO₂-Bilanz) | ✅ Abgeschlossen |
| Q1 2026 | **Multi-Household Support** (Teilbare Dashboards) | ✅ Abgeschlossen |
| Q1 2026 | **Live-Preis-Widget** (Tibber/aWATTar Auto-Optimierung) | ✅ Abgeschlossen |
| Q2 2026 | **Adapter-Pattern** (Victron, Modbus, KNX, OCPP 2.1) | ✅ Abgeschlossen |
| Q2 2026 | **Tailwind Config & Custom Utilities** (.neon-glow, .glass-panel) | 🚧 In Arbeit |
| Q3 2026 | **EEBUS SPINE/SHIP Integration** | 🔄 Geplant |
| Q3 2026 | **Focus Traps für Modals** (WCAG 2.2 AA Compliance) | 🔄 Geplant |
| Q3 2026 | **Docker/Kubernetes Deployment** | 🔄 Geplant |
| Q4 2026 | **Prometheus/Grafana Monitoring** | 🔄 Geplant |

### 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE) für Details.

### 🤝 Beitragen

Beiträge willkommen! Bitte öffnen Sie ein Issue oder einen PR.
