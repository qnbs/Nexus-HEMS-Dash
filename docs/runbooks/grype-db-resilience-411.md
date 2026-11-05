# Grype DB resilience (#411)

**Context:** SBOM jobs using `anchore/scan-action` occasionally failed with **`database does not exist`** on cold runners (example: PR run `41936482081`, frontend Grype step). Issue **#438** added `cache-db: true`; this follow-up adds an explicit **`grype db update` retry** before scans.

## Mitigation (CI)

| Layer | Location |
| --- | --- |
| `cache-db: true` | `sbom-scan.yml`, `container-publish.yml` (`anchore/scan-action`) |
| Warm DB composite | `.github/actions/warm-grype-db` — install Grype + up to 5 retries with backoff |

## Related

- [#411](https://github.com/qnbs/Nexus-HEMS-Dash/issues/411) runner-queue / CI recovery (separate from Grype flake; see `deploy-recovery.yml`)
- [#402](recovery-evidence-ledger-402.md) ledger
- `docs/Supply-Chain-Grype-Policy.md`

Do not disable Grype or lower severity cutoffs to mask DB download failures.
