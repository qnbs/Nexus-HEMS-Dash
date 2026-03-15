# Contrib Adapters — Nexus HEMS Plugin System

Community and third-party protocol adapters live here.
Each file is auto-discovered at runtime via Vite `import.meta.glob`.

## Quick Start

1. **Copy the template:**

   ```bash
   cp example-contrib.ts my-device.ts
   ```

2. **Implement your adapter** extending `BaseAdapter`:
   - `_connect()` — establish connection (WebSocket, REST, MQTT, …)
   - `_disconnect()` — graceful close
   - `_sendCommand(command)` — dispatch commands to hardware
   - `getSnapshot()` — return current data snapshot

3. **Register it** — choose one of these patterns:

   ```typescript
   // Option A: register() function (recommended)
   export function register(): void {
     registerAdapter('my-device', (config) => new MyDeviceAdapter(config), {
       displayName: 'My Device',
       source: 'contrib',
     });
   }

   // Option B: named exports (auto-registered)
   export const id = 'my-device';
   export const factory = (config) => new MyDeviceAdapter(config);

   // Option C: default export
   export default { id: 'my-device', factory: (config) => new MyDeviceAdapter(config) };
   ```

4. **Done!** The adapter is automatically discovered and available in Settings.

## npm Package Format

Publish your adapter as an npm package:

```json
{
  "name": "@yourorg/nexus-adapter-my-device",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "peerDependencies": {
    "@nexus-hems/adapter-registry": "^1.0.0"
  }
}
```

Your package entry point:

```typescript
import { registerAdapter } from '@nexus-hems/adapter-registry';
import { MyDeviceAdapter } from './my-device-adapter';

registerAdapter('my-device', (config) => new MyDeviceAdapter(config), {
  displayName: 'My Device',
  description: 'Custom integration for My Device',
  source: 'npm',
});
```

## Built-in Safety Features (inherited from BaseAdapter)

Every contrib adapter automatically gets:

- **Circuit Breaker** — stops retrying after repeated failures
- **Zod Command Validation** — all commands validated before dispatch
- **Double-Confirm** — user confirmation for danger commands
- **Audit Trail** — all commands logged to IndexedDB + Prometheus
- **Reconnect Logic** — exponential backoff with jitter
- **Performance Metrics** — latency, error-rate, data-freshness tracking

## Naming Convention

- File name: `kebab-case.ts` (e.g. `shelly-pro.ts`)
- Adapter ID: same as file name (e.g. `shelly-pro`)
- Pattern: `/^[a-z][a-z0-9-]*$/`
