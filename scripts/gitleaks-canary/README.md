# Gitleaks canary fixtures (#432)

Committed files here are **templates and safe placeholders only**. High-entropy positive probe
values are generated at runtime by `scripts/verify-gitleaks-integrity.mjs` (via
`runtime-synthetic.mjs`) into `.cache/gitleaks-probes/` and must never be committed.

This directory is excluded from the main Gitleaks scan via `.gitleaks.toml` `[allowlist].paths`.
External scanners (e.g. GitGuardian) still inspect git history — do not add credential-shaped
literals to tracked files.

Do **not** put real credentials here.
