# Grype DB resilience (#411)

**Context:** SBOM jobs using `anchore/scan-action` occasionally failed with **`database does not exist`** on cold runners (example: PR run `41936482081`, frontend Grype step). PR **#438** added **`cache-db: true`** on every scan step so `anchore/scan-action` downloads and caches the Grype vulnerability DB the same binary uses (Grype **v0.118.x** bundled with scan-action **v7.4.2**).

**Do not** pre-install a separate Grype CLI from `install.sh` or an older release: that warms a different schema/binary than the scanner and gives a false sense of resilience.

## Mitigation (CI)

| Layer | Location |
| --- | --- |
| `cache-db: true` | `sbom-scan.yml`, `container-publish.yml` (`anchore/scan-action` v7.4.2) |

## Related

- [#411](https://github.com/qnbs/Nexus-HEMS-Dash/issues/411) runner-queue / CI recovery (separate from Grype flake; see `deploy-recovery.yml`)
- [#402](recovery-evidence-ledger-402.md) ledger
- `docs/Supply-Chain-Grype-Policy.md`

Do not disable Grype or lower severity cutoffs to mask DB download failures.
