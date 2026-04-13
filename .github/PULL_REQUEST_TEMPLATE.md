## Beschreibung

<!-- Eine klare Beschreibung der Änderungen in diesem PR. -->

Fixes #<!-- Issue-Nummer -->

## Art der Änderung

- [ ] 🐛 Bugfix (nicht-breaking, behebt ein Issue)
- [ ] ✨ Neues Feature (nicht-breaking, fügt Funktionalität hinzu)
- [ ] 💥 Breaking Change (Fix oder Feature, das bestehende Funktionalität ändert)
- [ ] 📝 Dokumentation
- [ ] ♻️ Refactoring (kein funktionaler Unterschied)
- [ ] 🎨 Style / UI (CSS, Layout, Design)
- [ ] ⚡ Performance
- [ ] 🔒 Sicherheit
- [ ] ♿ Barrierefreiheit (a11y)
- [ ] 🌐 Lokalisierung (i18n)
- [ ] 🧪 Tests
- [ ] 🔧 CI / Build / Tooling

## Checkliste

### Allgemein

- [ ] Mein Code folgt dem Code-Stil dieses Projekts
- [ ] Ich habe ein Self-Review meines Codes durchgeführt
- [ ] Mein Commit folgt [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, etc.)

### Qualität

- [ ] `pnpm type-check` — keine TypeScript-Fehler
- [ ] `pnpm lint` — keine ESLint-Warnungen
- [ ] `pnpm format:check` — Formatting korrekt
- [ ] Bestehende Tests bestehen
- [ ] Ich habe neue Tests für meine Änderungen geschrieben (falls zutreffend)

### i18n / a11y (Pflicht)

- [ ] Alle neuen Strings sind in `src/locales/de.ts` und `src/locales/en.ts` mit `t()` lokalisiert
- [ ] WCAG 2.2 AA: korrekte ARIA-Attribute, Tastaturnavigation, Farbkontraste
- [ ] Keine hardcodierten Strings in Komponenten

### Spezifisch (falls zutreffend)

- [ ] Sankey-Diagramm / D3.js: nicht gebrochen
- [ ] KNX-Grundriss: nicht gebrochen
- [ ] Zustand-Store: Neuer State in `useAppStore` (UI/Settings) oder `useEnergyStore` (Energie-Daten)
- [ ] Adapter: Implementiert `EnergyAdapter`-Interface
- [ ] PWA: Offline-Funktionalität getestet

## Screenshots / Demo

<!-- Falls zutreffend, füge vorher/nachher Screenshots oder eine kurze Demo hinzu. -->

| Vorher | Nachher |
| ------ | ------- |
|        |         |

## Zusätzliche Hinweise

<!-- Informationen für den Reviewer: Risiken, offene Fragen, Abhängigkeiten. -->
