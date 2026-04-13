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

- **React 19** + **Vite 6** — No Next.js, no Remix
- **Zustand** — No Redux, no MobX
- **D3.js** for Sankey — No alternative charting for energy flow
- **Tailwind CSS 4** — Neo-Energy Cyber-Glassmorphism design system
- **Dexie.js** — IndexedDB for offline-first persistence
- **motion** — All animations

### Code Quality

```bash
pnpm lint             # ESLint (must pass, no warnings)
pnpm format:check     # Prettier formatting
pnpm type-check       # TypeScript strict mode
npx vitest run        # Unit tests (63+ tests, all must pass)
pnpm build            # Production build (bundle < 600 KB)
```

### i18n

All user-facing text must be translated in both locales:

- [src/locales/en.ts](src/locales/en.ts) — English
- [src/locales/de.ts](src/locales/de.ts) — German

Use `useTranslation()` hook, never hardcode strings.

### Accessibility (WCAG 2.2 AA)

- Semantic HTML (`<nav>`, `<main>`, `<button>`, etc.)
- ARIA labels on all interactive elements
- Focus-visible styles (`.focus-ring` utility)
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader support (`aria-live` for real-time data)

### Themes

5 themes are available. Always use CSS variables (`var(--color-*)`) instead of hardcoded colors. See [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).

### Security

- **No API keys in source code or environment variables** — Use BYOK settings (`/settings/ai`)
- All AI keys are encrypted with AES-GCM 256-bit before IndexedDB storage
- Validate all external input, sanitize user data
- No `dangerouslySetInnerHTML` without sanitization

## Pull Request Process

1. Branch from the latest `main`
2. Create a focused branch such as `feat/my-feature`, `fix/my-bug`, or `docs/my-update`
3. Make your changes following the guidelines above
4. Ensure all required checks pass: `pnpm lint && pnpm type-check && npx vitest run && pnpm build`
5. Commit with Conventional Commits: `feat:`, `fix:`, `test:`, `docs:`, `refactor:`
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

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
