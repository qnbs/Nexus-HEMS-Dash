/**
 * useLegacySendCommand — Backward-compatible wrapper
 *
 * Bridges the old `sendCommand(type: CommandType, value: number)` API
 * to the new adapter-based command routing with safety validation.
 *
 * Usage: Drop-in replacement for `useWebSocket().sendCommand` in pages
 * that still use ControlPanel with the legacy signature.
 */

import type { CommandType } from '../types';
import type { AdapterCommand } from './adapters/EnergyAdapter';
import { sendAdapterCommand } from './useEnergyStore';

/** Map legacy CommandType to AdapterCommand */
function toLegacyCommand(type: CommandType, value: number): AdapterCommand {
  const mapping: Record<CommandType, AdapterCommand> = {
    SET_EV_POWER: { type: 'SET_EV_POWER', value },
    SET_HEAT_PUMP_POWER: { type: 'SET_HEAT_PUMP_POWER', value },
    SET_BATTERY_POWER: { type: 'SET_BATTERY_POWER', value },
    TOGGLE_KNX_LIGHTS: { type: 'KNX_TOGGLE_LIGHTS', value: value === 1 },
    TOGGLE_KNX_WINDOW: { type: 'KNX_TOGGLE_WINDOW', value: value === 1 },
    SET_ROOM_TEMPERATURE: { type: 'KNX_SET_TEMPERATURE', value },
  };
  return mapping[type] ?? { type: 'SET_EV_POWER', value };
}

export function useLegacySendCommand() {
  const sendCommand = (type: CommandType, value: number) => {
    // Commands go through sendAdapterCommand which validates via Zod + rate limiting + audit
    sendAdapterCommand(toLegacyCommand(type, value));
  };

  return { sendCommand };
}
