# Tauri-Desktop: Auto-Updater & Signatur (v2.x)

Dieses Dokument beschreibt die **kanonische** Einrichtung für signierte Desktop-Releases und den eingebauten Updater. Es ersetzt ältere Hinweise auf `TAURI_PRIVATE_KEY` / `TAURI_KEY_PASSWORD` (Tauri v1); für Nexus-HEMS-Dash gelten die Variablen aus der offiziellen Tauri-2-Dokumentation.

## Voraussetzungen

- `pnpm` 10.x, Node 24 (wie im Root-`package.json`)
- Für lokale CLI: `pnpm dlx @tauri-apps/cli@2` (Version an `apps/web/src-tauri/Cargo.toml` anpassen)
- Öffentlicher Schlüssel: eingetragen in `apps/web/src-tauri/tauri.conf.json` unter `plugins.updater.pubkey`
- Bundle: `bundle.createUpdaterArtifacts: true` (erzeugt Updater-Artefakte)

## 1. Schlüsselpaar erzeugen

**Interaktiv** (empfohlen mit Passwort):

```bash
pnpm dlx @tauri-apps/cli@2.2.0 signer generate -w ~/.tauri/nexus-hems-tauri.key
```

**Headless / CI** (ohne Passwort; nur für Automatisierung):

```bash
CI=1 pnpm dlx @tauri-apps/cli@2.2.0 signer generate -w ~/.tauri/nexus-hems-tauri.key -f --ci
```

Ausgabe: Pfad zur privaten Datei + Minisign-**Public-Key-String** (eine Zeile Base64). Diesen String exakt in `tauri.conf.json` → `plugins.updater.pubkey` eintragen und committen.

## 2. Umgebungsvariablen zum Signieren (Build)

| Variable | Bedeutung |
|----------|-----------|
| `TAURI_SIGNING_PRIVATE_KEY` | Inhalt der privaten Schlüsseldatei **oder** Dateipfad |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Passwort der Schlüsseldatei (leer lassen, wenn ohne Passwort erzeugt) |

`.env` wird von der Tauri-Toolchain **nicht** für Signatur gelesen — Werte in der Shell oder in CI setzen.

## 3. GitHub Actions

Workflow: `.github/workflows/tauri-build.yml`

Die Secrets **müssen** heißen:

- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

(Wichtig: nicht die alten v1-Namen `TAURI_PRIVATE_KEY` / `TAURI_KEY_PASSWORD`.)

```bash
gh secret set TAURI_SIGNING_PRIVATE_KEY < ~/.tauri/nexus-hems-tauri.key
gh secret set TAURI_SIGNING_PRIVATE_KEY_PASSWORD --body 'dein-passwort'
# oder bei schlüssel ohne Passwort:
gh secret set TAURI_SIGNING_PRIVATE_KEY_PASSWORD --body ''
```

## 4. Update-Endpunkt

`plugins.updater.endpoints` zeigt auf die GitHub-Releases-`latest.json` dieses Repos. Releases erzeugt u. a. `tauri-action` mit `includeUpdaterJson: true`.

## 5. Schlüsselrotation

1. Neues Paar erzeugen, `pubkey` in `tauri.conf.json` ersetzen, Version bump, Release bauen.
2. Neues `TAURI_SIGNING_PRIVATE_KEY` (und ggf. Passwort) in GitHub aktualisieren.
3. Nutzer:innen auf eine Version mit **neuem** öffentlichen Schlüssel bringen (ein Release mit altem Schlüssel kann nicht mehr mit neuem privaten Schlüssel signiert werden — planbare Übergangszeit einhalten).

## 6. Lokale Kopie (optional)

Eine Kopie des privaten Schlüssels kann unter `.secrets/` liegen (von Git ignoriert); siehe `.secrets/README.md`.
