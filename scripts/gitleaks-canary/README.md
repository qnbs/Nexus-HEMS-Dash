# Gitleaks canary fixtures (#432)

Synthetic secret-like strings used **only** by `scripts/verify-gitleaks-integrity.mjs`.
This directory is excluded from the main repository scan via `.gitleaks.toml` `[allowlist].paths`
so CI stays green while the integrity job proves Gitleaks still detects realistic patterns.

Do **not** put real credentials here.
