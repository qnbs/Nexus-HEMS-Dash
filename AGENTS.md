# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Nexus-HEMS Dashboard is a pnpm monorepo (Turborepo) with 3 workspace packages:
- `apps/api` — Express 5 backend (port 3000)
- `apps/web` — React 19 Vite SPA (port 5173)
- `packages/shared-types` — Shared Zod schemas + TS types

### Environment requirements

- **Node.js 24** (per `.nvmrc`). Use nvm: `source /home/ubuntu/.nvm/nvm.sh && nvm use 24`
- **pnpm 10.33.0** via Corepack: `corepack enable && corepack prepare pnpm@10.33.0 --activate`
- No external services (databases, Docker, etc.) are needed for development — the API runs in `ADAPTER_MODE=mock` by default.

### Running services

Start both API + Web dev servers together:
```bash
pnpm dev
```
- API: http://localhost:3000 (health check: GET `/api/health`)
- Web: http://localhost:5173 (proxies `/api/*`, `/metrics`, `/ws` to the API)

### Key commands

See `CLAUDE.md` for full command reference. Quick summary:
- `pnpm type-check` — TypeScript strict checking across all workspaces
- `pnpm lint` — Biome + ESLint (read-only)
- `pnpm test:run` — All Vitest unit tests (one-shot)
- `pnpm test:e2e` — Playwright E2E (Chromium-only locally)
- `pnpm build` — Production builds for all packages
- `pnpm verify:basis` — Full local gate: type-check → lint → test:run

### Non-obvious caveats

1. **nvm path**: nvm is installed at `/home/ubuntu/.nvm/nvm.sh` (not `/root/.nvm`). Always source it before running node/pnpm in new shell sessions.
2. **Playwright E2E**: Requires `npx playwright install --with-deps chromium` before first run. E2E tests require a production build + preview server (port 4173), not the dev server. The `test:e2e` script handles this via the Playwright config's `webServer` setting.
3. **No secrets needed for dev**: All adapters run in mock mode. No JWT_SECRET, API_KEYS, or external credentials are required for local development.
4. **Turbo caching**: First runs are slow (cache miss); subsequent runs are near-instant from cache. Run `turbo clean` if you suspect stale cache issues.
5. **Build order**: `shared-types` must build before `api` and `web` can type-check. Turborepo handles this automatically via the `dependsOn` pipeline in `turbo.json`.
6. **Biome is primary**: Biome 2.4.7 is the primary linter/formatter. ESLint is only retained for React-specific plugins (react-compiler, react-hooks, react-refresh).
