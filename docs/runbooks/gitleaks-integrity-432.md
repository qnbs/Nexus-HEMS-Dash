# Gitleaks scanner integrity (#432)

Restores detection coverage after [#429](https://github.com/qnbs/Nexus-HEMS-Dash/pull/429) broad path allowlists.

## Changes

1. **Remove whole-file path exclusions** for `docs/API-Reference.md` and `apps/api/src/protocols/eebus/EebusProtocolAdapter.test.ts`. Known placeholder lines remain in `.gitleaksignore` (line/rule specific).
2. **Tighten `mqtt-credentials` rule allowlist** — drop generic `example` / `placeholder` / `your_` suppressions; keep structural HA field-name patterns and explicit `your_` assignment prefixes.
3. **Narrow `demo-data-allowlist` rule** — remove blanket `[rules.allowlist] regexes = [".*"]` that disabled the rule entirely.
4. **Canary verification** — `scripts/verify-gitleaks-integrity.mjs` runs after Gitleaks in `security-full.yml`. Positive probe values are **generated at runtime** into `.cache/gitleaks-probes/` from plain templates in `scripts/gitleaks-canary/` (no high-entropy literals committed — avoids GitGuardian false incidents while keeping Gitleaks coverage).
   - `scripts/gitleaks-canary/` (path-ignored in main scan) must produce findings.
   - Temp copies of docs + EEBUS test with synthetic append must produce findings.
   - Isolated HA `your_mqtt_password_here` placeholder must stay clean.
   - **#432 residual:** Tibber marker adjacent to `your_` / `example` comment text must still detect; placeholder-only Tibber assignment stays clean; `mqttUser` on the same line must not suppress `mqttPassword` (removed line-level `mqttUser` allowlist in `.gitleaks.toml`).

## Docker vs local runner

Integrity logs the runner at startup. CI **Security Full** installs Gitleaks **8.22.1** on the runner (`security-full.yml`); Docker fallback image is **`ghcr.io/gitleaks/gitleaks:v8.22.1`** when the CLI is unavailable. Both use the same repo `.gitleaks.toml` (integrity config strips only the canary path exclusion).

- Security Full on PR merge commit: Gitleaks job + integrity step green.
- Green Security Full alone does **not** close #421; update acceptance ledger only with fresh SARIF / maintainer Security tab export.

## Related

- [#421](https://github.com/qnbs/Nexus-HEMS-Dash/issues/421) tool health
- [#402](https://github.com/qnbs/Nexus-HEMS-Dash/issues/402) audit tracker
