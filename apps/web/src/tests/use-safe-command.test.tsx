import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdapterCommand } from '../core/adapters/EnergyAdapter';

const mockValidate = vi.fn();
const mockRequiresConfirmation = vi.fn();
const mockSend = vi.fn();
const mockAudit = vi.fn();

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, def?: unknown) => (typeof def === 'string' ? def : key),
  }),
}));
vi.mock('../components/ConfirmDialog', () => ({ ConfirmDialog: () => null }));
vi.mock('../core/command-safety', () => ({
  validateCommand: (c: AdapterCommand) => mockValidate(c),
  requiresConfirmation: (c: AdapterCommand) => mockRequiresConfirmation(c),
  describeCommand: () => ({ severity: 'warning', labelKey: 'safety.confirmGeneric' }),
  logCommandAudit: (entry: unknown) => mockAudit(entry),
}));
vi.mock('../core/useEnergyStore', () => ({
  sendAdapterCommand: (c: AdapterCommand) => mockSend(c),
}));
vi.mock('../store', () => ({
  useAppStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ adapterMode: 'mock' }),
}));

import { toast } from 'sonner';
import { useSafeCommand } from '../core/useSafeCommand';

const command = { type: 'SET_BATTERY_POWER', value: 2000 } as AdapterCommand;

describe('useSafeCommand — command feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequiresConfirmation.mockReturnValue(false);
  });

  it('rejects an invalid command with an error toast and does not send it', () => {
    mockValidate.mockReturnValue({ valid: false, error: 'value out of range' });
    const { result } = renderHook(() => useSafeCommand());

    act(() => result.current.execute(command));

    expect(mockSend).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('value out of range'));
    expect(mockAudit).toHaveBeenCalledWith(expect.objectContaining({ status: 'rejected' }));
  });

  it('executes a valid non-danger command and shows a success toast', async () => {
    mockValidate.mockReturnValue({ valid: true });
    const { result } = renderHook(() => useSafeCommand());

    act(() => result.current.execute(command));

    expect(mockSend).toHaveBeenCalledWith(command);
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('surfaces an execution failure as an error toast', async () => {
    mockValidate.mockReturnValue({ valid: true });
    mockSend.mockImplementation(() => {
      throw new Error('adapter offline');
    });
    const { result } = renderHook(() => useSafeCommand());

    act(() => result.current.execute(command));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('adapter offline')),
    );
    expect(mockAudit).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }));
  });
});
