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
`pnpm lint`, and targeted unit tests normally.

### Non-obvious startup caveats

- **Node version:** the project requires Node 24 (`.nvmrc` = 24, `engine-strict`
  is on in `.npmrc`). The VM ships nvm with Node 24 as the default; if
  `node --version` ever reports < 24, run `nvm use 24` before pnpm commands.
- **No `.env` needed for dev.** All env vars are optional in dev mode. The API
  auto-generates a JWT secret per run and allows anonymous access. Adapters default
  to mock mode — the dashboard shows simulated energy data with no real hardware.
  Live hardware requires double opt-in (`ADAPTER_MODE=live` + `ALLOW_LIVE_HARDWARE=true`
  backend; `VITE_ADAPTER_MODE=live` + `VITE_ALLOW_LIVE_HARDWARE=true` frontend build
  plus per-adapter enablement in Settings). See `docs/Safety-Certification-Notice.md`.
- **Harmless API startup noise:** on boot the API may log
  `ValidationError: ... ERR_ERL_KEY_GEN_IPV6` stack traces from
  `express-rate-limit`. These are non-fatal — the server still logs
  `{"msg":"Server running","port":3000}` and `/api/health` returns healthy mock mode.
- **Verifying it's up:** `curl http://localhost:3000/api/health` (direct) and
  `curl http://localhost:5173/api/health` (through the Vite proxy) should return
  JSON like `{"status":"healthy","mode":"mock","adapters":[],...}`.

### PR review automation (CodeRabbit)

- **Cursor Cloud agent tokens cannot post PR comments** (`403 Resource not accessible by
  integration`). Do not rely on `gh pr comment … @coderabbitai review` from agents.
- **On every non-draft PR push**, `.github/workflows/coderabbit-rereview.yml` posts
  `@coderabbitai review` when the head commit has no CodeRabbit review yet (deduped per
  SHA). A second trigger runs after **CI** succeeds.
- **Agents:** push fix commits — the workflow requests re-review automatically.
- **Maintainers:** `./scripts/request-coderabbit-review.sh <pr>` or
  `gh workflow run coderabbit-rereview.yml -f pr_number=<num> -f force=false`.
- Full checklist: `docs/runbooks/pr-review-correction-loop.md`.

### Docs to read for common agent tasks

| Task | Start here |
|------|------------|
| Feature shipped vs planned | `FEATURE_STATUS.md` |
| Known debt / backlog | `docs/Technical-Debt-Registry.md` |
| Full audit + roadmap | `docs/Audit-Report-2026-06-29.md`, `docs/Perfection-Roadmap.md` |
| Adapter development | `docs/Adapter-Dev-Guide.md` |
| Backend protocol adapters | `docs/Protocol-Adapter-Guide-Backend.md` |
| Safety before live hardware | `docs/Safety-Certification-Notice.md` |
| CI / required checks | `.github/CI-AUDIT.md` |
| PR review correction loops | `docs/runbooks/pr-review-correction-loop.md` |
| CI/CD & quality-platform layering | `DEVOPS.md` (DeepSource/Codecov/CodeRabbit/CodeAnt roles, `docs/adr/ADR-027`) |
