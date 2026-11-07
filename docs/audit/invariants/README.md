# Implicit invariants register (bounded slice)

Machine-readable rows live in `register.csv`. Status vocabulary:

| Status | Meaning |
| --- | --- |
| `observed` | Documented limitation or guard in source only |
| `reproduced-negative-test` | Failing counterexample test existed before fix |
| `branch-fixed` | Fix + tests on an open PR branch; not on `main` |
| `verified` | Legacy alias for post-merge proof (prefer `merged-main-verified`) |
| `merged-main-verified` | Fix on protected `main` with CI evidence |

## Traversal (#449)

```bash
node scripts/check-invariants-register.mjs
```

The checker validates CSV shape, allowed statuses, provenance SHAs for merged rows, and that every `evidence_ref` path exists on disk. Run targeted API tests after register edits:

```bash
pnpm --filter @nexus-hems/api exec vitest run src/services/TimeseriesService.test.ts src/services/TimeseriesService.archive-handoff.test.ts
pnpm --filter @nexus-hems/api exec vitest run src/tests/physical-command-ledger.test.ts src/tests/physical-command-ledger-redis-mock.test.ts
```

## DATA-18 split

Former umbrella **DATA-18** is split so sync-failure vs crash-restart semantics are not conflated:

- **DATA-18-SYNC** — in-process `copyFileSync` / progress / staging failures must not delete the authoritative `.recovering` snapshot (`merged-main-verified` @ `f7b219c`).
- **DATA-18-CRASH** — after a committed archive, crash or `unlink` failure may leave both `.recovering` and `wal.ndjson.failed-*`; merge must not replay duplicate logical rows (`merged-main-verified` @ `f7b219c`).
- **DATA-18-MERGE / DATA-18-MERGE-CRASH** — stranded snapshot merge idempotency and progress-write crash window (`merged-main-verified` @ `f7b219c`).
- **DATA-18-POWER** — explicit non-claim: per-line WAL without fsync (`observed`).
- **DATA-18-K8S** — Helm replica guard + health WAL storage class (`merged-main-verified` @ `f7b219c`; ops validation on real clusters still recommended).

**DATA-02** — repeat-failure duplicate growth guard (`merged-main-verified` @ `f7b219c`).

**CONTROL-395-*** — physical-command ledger alias CAS + fail-closed receipts (`merged-main-verified` @ `f3cbfa1`).
