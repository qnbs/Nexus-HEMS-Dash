# Test & Coverage — Finalization TODO & Roadmap

**Status:** ✅ Web baseline restored (2026-07-02)
**Owner:** @qnbs
**Related:** `docs/Testing-Coverage-Strategy.md`, MED-01 in `docs/Technical-Debt-Registry.md`

---

## Resolution summary (2026-07-02)

The temporary gate reductions from PRs #207/#208/#209 are **fully reversed** for statements, functions, and lines; branches restored to **72%** stretch target (measured 72.00%, 2026-07-02).

| Metric | Measured (CI) | Enforced floor (vitest + baseline) | Original target |
| ------ | ------------- | -------------------------------- | --------------- |
| Statements | 79.60 % | **78 %** | 78 % |
| Branches | 72.00 % | **72 %** | 72 % (stretch) |
| Functions | 73.46 % | **70 %** | 70 % |
| Lines | 81.58 % | **80 %** | 80 % |

Gates live in `apps/web/vitest.config.ts` and `apps/web/coverage-baseline.json` (PRF-03).

### Tests landed for the restore

- `openems-adapter.test.ts` — connect-failure + JSON-RPC handshake (G-1)
- `exec-adapter.test.ts` — transport/poll negative path (G-2)
- `homeassistant-mqtt-adapter.test.ts` — ha-ws-api auth, discovery, state_changed (G-3)
- `example-contrib-adapter.test.ts` — template smoke (G-4)

---

## Remaining roadmap (folded from former phases)

### Web — branch stretch to 72 %

- [x] Extend nav/UI tests (`CommandPalette`, `MobileNavigation`, `Sidebar`, `Disclosure`, `ChoiceCardGroup`, `ConfirmDialog`, `ErrorBoundary`) for remaining active-state branches.
- [x] Bump `coverage-baseline.json` `branches` 70 → 72 (measured 72.00%, 2026-07-02).

### Web — quality gaps (not blocking gates)

- [ ] Cover `co2-report.ts`, `auth-token.ts`, `ai-keys.ts` error paths (large line gaps).
- [ ] Page-level tests for historical analytics pages.

### API backend coverage (separate track, MED-01)

- [ ] Raise `apps/api` from measured 33/30/38/33 toward 55 %, prioritizing protocol adapters + WS gateway.
- [ ] Update `apps/api/vitest.config.ts` staged, sync `docs/Testing-Coverage-Strategy.md`.

### E2E / quality

- [ ] Prefer behavioural assertions over render-only smoke when filling coverage.
- [ ] E2E for auth flows, command-safety, backend-integration per `FEATURE_STATUS.md`.

---

## Guardrails

- **Never** lower a gate to hide a real regression.
- Keep `vitest.config.ts`, `coverage-baseline.json`, and all docs quoting coverage numbers in sync.
