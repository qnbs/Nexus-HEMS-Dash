# Nexus-HEMS Dash 2.0

<div align="center">

![Version](https://img.shields.io/badge/Version-2.0.0-22ff88?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-00f0ff?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=for-the-badge&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-4.1-38bdf8?style=for-the-badge&logo=tailwindcss)
![PWA Ready](https://img.shields.io/badge/PWA-Ready-ff8800?style=for-the-badge)
![i18n](https://img.shields.io/badge/i18n-DE%20%7C%20EN-22ff88?style=for-the-badge)
![WCAG](https://img.shields.io/badge/WCAG-2.2%20AA-00f0ff?style=for-the-badge)

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/qnbs/Nexus-HEMS-Dash)

**Real-time orchestration for PV, storage, heat & mobility**

[🇬🇧 English](#english) | [🇩🇪 Deutsch](#deutsch)

</div>

---

<a name="english"></a>

## 🇬🇧 English

### 🎯 Overview

**Nexus-HEMS Dash** is a production-ready, real-time Home Energy Management System (HEMS) dashboard designed for the decentralized energy era. Seamlessly integrating **Victron Energy**, **KNX building automation**, and **dynamic electricity tariffs** (Tibber, aWATTar), it provides intelligent orchestration for PV generation, battery storage, heat pumps, and EV charging.

Built with **React 19**, **Zustand**, **D3.js**, and **Tailwind CSS 4**, the dashboard delivers a stunning **Neo-Energy Cyber-Glassmorphism UI** with full **i18n** (German/English), **WCAG 2.2 AA accessibility**, and **offline-first** architecture.

### ✨ What's New in 2.0.0

- 🤖 **AI Optimizer**: Dynamic tariff-aware suggestions for EV charging, SG Ready heat pump control, and battery strategies
- 🌐 **Full i18n**: Complete German/English localization with persistent language switcher
- 🎨 **3 Premium Themes**: Cyber Energy Dark (default), Solar Light, Night Mode with smooth Framer Motion transitions
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
| 🚗 **Smart EV Charging** | PV surplus, fast charging, dynamic tariff modes | ✅ Live |
| 🔥 **SG Ready Control** | Heat pump modes (1-4) for thermal storage optimization | ✅ Live |
| 🤖 **AI Optimizer** | Tariff-aware recommendations (Tibber, aWATTar) | ✅ Live |
| 🌐 **i18n** | German/English with persistent localStorage | ✅ 100% |
| 🎨 **3 Themes** | Cyber Dark, Solar Light, Night Mode | ✅ Live |
| ♿ **WCAG 2.2 AA** | Full accessibility (semantic, ARIA, focus) | ✅ Compliant |
| 📦 **Local-First** | Dexie.js IndexedDB, 30-day history retention | ✅ Live |
| 🔒 **Enterprise Security** | mTLS, 2FA, telemetry opt-out, §14a compliance | ✅ Live |

### 🛠️ Technology Stack

**Frontend**
- ![React](https://img.shields.io/badge/React-19-00f0ff?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript)
- ![Zustand](https://img.shields.io/badge/Zustand-5.0-22ff88) ![React Router](https://img.shields.io/badge/React_Router-7-ff8800?logo=reactrouter)
- ![D3.js](https://img.shields.io/badge/D3.js-7.9-f9a03c?logo=d3dotjs) for Sankey diagrams
- ![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-bb4eff?logo=framer) for animations
- ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8?logo=tailwindcss) with custom Neo-Energy palette

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

**Local-First Design**
- WebSocket connection to Node-RED backend (Victron Cerbo GX)
- Zustand state management with persist middleware
- Dexie.js IndexedDB for 30-day rolling history
- Offline-capable PWA architecture

**Real-Time Data Flow**
```
Victron Cerbo GX (Node-RED) 
    ↓ WebSocket (ws://)
Nexus-HEMS Dash (React 19)
    ↓ Zustand Store
Dexie.js (IndexedDB) + LocalStorage
```

### 🗺️ Roadmap 2026

| Quarter | Feature | Status |
|---------|---------|--------|
| Q1 2026 | **Home Assistant / MQTT Integration** | � In Development |
| Q2 2026 | **Predictive AI** (Google Gemini + tariff prediction) | 🚧 In Development |
| Q2 2026 | **Voice Control** (Web Speech API) | 🚧 In Development |
| Q3 2026 | **PDF Monthly Reports** (Sankey + CO₂ balance) | 🚧 In Development |
| Q3 2026 | **Multi-Household Support** (shareable dashboards) | 🚧 In Development |
| Q4 2026 | **Live Price Widget** (Tibber/aWATTar auto-optimization) | 🚧 In Development |

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

### ✨ Neu in 2.0.0

- 🤖 **AI-Optimizer**: Tarifbewusste Empfehlungen für EV-Ladung, SG Ready Wärmepumpensteuerung und Batteriestrategien
- 🌐 **Vollständige i18n**: Komplette Deutsch/Englisch-Lokalisierung mit persistentem Sprachwechsel
- 🎨 **3 Premium-Themes**: Cyber Energy Dark (Standard), Solar Light, Night Mode mit flüssigen Framer Motion Übergängen
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
| 🚗 **Intelligentes EV-Laden** | PV-Überschuss, Schnellladung, dynamische Tarifmodi | ✅ Live |
| 🔥 **SG Ready Steuerung** | Wärmepumpen-Modi (1-4) zur thermischen Speicheroptimierung | ✅ Live |
| 🤖 **AI-Optimizer** | Tarifbewusste Empfehlungen (Tibber, aWATTar) | ✅ Live |
| 🌐 **i18n** | Deutsch/Englisch mit persistentem localStorage | ✅ 100% |
| 🎨 **3 Themes** | Cyber Dark, Solar Light, Night Mode | ✅ Live |
| ♿ **WCAG 2.2 AA** | Vollständige Barrierefreiheit (Semantik, ARIA, Fokus) | ✅ Konform |
| 📦 **Local-First** | Dexie.js IndexedDB, 30-Tage-Historie-Retention | ✅ Live |
| 🔒 **Enterprise-Sicherheit** | mTLS, 2FA, Telemetrie-Opt-out, §14a Konformität | ✅ Live |

### 🛠️ Technologie-Stack

**Frontend**
- ![React](https://img.shields.io/badge/React-19-00f0ff?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript)
- ![Zustand](https://img.shields.io/badge/Zustand-5.0-22ff88) ![React Router](https://img.shields.io/badge/React_Router-7-ff8800?logo=reactrouter)
- ![D3.js](https://img.shields.io/badge/D3.js-7.9-f9a03c?logo=d3dotjs) für Sankey-Diagramme
- ![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-bb4eff?logo=framer) für Animationen
- ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8?logo=tailwindcss) mit eigener Neo-Energy-Palette

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

**Local-First Design**
- WebSocket-Verbindung zu Node-RED-Backend (Victron Cerbo GX)
- Zustand State Management mit Persist-Middleware
- Dexie.js IndexedDB für 30-Tage-Rolling-History
- Offline-fähige PWA-Architektur

**Echtzeit-Datenfluss**
```
Victron Cerbo GX (Node-RED) 
    ↓ WebSocket (ws://)
Nexus-HEMS Dash (React 19)
    ↓ Zustand Store
Dexie.js (IndexedDB) + LocalStorage
```

### 🗺️ Roadmap 2026

| Quartal | Feature | Status |
|---------|---------|--------|
| Q1 2026 | **Home Assistant / MQTT Integration** | 🔄 Geplant |
| Q2 2026 | **Predictive AI** (Wettervorhersage + Tarifvorhersage) | 🔄 Geplant |
| Q3 2026 | **Multi-Household Support** (Community-Speicher) | 🔄 Geplant |
| Q4 2026 | **Sprachsteuerung** (Alexa, Google Assistant) | 🔄 Geplant |

### 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE) für Details.

### 🤝 Beitragen

Beiträge willkommen! Bitte öffnen Sie ein Issue oder einen PR.
