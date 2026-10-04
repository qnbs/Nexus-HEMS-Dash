import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  dispatchControllerOutputs,
  resetControllerCommandBridgeState,
} from '../core/controller-command-bridge';

vi.mock('../core/hardware-command-dispatch', () => ({
  dispatchHardwareCommand: vi.fn().mockResolvedValue(true),
}));

import { dispatchHardwareCommand } from '../core/hardware-command-dispatch';

describe('controller-command-bridge', () => {
  beforeEach(() => {
    resetControllerCommandBridgeState();
    vi.mocked(dispatchHardwareCommand).mockClear();
  });

  it('dispatches SET_HEAT_PUMP_MODE from sgReadyMode output', async () => {
    const accepted = await dispatchControllerOutputs({
      sgReadyMode: 3,
      reason: 'test',
      confidence: 0.9,
    });
    expect(accepted).toBe(1);
    expect(dispatchHardwareCommand).toHaveBeenCalledWith({ type: 'SET_HEAT_PUMP_MODE', value: 3 });
  });

  it('debounces repeated identical sgReadyMode within 60s', async () => {
    await dispatchControllerOutputs({ sgReadyMode: 3, reason: 'a', confidence: 0.9 });
    await dispatchControllerOutputs({ sgReadyMode: 3, reason: 'b', confidence: 0.9 });
    expect(dispatchHardwareCommand).toHaveBeenCalledTimes(1);
  });

  it('dispatches immediately when sgReadyMode value changes', async () => {
    await dispatchControllerOutputs({ sgReadyMode: 2, reason: 'a', confidence: 0.9 });
    await dispatchControllerOutputs({ sgReadyMode: 4, reason: 'b', confidence: 0.9 });
    expect(dispatchHardwareCommand).toHaveBeenCalledTimes(2);
    expect(dispatchHardwareCommand).toHaveBeenLastCalledWith({ type: 'SET_HEAT_PUMP_MODE', value: 4 });
  });

  it('dispatches battery and EV commands when present', async () => {
    const accepted = await dispatchControllerOutputs({
      essPowerW: 2000,
      evCurrentA: 12,
      reason: 'merged',
      confidence: 0.8,
    });
    expect(accepted).toBe(2);
    expect(dispatchHardwareCommand).toHaveBeenCalledWith({ type: 'SET_BATTERY_POWER', value: 2000 });
    expect(dispatchHardwareCommand).toHaveBeenCalledWith({ type: 'SET_EV_CURRENT', value: 12 });
  });
});
