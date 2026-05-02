# Product Requirements Document (PRD)

**Produkt:** Nexus-HEMS Dashboard  
**Repository:** Nexus-HEMS-Dash  
**Version dieses Dokuments:** 1.0  
**Abgestimmte Produkt-Baseline (Release):** siehe `package.json` / `CHANGELOG.md` (derzeit v1.2.x-Linie)  
**Normative Begleitdokumente:** `instructions.md`, `README.md`, `docs/Safety-Certification-Notice.md`, `docs/Security-Roadmap-2026.md`

---

## 1. Executive Summary

Nexus-HEMS ist ein **produktionsorientiertes Home-Energy-Management-System (HEMS)** mit einem vereinheitlichten Web-Dashboard („Command Center“). Es bündelt **Echtzeit-Energiedaten** aus diversen Feldgeräten und Energiemanagementsystemen, visualisiert Flüsse (u.a. Sankey), unterstützt **tarifgeführte Optimierung**, Steuerungslogik (Controller, MPC, KI-gestützte Optimierung mit BYOK) sowie **Offline/PWA**-Betrieb. Ein **Express-Backend** ergänzt die SPA um Auth, WebSocket-Gateway, Zeitreihen-Persistenz (InfluxDB), optionale Protokoll-Adapter auf der Edge und Integrationspfade (OpenADR, Metriken).

**Wichtig:** Das System kann **sicherheitsrelevante elektrische Infrastruktur** berühren. Es liegt **keine behördliche Zertifizierung** (z.B. VDE, IEC, CE für dieses Gesamtprodukt) vor — siehe Abschnitt 9 und `docs/Safety-Certification-Notice.md`.

---

## 2. Produktvision & Strategische Ziele

| Ziel | Beschreibung |
|------|----------------|
| **Transparenz** | Hausbesitzer:innen und Betreiber sehen Erzeugung, Verbrauch, Speicher und Tarife in einem Interface. |
| **Integration** | Viele Herstellerprotokolle über Adapter schließen statt Insellösungen zu vermehrfachen. |
| **Optimierung** | Kosten und CO₂-orientierte Strategien unter Berücksichtigung von Grenzen (SOC, Leistung, Netz). |
| **Verlässlichkeit** | Offline-Fähigkeit, nachvollziehbare Fehlerzustände, observability-fähige Metriken. |
| **Sicherheit & Datenschutz** | JWT, Rate-Limits, CSP, keine Secrets im Client; PII-sensible KI-Ausgaben filtern (siehe ADR-008). |

---

## 3. Zielgruppen (Personas)

1. **Privater Prosumer:** PV, Speicher, WP, E-Auto; Nutzung über Browser/PWA oder Desktop/Mobile-Wrapper.  
2. **Technisch versierter Betreiber:** Konfiguration von Adaptern, Tarifen, Grenzwerten; möglicherweise Docker/Kubernetes.  
3. **Integrator / Entwickler:** Erweiterung über Plugin-/Adapter-Pattern, Beiträge zum Monorepo.  
4. **Demand-Response / Flexibilität (optional):** Anbindung über OpenADR/Matter-Übersetzung etc. (siehe Roadmap-Docs).

---

## 4. Produktumfang (Scope)

### 4.1 Im Scope (Kern)

- **Frontend (`apps/web`):** React-19-SPA (Vite), einheitliche Navigation, Energievisualisierung, Einstellungen, i18n (mind. DE/EN), Barrierefreiheit gemäß Projektstandard (WCAG 2.2 AA als Zielrichtung; Details `docs/WCAG-2.2-Audit.md`, `docs/Accessibility-Testing-Guide.md`).  
- **Backend (`apps/api`):** REST (`/api/v1/...`, Auth, Health), WebSocket-Echtzeitpfad, Timeseries-Write/Read über InfluxDB, WAL bei Ausfall, Energy-Router-Service, Start ausgewählter Hardware-Protokoll-Adapter (Modbus/MQTT je nach Env/Konfiguration).  
- **Gemeinsame Typen (`packages/shared-types`):** Zod-Schemas als Vertrag zwischen Client, Server und Dokumentation (`docs/API-Reference.md`).  
- **Tests:** Vitest (Unit/Integration im Rahmen des Repos), Playwright für E2E/a11y wo vorgesehen; Coverage-Gates laut CI/Projektregeln.

### 4.2 Explizit variable / umgebungsabhängig

- Anbindung echter Hardware vs. **Mock-Modus** (`ADAPTER_MODE=mock` o.ä.).  
- **Redis** für persistente JWT-JTI-Revocation (optional; In-Memory-Fallback).  
- **KI-Anbieter:** BYOK, keine feste Cloud-Pflicht für Basisfunktionen.

### 4.3 Außerhalb des Kern-PRD (Roadmap / separate Spezifikationen)

Alles, was nur in Roadmap-Dokumenten oder Issues existiert und **nicht** im Mainline-Code verifiziert ist, gilt als **geplant**, nicht als geliefert. Verweise: `docs/Technical-Debt-Registry.md`, `docs/Master-Improvement-Roadmap.md`, `docs/Plugin-Marketplace-Spec.md`.

---

## 5. Funktionale Anforderungen

### 5.1 Dashboard & Navigation

- **FR-DASH-01:** Das System stellt eine konsolidierte Oberfläche für Energieflüsse, Schlüsselkennzahlen und Kontextaktionen bereit (kein Pflichtrequirement für eine feste Seitenzahl; Orientierung `README`).  
- **FR-DASH-02:** Nutzer können Theming, Sprache und relevante Einstellungen persistiert speichern (Client-seitig über etablierte Stores).  
- **FR-DASH-03:** Offline-Szenarien: definiertes Verhalten über Dexie/Workbox — Details `docs/Offline-Sync-Design.md`.

### 5.2 Adapter & Datenmodell

- **FR-ADP-01:** Adapter implementieren das vereinbarte Energieadapter-Interface; Ausführung über Registry (statisch/dynamisch je nach Adapter-Typ).  
- **FR-ADP-02:** Datenfusion zu einem **vereinheitlichten Energiemodell** für UI und Optimierer.  
- **FR-ADP-03:** Controllers und Optimierer operieren auf diesem Modell und dokumentierten Constraints (`EnergyRouter`-Design: `docs/Energy-Router-Design.md`).

### 5.3 Backend & APIs

- **FR-API-01:** Health- und Auth-Endpunkte wie in `docs/API-Reference.md`; keine unnötige Preisgabe sicherheitsrelevanter Metadaten (vgl. MED-05).  
- **FR-API-02:** WebSocket-Auth über Ticket- oder Token-Flow wie spezifiziert; Rate-Limits auf Auth-Routen.  
- **FR-API-03:** Historische/Zeitreihen-Abfragen über dokumentierte Routen mit validierten Parametern (keine unsicheren Flux-Konkatenationen).

### 5.4 Sicherheit & Compliance (funktional)

- **FR-SEC-01:** Keine Hardcodierung von Credentials; Konfiguration über Env/Secrets-Management.  
- **FR-SEC-02:** JWT-Lebenszyklus inkl. Refresh, Revocation (JTI), optional Redis — ADR-003.  
- **FR-SEC-03:** Security-Header und CORS-Konfiguration gemäß `docs/Security-Architecture.md` und implementiertem Middleware-Stack.

### 5.5 Reporting & Export

- **FR-REP-01:** PDF-/Sharing-Funktionen wie im Produkt umgesetzt (jsPDF/QR); keine Übertragung personenbezogener Daten ohne Einwilligung/Kontext.

---

## 6. Nicht-funktionale Anforderungen

| ID | Kategorie | Anforderung |
|----|-----------|-------------|
| **NFR-PERF-01** | Performance | Bundle- und Laufzeitbudgets gemäß `apps/web` size-limit und `docs/Performance-Optimization-Plan.md`. |
| **NFR-REL-01** | Zuverlässigkeit | Backend startet auch bei optionalem Ausfall von InfluxDB mit degradierter WAL-Logik (kein silent data loss ohne dokumentiertes Verhalten). |
| **NFR-SCALE-01** | Skalierung | Primär Single-Home-/Edge-Fokus; Multi-Tenant/RBAC als Zukunft ADR-009. |
| **NFR-A11Y-01** | Accessibility | Automatisierte + manuelle Tests laut `docs/Accessibility-Testing-Guide.md`. |
| **NFR-OBS-01** | Observability | Prometheus/Metriken-Endpunkte wie implementiert; Ausbau `docs/Observability-Plan.md`. |
| **NFR-I18N-01** | Lokalisierung | DE/EN synchron halten (`docs`-Hinweise zu i18n-Tests). |

---

## 7. Technische Constraints (nicht verhandelbar ohne ADR)

Die folgenden Entscheidungen sind **architektonisch gebunden**, sofern nicht durch ein neues ADR abgelöst:

- Frontend: **React 19**, **Vite 8**, **Zustand**, **TanStack Query**, **React Router 7**, **Tailwind v4**, **Dexie**, **D3-Sankey** für Energiefluss — siehe `CONTRIBUTING.md` und ADR-001 (Biome-first).  
- Backend: **Express 5**, **WebSocket**, **InfluxDB v2 Client**, TypeScript strict.  
- Tooling: **pnpm** + **Turborepo**, **Biome** + ergänzendes ESLint für React.

---

## 8. Datenflüsse & externe Systeme

- **Client ↔ API:** REST, WS; Auth siehe API-Reference.  
- **API ↔ InfluxDB:** Schreiben/Lesen von Zeitreihen; WAL auf Dateisystem.  
- **API ↔ MQTT/Modbus:** Geräte-/Broker-Konfiguration über Env und JSON-Maps — `docs/Protocol-Adapter-Guide-Backend.md`.  
- **Tarife:** Anbieter-spezifische Integration im Web — `docs/Tariff-Providers-Setup.md`.  
- **Desktop/Mobile:** Tauri/Capacitor-Pfade in separaten Deploy-Docs.

---

## 9. Risiken, Safety & regulatorischer Kontext

| Risiko | Mitigation (Produkt/Prozess) |
|--------|------------------------------|
| Elektrische Gefahr durch Fernschalten | Klare Warnhinweise, keine Zertifizierungsbehauptung; Checklisten vor Live-Betrieb. |
| Falschkonfiguration von Speicher/EV | Command-Safety-Layer, Bestätigungen für gefährliche Kommandos. |
| Supply-Chain / Secrets | gitleaks, nurBuiltDependencies-Policy, keine Secrets im Repo. |
| KI-Halluzinationen / PII | Output-Filter ADR-008, dokumentierte Grenzen. |

---

## 10. Erfolgskriterien & Metriken

- **Qualität:** CI grün — `pnpm verify:basis` (type-check, lint, test:run) vor Merge als Teamstandard.  
- **Sicherheit:** Umsetzungsgrad laut `docs/Security-Roadmap-2026.md` tracken.  
- **UX:** Lighthouse/a11y-Tests wo definiert; keine Regression ohne Ticket.  
- **Release:** Semantic Versioning, `CHANGELOG.md` pflegen.

---

## 11. Traceability-Matrix (PRD → Artefakte)

| Thema | Dokument / Pfad |
|--------|-----------------|
| API-Vertrag | `docs/API-Reference.md`, `packages/shared-types` |
| Adapter entwickeln | `docs/Adapter-Dev-Guide.md`, `docs/Protocol-Adapter-Guide-Backend.md` |
| Deployment | `docs/Deployment-Guide.md`, `docs/Deployment-Checklist.md` |
| Security | `SECURITY.md`, `docs/Security-Architecture.md` |
| ADR-Entscheidungen | `docs/adr/ADR-*.md` |
| Testing | `docs/Testing-Coverage-Strategy.md` |
| Betrieb für KI/Agenten | `instructions.md`, `.cursor/index.mdc` |

---

## 12. Änderungsmanagement dieses PRD

1. Inhaltliche Produktänderungen: PR mit Referenz auf Issue/Discussion; bei Architekturwechsel **ADR** anlegen oder aktualisieren (`pnpm adr:new` / Log4brains).  
2. Release-Version vs. PRD-Version: Release ist **Code + CHANGELOG** maßgeblich; PRD beschreibt Intent und Constraints.  
3. Abweichungen zwischen PRD und Code: **Code für implementierte Wahrheit**, PRD nachziehen oder Bug/Issue eröffnen.

---

## 13. Glossar

| Begriff | Bedeutung |
|---------|-----------|
| **HEMS** | Home Energy Management System |
| **BYOK** | Bring Your Own API Key (KI-Anbieter) |
| **WAL** | Write-Ahead Log (Timeseries-Resilienz) |
| **JTI** | JWT ID (Revocation) |
| **VEN/VTN** | OpenADR Virtual End Node / Top Node |

---

*Ende PRD v1.0 — bei Fragen zur Auslegung zuerst `instructions.md` und die verlinkten docs konsultieren.*
