## Nexus-HEMS-Dash v1.10.0 (2026-07-04)

Consolidates **33 commits** since `v1.9.0` (PRs [#236](https://github.com/qnbs/Nexus-HEMS-Dash/pull/236)–[#268](https://github.com/qnbs/Nexus-HEMS-Dash/pull/268)): security hardening, DevOps quality platforms, post-audit backend parity (phases 1–8), and production deploy/Helm edge fixes.

### Highlights

- **Post-audit remediation complete (phases 1–8)** — Backend HA/Zigbee/Matter/MQTT adapters, `ProtocolCommandRouter`, OpenEMS + OCPP command writes, WS schema hardening, Helm `WS_ORIGINS`, GitHub Pages deploy pruning.
- **Security wave** — JWT production-fatal weak secrets, CSP nonce (Helmet/nginx/Tauri), BYOK non-extractable keys (ADR-026), OCPP SP3 mTLS proxy, command validation at shared-types boundary.
- **Platform** — Manual-only releases (ADR-015), DevOps quality layering (ADR-027), Helm CI gate, branded ComboBox (WS-8), SunSpec worker (MED-12).

### Full changelog

See [CHANGELOG.md#1100---2026-07-04](https://github.com/qnbs/Nexus-HEMS-Dash/blob/main/CHANGELOG.md#1100---2026-07-04).

**Compare:** https://github.com/qnbs/Nexus-HEMS-Dash/compare/v1.9.0...v1.10.0
