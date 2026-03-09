# Contributing to Nexus-HEMS Dash

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

```bash
# Clone and install
git clone https://github.com/qnbs/Nexus-HEMS-Dash.git
cd Nexus-HEMS-Dash
npm install --legacy-peer-deps

# Start dev server
npm run dev
```

### Prerequisites

- Node.js 22+
- npm 10+

## Project Structure

```
src/
├── components/       # React components (UI, panels, widgets)
│   └── ui/           # Shared UI primitives (Gauge, NeonCard, etc.)
├── core/             # Adapter pattern (EnergyAdapter, UnifiedEnergyModel)
│   └── adapters/     # Protocol adapters (Victron, Modbus, KNX, OCPP, EEBUS)
├── lib/              # Utilities (db, crypto, format, optimizer, voice, etc.)
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
- **Framer Motion** — All animations

### Code Quality

```bash
npm run lint          # ESLint (must pass, no warnings)
npm run format:check  # Prettier formatting
npm run type-check    # TypeScript strict mode
npx vitest run        # Unit tests (63+ tests, all must pass)
npm run build         # Production build (bundle < 600 KB)
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

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes following the guidelines above
4. Ensure all checks pass: `npm run lint && npm run type-check && npx vitest run && npm run build`
5. Commit with conventional commits: `feat:`, `fix:`, `test:`, `docs:`, `refactor:`
6. Open a PR against `main`

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Usage |
|--------|-------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `test:` | Adding or updating tests |
| `docs:` | Documentation changes |
| `refactor:` | Code restructuring (no feature change) |
| `perf:` | Performance improvement |
| `chore:` | Build, CI, dependency updates |

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
