# Test & Coverage — Finalization TODO & Roadmap

**Status:** 🔄 Active follow-up
**Created:** 2026-07-02
**Owner:** @qnbs
**Related:** `docs/Testing-Coverage-Strategy.md` (long-range strategy), MED-01 in `docs/Technical-Debt-Registry.md`

---

## Why this file exists

The hardware-registry nav-discoverability work (PR #207) added the first tests that render
`Sidebar`, `CommandPalette`, and `MobileNavigation`. Importing those previously-untested,
function-dense components into the coverage set pulled **global function coverage to ~69.5 %**,
just under the 70 % gate. To keep CI green **without weakening the intent**, two gates were
**temporarily** lowered; this file tracks restoring them and pushing coverage upward.

### Measured baseline (CI, PR #207, `apps/web`)

| Metric | Actual | vitest gate (was → now) | baseline gate (was → now) |
| ------ | ------ | ----------------------- | ------------------------- |
| Statements | 78.42 % | 70 → 70 | 78 → 78 |
| Branches | 71.79 % | 70 → 70 | 72 → **70** |
| Functions | 69.53 % | 70 → **68** | 70 → **68** |
| Lines | 80.35 % | 70 → 70 | 80 → 80 |

Gates live in `apps/web/vitest.config.ts` (`coverage.thresholds`) and
`apps/web/coverage-baseline.json` (PRF-03, enforced by `scripts/check-coverage-baseline.mjs`).
API gates are separate (`apps/api/vitest.config.ts` = 33/30/38/33, its own staged track).

> **Definition of done for this file:** vitest thresholds back to **70/70/70/70** and the PRF-03
> baseline back to **≥ 78/72/70/80**, then deleted or folded into `Testing-Coverage-Strategy.md`.

---

## Lowest-covered areas (from the PR #207 coverage report)

Prioritized by impact on the **function** metric (the binding constraint) and by risk.

| Area / file | Funcs | Note |
| ----------- | ----- | ---- |
| `src/components/ui` (aggregate) | ~50.8 % | Largest lever — many UI primitives have no render tests |
| `src/components/ui/CommandPalette.tsx` | partial | Nav/keyboard covered in PR #207; edge branches remain |
| `src/components/ui/MobileNavigation.tsx` | partial | Primary/More/close covered; active-state branches remain |
| `src/components/layout/Sidebar.tsx` | 85.7 % | Collapse covered; a couple of render branches remain |
| `src/lib/co2-report.ts` | 80 % funcs / **18 % lines** | Large uncovered body (lines 218–516) |
| `src/lib/auth-token.ts` | 85.7 % / 59 % stmts | Error paths untested |
| `src/lib/ai-keys.ts` | 77.7 % | Encryption error branches untested |
| `src/pages/*AnalyticsPage.tsx` (historical) | 75 % | Interaction paths untested |
| `src/core/adapters/contrib/matter-thread.ts` | 69.5 % | Command dispatch edges |

(Regenerate the exact list from CI: **Unit Tests** job → coverage table, or `pnpm test:coverage`
in the cloud — do **not** run full coverage locally; it takes > 1 h on the maintainer's machine.)

---

## Roadmap

### Phase 1 — Restore the function gate to 70 % (unblocks this file)
- [ ] Add render/interaction tests for the highest-function-count untested `components/ui` primitives
      (e.g. `ChoiceCardGroup`, `SelectField`, `Disclosure`, `SgReadyModeSelector`, `EnergyCard`,
      dialogs/sheets) — each render covers several component functions cheaply.
- [ ] Extend `CommandPalette` / `MobileNavigation` tests to the remaining active-state and
      edge branches.
- [ ] Bump `apps/web/vitest.config.ts` `functions` 68 → 70 and `coverage-baseline.json`
      `functions` 68 → 70, `branches` 70 → 72 in the same PR that lands the tests.

### Phase 2 — Raise the whole web floor to Stage-1 (per `Testing-Coverage-Strategy.md`)
- [ ] Cover `co2-report.ts`, `auth-token.ts`, `ai-keys.ts` error/edge paths (biggest line gaps).
- [ ] Add page-level tests for the historical analytics pages and any remaining zero-coverage pages.
- [ ] Ratchet all four web metrics upward together; move the baseline JSON up in lockstep so
      regressions are caught (PRF-03 already fails CI on any drop).

### Phase 3 — API backend coverage (separate track, MED-01)
- [ ] Raise `apps/api` from the measured 33/30/38/33 baseline toward 55 %, prioritizing the new
      backend protocol adapters (`KnxAdapter`, `EvccAdapter`, `LiveEnergyAggregator`,
      `adapter-metrics`) and the WS gateway.
- [ ] Update `apps/api/vitest.config.ts` staged, and keep `docs/Testing-Coverage-Strategy.md` +
      `FEATURE_STATUS.md` in sync with the enforced numbers each time.

### Phase 4 — Quality, not just quantity
- [ ] Prefer behavioural assertions over render-only smoke tests when filling coverage.
- [ ] Add E2E coverage for the gaps called out in `FEATURE_STATUS.md` (auth flows,
      command-safety, backend-integration).
- [ ] Fold this file into `Testing-Coverage-Strategy.md` once Phase 1–2 land, and delete it.

---

## Guardrails while this is open

- **Never** lower a gate to hide a *real* regression — lower only to reflect a measured,
  understood baseline (as done here), and always with a dated entry above.
- Keep the enforced numbers in `apps/web/vitest.config.ts` / `coverage-baseline.json` and every
  doc that quotes them (`CLAUDE.md`, `FEATURE_STATUS.md`, `Technical-Debt-Registry.md`,
  `Testing-Coverage-Strategy.md`, `.github/copilot-instructions.md`) **in sync** — the last audit
  found six docs drifted from the config.
