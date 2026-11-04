# Gitleaks scanner integrity (#432)

Restores detection coverage after [#429](https://github.com/qnbs/Nexus-HEMS-Dash/pull/429) broad path allowlists.

## Changes

1. **Remove whole-file path exclusions** for `docs/API-Reference.md` and `apps/api/src/protocols/eebus/EebusProtocolAdapter.test.ts`. Known placeholder lines remain in `.gitleaksignore` (line/rule specific).
2. **Tighten `mqtt-credentials` rule allowlist** — drop generic `example` / `placeholder` / `your_` suppressions; keep structural HA field-name patterns and explicit `your_` assignment prefixes.
3. **Narrow `demo-data-allowlist` rule** — remove blanket `[rules.allowlist] regexes = [".*"]` that disabled the rule entirely.
4. **Canary verification** — `scripts/verify-gitleaks-integrity.mjs` runs after Gitleaks in `security-full.yml`:
   - `scripts/gitleaks-canary/` (path-ignored in main scan) must produce findings.
   - Temp copies of docs + EEBUS test with synthetic append must produce findings.
   - Isolated HA `your_mqtt_password_here` placeholder must stay clean.

## Evidence

- Security Full on PR merge commit: Gitleaks job + integrity step green.
- Green Security Full alone does **not** close #421; update acceptance ledger only with fresh SARIF / maintainer Security tab export.

## Related

- [#421](https://github.com/qnbs/Nexus-HEMS-Dash/issues/421) tool health
- [#402](https://github.com/qnbs/Nexus-HEMS-Dash/issues/402) audit tracker
