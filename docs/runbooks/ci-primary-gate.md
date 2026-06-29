# CI Primary Gate Runbook

**Workflow:** `.github/workflows/ci.yml`  
**Aggregate status check:** `✅ CI Passed`

---

## Purpose

The primary merge gate for Nexus-HEMS-Dash. It runs on every push to `main`/`develop` and every pull request to `main`. It verifies lint, type safety, unit tests, production build, E2E tests, Storybook build, and optional GitHub Pages deploy.

---

## Triggers

- `push` to `main` or `develop`
- `pull_request` to `main`

---

## Job Layout

```
security-audit
├── lint-typecheck
├── unit-tests
└── build
    ├── e2e-tests
    ├── storybook
    └── deploy (main pushes only)

ci-passed (rollup gate)
```

| Job              | What it does                                                                                                  | Typical duration |
| ---------------- | ------------------------------------------------------------------------------------------------------------- | ---------------- |
| `security-audit` | `pnpm audit --audit-level=high --prod` (report-only for existing HIGH CVEs) + dependency-review-action on PRs | ~1 min           |
| `lint-typecheck` | `pnpm lint` (Biome + ESLint) + `pnpm type-check`                                                              | ~3–6 min         |
| `unit-tests`     | API unit tests + web unit tests with coverage                                                                 | ~6–12 min        |
| `build`          | Production build, size-limit, production-bundle smoke test, SLSA attestation on `main`, artifact upload       | ~5–10 min        |
| `e2e-tests`      | Playwright Chromium + Firefox against the uploaded build                                                      | ~10–20 min       |
| `storybook`      | Storybook build + artifact upload                                                                             | ~3–5 min         |
| `deploy`         | GitHub Pages deploy (main pushes only)                                                                        | ~1 min           |
| `ci-passed`      | Fails if any required prerequisite failed                                                                     | ~0 min           |

---

## Common Failures & Fixes

### `pnpm lint` fails

```bash
pnpm lint:fix
pnpm lint   # verify zero warnings/errors
```

### `pnpm type-check` fails

```bash
pnpm type-check
# fix reported TypeScript errors; the repo uses strict mode
```

### Unit tests fail

```bash
# API tests
pnpm --filter @nexus-hems/api test:run

# Web tests
pnpm --filter @nexus-hems/web test:run
```

### Size-limit fails

- Check the `bundle-analysis` artifact.
- If a dependency grew the bundle, consider lazy-loading or an alternative package.
- Update budgets only via ADR/PR discussion.

### Smoke test fails

- Ensure `pnpm build` produces a working `apps/web/dist/`.
- Run `pnpm --filter @nexus-hems/web smoke:prod` locally after building.

### E2E tests fail

- Download the `playwright-report` artifact.
- Re-run locally with `VITE_E2E_TESTING=true pnpm test:e2e`.

---

## How to Extend

1. Add a new job that depends on `build` or `security-audit`.
2. Upload artifacts with `actions/upload-artifact` for debugging.
3. Add the job to the `needs:` list of `ci-passed`.
4. Update this runbook and `docs/PR-FEEDBACK-PLAYBOOK.md`.

---

## Related

- [security-full-gate.md](security-full-gate.md)
- [working-with-coverage.md](working-with-coverage.md)
- [../PR-FEEDBACK-PLAYBOOK.md](../PR-FEEDBACK-PLAYBOOK.md)
