# Release drift after v1.12.2 (#401)

**Tag:** `v1.12.2` @ `0eb15bc` (published 2026-10-04)  
**Current `main` (audit baseline):** `26d0616` — includes post-tag safety merges **not** in the published release.

## Commits on `main` not in `v1.12.2`

| PR | Topic |
|----|--------|
| #375 | Atomic Redis settings / offline sync |
| #376 | Audit ledger follow-up |
| #377 | Physical command idempotency ledger |
| #378 | Browser ControlAuthority fail-closed |

## Release prerequisites (do not skip)

1. Merge **#403** (P0 production dependency advisories).
2. Merge **#404** (CI/security recovery, SBOM/Grype base images, Pages provenance) onto updated `main`.
3. Rebase **#379** to an OCPP-only diff after #404, then merge after review quiescence.
4. Dispatch **SBOM**, **security-full**, and **Scorecard** manually if schedules remain stale (#387).
5. Verify Pages deploy uses `build-info.json` provenance (`verify-pages-build-sha.sh` in `deploy.yml`).

## Suggested next version

Patch **`v1.12.3`** (security/resilience focus) after P0/P1 gates — **manual** `release.yml` dispatch only (`approveRelease=RELEASE`), per ADR-015.

## Demo vs production

GitHub Pages demo may still reflect an older deployment SHA until the next successful `deploy.yml` on `main`. Compare Help → About build SHA with `git rev-parse main`.
