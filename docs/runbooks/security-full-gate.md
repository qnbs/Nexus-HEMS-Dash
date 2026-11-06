# Security Full Gate Runbook

**Workflow:** `.github/workflows/security-full.yml`  
**Aggregate status check:** `Security Gate`

---

## Purpose

Comprehensive SAST, secret detection, supply-chain, and repository-hardening gate. It runs on every push/PR to `main` and weekly on Monday mornings.

---

## Triggers

- `push` to `main`
- `pull_request` to `main`
- Weekly schedule: Monday 05:00 UTC
- `workflow_dispatch`

---

## Jobs

| Job                          | Tool / image                                      | Purpose                                                                 |
| ---------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------- |
| `gitleaks`                   | Gitleaks Action + integrity probe                 | Secret/credential detection                                             |
| `semgrep`                    | `semgrep/semgrep@sha256:…` (pinned digest)        | SAST with `semgrep scan --config auto` → SARIF upload (best effort)    |
| `anti-trojan-source`         | `anti-trojan-source` + Biome                      | Unicode bidi attack detection; Biome lint                               |
| `dependency-check`           | `pnpm audit` (HIGH report + **critical** gate)  | Production dependency vulnerabilities; critical count must be zero     |
| `license-check`              | `license-checker` (scheduled / dispatch only)     | Advisory GPL/AGPL production license report (see workflow `if:`)       |
| `audit-full`                 | `pnpm audit` incl. dev-deps (sched./dispatch)     | Weekly/manual full dependency report                                    |
| `branch-protection-reminder` | Shell checklist                                   | Prints branch-protection checklist to job summary                       |
| `security-gate`              | Shell rollup                                      | Fails if any **critical** upstream job failed                           |

**CodeQL** and **OpenSSF Scorecard** are **not** jobs in this file; they run in `codeql.yml` and `scorecard.yml` (ADR-027 single-source workflows). The rollup job prints their status as informational lines only.

---

## Common Failures & Fixes

### Gitleaks reports a secret

- **Do not commit real secrets.**
- Rotate the exposed credential immediately.
- If the match is a false positive (e.g., a test fixture), add a **line-specific** entry in `.gitleaksignore` and document it in `docs/runbooks/gitleaks-integrity-432.md`. Avoid whole-file path exclusions in `.gitleaks.toml`.

### CodeQL fails on SARIF upload (default + advanced both on)

If the **Perform CodeQL Analysis** step fails with:

> CodeQL analyses from advanced configurations cannot be processed when the default setup is enabled

GitHub is running **both** the repository **default** Code scanning setup and **CodeQL Advanced** (`.github/workflows/codeql.yml`). **Pick one:**

**Path A — Advanced (repo workflow, ADR-027 as implemented)**  
1. **Settings → Code security → Code scanning** — turn **Default** setup **off**.  
2. Keep **`codeql.yml`** enabled; run **workflow_dispatch** on `main` if needed.  
3. Confirm **Tool status** shows a successful analysis for `refs/heads/main`.

**Path B — Default only (GitHub-managed)**  
1. **Disable** the **CodeQL Advanced** workflow (Actions → `CodeQL Advanced` → disable) or remove `codeql.yml` in a PR.  
2. Leave **Default** setup on. Expect **JavaScript/TypeScript** coverage only (no `actions` / `rust` matrix from `codeql.yml`).  
3. Optional: `VERIFY_CODE_SCANNING_SKIP_CODEQL_ADVANCED=1` when running `verify-code-scanning-workflow-health.mjs`.

See [code-scanning-tool-health-421.md](code-scanning-tool-health-421.md) §0.

### CodeQL reports a new alert

- Open the alert in the GitHub Security tab.
- If it is a true positive, fix it and add a regression test when possible.
- If it is a false positive, use the GitHub UI to dismiss it with a reason.

### Semgrep reports an issue

- Review the SARIF output uploaded to GitHub Security tab.
- Fix true positives; suppress false positives via inline `nosemgrep` comments:
  ```ts
  // nosemgrep: typescript.react.security.audit.raw-dangerous-set-innerhtml
  ```

### Dependency audit fails

- `dependency-check` fails only on **critical** vulnerabilities.
- If a HIGH vulnerability is reported, open a dedicated remediation issue/PR.
- The separate `pnpm audit` step in `ci.yml` is currently report-only for HIGH CVEs until remediation.

### License compliance (scheduled / manual)

- The `license-check` job uses `continue-on-error: true` — advisory on schedule/dispatch runs.
- `dependency-check` on every push also runs `license-checker` with `continue-on-error: true` for the same GPL/AGPL rule (non-blocking until promoted in the workflow).
- If `GPL-3.0` / `AGPL-3.0` appears in production dependencies, find an alternative or obtain legal review before dropping `continue-on-error`.

---

## How to Extend

- Add a new job before the `security-gate` rollup.
- Include its result in the `security-gate` evaluation script.
- Update this runbook and `docs/PR-FEEDBACK-PLAYBOOK.md`.

---

## Related

- [ci-primary-gate.md](ci-primary-gate.md)
- [../PR-FEEDBACK-PLAYBOOK.md](../PR-FEEDBACK-PLAYBOOK.md)
