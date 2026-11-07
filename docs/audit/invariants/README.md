# Implicit invariants register (bounded slice)

Machine-readable rows live in `register.csv`. Status vocabulary:

| Status | Meaning |
| --- | --- |
| `observed` | Documented limitation or guard in source only |
| `reproduced-negative-test` | Failing counterexample test existed before fix |
| `branch-fixed` | Fix + tests on an open PR branch; not on `main` |
| `merged-main-verified` | Fix on protected `main` with CI evidence |

## DATA-18 split (#449)

Former umbrella **DATA-18** is split so sync-failure vs crash-restart semantics are not conflated:

- **DATA-18-SYNC** — in-process `copyFileSync` / progress / staging failures must not delete the authoritative `.recovering` snapshot (**verified** on branch via fault injection).
- **DATA-18-CRASH** — after a committed archive, crash or `unlink` failure may leave both `.recovering` and `wal.ndjson.failed-*`; merge must not replay duplicate logical rows (**verified** on branch via unlink-fault restart test; not a full kernel crash harness).
- **DATA-18-POWER** — explicit non-claim: per-line WAL without fsync; Helm `emptyDir` ephemerality (#452).

**DATA-02** (repeat-failure duplicate growth) remains **branch-fixed** on the same WAL PR; do not treat as `merged-main-verified`.

Provenance SHA is the WAL recovery branch head when this slice was written. Reconcile after merge.
