import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Referenced inside the hoisted vi.mock factory below.
const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) =>
      typeof opts === 'object' && opts?.defaultValue ? opts.defaultValue : key,
  }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

// `__APP_VERSION__` is a Vite compile-time define; provide it for the jsdom run.
vi.stubGlobal('__APP_VERSION__', '0.0.0-test');

import { allNavItems, Sidebar } from '../components/layout/Sidebar';
import { CommandPalette } from '../components/ui/CommandPalette';
import { MobileNavigation } from '../components/ui/MobileNavigation';

beforeEach(() => {
  mockNavigate.mockClear();
});

describe('Sidebar navigation', () => {
  it('registers /settings/hardware as a sidebar nav item (MED-19 discoverability)', () => {
    const item = allNavItems.find((i) => i.path === '/settings/hardware');
    expect(item).toBeDefined();
    expect(item?.labelKey).toBe('nav.hardware');
  });

  it('renders the hardware link inside the sidebar Settings group', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: /nav\.hardware/ });
    expect(link).toHaveAttribute('href', '/settings/hardware');
  });

  it('collapses and expands via the toggle button', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: 'nav.collapseSidebar' }));
    expect(screen.getByRole('button', { name: 'nav.expandSidebar' })).toBeInTheDocument();
  });

  it('marks the hardware nav link active on /settings/hardware', () => {
    render(
      <MemoryRouter initialEntries={['/settings/hardware']}>
        <Sidebar />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: /nav\.hardware/ });
    expect(link.className).toMatch(/sidebar-link-active|primary/);
  });
});

describe('CommandPalette navigation', () => {
  const navPaths: Record<string, string> = {
    'nav-dashboard': '/',
    'nav-energy-flow': '/energy-flow',
    'nav-devices': '/devices',
    'nav-ai': '/optimization-ai',
    'nav-ai-settings': '/settings/ai',
    'nav-tariffs': '/tariffs',
    'nav-analytics': '/analytics',
    'nav-monitoring': '/monitoring',
    'nav-settings': '/settings',
    'nav-hardware': '/settings/hardware',
    'nav-plugins': '/plugins',
    'nav-help': '/help',
    'device-grid': '/energy-flow',
  };

  it('routes every navigation command to its target path', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(
      <MemoryRouter>
        <CommandPalette isOpen onClose={onClose} />
      </MemoryRouter>,
    );

    for (const [id, path] of Object.entries(navPaths)) {
      const btn = container.querySelector(`#cmd-${id}`) as HTMLButtonElement | null;
      expect(btn, `command ${id} should render`).not.toBeNull();
      await user.click(btn as HTMLButtonElement);
      expect(mockNavigate).toHaveBeenCalledWith(path);
    }
    expect(onClose).toHaveBeenCalled();
  });

  it('invokes the optimize and export actions', async () => {
    const user = userEvent.setup();
    const onOptimize = vi.fn();
    const onExportReport = vi.fn();
    const { container } = render(
      <MemoryRouter>
        <CommandPalette
          isOpen
          onClose={vi.fn()}
          onOptimize={onOptimize}
          onExportReport={onExportReport}
        />
      </MemoryRouter>,
    );

    await user.click(container.querySelector('#cmd-optimize') as HTMLButtonElement);
    await user.click(container.querySelector('#cmd-export-report') as HTMLButtonElement);
    expect(onOptimize).toHaveBeenCalled();
    expect(onExportReport).toHaveBeenCalled();
  });

  it('supports arrow-key selection and Enter activation', () => {
    const onOptimize = vi.fn();
    render(
      <MemoryRouter>
        <CommandPalette isOpen onClose={vi.fn()} onOptimize={onOptimize} />
      </MemoryRouter>,
    );
    // Start at index 0 (optimize); Down then Up returns to it; Enter activates.
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onOptimize).toHaveBeenCalled();
  });

  it('shows the empty state when nothing matches the search', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CommandPalette isOpen onClose={vi.fn()} />
      </MemoryRouter>,
    );
    await user.type(screen.getByRole('combobox'), 'zzzz-no-command-zzzz');
    expect(screen.getByText('command.noResults')).toBeInTheDocument();
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <CommandPalette isOpen onClose={onClose} />
      </MemoryRouter>,
    );
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('does not auto-focus the search input on touch viewports (no keyboard pop)', async () => {
    // jsdom has no window.matchMedia, so autoFocusInput resolves falsy → the
    // mobile path focuses the dialog container instead of the text input.
    render(
      <MemoryRouter>
        <CommandPalette isOpen onClose={vi.fn()} />
      </MemoryRouter>,
    );
    const input = screen.getByRole('combobox');
    await waitFor(() => {
      // Focus moved into the dialog (onto the sentinel), not onto the text input.
      expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
    });
    expect(document.activeElement).not.toBe(input);
  });
});

describe('MobileNavigation', () => {
  it('navigates from the primary bottom-bar items', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MobileNavigation />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: 'nav.energyFlow' }));
    expect(mockNavigate).toHaveBeenCalledWith('/energy-flow');
  });

  it('opens the More sheet, navigates to hardware, and closes', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MobileNavigation />
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId('mobile-more-btn'));
    // The overflow sheet now also exposes plugins and AI keys.
    expect(await screen.findByText('nav.plugins')).toBeInTheDocument();
    expect(screen.getByText('nav.aiKeys')).toBeInTheDocument();

    await user.click(
      (await screen.findByText('nav.hardware')).closest('button') as HTMLButtonElement,
    );
    expect(mockNavigate).toHaveBeenCalledWith('/settings/hardware');
  });

  it('closes the More sheet via the close button', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MobileNavigation />
      </MemoryRouter>,
    );
    await user.click(screen.getByTestId('mobile-more-btn'));
    const closeBtn = await screen.findByRole('button', { name: 'common.close' });
    await user.click(closeBtn);
    await waitFor(() => {
      expect(screen.queryByText('nav.aiKeys')).not.toBeInTheDocument();
    });
  });

  it('highlights the active primary tab for the current route', () => {
    render(
      <MemoryRouter initialEntries={['/tariffs']}>
        <MobileNavigation />
      </MemoryRouter>,
    );
    const tariffsBtn = screen.getByRole('button', { name: 'nav.tariffs' });
    expect(tariffsBtn).toHaveAttribute('aria-current', 'page');
    expect(tariffsBtn.className).toMatch(/text-\(--color-primary\)/);
  });

  it('highlights the More button when a overflow route is active', () => {
    render(
      <MemoryRouter initialEntries={['/monitoring']}>
        <MobileNavigation />
      </MemoryRouter>,
    );
    const moreBtn = screen.getByTestId('mobile-more-btn');
    expect(moreBtn.className).toMatch(/text-\(--color-primary\)/);
  });
});
