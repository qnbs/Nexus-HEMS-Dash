import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import MonitoringUnified from '../pages/Monitoring';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../components/layout/PageHeader', () => ({
  PageHeader: ({ title, actions }: { title: string; actions?: ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {actions}
    </div>
  ),
}));

vi.mock('../components/ui/PageCrossLinks', () => ({
  PageCrossLinks: () => <div data-testid="page-cross-links" />,
}));

vi.mock('../components/ui/HelpTooltip', () => ({
  HelpTooltip: () => null,
}));

vi.mock('../components/ui/EmptyState', () => ({
  EmptyState: () => <div data-testid="empty-state" />,
}));

vi.mock('../pages/MonitoringPage', () => ({
  default: () => <div data-testid="monitoring-detail-panel" />,
}));

const storeState = vi.hoisted(() => ({
  connected: true,
  debugMode: false,
}));

vi.mock('../store', () => ({
  useAppStoreShallow: (
    selector: (state: { connected: boolean; settings: { debugMode: boolean } }) => unknown,
  ) => selector({ connected: storeState.connected, settings: { debugMode: storeState.debugMode } }),
}));

describe('Monitoring unified page', () => {
  it('renders connected status and cross-links', () => {
    storeState.connected = true;
    render(<MonitoringUnified />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('monitoringUnified.title');
    expect(screen.getByText('common.connected')).toBeInTheDocument();
    expect(screen.getByText('monitoringUnified.systemHealthy')).toBeInTheDocument();
    expect(screen.getByTestId('page-cross-links')).toBeInTheDocument();
  });

  it('renders degraded status when disconnected', () => {
    storeState.connected = false;
    render(<MonitoringUnified />);

    expect(screen.getByText('common.disconnected')).toBeInTheDocument();
    expect(screen.getByText('monitoringUnified.systemDegraded')).toBeInTheDocument();
  });

  it('shows summary cards and toggles power user mode', async () => {
    storeState.connected = true;
    const user = userEvent.setup();
    render(<MonitoringUnified />);

    expect(screen.getByText('monitoringUnified.adaptersOnline')).toBeInTheDocument();
    expect(screen.getByText('5/5')).toBeInTheDocument();

    const toggle = screen.getByRole('checkbox');
    expect(toggle).not.toBeChecked();
    await user.click(toggle);
    expect(toggle).toBeChecked();
    expect(screen.queryByText('monitoringUnified.adaptersOnline')).not.toBeInTheDocument();
  });
});
