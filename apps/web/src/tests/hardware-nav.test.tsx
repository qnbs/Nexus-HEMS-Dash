import { render, screen, waitFor } from '@testing-library/react';
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

describe('hardware registry navigation wiring (MED-19 discoverability)', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('registers /settings/hardware as a sidebar nav item', () => {
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

  it('navigates to /settings/hardware from the command palette', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <CommandPalette isOpen onClose={onClose} />
      </MemoryRouter>,
    );

    const option = screen.getByText('nav.hardware').closest('button');
    expect(option).not.toBeNull();
    await user.click(option as HTMLButtonElement);

    expect(mockNavigate).toHaveBeenCalledWith('/settings/hardware');
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

  it('navigates to /plugins from the command palette', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <CommandPalette isOpen onClose={onClose} />
      </MemoryRouter>,
    );

    const option = screen.getByText('nav.plugins').closest('button');
    await user.click(option as HTMLButtonElement);
    expect(mockNavigate).toHaveBeenCalledWith('/plugins');
  });

  it('surfaces the hardware page via the mobile More sheet', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MobileNavigation />
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId('mobile-more-btn'));
    const hardwareBtn = (await screen.findByText('nav.hardware')).closest('button');
    expect(hardwareBtn).not.toBeNull();
    await user.click(hardwareBtn as HTMLButtonElement);

    expect(mockNavigate).toHaveBeenCalledWith('/settings/hardware');
  });
});
