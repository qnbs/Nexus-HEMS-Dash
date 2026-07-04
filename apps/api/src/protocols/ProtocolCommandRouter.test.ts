import { afterEach, describe, expect, it } from 'vitest';
import {
  clearProtocolCommandHandlers,
  dispatchProtocolCommand,
  getProtocolCommandHandlerCount,
  registerProtocolCommandHandler,
} from './ProtocolCommandRouter.js';
import type { IProtocolCommandHandler, ProtocolCommandRequest } from './protocol-command.js';

function stubHandler(
  id: string,
  supported: string[],
  result: { success: boolean; error?: string },
): IProtocolCommandHandler {
  return {
    supportsCommand: (type) => supported.includes(type),
    sendCommand: async (_command: ProtocolCommandRequest) => ({
      handled: true,
      success: result.success,
      adapterId: id,
      ...(result.error ? { error: result.error } : {}),
    }),
  };
}

describe('ProtocolCommandRouter', () => {
  afterEach(() => {
    clearProtocolCommandHandlers();
  });

  it('returns handled:false when no handlers are registered', async () => {
    const result = await dispatchProtocolCommand({ type: 'SET_EV_POWER', value: 1000 });
    expect(result).toEqual({ handled: false, success: false });
  });

  it('dispatches to the first handler that supports the command type', async () => {
    registerProtocolCommandHandler(
      stubHandler('openems', ['SET_BATTERY_POWER'], { success: true }),
    );
    registerProtocolCommandHandler(stubHandler('ocpp', ['SET_EV_POWER'], { success: true }));

    const result = await dispatchProtocolCommand({ type: 'SET_EV_POWER', value: 7200 });
    expect(result).toEqual({ handled: true, success: true, adapterId: 'ocpp' });
    expect(getProtocolCommandHandlerCount()).toBe(2);
  });

  it('skips handlers that do not support the command type', async () => {
    registerProtocolCommandHandler(stubHandler('ha', ['START_CHARGING'], { success: true }));

    const result = await dispatchProtocolCommand({ type: 'SET_EV_CURRENT', value: 16 });
    expect(result).toEqual({ handled: false, success: false });
  });

  it('propagates handler failure as handled with success:false', async () => {
    registerProtocolCommandHandler(
      stubHandler('ocpp', ['STOP_CHARGING'], { success: false, error: 'No active transaction' }),
    );

    const result = await dispatchProtocolCommand({ type: 'STOP_CHARGING', value: true });
    expect(result.handled).toBe(true);
    expect(result.success).toBe(false);
    expect(result.error).toBe('No active transaction');
  });
});
