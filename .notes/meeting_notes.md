# Meeting Notes & Consciousness Stream

**Zweck:** Kurzlebiger, aber strukturierter **Gedächtnisstrom** für das Projekt — Beschlüsse, die nicht jedes Mal ein ADR rechtfertigen, Kontext für KI-Agenten, und Erinnerungen aus Reviews.  
**Sprache:** DE oder EN — konsistent pro Eintrag.  
**Verbote:** Passwörter, API-Keys, Tokens, private URLs, personenbezogene Daten Dritter, interne Firmen-Geheimnisse ohne Freigabe.

**Verknüpfung:** Schwere/architektonische Themen zusätzlich in `docs/adr/` und `PRD.md` / `instructions.md` spiegeln.

---

## Nutzungskonvention

Jeder Eintrag hat:

```text
### YYYY-MM-DD — Kurztitel
**Teilnehmer / Quelle:** Name | Agent | Issue #123
**Kontext:** 1–3 Sätze
**Entscheidung / Erkenntnis:**
- …
**Follow-ups:**
- [ ] …
**Links:** optional: PR, ADR, Dateipfad
```

Alte Einträge **nicht löschen** — bei Korrektur neuen Untereintrag mit „Korrektur zu …“ setzen.

---

## Index laufender Themen (Pflege bei Bedarf)

| Tag | Thema | Status |
|-----|--------|--------|
| safety | Live-Hardware nur nach Safety-Notice-Checkliste | aktiv |
| security | JWT-Ticket-Flow bevorzugen gegenüber JWT in URL | referenz: API-Reference |
| perf | Bundle-Limits in `apps/web/package.json` size-limit | aktiv |
| a11y | Playwright a11y + manuelle Checks | aktiv |

---

## Chronologische Einträge

### Template (kopieren und ausfüllen)

### YYYY-MM-DD — 
**Teilnehmer / Quelle:**  
**Kontext:**  
**Entscheidung / Erkenntnis:**  
-  
**Follow-ups:**  
- [ ]  
**Links:**  

---

### 2026-05-02 — Initialisierung Consciousness Stream
**Teilnehmer / Quelle:** Repository-Setup / Dokumentationsrunde  
**Kontext:** Strukturierte Notizen- und PRD-/instructions-Landschaft ergänzt; Agenten sollen vor großen Architekturänderungen PRD + instructions konsultieren.  
**Entscheidung / Erkenntnis:**  
- `.notes/meeting_notes.md` ist der Ort für **ephemere bis mittelfristige** Kontexte; verbindliche Specs bleiben `PRD.md`, `instructions.md`, `docs/*`, ADRs.  
- Jede sicherheitsrelevante Feldintegration wird mit Verweis auf `docs/Safety-Certification-Notice.md` dokumentiert.  
**Follow-ups:**  
- [ ] Team gewohnt machen, nach Meetings hier 5-Minuten-Summary einzutragen.  
- [ ] Bei erstem echten Architektur-Beschluss Beispiel-Eintrag durch echten Eintrag ersetzen und ADR verlinken.  
**Links:** `PRD.md`, `instructions.md`, `.cursor/rules/850-mcp-and-prd.mdc`

---

## Entscheidungen ohne ADR (leichtgewichtig)

| Datum | Thema | Kurzentscheidung |
|-------|--------|------------------|
| 2026-05-02 | Notizen-Format | Markdown-Template oben verbindlich für neue Einträge |

*(Schwere Entscheidungen → ADR-Tabelle in `docs/adr/` pflegen, hier nur Verweis.)*

---

## Offene Fragen / Parkplatz

- *(Beispiel)* Soll `instructions.md` bei jedem Major-Release ein Versionsdatum im Header erhalten? → Team klären.  
- *(Platzhalter für echte offene Punkte)*

---

## MCP & Tooling-Erinnerungen (optional)

Wenn im Team MCP-Server (GitHub, Docs, DB-Readonly) aktiviert werden:

- Nur least-privilege Tokens; nie in dieses File schreiben.  
- Kurz notieren **welches** MCP ab wann genutzt wird (Datum + Zweck), ohne Zugangsdaten.

---

*Dieses Dokument absichtlich „lebendig“ — Historie wertvoll für Onboarding und Agent-Kontext.*
