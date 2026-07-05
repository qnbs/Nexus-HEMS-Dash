# Command Palette — Developer Guide

Register commands via the **Command Registry** (`apps/web/src/core/commands/`).

## Quick start

```typescript
import { registerCommand } from '@/core/commands';

registerCommand({
  id: 'my-feature.action',
  labelKey: 'myFeature.action',
  category: 'action',
  risk: 'safe',
  source: 'core',
  keywords: ['example'],
  execute: (ctx) => {
    ctx.navigate('/my-route');
    ctx.actions.closePalette();
  },
});
```

Add `labelKey` to **both** `apps/web/src/locales/en.ts` and `de.ts`.

## Dynamic commands (adapters)

```typescript
import { registerCommandProvider, unregisterCommandProvider } from '@/core/commands';

registerCommandProvider({
  id: 'my-adapter',
  priority: 100,
  getCommands: (ctx) => [
    /* CommandDefinition[] */
  ],
});

// on adapter stop:
unregisterCommandProvider('my-adapter');
```

## Safety

| `risk` | Behavior |
|--------|----------|
| `safe` | Execute immediately |
| `moderate` | Route through `useSafeCommand` when `hardwareCommand` is set |
| `danger` | Route through `useSafeCommand` via `hardwareCommand` |
| `admin` | Requires `authScope: 'admin'` + hardware bridge when applicable |

Set `blockedInReadOnly: true` for hardware control commands.

### Hardware commands (Phase 2+)

```typescript
registerCommand({
  id: 'device.stopEvCharging',
  labelKey: 'command.stopEvCharging',
  category: 'device',
  risk: 'danger',
  blockedInReadOnly: true,
  source: 'core',
  hardwareCommand: { type: 'STOP_CHARGING', value: true },
  execute: (ctx) => ctx.actions.closePalette(),
});
```

Mount the palette via `CommandPaletteWithSafety` in `AppShell` so `executeHardwareCommand`
wires to `useSafeCommand` (confirmation dialog, validation, audit trail).

### Adapter provider

`adapterCommandsProvider` reads `ctx.adapterEntries` and emits per-adapter settings +
reconnect commands. Register additional providers with `registerCommandProvider` and
`unregisterCommandProvider` on adapter unload.

## Architecture

See `docs/adr/ADR-028-command-palette-registry.md`.
