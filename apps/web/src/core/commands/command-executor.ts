import { toast } from 'sonner';
import type { CommandContext, ResolvedCommand } from './types';

export interface ExecuteResult {
  ok: boolean;
  reason?: 'readonly' | 'scope' | 'disabled' | 'error';
}

function resolveDisabledReason(
  cmd: ResolvedCommand,
  ctx: CommandContext,
): NonNullable<ExecuteResult['reason']> {
  if (cmd.blockedInReadOnly && ctx.isReadOnly) return 'readonly';
  if (cmd.disabledReasonKey === 'command.insufficientScope') return 'scope';
  return 'disabled';
}

/**
 * Execute a resolved palette command with safety gates and usage tracking.
 */
export async function executeResolvedCommand(
  cmd: ResolvedCommand,
  ctx: CommandContext,
): Promise<ExecuteResult> {
  if (cmd.disabled) {
    if (cmd.disabledReasonKey) {
      toast.error(ctx.t(cmd.disabledReasonKey));
    }
    return { ok: false, reason: resolveDisabledReason(cmd, ctx) };
  }

  try {
    await cmd.execute(ctx);
  } catch (err) {
    const message = err instanceof Error ? err.message : ctx.t('command.executeFailed');
    toast.error(message);
    return { ok: false, reason: 'error' };
  }

  ctx.actions.recordUsage(cmd.id);
  return { ok: true };
}
