# ADR-028: Command Palette Registry & Extensibility

- **Status:** Accepted (Phase 0+1 shipped; Phase 2 shipped; Phase 3 in progress)
- **Date:** 2026-07-04
- **Deciders:** Maintainer
- **Related:** ADR-002 (Zustand dual-store), ADR-019 (adapter registry), `apps/web/src/core/command-safety.ts`, `docs/UI-UX-Audit-2026.md` (C1)

## Context

The Command Palette (`CommandPalette.tsx`) was a monolithic component with 15 hardcoded
commands, substring search, no adapter extensibility, and DOM-coupled actions (`#ai-optimizer`,
`[data-export-report]`). It did not integrate with `command-safety.ts`, Read-Only Mode, or
`useEnergyStore`. The UI-UX audit (C1) flagged insufficient coverage for 13 adapters and
power-user workflows.

## Decision

1. **Introduce a Command Registry** mirroring `adapter-registry.ts`: static registration,
   provider pattern for dynamic commands, versioned `CommandDefinition` schema.
2. **Split UI from logic**: `apps/web/src/core/commands/` (registry, search, context,
   executor) + `apps/web/src/components/command-palette/` (presentation).
3. **Safety-first execution**: hardware-risk commands route through `useSafeCommand` (Phase 2+);
   Read-Only Mode and scope gates applied at resolve/execute time.
4. **Search**: lightweight custom scorer (no `cmdk` / `fuse.js`) to protect bundle budget;
   `@tanstack/react-virtual` for list virtualization (already a dependency).
5. **Persist recency/favorites** in `useAppStore` (`commandPalette` slice).
6. **Honor `settings.keyboardShortcuts`** for global shortcut registration.

## Consequences

- **Positive:** Extensible commands from adapters/plugins; faster search; WCAG touch-target fix;
  deep-link navigation; foundation for AI suggestions (Phase 4).
- **Negative:** More files and indirection; providers must unregister on adapter unload.
- **Migration:** `ui/CommandPalette.tsx` re-exports from `command-palette/` for one release.

## Non-Goals (this ADR)

- Natural-language / voice input (Phase 4+)
- Full adapter-generated hardware command surface (Phase 2–3)
