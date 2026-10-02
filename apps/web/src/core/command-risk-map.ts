import type { AdapterCommandType } from './adapters/EnergyAdapter';

export type CommandRiskClass =
  | 'informational'
  | 'user_preference'
  | 'moderate_physical'
  | 'dangerous_physical'
  | 'admin_grid'
  | 'emergency'
  | 'autonomous_controller';

export type CommandReplayPolicy =
  | 'never_auto'
  | 'short_ttl_only'
  | 'precondition_required'
  | 'server_intent_only';

export interface CommandRiskEntry {
  risk: CommandRiskClass;
  replay: CommandReplayPolicy;
  requiresConfirmation: boolean;
}

/**
 * Exhaustive risk/replay metadata for frontend adapter commands (audit wave 2).
 * CI: `command-risk-map.test.ts` must stay aligned with `commandSchemas`.
 */
export const COMMAND_RISK_MAP: Record<AdapterCommandType, CommandRiskEntry> = {
  SET_EV_POWER: {
    risk: 'dangerous_physical',
    replay: 'short_ttl_only',
    requiresConfirmation: true,
  },
  SET_EV_CURRENT: {
    risk: 'dangerous_physical',
    replay: 'short_ttl_only',
    requiresConfirmation: true,
  },
  START_CHARGING: {
    risk: 'dangerous_physical',
    replay: 'short_ttl_only',
    requiresConfirmation: true,
  },
  STOP_CHARGING: {
    risk: 'dangerous_physical',
    replay: 'short_ttl_only',
    requiresConfirmation: true,
  },
  SET_V2X_DISCHARGE: {
    risk: 'dangerous_physical',
    replay: 'never_auto',
    requiresConfirmation: true,
  },
  SET_EV_MODE: { risk: 'moderate_physical', replay: 'short_ttl_only', requiresConfirmation: false },
  SET_EV_TARGET_SOC: {
    risk: 'moderate_physical',
    replay: 'short_ttl_only',
    requiresConfirmation: false,
  },
  SET_EV_PHASES: {
    risk: 'moderate_physical',
    replay: 'short_ttl_only',
    requiresConfirmation: false,
  },
  SET_EV_MIN_CURRENT: {
    risk: 'moderate_physical',
    replay: 'short_ttl_only',
    requiresConfirmation: false,
  },
  SET_SMART_COST_LIMIT: {
    risk: 'user_preference',
    replay: 'server_intent_only',
    requiresConfirmation: false,
  },
  SET_V2G_BPT_PARAMS: {
    risk: 'dangerous_physical',
    replay: 'never_auto',
    requiresConfirmation: true,
  },
  SET_HEAT_PUMP_MODE: {
    risk: 'dangerous_physical',
    replay: 'short_ttl_only',
    requiresConfirmation: true,
  },
  SET_HEAT_PUMP_POWER: {
    risk: 'dangerous_physical',
    replay: 'short_ttl_only',
    requiresConfirmation: true,
  },
  SET_BATTERY_POWER: {
    risk: 'dangerous_physical',
    replay: 'short_ttl_only',
    requiresConfirmation: true,
  },
  SET_BATTERY_MODE: {
    risk: 'dangerous_physical',
    replay: 'short_ttl_only',
    requiresConfirmation: true,
  },
  SET_GRID_LIMIT: { risk: 'admin_grid', replay: 'never_auto', requiresConfirmation: true },
  KNX_TOGGLE_LIGHTS: {
    risk: 'moderate_physical',
    replay: 'precondition_required',
    requiresConfirmation: false,
  },
  KNX_SET_TEMPERATURE: {
    risk: 'moderate_physical',
    replay: 'precondition_required',
    requiresConfirmation: false,
  },
  KNX_TOGGLE_WINDOW: {
    risk: 'moderate_physical',
    replay: 'precondition_required',
    requiresConfirmation: false,
  },
  OPENADR_ACKNOWLEDGE_EVENT: {
    risk: 'moderate_physical',
    replay: 'server_intent_only',
    requiresConfirmation: false,
  },
  OPENADR_SUBMIT_REPORT: {
    risk: 'informational',
    replay: 'server_intent_only',
    requiresConfirmation: false,
  },
  VPP_OFFER_FLEX: { risk: 'admin_grid', replay: 'never_auto', requiresConfirmation: true },
};

export function assertCommandRiskMapExhaustive(commandTypes: readonly AdapterCommandType[]): void {
  for (const type of commandTypes) {
    if (!(type in COMMAND_RISK_MAP)) {
      throw new Error(`COMMAND_RISK_MAP missing entry for ${type}`);
    }
  }
}
