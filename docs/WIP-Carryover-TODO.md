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

### 2. `shared-types` compiled build output  *(DECLINED — 2026-07-01)*

wip switched `@nexus-hems/shared-types` from being consumed as raw TS source to a
compiled `dist/` (`tsconfig.build.json` emitting declarations + maps; `exports`
pointing at `./dist/index.js` + `./dist/index.d.ts`; `"files": ["dist"]`).

**Decision: declined.** `@nexus-hems/shared-types` is `private: true` + consumed via
`workspace:*` and is **never published to npm**, so nothing needs compiled output or
emitted `.d.ts` files. Both consumers read the TS source fine today — web via Vite,
api via `tsx`/Node — and each workspace type-checks against the strict root config.
Switching to `dist/` consumption would add a Turborepo build-ordering dependency
(shared-types must build before every web/api type-check + build), introduce
stale-`dist` failure modes, and break HMR on shared-types edits — real cost for zero
benefit on an internal-only package. The current source-consumption model stays.

For the record (so the now-deleted branch loses nothing), the exact file wip added:

```jsonc
// packages/shared-types/tsconfig.build.json (NOT adopted)
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "src/**/*.test.ts"]
}
```

…plus `package.json` changes: `"files": ["dist"]`, `build` → `tsc -p
tsconfig.build.json`, and `exports."."` repointed from `./src/index.ts` to
`./dist/index.js` / `./dist/index.d.ts`. If a future need to publish shared-types
arises, revisit this with the build-ordering wiring in `turbo.json`.

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

## Closing the branch — DONE (2026-07-01)

Item 1 (production smoke test) merged to `main` via PR 160; item 2 declined above
with its exact content preserved here. `wip/unrelated-wip-stash` (a **local-only**
branch, never pushed) therefore holds nothing unique and was deleted:

```bash
git branch -D wip/unrelated-wip-stash   # local-only; no remote ref existed
```

This file is the permanent record of what that branch contained and why each part
was adopted or declined.
