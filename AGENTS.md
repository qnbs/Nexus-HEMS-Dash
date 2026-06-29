# AGENTS.md

General development guidance for this repository lives in `CLAUDE.md` (commands,
architecture, toolchain rules, constraints). Read it first. This file only adds
context specific to running the project inside a Cursor Cloud agent VM.

## Cursor Cloud specific instructions

### Services & how to run them

This is a pnpm + Turborepo monorepo. `pnpm dev` (from the repo root) starts both
dev services concurrently via Turbo:

| Service | Package | Port | Notes |
|---|---|---|---|
| API (Express 5 + WebSocket) | `@nexus-hems/api` | 3000 | `tsx --watch index.ts`; `/api/health` is unauthenticated |
| Web (React 19 + Vite) | `@nexus-hems/web` | 5173 | Vite dev server; proxies `/api/*`, `/metrics`, `/ws` → API on 3000 |

Standard commands (lint/test/build/typecheck) are documented in `CLAUDE.md` and
`package.json` scripts — use those rather than duplicating here. The local-hardware
"run one heavy check at a time" policy in `CLAUDE.md` is for the maintainer's
low-RAM workstation; in the cloud VM it is fine to run `pnpm type-check`,
`pnpm lint`, and `pnpm test:run` normally (the full unit suite runs in ~20s).

### Non-obvious startup caveats

- **Node version:** the project requires Node 24 (`.nvmrc` = 24, `engine-strict`
  is on in `.npmrc`). The VM ships nvm with Node 24 as the default; a one-off
  `~/.bashrc` edit prepends the nvm Node 24 bin ahead of `/exec-daemon/node`
  (which is an older v22 that would fail the engine check). If `node --version`
  ever reports < 24, run `nvm use 24` before pnpm commands.
- **No `.env` needed for dev.** All env vars are optional in dev mode. The API
  auto-generates a JWT secret per run and allows anonymous access. Adapters
  default to mock mode, so the dashboard shows simulated live energy data with no
  real hardware. Only set `ADAPTER_MODE=live` against real hardware (see
  `docs/Safety-Certification-Notice.md`).
- **Harmless API startup noise:** on boot the API logs several
  `ValidationError: ... ERR_ERL_KEY_GEN_IPV6` stack traces from
  `express-rate-limit` and repeated `[ModbusAdapter:...] Connected to 192.168.x.x`
  lines. These are non-fatal — the server still logs `{"msg":"Server running","port":3000}`
  and `/api/health` returns `{"status":"ok",...}`. Do not treat them as failures.
- **Verifying it's up:** `curl http://localhost:3000/api/health` (direct) and
  `curl http://localhost:5173/api/health` (through the Vite proxy) should both
  return the health JSON with connected mock adapters.
