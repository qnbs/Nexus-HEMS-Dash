# Adapters bundle budget (#405)

**Current enforced limit:** 92 kB gzip (`apps/web/package.json` size-limit).  
**Observed CI baseline:** ~90.8 kB with `VITE_BACKEND_WS=true` (see #404 / debt registry).

## Measure locally (same toolchain as CI)

```bash
VITE_BACKEND_WS=true pnpm --filter @nexus-hems/web build
pnpm size
```

Inspect chunk: `apps/web/dist/assets/adapters-*.js` (gzip via size-limit).

## Remediation backlog (no limit bump without evidence)

1. Lazy-load rarely used contrib adapters from Settings/plugins path only.
2. Trim duplicate protocol helpers shared with adapter-worker (single code path).
3. Re-run bundle analyzer: `pnpm build:analyze` → `apps/web/dist/bundle-stats.html`.

**Do not** raise the 92 kB ceiling again without a linked issue, measured delta, and lazy-load plan.
