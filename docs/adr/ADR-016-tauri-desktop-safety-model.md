# ADR-016: Tauri desktop safety & security model (thin-wrapper)

- **Status:** Accepted
- **Date:** 2026-06-30
- **Deciders:** Maintainer
- **Related:** ADR-015 (release automation), `docs/Safety-Certification-Notice.md`, SAF-05 (READ_ONLY_MODE)

## Context

Nexus-HEMS-Dash ships a Tauri v2 desktop shell (`apps/web/src-tauri/`) alongside the
web and Capacitor targets. Because the application controls safety-critical electrical
hardware, the desktop distribution must offer **exactly the same safety guarantees** as
the web app, with no additional native attack surface. This ADR records the audited
desktop security posture so future changes don't silently weaken it.

## Decision

The desktop app is a **thin wrapper** around the Vite SPA. We deliberately keep it
free of a native command surface and enforce all safety at the web/API layers:

1. **No custom Tauri commands.** `src-tauri/src/lib.rs` only registers plugins;
   `main.rs` is a launcher. There are **zero `#[tauri::command]`** functions, so the
   WebView cannot invoke privileged native code. The frontend contains no
   `@tauri-apps/api` imports and no `invoke(...)` calls (verified by grep).
2. **Hardware control routes through the web/API pipeline only.** Every command goes
   `command-safety.ts` → backend WebSocket (`energy.ws.ts`). `READ_ONLY_MODE` is
   enforced at the web layer (`command-safety.ts`, `isReadOnlyModeActive()`) **and**
   independently at the API layer (`apps/api/src/config/read-only-mode.ts`). The Tauri
   layer is **not** in the command path and therefore cannot bypass it.
3. **Strict CSP.** `tauri.conf.json` defines `app.security.csp` restricting
   `script-src 'self'`, `connect-src` to `self` + the known tariff/AI hosts + `wss:`,
   `img-src 'self' data: blob:`. `style-src` retains `'unsafe-inline'` because Tailwind
   v4 injects runtime styles; this is an **accepted** residual (no script execution
   risk) and revisited if a nonce/hash pipeline becomes practical.
4. **No capabilities/allowlist needed.** With no custom commands, there is no
   capability scope to define; the Tauri v1 `allowlist` pattern is not used. If custom
   commands are ever introduced, narrow per-window capability files under
   `src-tauri/capabilities/` become mandatory.
5. **Minimal plugins, least privilege.** Enabled: `shell` (`open: true` only — no
   sidecar/execute), `notification` (lazy-imported in `lib/notifications.ts`, gated by
   `isTauri()`), `haptics` and `barcode-scanner` (mobile). All are read-only w.r.t.
   hardware control.
6. **Auto-updater stays disabled** (CRIT-02). Re-enabling requires a dedicated, audited,
   code-signed update channel; until then users update by downloading a fresh signed
   release.

## Mandatory rule for future changes

Any future `#[tauri::command]` that can affect hardware or system state **must**:
(a) check `READ_ONLY_MODE` first and short-circuit, (b) validate all inputs, (c) write
to the command audit trail, and (d) be exposed via a narrow capability file. Mirror the
logic in `apps/web/src/core/command-safety.ts`. Adding such a command without these is a
safety regression.

## Consequences

- The desktop build adds **no command attack surface** and inherits the web/API safety
  guarantees unchanged — the audited posture is "hardened" with no code changes required.
- `Safety-Certification-Notice.md` should cross-reference this ADR for the desktop enforcement story.
- The remaining desktop follow-ups are operational, not safety-blocking: review CSP
  `style-src` over time, audit `shell.open` call sites, and re-enable signed updates only
  with proper signing infrastructure.
