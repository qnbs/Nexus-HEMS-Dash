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
| `moderate` | User toast optional |
| `danger` | Route through `useSafeCommand` (Phase 2+) |
| `admin` | Requires `authScope: 'admin'` |

Set `blockedInReadOnly: true` for hardware control commands.

## Architecture

See `docs/adr/ADR-028-command-palette-registry.md`.
