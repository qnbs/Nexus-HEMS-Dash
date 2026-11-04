# Adapters bundle budget (#405)

**Core limit:** 88 kB gzip — `dist/assets/adapters-core-*.js` (tightened after lazy splits; measured ~**84.8 kB** gzip 2026-11-04).  
**Lazy chunks:** OCPP ~3.8 kB, evcc ~2.0 kB, OpenEMS ~3.5 kB gzip (separate size-limit entries).

## Measured (local, same flags as CI)

```bash
VITE_BACKEND_WS=true pnpm --filter @nexus-hems/web build
pnpm --filter @nexus-hems/web size
```

| Chunk | Gzip (2026-11-04 post-#420) | Notes |
| --- | --- | --- |
| `adapters-core-*` | ~84.8 kB | Victron, Modbus, KNX, EEBUS, registry |
| `adapters-ocpp-*` | ~3.8 kB | Lazy OCPP |
| `adapters-evcc-*` | ~2.0 kB | Lazy evcc |
| `adapters-openems-*` | ~3.5 kB | Lazy OpenEMS |
| `contrib-adapters-*` | ~58.7 kB | Six shipped contrib adapters |

## Vite `manualChunks`

Contrib sources under `core/adapters/contrib/` → `contrib-adapters` chunk. Core four adapters + registry → `adapters-core`. OCPP, evcc, and OpenEMS register via `createLazyEnergyAdapter()` with dynamic imports.

## Remediation backlog (no core limit bump without ADR)

1. Trim duplicate protocol helpers shared with `adapter-worker.ts` (single code path).
2. Bundle analyzer: `pnpm build:analyze` → `apps/web/dist/bundle-stats.html`.
3. Revisit **85 kB** roadmap target if core grows again (current ~84.8 kB gzip headroom ~3 kB under 88 kB cap).

**Do not** raise the core ceiling without a linked issue, measured delta, and lazy-load plan.
