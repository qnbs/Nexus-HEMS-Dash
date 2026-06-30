# WIP Carry-over TODO — `wip/unrelated-wip-stash`

> **Status:** Open · **Created:** 2026-07-01 · **Owner:** maintainer
> **Purpose:** Capture the changes that lived only on the `wip/unrelated-wip-stash`
> preservation branch and are **not yet adopted into the app/`main`**, so they can be
> caught up deliberately. Once the two "ADOPT" items below land (or are explicitly
> declined), the branch carries no unique value and can be deleted.

## How this list was derived

`wip/unrelated-wip-stash` (commits `7fe2bd5` "ci: phase 0/1 devops transfer" and
`30aff49` "wip: preserved unrelated WIP from stash") branches from an **old base**
(`3a26623`, ~2026-06-29). Because of that stale base, a raw `git diff main..wip`
shows ~9,200 deletions — but those are **not real deletions**: they are files `main`
gained *after* the branch point (ADR-015/016, `Perfection-Roadmap.md`, the
`docs/runbooks/*`, `Supply-Chain-Grype-Policy.md`, `Graphify-Integration-Guide.md`,
the v1.3.0 release/version bumps, dependency upgrades, etc.). **None of those must be
re-deleted.**

Filtering to content that is genuinely *novel on wip and absent from `main`* leaves
only what is catalogued below.

---

## ✅ ADOPT — genuinely novel, not yet in the app

### 1. Production-build smoke test  *(recommended — safe, high value)*

A lightweight post-build sanity check: start `vite preview` against the built
`dist/`, load it in headless Chromium, and fail if React does not mount (`#root`
empty) or any uncaught runtime/console error occurs. Catches "build succeeds but app
white-screens in production" — a class of failure the unit suite cannot see.

Files / wiring on wip:
- `apps/web/scripts/smoke-prod-build.mjs` — the script (Playwright `chromium`, `vite
  preview --strictPort` on port 4174, base `/Nexus-HEMS-Dash/`, networkidle + mount
  assertion; optional static fallback server for agents without the vite CLI).
- `apps/web/package.json` → add script `"smoke:prod": "node scripts/smoke-prod-build.mjs"`.
- `.github/workflows/ci.yml` → step **"Smoke-test production build (mounts, no
  runtime crash)"** running `pnpm --filter @nexus-hems/web smoke:prod` after the web
  build job (with `VITE_E2E_TESTING=true` to match CI conditions).

Adoption notes:
- `main` has **no** equivalent prod-build smoke gate today (verified — only the word
  "smoke" appears in `Skeleton.tsx`/copilot docs).
- Take the script **as-is**; do **not** import any other change from wip's
  `package.json` diff — those are dependency *down*grades from the stale base
  (Capacitor 8→7, Sentry 10→9, lucide 1.22→0.546, vite 8.0.16→8.0.11, version
  1.3.0→1.2.0) and must be ignored.
- Delivery: small PR, port-isolate from the existing E2E (4174 ≠ 4173), CI-first.

### 2. `shared-types` compiled build output  *(optional — evaluate, do not rush)*

wip switches `@nexus-hems/shared-types` from being consumed as raw TS source to a
compiled `dist/`:
- `packages/shared-types/tsconfig.build.json` — emits `dist/` with `declaration` +
  `declarationMap` + `sourceMap`, `rootDir: src`, excludes `*.test.ts`.
- `packages/shared-types/package.json` — `build` → `tsc -p tsconfig.build.json`,
  `exports` point at `./dist/index.js` + `./dist/index.d.ts`, adds `"files": ["dist"]`.

Adoption notes:
- Real build hygiene (publishable shape, declaration maps) **but** it changes
  workspace consumption from source → compiled output, which can break Vite/`tsx`
  dev resolution and Turborepo build ordering if `dist/` is stale or the build task
  isn't wired as an upstream dependency. **Validate carefully** (dev server, type-check,
  `pnpm build` ordering in `turbo.json`) before adopting; this is **not** a drop-in.
- Lower priority than #1. Only pursue if we actually need a publishable/declaration
  artifact; otherwise the current source-consumption model is simpler and fine.

---

## ⛔ DO NOT ADOPT — already in `main`, or stale/regressive on wip

These appear in the wip diff but must **not** be carried over:

- **Already landed in `main`** via this session's merged PRs (verified identical or
  superseded): `apps/api/src/config/trust-proxy.ts`, `apps/api/src/routes/health.routes.ts`,
  `.github/actions/setup-node-pnpm/action.yml`, `apps/web/src/tests/command-safety.test.ts`,
  `apps/api/src/tests/health.routes.test.ts`, the CI v2 / coverage-ratchet work.
- **Stale safety regression — keep `main`:** `apps/api/src/protocols/index.ts` on wip
  removes the `isLiveHardwareAllowed` / `getEffectiveAdapterMode` /
  `logAdapterModeStartup` guards and defaults `ADAPTER_MODE` to **`live`**. `main`'s
  version (mock-default + `ALLOW_LIVE_HARDWARE` double-opt-in) is correct and must
  stand. Do not import wip's version.
- **Stale — keep `main`:** `apps/api/src/ws/energy.ws.ts` (wip predates main's
  `READ_ONLY_MODE` WS enforcement), `health.routes.ts` trivia, and all
  `package.json` / `pnpm-lock.yaml` dependency *down*grades from the old base.
- **Phantom deletions:** every `docs/**` / `helm/**` "removal" in `main..wip` is just
  the stale base lacking files `main` added later. Ignore entirely.

---

## Closing the branch

After item #1 is merged (and #2 is adopted or explicitly declined), `wip/unrelated-wip-stash`
holds nothing unique. Delete it locally and on the remote:

```bash
git branch -D wip/unrelated-wip-stash
git push origin --delete wip/unrelated-wip-stash
```
