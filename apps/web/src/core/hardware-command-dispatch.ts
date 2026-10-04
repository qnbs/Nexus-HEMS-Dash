/**
 * Unified hardware command entry for automation paths (controllers, OpenADR).
 * UI commands use `useSafeCommand` → `sendAdapterCommand` directly.
 */

import { getBrowserControlAuthority } from '../lib/adapter-mode';
import { logger } from '../lib/logger';
import type { AdapterCommand } from './adapters/EnergyAdapter';
import { sendAdapterCommand } from './useEnergyStore';

/**
 * Dispatch a hardware command when browser adapters own control authority.
 * When the backend owns actuation (live / backend WS), returns `false` and logs —
 * server-side dispatch is tracked under FUP-OADR-01 / backend command APIs.
 */
export async function dispatchHardwareCommand(command: AdapterCommand): Promise<boolean> {
  const authority = getBrowserControlAuthority();
  if (!authority.browserDirectControlAllowed) {
    if (authority.source === 'backend' || authority.denyReason === 'backend_unresolved') {
      logger.warn(
        'Automated hardware command blocked — backend control authority is active',
        'hardware-command-dispatch',
        { type: command.type, denyReason: authority.denyReason },
      );
    }
    return false;
  }
  return sendAdapterCommand(command);
}
