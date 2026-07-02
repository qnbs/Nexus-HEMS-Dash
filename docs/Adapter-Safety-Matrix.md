# Adapter Safety Matrix

**Status:** 🔄 Living audit
**Created:** 2026-07-02
**Owner:** @qnbs
**Related:** ADR-024 (connect contract), `apps/web/src/core/adapters/BaseAdapter.ts`, `docs/Technical-Debt-Registry.md`

This matrix audits every frontend adapter that extends `BaseAdapter` against five safety-critical
lifecycle/command properties. It exists because a lifecycle-contract gap (the `AddAdapterWizard`
false-success bug, ADR-024) revealed that adapter contracts must be checked systematically — these
adapters can command real hardware.

## Base-class guarantees (apply to **all** adapters)

`BaseAdapter` centralizes most safety behavior, so per-adapter risk is mostly about the small
adapter-specific `_connect()` / `_disconnect()` / `_sendCommand()` overrides:

| Property | Where enforced | Test |
|---|---|---|
| **Non-throwing `connect()`** — `_connect()` throw → `error` status + circuit-breaker failure, no reject (ADR-024) | `BaseAdapter.connect()` (`BaseAdapter.ts:207-224`) | `add-adapter-wizard.test.tsx`, `circuit-breaker.test.ts` |
| **Reconnect guarded after destroy** — `destroyed` flag short-circuits `scheduleReconnect()` and the `online` listener | `BaseAdapter.ts:158-166, 384` | `circuit-breaker.test.ts` |
| **Command pipeline** — Zod validate → circuit-breaker → danger double-confirm → online check → execute + IndexedDB audit | `BaseAdapter.sendCommand()` (`BaseAdapter.ts:267-345`) | `command-safety.test.ts` |
| **Read-only mode (SAF-05)** — global block of all control commands | `command-safety.ts` (web) + `energy.ws.ts` / `read-only-mode.ts` (api) — **not** in `BaseAdapter.sendCommand` | `adapter-mode.test.ts`, `command-safety.test.ts`, api `energy-ws.test.ts` |
| **Outgoing WS sanitization** — role/mock filtering + no secret leakage on the browser boundary | `sanitizeOutgoingWsPayload` in `apps/api/src/ws/energy.ws.ts` (API boundary; frontend adapters are inbound consumers) | api `energy-ws.test.ts` |

## Legend
🟢 verified (adapter-specific test or firm base guarantee) · 🟡 relies on base guarantee, **no adapter-specific test** or a tracked minor gap · 🔴 defect (none found — a real defect would STOP the pass)

## Matrix (adapter × 5 checks)

| Adapter | 1. connect throws→records | 2. disconnect/destroy idempotent + cleanup | 3. command safety (RO + scope + §14a) | 4. breaker + reconnect no hot-loop | 5. output / log hygiene | Linked test |
|---|:--:|:--:|:--:|:--:|:--:|---|
| VictronMQTTAdapter | 🟢 | 🟢 clears poll interval | 🟢 | 🟢 | 🟢 | `adapters.test.ts` |
| ModbusSunSpecAdapter | 🟢 | 🟢 clears `pollTimer` | 🟢 | 🟢 | 🟢 | `modbus-sunspec-adapter.test.ts` |
| KNXAdapter | 🟢 | 🟢 closes `ws` | 🟢 | 🟢 | 🟢 | `KNXAdapter.test.ts` |
| OCPP21Adapter | 🟢 | 🟢 clears timers + `ws` | 🟢 **§14a W-unit fix (#211)** | 🟢 | 🟢 | `OCPP21Adapter.test.ts`, `ocpp-security.test.ts` |
| OpenEMSAdapter | 🟡 no dedicated test | 🟢 clears timers + `ws` | 🟢 | 🟢 | 🟢 | — (**gap → registry**) |
| EEBUSAdapter | 🟢 | 🟢 `destroy()` override + timers | 🟢 mTLS/trust-store | 🟢 | 🟢 cert redaction | `eebus-adapter-security.test.ts`, `eebus-security.test.ts` |
| EvccAdapter | 🟢 connect-failure test | 🟢 clears `pollTimer` + `ws` | 🟢 | 🟢 | 🟢 | `evcc-adapter.test.ts` |
| MatterThreadAdapter | 🟢 | 🟢 clears timers + `ws` | 🟢 | 🟢 | 🟢 | `matter-thread-adapter.test.ts` |
| Zigbee2MQTTAdapter | 🟢 | 🟢 clears timers + `ws` | 🟢 | 🟢 | 🟢 | `zigbee2mqtt-adapter.test.ts` |
| HomeAssistantMQTTAdapter | 🟢 auth-required reject test | 🟢 clears timers + `ws` | 🟢 dual transport | 🟢 | 🟡 ha-ws-api mode under-tested (P1) | `homeassistant-mqtt-adapter.test.ts` |
| ShellyRESTAdapter | 🟢 | 🟢 clears `pollTimer` | 🟢 Gen1/Gen3 | 🟢 | 🟢 | `shelly-rest-adapter.test.ts` |
| ExecAdapter (contrib) | 🟡 no web test | 🟢 clears `pollTimer` | 🟢 read-only honored | 🟢 | 🟢 | — (**gap → P1 / registry**) |
| ExampleContribAdapter | 🟡 template, no test | 🟢 clears poll interval | 🟢 | 🟢 | 🟢 | — (template; low priority) |
| OpenADR31Adapter | 🟢 token-refresh-fail test | 🟢 clears timers + `pollTimer` | 🟢 VEN client | 🟢 | 🟢 | `openadr-adapter.test.ts` |

## Findings / tracked gaps

No 🔴 defects found beyond the already-fixed wizard false-success (ADR-024, this pass). Open 🟡 gaps are
**missing adapter-specific tests**, not known misbehavior — the base-class guarantees still cover them:

- **G-1 — OpenEMSAdapter has no dedicated connect-failure test.** JSON-RPC-over-WS `_connect()` relies on the
  base non-throwing conversion; add an `openems-adapter.test.ts` negative-path case. → Technical-Debt-Registry.
- **G-2 — ExecAdapter has no web-side test.** Also tracked by P1 coverage (`exec-adapter.test.ts`). Read-only
  enforcement is present (`exec-adapter.ts` references `isReadOnly`) but unverified by test. → P1 + registry.
- **G-3 — HA `ha-ws-api` transport under-tested.** Tracked by P1 (`homeassistant-ha-ws-api.test.ts`).
- **G-4 — ExampleContribAdapter** is a template; a smoke test is nice-to-have, low priority.

## Method note
This is a **static audit**: cell verdicts come from reading each adapter's `_connect`/`_disconnect`/`destroy`
overrides plus the base guarantees, and from the presence of an adapter-specific negative-path test. Cells
marked 🟢 without a per-adapter test inherit a firm base-class guarantee (e.g. reconnect-after-destroy). A
future pass should convert G-1…G-4 to per-adapter tests and re-mark those cells with a direct link.
