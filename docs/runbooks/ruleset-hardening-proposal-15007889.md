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

1. **Required approvals:** `1` from a reviewer who is **not** the PR author (GitHub does not count the author's own approval). Solo maintainers need a second trusted reviewer account, org bot approval, or a documented break-glass ruleset exception — not an implicit self-approve.
2. **Review thread resolution:** `true` (aligns with `docs/runbooks/pr-review-correction-loop.md`).
3. **Strict status checks:** `true` — checks must pass on **latest** head SHA.
4. **Bypass actors:** remove `always` bypass except break-glass admin; document each retained bypass in `DEVOPS.md`.
5. **Optional:** enable CODEOWNERS review for `apps/api/src/ws/`, `apps/web/src/core/command-safety.ts`, protocol adapters.

## Rollback

Export current ruleset JSON from GitHub UI before edits; restore prior JSON if release or hotfix velocity is blocked.

## Actions policy — `pull_request_target` (2026-12-02)

GitHub rulesets can include **Actions policies → Restrict events**. If evaluation fails with *Configure an Actions policy* for `pull_request_target`:

| Approach | When |
| --- | --- |
| **Preferred (repo)** | Use `pull_request` in workflows that do not need base-branch secrets — e.g. `.github/workflows/labeler.yml` (auto-label). |
| **Maintainer-only** | Rules → ruleset **15007889** → **Actions policies** → allow `pull_request_target` for a named workflow (only if fork PR labeling with elevated context is required). See [GitHub guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository#managing-github-actions-permissions-for-your-repository). |

Do not re-introduce `pull_request_target` without a documented threat model (untrusted fork code + write token).

## Out of scope for agents

Cloud agents must **not** change ruleset settings without explicit maintainer authorization.

---

## Operational note — Code scanning rule and merge `BLOCKED` (2026-11-06)

GitHub exposes ruleset **15007889** with a **`code_scanning`** rule: **CodeQL** must meet configured thresholds (**critical** security alerts and **errors** for standard severity). This is independent of green CI workflow runs.

### Symptoms

- `gh pr view <n> --json mergeStateStatus` returns **`BLOCKED`** while `mergeable` is **`MERGEABLE`** and required workflow checks are green.
- REST merge (`gh pr merge`) fails with “base branch policy prohibits the merge” without naming a missing check.
- If `gh pr merge --auto` fails with `enablePullRequestAutoMerge`, turn on **Allow auto-merge** under **Settings → General** (repo or org); that is separate from the `code_scanning` rule.

### Maintainer actions

1. **Security** tab → **Code scanning** → triage **CodeQL** (and Semgrep if applicable): fix, dismiss with reason, or mark false positives per org policy until the ruleset’s `code_scanning` evaluation passes for the PR’s head commit.
2. If the UI shows stale or contradictory state, re-run **CodeQL Advanced** on the branch after triage.
3. Per [pr-review-correction-loop.md](pr-review-correction-loop.md): agents cannot verify alert counts via `gh api .../code-scanning/alerts` (often **403** on integration tokens); rely on the **Security** tab or a maintainer token.

### Agent policy alignment

Per **AGENTS.md** §15: use the normal merge path first (UI or `gh pr merge` without flags) once **review quiescence** and **ruleset evaluation** pass. Use **`--admin`** only when the **maintainer explicitly asks** and the repo’s bypass list / your role allows it (e.g. Cursor app bypass)—never to skip quiescence or green required checks.
