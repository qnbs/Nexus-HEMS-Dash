# Arbeitsanweisungen — Nexus-HEMS-Dash

Dieses Dokument richtet sich an **Menschen und KI-Agenten**, die Code, Architektur oder Produktverhalten in diesem Repository ändern. Es ergänzt das **PRD** (`PRD.md`) um operative Regeln und Verweise — nicht um jedes Detail zu wiederholen.

---

## 1. Rangfolge der Wahrheit

1. **Sicherheit & Safety:** `docs/Safety-Certification-Notice.md`, `SECURITY.md`, `docs/Security-Architecture.md` — bei Konflikt mit Feature-Wünschen haben diese Vorrang.  
2. **Implementierter Code + Tests:** Was im Mainline gebaut und getestet ist, gilt als „geliefert“.  
3. **PRD (`PRD.md`):** Produktintent, Scope, Anforderungen — bei Abweichung vom Code PRD aktualisieren oder Issue anlegen.  
4. **Roadmaps / Debt:** `docs/Technical-Debt-Registry.md`, `docs/Master-Improvement-Roadmap.md` — Planung, keine Garantie.  
5. **ADR:** Architekturentscheidungen unter `docs/adr/` — bei bewusstem Bruch neues ADR oder ADR-Update.

---

## 2. Wann was lesen (Pflichtmatrix)

| Situation | Mindestens lesen |
|-----------|------------------|
| Neue Feature-Idee / UX-Änderung | `PRD.md`, relevante `docs/*` aus README-„primary references“ |
| Auth, Tokens, Rate-Limits | `docs/API-Reference.md`, `apps/api/src/jwt-utils.ts`, ADR-003 |
| Zeitreihen / Historie | `docs/API-Reference.md`, `apps/api/src/services/TimeseriesService.ts`, `history.routes.ts` |
| Neuer oder geänderter Adapter | `docs/Adapter-Dev-Guide.md`, `EnergyAdapter`-Interface, `CONTRIBUTING.md` |
| Performance / Bundle | `docs/Performance-Optimization-Plan.md`, `apps/web` size-limit |
| Accessibility | `docs/Accessibility-Testing-Guide.md`, `docs/WCAG-2.2-Audit.md` |
| Deployment | `docs/Deployment-Guide.md`, `docs/Deployment-Checklist.md` |
| KI / Prompt / PII | `docs/AI-Providers-Setup.md`, ADR-008 |

---

## 3. Repository-Kurzüberblick

```
apps/api/                 Express 5, WS, Influx, Adapter-Stubs
apps/web/                 React 19, Vite 8, Stores, Adapter-Registry, UI
packages/shared-types/    Zod + TypeScript — öffentlicher Vertrag
docs/                     Tiefe Spezifikationen, ADRs, Runbooks
.cursor/rules/            Modulare Cursor-Regeln (.mdc)
```

Entry Points: `apps/api/index.ts` → `startServer()`, `apps/web/src/main.tsx`.

---

## 4. Stack-„Gesetze“ (kurz)

**Nicht ohne ADR und Team-Abstimmung wechseln:** React↔Framework, Zustand↔anderes State-Management, Vite↔anderer Bundler, Tailwind-Major, Dexie-Ersatz, D3-Sankey-Ersatz für den Haupt-Sankey.

Details und Begründungen: `CONTRIBUTING.md`, `.github/copilot-instructions.md` (technisch ausführlich), ADR-001.

---

## 5. Entwicklungsworkflow

```bash
corepack enable
pnpm install
pnpm dev              # Turbo: web + ggf. weitere Packages
```

Qualität vor PR:

```bash
pnpm verify:basis     # type-check + lint + test:run (Turbo)
```

Zusätzlich je nach Änderung: `pnpm test:e2e`, `pnpm security:secrets` (lokal).

---

## 6. Umgebungsvariablen & Secrets

- **Niemals** echte Secrets in Code, Commits, Screenshots oder `.notes/`.  
- Backend: u.a. `PORT`, `NODE_ENV`, `API_KEYS`, `INFLUXDB_*`, `REDIS_URL`, `MQTT_BROKER_URL`, `WEB_DIST_PATH`, `ADAPTER_MODE` — vollständige Liste den Modulen und `docker-compose`/Deploy-Docs entnehmen.  
- Frontend: nur `VITE_*` für bewusst exponierte Werte.  
- Vorlagen: wo vorhanden `.env.example` pflegen; interne Geheimnisse: `.secrets/` nur laut `.secrets/README.md`.

---

## 7. API- & Schema-Disziplin

- Änderungen an Request/Response: zuerst **Zod-Schemas** in `@nexus-hems/shared-types`, dann Client + Server anpassen.  
- `docs/API-Reference.md` parallel oder im selben PR aktualisieren.  
- Breaking Changes: MINOR/MAJOR laut SemVer + `CHANGELOG.md`.

---

## 8. Testing-Disziplin

- Keine dauerhaft auskommentierten oder `.skip`-Tests zur „Grünfärbung“.  
- Externe Systeme mocken (Influx, MQTT, Redis, Netz) in Unit-Tests — siehe bestehende Muster unter `apps/*/src/tests/**`.  
- Playwright: keine Abhängigkeit von Produktions-URLs ohne Konfiguration.

---

## 9. ADR & größere Entscheidungen

- Architektur mit langfristiger Wirkung → **ADR** (`docs/adr/`, Werkzeug `pnpm adr:new`).  
- Im PR verlinken: Issue + ADR-Nummer.  
- Kurze mündliche Absprachen → Eintrag in `.notes/meeting_notes.md` (Consciousness Stream).

---

## 10. Cursor / KI-Agenten

- Modulare Regeln: `.cursor/rules/*.mdc` — bei neuen dauerhaften Lessons neue Regel nach `000-cursor-rules.mdc` anlegen.  
- Projekt-Manifest: `.cursor/index.mdc`.  
- Diese `instructions.md` und `PRD.md` sind der **menschlich lesbare** Oberbefehl; Regeln spiegeln wiederkehrende technische Constraints.

---

## 11. Bewusstsein für Compliance-Themen

- **AFIR / Netzdienliche Anforderungen:** siehe `docs/AFIR-Compliance-Checklist.md` wo relevant.  
- **OpenADR / Matter:** Integrations- und Interworking-Guides unter `docs/`.  
- Keine falscher Zertifizierungsclaims in UI oder Doku.

---

## 12. Wo Feedback und kontinuierliche Notizen hingehören

| Inhalt | Ort |
|--------|-----|
| Produkt-/Scope-Änderung | Issue + PR + PRD-Update |
| Architektur-Entscheidung | ADR |
| Kurzentscheidungen, Meetings, Agent-Kontext | `.notes/meeting_notes.md` |
| Security-Vulnerability | `SECURITY.md` Policy folgen |

---

*Letzte Ausrichtung: konsistent mit README v1.2.x und Monorepo-Stand — bei Releases CHANGELOG prüfen.*
