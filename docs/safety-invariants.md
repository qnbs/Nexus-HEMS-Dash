# Safety and trust invariants (canonical)

This document summarizes non-negotiable safety boundaries for Nexus HEMS Dash. It does **not** imply regulatory certification (see `docs/Safety-Certification-Notice.md`).

## Global safety

- Default adapter mode is **mock**; live hardware requires explicit double opt-in (`ADAPTER_MODE=live` + `ALLOW_LIVE_HARDWARE=true`, plus per-adapter enablement).
- **Read-only mode** blocks hardware writes on the API/WebSocket path; hardened deployments must align frontend build flags with backend policy.
- Unknown or malformed commands are **rejected** before adapter dispatch.
- AI output never bypasses deterministic command validation, scope checks, or read-only guards.
- Offline replay is validated **server-side** (envelope age, expiry, authorization, read-only, adapter mode) — client TTL alone is insufficient.
- Every mutating HTTP replay uses scoped idempotency: principal + method + route + client key + body fingerprint.

## Units (internal contracts)

| Quantity | Unit |
|----------|------|
| Power | W |
| Energy | Wh or kWh (named in schema) |
| Current | A |
| Voltage | V |
| Temperature | °C |
| Tariff price | currency/kWh (e.g. €/kWh) |

## OCPP Authorize

- **Mock** effective mode: Authorize may auto-accept for demos and tests.
- **Live** mode: Authorize is **fail-closed** unless `idToken` is listed in `OCPP_AUTHORIZE_ID_TOKENS`.

## Authorization

- Invalid or missing JWT scope claims map to **least privilege** (`read`), never elevated to `readwrite`.
- WebSocket tickets inherit the validated scope from the issuing JWT.

## Command outcomes

Distinguish: application acceptance, protocol dispatch, adapter acknowledgment, and observed device effect where measurable. Adapters must not report success when no command was sent.
