# PR stack merge playbook — Wave A recovery (#402)

**Do not merge without explicit maintainer authorization.** Agents prepare branches only.

## Order

1. **#403** (`cursor/proxy-addr-p0-386-79f6`) — P0 production deps + aligned Grype base images.
2. **#404** (`cursor/devops-security-recovery-79f6`) — rebase onto new `main`; drop commits already on `main` from #403.
3. **#379** (`cursor/ocpp-sp0-optin-f4-988d`) — rebase onto new `main`; diff must stay **OCPP-only** (~8 files vs #404 parent).

## After each authorized merge

- Record new `main` SHA in #402 evidence ledger.
- Dispatch `SBOM Generation`, `Security Full`, and `OpenSSF Scorecard` if schedules remain stale (#387).
- Do **not** close #387/#392 until `event=schedule` success and deployment provenance are evidenced.

## Review quiescence

Follow `docs/runbooks/pr-review-correction-loop.md`. Resolve or decline every actionable thread on the **latest head SHA** before merge.
