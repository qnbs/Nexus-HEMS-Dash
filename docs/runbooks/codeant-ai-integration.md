# CodeAnt.ai Integration Runbook

**GitHub App:** CodeAnt AI  
**Status check:** `CodeAnt AI`  
**Mode:** Advisory

---

## Purpose

CodeAnt.ai provides AI-powered code review comments on pull requests. It complements deterministic tools (Biome, DeepSource) with higher-level feedback on architecture, maintainability, and security smells.

---

## Installation

> These steps require repository-owner access to GitHub.

1. Go to https://codeant.ai and sign in with the `qnbs` GitHub account.
2. Install the CodeAnt AI GitHub App.
3. Select `qnbs/Nexus-HEMS-Dash`.
4. Grant the requested repository permissions.

No configuration file is required in the repo; CodeAnt is primarily dashboard-driven.

---

## Configuration

In the CodeAnt dashboard:

1. **Disable overlapping rules.** Turn off rules that duplicate Biome/DeepSource:
   - Formatting
   - Line length
   - Unused imports
   - Simple lint/style issues

2. **Enable high-value rules:**
   - Architectural feedback
   - Maintainability / complexity
   - Security smells
   - Missing tests for complex logic
   - Error-handling gaps

3. **Set severity.** Keep inline comments at `warning` or higher; reserve `error` for clear security issues.

4. **Blocking policy.** Keep CodeAnt **advisory** (non-blocking) indefinitely. It should inform human reviewers, not replace them.

---

## How to Read CodeAnt Comments

1. CodeAnt posts a summary comment and inline comments on the PR diff.
2. Read the suggestion and the reasoning.
3. If the suggestion is correct and safe, apply it manually or reply `+1`.
4. If the suggestion is incorrect or unsafe, reply explaining why and resolve the thread.

---

## Safety Rules

- **Never auto-apply** CodeAnt suggestions to control logic, auth, rate limits, or safety guardrails.
- **Never** let CodeAnt auto-approve or auto-merge a PR.
- For files under:
  - `apps/api/src/middleware/security.ts`
  - `apps/api/src/routes/auth*.ts`
  - `apps/api/src/protocols/**`
  - `apps/web/src/core/adapters/**`
  - `apps/web/src/core/command-safety.ts`
  - `apps/web/src/core/energy-controllers.ts`
    require explicit human review regardless of CodeAnt’s suggestion.

---

## When to Trust AI Suggestions

| Suggestion type                  | Trust level                       | Action                                       |
| -------------------------------- | --------------------------------- | -------------------------------------------- |
| Rename variable / improve naming | High                              | Apply if it improves clarity                 |
| Extract helper function          | Medium                            | Apply if it reduces complexity and has tests |
| Error-handling improvement       | Medium                            | Apply only with regression tests             |
| Security refactor                | Low                               | Always have a human reviewer verify          |
| Control-logic change             | Do not apply without human review | Require maintainer approval                  |

---

## Reducing Noise

If CodeAnt becomes noisy:

1. Lower the inline-comment threshold in the dashboard.
2. Disable more overlapping rules.
3. Add ignore patterns for generated/test fixtures.
4. Open an issue to tune the configuration.

---

## Alternative Tools

If CodeAnt.ai is unavailable or does not meet the project’s needs, alternatives are:

- **CodeRabbit** — fast, configurable AI review (`.coderabbit.yaml`).
- **Qodo Merge / PR-Agent** — open-source, self-hostable, model-agnostic.
- **GitHub Copilot Code Review** — native if Copilot Business/Enterprise is already active.

Update this runbook if an alternative is chosen.

---

## Related

- [deepsource-integration.md](deepsource-integration.md)
- [../PR-FEEDBACK-PLAYBOOK.md](../PR-FEEDBACK-PLAYBOOK.md)
