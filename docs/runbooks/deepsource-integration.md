# DeepSource Integration Runbook

**Config file:** `.deepsource.toml`  
**Dashboard:** https://deepsource.io/gh/qnbs/Nexus-HEMS-Dash  
**Status checks:** `DeepSource: JavaScript`, `DeepSource: Secrets`, `DeepSource: Test coverage`

---

## Purpose

DeepSource provides deterministic static analysis, secrets detection, Docker analysis, and coverage diffing. It posts a report card and inline comments on pull requests.

---

## Current Configuration

The repository uses `.deepsource.toml` with:

- **JavaScript analyzer** — TypeScript/React dialect, ESM modules, Vitest environment.
- **Secrets analyzer** — Detects committed credentials.
- **Docker analyzer** — Scans Dockerfiles.
- **Test-coverage analyzer** — Reads coverage reports and computes diff coverage.

Monorepo manifests are explicitly declared:

- `apps/api/package.json`
- `apps/web/package.json`
- `packages/shared-types/package.json`

---

## Rollout Mode

**Advisory-first.** DeepSource comments on PRs but is not a required merge gate initially. After 2–4 weeks of tuning and after existing HIGH-severity dependency advisories are remediated, the following checks will be made required:

- `DeepSource: JavaScript`
- `DeepSource: Secrets`

---

## How to Read Findings

1. Open the PR checks tab.
2. Click `DeepSource: JavaScript` or `DeepSource: Secrets`.
3. Read the report card.
4. Inline annotations appear directly on the diff.

---

## How to Fix Issues

1. Start with the highest-severity findings (`critical`, `major`).
2. For `style`/`minor` issues, run `pnpm lint:fix` first; many are already caught by Biome.
3. For `security` or `bug-risk` issues, understand the root cause before changing code.
4. If a finding is on generated or third-party code, exclude the path in `.deepsource.toml`.

---

## Suppressing Issues

Use explicit `skipcq` comments:

```ts
// skipcq: JS-0323 — reason why this exception is safe
const value = JSON.parse(unsafeInput);
```

Do **not** use bare `// skipcq` because it silences every rule on that line.

For repository-wide suppressions, update `.deepsource.toml` or use the DeepSource dashboard ignore rules, and document the rationale in the PR.

---

## Autofix Policy

Autofix is configured from the DeepSource dashboard, not from `.deepsource.toml`.

- Enable only for low-risk categories: formatting, unused imports, dead code.
- Never auto-apply fixes to control-logic paths:
  - `apps/api/src/middleware/security.ts`
  - `apps/api/src/routes/auth*.ts`
  - `apps/api/src/protocols/**`
  - `apps/web/src/core/adapters/**`
  - `apps/web/src/core/command-safety.ts`
  - `apps/web/src/core/energy-controllers.ts`
- Prefer the “create a new PR” Autofix path over “commit to PR branch”.

---

## Coverage Gate

DeepSource reads the coverage artifact uploaded by `ci.yml`. The coverage gate is advisory until tuning is complete. The eventual goal is:

- Diff coverage should not fall significantly below the project average.
- New code in adapters, auth, and command-safety paths should have tests.

---

## How to Update This Configuration

1. Edit `.deepsource.toml`.
2. Open a PR; DeepSource will validate the config.
3. Update this runbook if the change affects contributors.

---

## Related

- [codeant-ai-integration.md](codeant-ai-integration.md)
- [working-with-coverage.md](working-with-coverage.md)
- [../PR-FEEDBACK-PLAYBOOK.md](../PR-FEEDBACK-PLAYBOOK.md)
