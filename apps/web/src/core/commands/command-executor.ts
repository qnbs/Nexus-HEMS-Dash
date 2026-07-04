import { toast } from 'sonner';
import type { CommandContext, ResolvedCommand } from './types';

export interface ExecuteResult {
  ok: boolean;
  reason?: 'readonly' | 'scope' | 'disabled' | 'error';
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
    return { ok: false, reason: cmd.blockedInReadOnly && ctx.isReadOnly ? 'readonly' : 'disabled' };
  }

  try {
    await cmd.execute(ctx);
    ctx.actions.recordUsage(cmd.id);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Command failed';
    toast.error(message);
    return { ok: false, reason: 'error' };
  }
}
