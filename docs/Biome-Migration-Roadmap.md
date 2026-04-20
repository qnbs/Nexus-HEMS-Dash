# Biome-First Toolchain Migration — Roadmap & Architecture Decision Record

**Status:** Implemented
**Date:** 2026-04-20
**ADR:** Build toolchain — Biome as primary linter + formatter
**Scope:** Dev toolchain, CI/CD, pre-commit hooks, editor integration

---

## 1. Executive Summary

Nexus-HEMS-Dash migrates from a dual-tool stack (ESLint + Prettier) to a **Biome-first toolchain**. Biome 2.x handles all TypeScript/JavaScript linting and formatting in a single Rust-native process. A minimal ESLint configuration is retained exclusively for three React-specific plugins that have no Biome equivalent.

**Expected gains:**

| Metric              | Before      | After       | Δ                   |
| ------------------- | ----------- | ----------- | ------------------- |
| CI lint + format    | ~40–80 s    | ~8–15 s     | **–75%**            |
| Pre-commit (staged) | ~15–25 s    | ~3–6 s      | **–78%**            |
| Dev `formatOnSave`  | ~300–800 ms | ~20–80 ms   | **–87%**            |
| Installed devDeps   | Baseline    | –9 packages | ~5% install speedup |

---

## 2. Current State (Before Migration)

### Tools in Use

| Tool                               | Version | Role                                                            |
| ---------------------------------- | ------- | --------------------------------------------------------------- |
| `@biomejs/biome`                   | 2.4.7   | Installed, **linter and formatter disabled** (`enabled: false`) |
| `eslint`                           | 9.x     | Primary linter — TypeScript, React, security rules              |
| `prettier`                         | 3.x     | Primary formatter — JS/TS/CSS/JSON/MD                           |
| `prettier-plugin-tailwindcss`      | 0.7.x   | Tailwind class sorting via Prettier                             |
| `eslint-plugin-prettier`           | 5.x     | ESLint/Prettier bridge (double-runs Prettier)                   |
| `typescript-eslint`                | 8.x     | TypeScript parser + type-aware rules for ESLint                 |
| `eslint-plugin-anti-trojan-source` | 1.x     | Unicode bidi detection (also covered by pre-commit)             |

### Pre-commit Pipeline (Before)

```
pre-commit framework
  → trailing-whitespace, end-of-file-fixer, check-yaml, check-json
  → gitleaks v8.24.3
  → anti-trojan-source CLI (src/**/*.{ts,tsx,js,jsx})
→ pnpm format:check   (Prettier — separate standalone step)
→ npx lint-staged
  → eslint --fix + prettier --write  (on *.ts, *.tsx)
  → prettier --write                 (on *.json, *.md, *.css, *.html, *.yml)
```

### CI Pipeline (Before)

```
lint-typecheck job (sequential):
  → pnpm audit
  → pnpm lint          (ESLint)
  → pnpm type-check    (tsc)
  → pnpm format:check  (Prettier)
```

---

## 3. Target State (After Migration)

### Tool Responsibilities

| Tool                         | Role                                                         |
| ---------------------------- | ------------------------------------------------------------ |
| **Biome 2.4.7**              | Primary linter + formatter for all TS/JS/TSX/JSON/CSS files  |
| **ESLint 9** (slim)          | React-only: `react-compiler`, `react-hooks`, `react-refresh` |
| **tsc**                      | Type checking only (`--noEmit`)                              |
| **anti-trojan-source** (CLI) | Pre-commit Unicode bidi security check                       |
| **gitleaks**                 | Pre-commit secret detection                                  |

### Post-Migration Pipeline (Pre-commit)

```
pre-commit framework
  → trailing-whitespace, end-of-file-fixer, check-yaml, check-json
  → gitleaks v8.24.3
  → anti-trojan-source CLI
→ npx lint-staged
  → biome check --write          (*.ts, *.tsx — lint + format)
  → eslint --fix --max-warnings 0 (*.ts, *.tsx — React rules only)
  → biome format --write         (*.json, *.css, *.html, *.yml, *.yaml, *.md)
```

### Post-Migration CI Pipeline

```
lint-typecheck job (parallel with build + tests):
  → pnpm audit
  → pnpm lint          (biome check + slim eslint)
  → pnpm type-check    (tsc --noEmit)
  [format:check is subsumed into pnpm lint via biome]
```

---

## 4. Decision Log

### D1 — Hybrid Biome + Slim ESLint (ACCEPTED)

**Options considered:**

- **Option A (Selected):** Biome for TS/JS linting + formatting; ESLint retained for 3 React plugins
- **Option B:** ESLint completely removed — rejected due to no Biome equivalent for `react-compiler/react-compiler`
- **Option C:** Keep ESLint + Prettier, add Biome as optional CI gate — rejected (maintains dual overhead)

**Rationale:** The `eslint-plugin-react-compiler` rule enforces React Compiler constraints at lint time. Violations would compile but silently produce incorrect runtime behaviour. This rule is safety-critical and must be enforced in CI. Biome has no equivalent as of v2.4.7.

**ESLint rules retained:**

```
react-compiler/react-compiler  → error   (no Biome equivalent — React Compiler violations)
react-hooks/rules-of-hooks     → error   (no Biome equivalent — Hook order errors)
react-hooks/exhaustive-deps    → warn    (no Biome equivalent — missing deps)
react-refresh/only-export-components → warn (HMR compatibility)
```

**ESLint packages removed:**

```
prettier                           (formatter → Biome)
prettier-plugin-tailwindcss        (formatter plugin → Biome nursery.useSortedClasses)
eslint-plugin-prettier             (bridge → no longer needed)
eslint-config-prettier             (transitive of eslint-plugin-prettier)
@eslint/js                         (base config → Biome covers recommended rules)
typescript-eslint                  (meta-package → Biome handles TS rules)
@typescript-eslint/eslint-plugin   (TS rules → Biome)
@typescript-eslint/parser          (TS parser → Biome)
globals                            (browser globals for ESLint → Biome)
eslint-plugin-anti-trojan-source   (pre-commit standalone CLI already covers this)
```

### D2 — Biome `nursery.useSortedClasses` for Tailwind (ACCEPTED)

**Options considered:**

- **Option A (Selected):** Enable `nursery.useSortedClasses` in Biome with `clsx`/`cn` function config
- **Option B:** Retain `prettier-plugin-tailwindcss` standalone — rejected (requires Prettier)
- **Option C:** Drop Tailwind class sorting — rejected (leads to inconsistent class ordering)

**Rationale:** Biome 2.x `nursery.useSortedClasses` supports configuring utility functions (`clsx`, `cn`) and is stable enough for production use. Applied as a linting warn (not error) to avoid breaking existing code on first migration. Auto-fixable via `biome check --write`.

### D3 — Anti-Trojan-Source: Pre-commit only (ACCEPTED)

**Rationale:** The `eslint-plugin-anti-trojan-source` ESLint plugin was redundant — the same check was already running as a standalone CLI hook in `.pre-commit-config.yaml`. Removing the ESLint plugin eliminates the dual overhead while maintaining the security gate via pre-commit.

### D4 — CI Lint Step Simplification (ACCEPTED)

**Rationale:** With Biome's format check integrated into `pnpm lint`, the separate `pnpm format:check` step in CI is redundant. `pnpm lint` now runs `biome check --write=false` (includes format check) + slim ESLint. One step instead of two.

---

## 5. Biome Configuration

### Formatter Settings (Parity with old Prettier config)

| Setting         | Prettier Config         | Biome Config                 |
| --------------- | ----------------------- | ---------------------------- |
| Line width      | `printWidth: 100`       | `lineWidth: 100`             |
| Tab width       | `tabWidth: 2`           | `indentWidth: 2`             |
| Line ending     | `endOfLine: "lf"`       | `lineEnding: "lf"`           |
| Quotes (JS/TS)  | `singleQuote: true`     | `quoteStyle: "single"`       |
| Trailing commas | `trailingComma: "all"`  | `trailingCommas: "all"`      |
| Semicolons      | `semi: true`            | `semicolons: "always"`       |
| Bracket spacing | `bracketSpacing: true`  | `bracketSpacing: true`       |
| Arrow parens    | `arrowParens: "always"` | `arrowParentheses: "always"` |

### Key Lint Rules

| Rule                                        | Level    | Replaces                                          |
| ------------------------------------------- | -------- | ------------------------------------------------- |
| `suspicious.noExplicitAny`                  | error    | `@typescript-eslint/no-explicit-any: error`       |
| `correctness.noUnusedVariables`             | error    | `@typescript-eslint/no-unused-vars: error`        |
| `correctness.noUnusedImports`               | error    | (part of typescript-eslint)                       |
| `correctness.useHookAtTopLevel`             | error    | `react-hooks/rules-of-hooks` (kept in ESLint too) |
| `performance.noAccumulatingSpread`          | error    | (no ESLint equivalent)                            |
| `complexity.noExcessiveCognitiveComplexity` | warn(25) | (no ESLint equivalent)                            |
| `nursery.useSortedClasses`                  | warn     | `prettier-plugin-tailwindcss`                     |
| `style.useImportType`                       | warn     | (no ESLint equivalent, cleaner imports)           |
| `suspicious.noArrayIndexKey`                | warn     | `react/no-array-index-key`                        |

---

## 6. Risk Assessment

| Risk                                                          | Likelihood | Impact | Mitigation                                                                |
| ------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------- |
| Biome formatter produces different output from Prettier       | High       | Low    | One-time format run at migration; all files reformatted consistently      |
| `nursery.useSortedClasses` causes unexpected class reordering | Medium     | Low    | Applied as warn + --write; visual regression via Chromatic before merge   |
| ESLint React rules catch something Biome missed               | Low        | High   | Slim ESLint config explicitly retained for all React rules                |
| CI breaks on existing code with Biome errors                  | Medium     | Medium | Biome run as `--write=false` in CI; fix-pass run locally during migration |
| Storybook build incompatibility                               | Low        | Low    | Storybook uses Vite config, not ESLint directly; isolated test            |

---

## 7. Rollback Plan

If the migration causes critical issues, the rollback steps are:

```bash
# 1. Restore Prettier
pnpm add -D prettier prettier-plugin-tailwindcss eslint-plugin-prettier

# 2. Restore ESLint packages
pnpm add -D @eslint/js typescript-eslint @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser globals eslint-plugin-anti-trojan-source

# 3. Restore config files from git
git checkout HEAD~1 -- eslint.config.js .prettierrc .prettierignore \
  .lintstagedrc.json .husky/pre-commit package.json biome.json

# 4. Reinstall
pnpm install

# 5. Verify
pnpm lint && pnpm type-check && pnpm build
```

Git tag `toolchain-pre-biome` marks the last commit before migration to ease rollback.

---

## 8. Benchmark Methodology

Run `scripts/bench-tooling.sh` to measure toolchain performance:

```bash
chmod +x scripts/bench-tooling.sh
./scripts/bench-tooling.sh
```

The script measures:

- Wall-clock time for `biome check src/`
- Wall-clock time for `eslint src/` (React-only config)
- Wall-clock time for `tsc --noEmit`
- RSS peak memory for each tool (Linux: `/usr/bin/time -v`)
- Combined lint time (biome + slim eslint) vs. old (eslint + prettier check)

Output is saved to `.perf/toolchain-bench-YYYYMMDD.json`.

---

## 9. File Change Summary

### New Files

| File                              | Purpose                       |
| --------------------------------- | ----------------------------- |
| `docs/Biome-Migration-Roadmap.md` | This document                 |
| `docs/Toolchain-Architecture.md`  | Living architecture reference |
| `scripts/bench-tooling.sh`        | Performance benchmark script  |

### Modified Files

| File                                   | Change                                                      |
| -------------------------------------- | ----------------------------------------------------------- |
| `biome.json`                           | Fully rewritten — linter + formatter enabled                |
| `eslint.config.js`                     | Reduced to React-only (~20 lines)                           |
| `package.json`                         | Updated scripts + devDependencies                           |
| `.lintstagedrc.json`                   | Biome-first staged file processing                          |
| `.husky/pre-commit`                    | Simplified — format:check removed (subsumed by lint-staged) |
| `.pre-commit-config.yaml`              | anti-trojan-source hook updated                             |
| `.github/workflows/ci.yml`             | format:check step removed                                   |
| `.github/workflows/perf-benchmark.yml` | Biome lint step upgraded                                    |
| `.github/dependabot.yml`               | dev-deps patterns updated                                   |
| `.vscode/settings.json`                | Biome as default formatter                                  |
| `.vscode/extensions.json`              | Prettier extension removed                                  |
| `CONTRIBUTING.md`                      | Tooling section updated                                     |
| `README.md`                            | Developer commands updated                                  |
| `CHANGELOG.md`                         | [Unreleased] migration entries                              |

### Removed Files

| File              | Reason                                                      |
| ----------------- | ----------------------------------------------------------- |
| `.prettierrc`     | Formatter config replaced by `biome.json` formatter section |
| `.prettierignore` | File ignores moved to `biome.json` `files.includes`         |
