# Lokale Geheimnisse (nicht versioniert)

Dieses Verzeichnis ist für **lokale** geheime Dateien reserviert. Sie werden von Git ignoriert.

## Tauri-Updater-Signaturschlüssel

Für offizielle Release-Builds mit Auto-Update:

1. Schlüsselpaar erzeugen (einmalig; ohne TTY z. B. `CI=1 … signer generate --ci` — siehe `docs/Tauri-Desktop-Updater-Setup.md`).
2. Den **öffentlichen** Schlüssel steht in `apps/web/src-tauri/tauri.conf.json` unter `plugins.updater.pubkey`.
3. Den **privaten** Schlüssel niemals committen. Für GitHub Actions:

   ```bash
   gh secret set TAURI_SIGNING_PRIVATE_KEY < pfad/zur/nexus-hems.key
   gh secret set TAURI_SIGNING_PRIVATE_KEY_PASSWORD --body ''
   ```

   (Passwort nur setzen, wenn die Schlüsseldatei mit Passwort geschützt ist.)

4. Optional: eine Kopie des privaten Schlüssels hier ablegen (z. B. `nexus-hems-tauri.key`) nur für lokale `tauri build`-Tests — weiterhin ignoriert durch `.gitignore`.

Wenn du das Repository neu klont, erhältst du **keinen** privaten Schlüssel; Maintainer müssen das Geheimnis aus dem sicheren Speicher der Organisation setzen oder ein neues Schlüsselpaar erzeugen und `pubkey` + GitHub-Secrets entsprechend rotieren.
