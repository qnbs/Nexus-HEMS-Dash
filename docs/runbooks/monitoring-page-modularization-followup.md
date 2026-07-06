# Runbook: MonitoringPage Modularization Follow-up

## Status

Partially completed in PR #297 (`perf/lint-typecheck-speed`). The monolithic `apps/web/src/pages/MonitoringPage.tsx` was split into `apps/web/src/components/monitoring/` in commit `dd69c13`.

## What was done

- Extracted presentational components:
  - `StatusPill`, `ResourceGauge`, `VirtualEventLog`, `AdapterRow`, `MetricCard`, `AlertRuleItem`
- Extracted section components:
  - `SystemHealthBanner`, `MetricCardsGrid`, `LoadChartSection`, `ResourceSection`, `AdapterHealthSection`, `AlertRulesSection`, `EventLogSection`, `GrafanaSection`, `PageActions`
- Extracted shared types into `types.ts`
- Extracted shared helpers into `utils.ts`
- Introduced `useMonitoringData()` hook to keep the page component focused on orchestration
- Fixed DeepSource hygiene issues:
  - Removed non-null assertion (`events[i]!`)
  - Replaced `ok={true}` with `ok`
  - Renamed short variable names (`h`, `d`, `m`, `lat`, `s`)
  - Reduced cyclomatic complexity by splitting the render tree

## Remaining work (do not start before next dedicated session)

### 1. Unit / smoke tests for MonitoringPage

Create `apps/web/src/tests/monitoring-page.test.tsx` with the following coverage:

- Mock `react-i18next`, `../store`, `../core/useMetrics`, `motion/react`, `recharts`, `PageHeader`, `PageCrossLinks`
- Verify the page title renders
- Verify system health banner shows healthy/degraded state based on mocked `error`
- Verify metric cards render expected values from mocked energy data and metrics
- Verify adapter health and alert rules sections render
- Verify event log and Grafana sections render
- Verify `PageCrossLinks` renders when `embedded={false}` and is hidden when `embedded={true}`

Draft test skeleton (save for implementation):

```tsx
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import MonitoringPage from '../pages/MonitoringPage';

const mockEnergyData = { /* pvPower, gridPower, ... */ };

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));
vi.mock('../store', () => ({
  useAppStoreShallow: (selector) => selector({ energyData: mockEnergyData, connected: true }),
}));
vi.mock('../core/useMetrics', () => ({
  useMetrics: () => ({ families: [], health: { uptime: 3661, connections: 5 }, lastUpdated: 0, error: null }),
  getMetricFromSnapshot: () => null,
}));
vi.mock('../components/layout/PageHeader', () => ({
  PageHeader: ({ title, actions }: { title: string; actions?: ReactNode }) => (
    <div><h1>{title}</h1>{actions}</div>
  ),
}));
vi.mock('../components/ui/PageCrossLinks', () => ({
  PageCrossLinks: () => <div data-testid="page-cross-links" />,
}));
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: { children?: ReactNode }) => <div {...props}>{children}</div>,
    section: ({ children, ...props }: { children?: ReactNode }) => <section {...props}>{children}</section>,
  },
}));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Area: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
  defs: () => null,
  linearGradient: () => null,
  stop: () => null,
}));

describe('MonitoringPage', () => {
  it('renders the monitoring dashboard', () => {
    render(<MonitoringPage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    // add assertions for metrics, sections, cross-links
  });
});
```

### 2. Optional further decomposition

- Move `buildCoreAdapters`, `buildContribAdapters`, `buildEventLog`, `buildMetricCards`, `buildAlertRules`, `calculateStatuses` into a dedicated `useMonitoringData.ts` file next to the page.
- Consider moving the data builders into the backend or a static config file if they become stable.

### 3. Acceptance criteria

- `pnpm --filter @nexus-hems/web test monitoring-page.test.tsx` passes
- `pnpm lint` and `pnpm type-check` remain green
- Codecov patch coverage does not drop

## Owner

AI coding agent / frontend owner.

## Related

- `docs/runbooks/pr-review-correction-loop.md`
- `docs/runbooks/deepsource-integration.md`
