# Contributing to Nexus-HEMS Dash

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

```bash
# Clone and install
git clone https://github.com/qnbs/Nexus-HEMS-Dash.git
cd Nexus-HEMS-Dash
corepack enable
pnpm install

# Start dev server
pnpm dev
```

### Prerequisites

- Node.js 24+
- pnpm 10+

## Project Structure

```text
src/
├── components/       # React components (UI, panels, widgets)
│   └── ui/           # Shared UI primitives (Gauge, NeonCard, etc.)
├── core/             # Adapter pattern (EnergyAdapter, UnifiedEnergyModel)
│   └── adapters/     # Protocol adapters (Victron, Modbus, KNX, OCPP, EEBUS)
├── lib/              # Utilities (db, crypto, format, optimizer, etc.)
├── locales/          # i18n translations (en.ts, de.ts)
├── pages/            # Route-level page components
├── tests/            # Vitest unit tests
├── store.ts          # Zustand global store
├── types.ts          # Shared TypeScript types
└── i18n.ts           # react-i18next configuration
```

## Development Guidelines

### Tech Stack (Do Not Change)

- **React 19** + **Vite 8** — No Next.js, no Remix
- **Zustand** — No Redux, no MobX
- **D3.js** for Sankey — No alternative charting for energy flow
- **Tailwind CSS 4** — Neo-Energy Cyber-Glassmorphism design system
- **Dexie.js** — IndexedDB for offline-first persistence
- **motion** — All animations

### Code Quality

The project uses **Biome** as the primary linter and formatter, with a minimal ESLint configuration for React-specific rules that have no Biome equivalent.

```bash
pnpm lint             # Biome check + React ESLint (zero-warning policy)
pnpm lint:fix         # Biome auto-fix + ESLint fix
pnpm format           # Biome format --write (all src files)
pnpm type-check       # TypeScript strict mode
pnpm test:run         # Unit tests (all must pass)
pnpm build            # Production build
pnpm verify:basis     # Full local loop: type-check + lint + test:run
```

> `pnpm lint` subsumes format checking — `format:check` does not need to be run separately.

**Toolchain architecture:**

| Tool                | Role                                                                       |
| ------------------- | -------------------------------------------------------------------------- |
| **Biome 2.x**       | Primary linter + formatter (Rust-native, ~10× faster than ESLint+Prettier) |
| **ESLint 9** (slim) | React-only rules: `react-compiler`, `react-hooks`, `react-refresh`         |
| **tsc**             | Type checking only                                                         |

See [docs/Toolchain-Architecture.md](docs/Toolchain-Architecture.md) for the full architecture reference and [docs/Biome-Migration-Roadmap.md](docs/Biome-Migration-Roadmap.md) for migration context.

### i18n

All user-facing text must be translated in both locales:

- [src/locales/de.ts](src/locales/de.ts) — German (**fallback locale** — always complete; missing keys fall back to German)
- [src/locales/en.ts](src/locales/en.ts) — English

Use `useTranslation()` hook, never hardcode strings. Both files must be updated simultaneously.

### Accessibility (WCAG 2.2 AA)

- Semantic HTML (`<nav>`, `<main>`, `<button>`, etc.)
- ARIA labels on all interactive elements
- Focus-visible styles (`.focus-ring` utility)
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader support (`aria-live` for real-time data)

### React Compiler Compliance

This project uses the **React Compiler** (`babel-plugin-react-compiler`) for automatic memoization.

- **Never add** `useMemo`, `useCallback`, or `memo()` unless you have confirmed the React Compiler cannot handle the specific case
- Run `pnpm lint` — `react-compiler/react-compiler` rule will flag any Compiler-incompatible patterns
- See [React Compiler docs](https://react.dev/learn/react-compiler) for the Rules of React

### Themes

5 themes are available (IDs: `ocean-dark`, `energy-dark`, `solar-light`, `minimal-white`, `nature-green`). Always use CSS variables (`var(--color-*)`) instead of hardcoded colors. See [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).

### Security

- **No API keys in source code or environment variables** — Use BYOK settings (`/settings/ai`)
- All AI keys are encrypted with AES-GCM 256-bit before IndexedDB storage
- Validate all external input, sanitize user data
- No `dangerouslySetInnerHTML` without sanitization

## Pull Request Process

1. Branch from the latest `main`
2. Create a focused branch such as `feat/my-feature`, `fix/my-bug`, or `docs/my-update`
3. Make your changes following the guidelines above
4. Ensure all required checks pass: `pnpm lint && pnpm type-check && pnpm test:run && pnpm build`
5. Commit with Conventional Commits: `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`, `perf:`, `ci:`

   Common scopes: `adapter`, `store`, `sankey`, `floorplan`, `ui`, `i18n`, `a11y`, `security`, `server`, `pwa`, `tauri`, `deps`

   Examples:
   - `feat(adapter): add Zigbee2MQTT retry logic`
   - `fix(sankey): correct node label overlap at narrow viewport`
   - `docs(security): update PBKDF2 iterations to 600k`
6. Open a PR against `main`
7. Resolve all review threads and keep the branch up to date with `main`

## GitHub Codespaces

The fastest way to start contributing is via Codespaces:

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/qnbs/Nexus-HEMS-Dash?quickstart=1)

**Recommended machine type:** 4-core / 8 GB RAM

The dev container includes Node.js 24, pnpm, Playwright (Chromium), Docker, and all VS Code extensions. Dependencies are installed automatically via `postCreateCommand`.

### Codespaces Secrets

Optional secrets you can configure in your [Codespaces settings](https://github.com/settings/codespaces):

| Secret                    | Purpose                     | Required         |
| ------------------------- | --------------------------- | ---------------- |
| `TIBBER_API_TOKEN`        | Tibber tariff API access    | No               |
| `CHROMATIC_PROJECT_TOKEN` | Storybook visual regression | No (Maintainers) |
| `SENTRY_AUTH_TOKEN`       | Error reporting source maps | No (Maintainers) |

AI API keys (OpenAI, Anthropic, Gemini, etc.) are managed through the in-app BYOK Settings page with AES-GCM 256-bit encryption — never store them as environment variables.

### Forwarded Ports

| Port | Service                              | Auto-Forward |
| ---- | ------------------------------------ | ------------ |
| 5173 | Vite Dev Server                      | Notify       |
| 3000 | Backend Server (Express + WebSocket) | Silent       |
| 6006 | Storybook                            | Silent       |
| 9090 | Prometheus                           | Ignore       |

## Branching Strategy

- `main` is the protected production branch. Direct pushes, force pushes, and deletions are not part of the normal workflow.
- All work starts in a short-lived branch created from the latest `main`.
- Preferred branch prefixes: `feat/`, `fix/`, `docs/`, `refactor/`, `test/`, `chore/`, `perf/`, `hotfix/`.
- Open a pull request back to `main` as soon as the change is reviewable. Draft PRs are encouraged for early feedback.
- Keep PRs focused. Large mixed PRs make Code Owner review, CodeQL findings, and release notes materially worse.

## Merge Strategy

- Squash merge is the default and recommended merge method.
- Rebase and merge is acceptable for a clean, already well-structured commit series.
- Merge commits should stay disabled on `main` to preserve linear history.
- This repository currently runs in a single-maintainer mode: approvals are optional and not a hard merge gate.
- Merge readiness is determined by passing required status checks and resolved review conversations.
- If the maintainer team grows, re-enable required approvals and Code Owner review as a policy hardening step.

## Pull Request Expectations

- Target branch: always `main`
- Required status checks: CI baseline, build, E2E, Lighthouse, security scanning, and supply-chain checks
- Required review hygiene: all review conversations resolved before merge
- Copilot review may be auto-requested for draft PRs and subsequent pushes; treat it as an additional review signal

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix      | Usage                                  |
| ----------- | -------------------------------------- |
| `feat:`     | New feature                            |
| `fix:`      | Bug fix                                |
| `test:`     | Adding or updating tests               |
| `docs:`     | Documentation changes                  |
| `refactor:` | Code restructuring (no feature change) |
| `perf:`     | Performance improvement                |
| `chore:`    | Build, CI, dependency updates          |

## Architecture Decision Records (ADRs)

Major technical decisions are documented as ADRs in `docs/adr/`. When proposing a change that affects:

- State management approach
- New external dependency (>50 KB gzipped)
- Protocol adapter architecture
- Security model changes
- Build toolchain changes

Create an ADR using this template:

```markdown
# ADR-NNN: Title

**Status:** Proposed | Accepted | Deprecated | Superseded
**Date:** YYYY-MM-DD
**Context:** Why is this decision needed?
**Decision:** What was decided?
**Consequences:** What are the trade-offs?
```

## Testing Strategy

| Layer        | Tool                             | Threshold                      | Focus                                                                                       |
| ------------ | -------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------- |
| **Unit**     | Vitest + jsdom                   | Statements ≥48%, Branches ≥40% | Store logic, adapters, crypto, formatters, circuit-breaker, tariff-providers, notifications |
| **E2E**      | Playwright (3 browsers + mobile) | All specs pass                 | User flows, navigation, settings                                                            |
| **A11y**     | @axe-core/playwright             | WCAG 2.2 AA on all routes      | Keyboard nav, contrast, ARIA                                                                |
| **Visual**   | Chromatic + Storybook            | No unreviewed changes          | Component regression                                                                        |
| **Security** | security-fuzz.test.ts + CodeQL   | Zero critical/high in runtime  | Input validation, injection                                                                 |

**When to write tests:**

- New adapter → unit test for connect/disconnect/data-flow + E2E smoke
- New utility/service → unit tests covering the happy path, error branches, and edge cases
- New UI component → Storybook story + a11y check
- Bug fix → regression test proving the fix
- Security change → fuzz test + hardening test

**Test file map** (`src/tests/`):

| File                         | Source module                 | Focus                                            |
| ---------------------------- | ----------------------------- | ------------------------------------------------ |
| `circuit-breaker.test.ts`    | `src/core/circuit-breaker.ts` | FSM states, execute(), callbacks                 |
| `tariff-providers.test.ts`   | `src/lib/tariff-providers.ts` | §14a grid fees, peak hours, applyDynamicGridFees |
| `notifications.test.ts`      | `src/lib/notifications.ts`    | Quiet hours, cooldown windows                    |
| `energy-context.test.tsx`    | `src/core/EnergyContext.tsx`  | Provider state, derived values                   |
| `energy-store.test.ts`       | `src/core/useEnergyStore.ts`  | Adapter bridge, getState() contract              |
| `store.test.ts`              | `src/store.ts`                | Zustand selectors, equality-skip guards          |
| `adapters.test.ts`           | `src/core/adapters/`          | Protocol adapter contracts                       |
| `send-command.test.ts`       | `src/core/command-safety.ts`  | OCPP/Victron pipeline, rate limiting             |
| `security-fuzz.test.ts`      | multiple                      | Input validation, injection resistance           |
| `security-hardening.test.ts` | multiple                      | Rate limits, CSP, auth                           |
| `optimizer.test.ts`          | `src/lib/optimizer.ts`        | LP schedule optimizer                            |
| `mpc-optimizer.test.ts`      | `src/lib/mpc-optimizer.ts`    | EMHASS-inspired MPC                              |
| `predictive-ai.test.ts`      | `src/lib/predictive-ai.ts`    | AI forecast pipeline                             |
| `pdf-report.test.ts`         | `src/lib/pdf-report.ts`       | PDF generation                                   |
| `sharing.test.ts`            | `src/lib/sharing.ts`          | Export/share flows                               |

## Performance Budgets

| Metric              | Budget   | Enforcement           |
| ------------------- | -------- | --------------------- |
| Total JS (gzipped)  | ≤1100 KB | `pnpm size` in CI     |
| Total CSS (gzipped) | ≤25 KB   | `pnpm size` in CI     |
| Framework chunk     | ≤85 KB   | size-limit            |
| Vendor Recharts     | ≤110 KB  | size-limit            |
| FCP                 | ≤3000 ms | Lighthouse CI         |
| LCP                 | ≤4000 ms | Lighthouse CI         |
| TBT                 | ≤400 ms  | Lighthouse CI (error) |
| CLS                 | ≤0.1     | Lighthouse CI (error) |
| Perf score          | ≥85%     | Lighthouse CI         |
| A11y score          | ≥90%     | Lighthouse CI         |

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
