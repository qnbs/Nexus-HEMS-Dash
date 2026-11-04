# Adapters bundle budget (#405)

**Core limit:** 92 kB gzip — `dist/assets/adapters-*.js` (`apps/web/package.json` size-limit).  
**Contrib limit:** 155 kB gzip — `dist/assets/contrib-adapters-*.js` (split 2026-11-04; lazy-loaded contrib plugins).

## Measured (local, same flags as CI)

```bash
VITE_BACKEND_WS=true pnpm --filter @nexus-hems/web build
pnpm --filter @nexus-hems/web size
```

| Chunk | Gzip (2026-11-04) | Notes |
| --- | --- | --- |
| `adapters-*` | ~90.5 kB | CI logged 91.53 kB before contrib split |
| `contrib-adapters-*` | ~58.1 kB | Six shipped contrib adapters + shared deps |

## Vite `manualChunks`

Contrib sources under `core/adapters/contrib/` → `contrib-adapters` chunk. Core seven adapters + registry + Evcc/OpenEMS → `adapters` chunk.

## Remediation backlog (no core limit bump without ADR)

1. Dynamic-import OCPP registration in `adapter-registry.ts` so OCPP can leave the core chunk.
2. Trim duplicate protocol helpers shared with `adapter-worker.ts` (single code path).
3. Bundle analyzer: `pnpm build:analyze` → `apps/web/dist/bundle-stats.html`.

**Do not** raise the 92 kB core ceiling without a linked issue, measured delta, and lazy-load plan.
