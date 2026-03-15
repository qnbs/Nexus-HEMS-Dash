/**
 * useSafeCommand — Hook for sending hardware commands with safety guarantees
 *
 * Wraps sendAdapterCommand with:
 *   1. Zod schema validation
 *   2. Rate limiting
 *   3. Optional confirmation dialog (danger commands)
 *   4. 3-second timeout for auto-cancel
 *   5. Audit trail logging to IndexedDB
 *   6. Prometheus metric increment
 *
 * Usage:
 *   const { execute, pending, ConfirmationDialog } = useSafeCommand();
 *   execute({ type: 'SET_BATTERY_POWER', value: 2000 });
 */

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { AdapterCommand } from './adapters/EnergyAdapter';
import { sendAdapterCommand } from './useEnergyStore';
import {
  validateCommand,
  requiresConfirmation,
  logCommandAudit,
  describeCommand,
} from './command-safety';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { ConfirmVariant } from '../components/ConfirmDialog';

interface SafeCommandState {
  pending: boolean;
  lastError: string | null;
}

/** Pure audit log helper — extracted to avoid impure calls during render */
function auditLog(
  command: AdapterCommand,
  status: 'confirmed' | 'rejected' | 'executed' | 'failed' | 'emergency_stop',
  error?: string,
): void {
  void logCommandAudit({
    timestamp: Date.now(),
    commandType: command.type,
    value: command.value,
    targetDeviceId: command.targetDeviceId,
    status,
    error,
  });
}

async function executeCommand(
  command: AdapterCommand,
  setState: (s: SafeCommandState) => void,
): Promise<void> {
  setState({ pending: true, lastError: null });
  try {
    sendAdapterCommand(command);
    auditLog(command, 'executed');
    setState({ pending: false, lastError: null });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Command execution failed';
    auditLog(command, 'failed', errorMsg);
    setState({ pending: false, lastError: errorMsg });
  }
}

export function useSafeCommand() {
  const { t } = useTranslation();
  const [state, setState] = useState<SafeCommandState>({ pending: false, lastError: null });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<AdapterCommand | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateSetterRef = useRef(setState);

  useEffect(() => {
    stateSetterRef.current = setState;
  }, [setState]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  /** Execute a command — validates, optionally shows confirmation, then sends */
  const execute = (command: AdapterCommand) => {
    // Step 1: Validate
    const validation = validateCommand(command);
    if (!validation.valid) {
      stateSetterRef.current({
        pending: false,
        lastError: validation.error ?? 'Validation failed',
      });
      auditLog(command, 'rejected', validation.error);
      return;
    }

    // Step 2: Check if confirmation needed
    if (requiresConfirmation(command)) {
      setPendingCommand(command);
      setConfirmOpen(true);

      // 3-second auto-cancel timeout
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setConfirmOpen(false);
        setPendingCommand(null);
        auditLog(command, 'rejected', 'Confirmation timeout (3s)');
      }, 3000);
      return;
    }

    // Step 3: Direct execution (non-danger commands like KNX lights)
    void executeCommand(command, stateSetterRef.current);
  };

  const handleConfirm = async () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (pendingCommand) {
      auditLog(pendingCommand, 'confirmed');
      await executeCommand(pendingCommand, stateSetterRef.current);
    }
    setPendingCommand(null);
  };

  const handleCancel = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (pendingCommand) {
      auditLog(pendingCommand, 'rejected', 'User cancelled');
    }
    setPendingCommand(null);
    setConfirmOpen(false);
  };

  // Build dialog props from pending command
  const dialogVariant: ConfirmVariant = pendingCommand
    ? describeCommand(pendingCommand).severity
    : 'warning';

  const dialogTitle = pendingCommand
    ? t('safety.confirmCommandTitle', 'Gerätebefehl bestätigen')
    : '';

  const dialogMessage = pendingCommand
    ? t(describeCommand(pendingCommand).labelKey, {
        type: pendingCommand.type,
        value: String(pendingCommand.value),
      })
    : '';

  /** Render this in your component tree to show the confirmation dialog */
  const ConfirmationDialog = () => (
    <ConfirmDialog
      isOpen={confirmOpen}
      onClose={handleCancel}
      onConfirm={handleConfirm}
      title={dialogTitle}
      message={dialogMessage}
      confirmText={t('safety.executeCommand', 'Befehl ausführen')}
      cancelText={t('common.cancel', 'Abbrechen')}
      variant={dialogVariant}
      loading={state.pending}
    />
  );

  return {
    execute,
    pending: state.pending,
    lastError: state.lastError,
    ConfirmationDialog,
  };
}
