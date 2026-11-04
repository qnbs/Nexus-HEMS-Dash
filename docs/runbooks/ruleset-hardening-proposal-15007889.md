# Ruleset hardening proposal — ruleset 15007889 (#390)

**Status:** proposal only — requires repository admin approval before applying.  
**Ruleset:** https://github.com/qnbs/Nexus-HEMS-Dash/rules/15007889

## Current strengths (keep)

- Required signed commits
- Required checks: `✅ CI Passed`, `lighthouse`, `🎭 E2E Tests`, CodeQL
- Block force pushes on `main`

## Observed gaps (2026-11-04 audit)

| Setting | Current | Risk |
|---------|---------|------|
| Required approving reviews | `0` | Changes can land without human review |
| Required review thread resolution | `false` | Bot/human threads can remain open at merge |
| Strict required status checks | `false` | Stale check success may count |
| Bypass actors | multiple `always` | Routine bypass of protections |

## Recommended target (solo-maintainer aware)

1. **Required approvals:** `1` for `main` (maintainer self-approval allowed if repo policy permits).
2. **Review thread resolution:** `true` (aligns with `docs/runbooks/pr-review-correction-loop.md`).
3. **Strict status checks:** `true` — checks must pass on **latest** head SHA.
4. **Bypass actors:** remove `always` bypass except break-glass admin; document each retained bypass in `DEVOPS.md`.
5. **Optional:** enable CODEOWNERS review for `apps/api/src/ws/`, `apps/web/src/core/command-safety.ts`, protocol adapters.

## Rollback

Export current ruleset JSON from GitHub UI before edits; restore prior JSON if release or hotfix velocity is blocked.

## Out of scope for agents

Cloud agents must **not** change ruleset settings without explicit maintainer authorization.
