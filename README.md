# Nexus-HEMS Dash

![Nexus-HEMS Dash](https://img.shields.io/badge/Status-Active-success) ![React](https://img.shields.io/badge/React-19-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC)

[English](#english) | [Deutsch](#deutsch)

---

<a name="english"></a>

## 🇬🇧 English

### Overview

Nexus-HEMS Dash is a strategic Home Energy Management System (HEMS) dashboard. It acts as an intelligent orchestrator for decentralized energy, integrating Victron Energy hardware, KNX building automation, and dynamic electricity tariffs. The application visualizes real-time energy flows and provides control over EV charging strategies and heat pump operations (SG Ready).

### Features

- **Real-Time Energy Flow (Sankey Diagram)**: Visualizes the distribution of energy between PV generation, grid, battery, house load, heat pump, and EV in real-time.
- **KNX Building Automation**: Interactive floorplan to control smart home devices (lights, windows, thermostats) directly from the dashboard.
- **Smart EV Charging**: Configure charging strategies based on PV surplus, fast charging, or dynamic tariffs.
- **Heat Pump Control (SG Ready)**: Manage the operating modes of your heat pump to optimize self-consumption and thermal storage.
- **Comprehensive Settings**: Configure system IP addresses, dynamic tariff providers (Tibber, aWATTar), security settings (mTLS, 2FA), and database connections (InfluxDB).
- **Help & Documentation**: Built-in lexicon, FAQ, and usage guide.

### Technology Stack

- **Frontend**: React 19, React Router, Tailwind CSS, Lucide Icons
- **State Management**: Zustand
- **Visualization**: D3.js (Sankey diagrams), Framer Motion
- **Backend/Communication**: Node.js (Express), WebSockets for real-time data
- **Local Storage**: Dexie.js (IndexedDB)

### Getting Started

1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. Open the application in your browser.

### Architecture

The application uses a "Local-First" architecture. Data is fetched via WebSockets from a Node-RED backend (running on a Cerbo GX) and managed locally using Zustand. The UI is built with a modern "Glassmorphism" design using Tailwind CSS.

---

<a name="deutsch"></a>

## 🇩🇪 Deutsch

### Überblick

Nexus-HEMS Dash ist ein strategisches Dashboard für Home Energy Management Systeme (HEMS). Es fungiert als intelligenter Orchestrator für dezentrale Energie und integriert Victron Energy Hardware, KNX-Gebäudeautomation und dynamische Stromtarife. Die Anwendung visualisiert Energieflüsse in Echtzeit und bietet Kontrolle über EV-Ladestrategien und den Betrieb von Wärmepumpen (SG Ready).

### Funktionen

- **Echtzeit-Energiefluss (Sankey-Diagramm)**: Visualisiert die Verteilung der Energie zwischen PV-Erzeugung, Netz, Batterie, Hausverbrauch, Wärmepumpe und Elektroauto in Echtzeit.
- **KNX-Gebäudeautomation**: Interaktiver Grundriss zur Steuerung von Smart-Home-Geräten (Licht, Fenster, Thermostate) direkt über das Dashboard.
- **Intelligentes EV-Laden**: Konfigurieren Sie Ladestrategien basierend auf PV-Überschuss, Schnellladung oder dynamischen Tarifen.
- **Wärmepumpensteuerung (SG Ready)**: Verwalten Sie die Betriebsmodi Ihrer Wärmepumpe zur Optimierung des Eigenverbrauchs und der thermischen Speicherung.
- **Umfassende Einstellungen**: Konfigurieren Sie System-IP-Adressen, dynamische Tarifanbieter (Tibber, aWATTar), Sicherheitseinstellungen (mTLS, 2FA) und Datenbankverbindungen (InfluxDB).
- **Hilfe & Dokumentation**: Integriertes Lexikon, FAQ und Bedienungsanleitung.

### Technologie-Stack

- **Frontend**: React 19, React Router, Tailwind CSS, Lucide Icons
- **State Management**: Zustand
- **Visualisierung**: D3.js (Sankey-Diagramme), Framer Motion
- **Backend/Kommunikation**: Node.js (Express), WebSockets für Echtzeitdaten
- **Lokale Speicherung**: Dexie.js (IndexedDB)

### Erste Schritte

1. Abhängigkeiten installieren: `npm install`
2. Entwicklungsserver starten: `npm run dev`
3. Öffnen Sie die Anwendung in Ihrem Browser.

### Architektur

Die Anwendung nutzt eine "Local-First"-Architektur. Daten werden über WebSockets von einem Node-RED-Backend (das auf einem Cerbo GX läuft) abgerufen und lokal mit Zustand verwaltet. Die Benutzeroberfläche ist in einem modernen "Glassmorphism"-Design mit Tailwind CSS gestaltet.
