/**
 * Backend protocol command dispatch — shared types for live hardware control.
 *
 * Phase 5: bridges validated WS commands to command-capable IProtocolAdapter
 * instances (OCPP CSMS, OpenEMS, Home Assistant WS). HA MQTT service publish
 * remains deferred.
 */

import { WSCommandSchema, type WSCommandType } from '@nexus-hems/shared-types';
import { z } from 'zod';

/** Residential EVCS ceiling — aligns with WSCommand 25 kW safety cap. */
export const MAX_EV_POWER_W = 22_000;
export const MAX_EV_CURRENT_A = 32;

export const EvPowerValueSchema = z.number().finite().min(0).max(MAX_EV_POWER_W);
export const EvCurrentValueSchema = z.number().finite().min(0).max(MAX_EV_CURRENT_A);

export const ProtocolCommandRequestSchema = WSCommandSchema.and(
  z.object({
    chargePointId: z.string().trim().min(1).max(128).optional(),
  }),
).superRefine((cmd, ctx) => {
  if (cmd.type === 'SET_EV_POWER' && !EvPowerValueSchema.safeParse(cmd.value).success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'SET_EV_POWER requires a finite wattage between 0 and 22000',
    });
  }
  if (cmd.type === 'SET_EV_CURRENT' && !EvCurrentValueSchema.safeParse(cmd.value).success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'SET_EV_CURRENT requires a finite amp value between 0 and 32',
    });
  }
});
export type ValidatedProtocolCommandRequest = z.infer<typeof ProtocolCommandRequestSchema>;

export interface ProtocolCommandRequest {
  type: WSCommandType;
  value: number | string | boolean;
  /** OCPP CSMS: target charge point id when multiple sessions are connected. */
  chargePointId?: string;
}

export function validateProtocolCommandRequest(
  command: ProtocolCommandRequest,
): { valid: true; command: ValidatedProtocolCommandRequest } | { valid: false; error: string } {
  const parsed = ProtocolCommandRequestSchema.safeParse(command);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { valid: false, error: issue?.message ?? 'Invalid protocol command' };
  }
  return { valid: true, command: parsed.data };
}

export interface ProtocolCommandResult {
  /** True when a registered handler recognized the command type. */
  handled: boolean;
  /** True when the handler accepted and forwarded the command. */
  success: boolean;
  /** Adapter id that handled the command (when handled). */
  adapterId?: string;
  error?: string;
}

/** Optional capability mixed into backend protocol adapters. */
export interface IProtocolCommandHandler {
  supportsCommand(type: WSCommandType): boolean;
  sendCommand(command: ProtocolCommandRequest): Promise<ProtocolCommandResult>;
}

export function isProtocolCommandHandler(adapter: unknown): adapter is IProtocolCommandHandler {
  if (adapter === null || typeof adapter !== 'object') return false;
  const candidate = adapter as IProtocolCommandHandler;
  return (
    typeof candidate.supportsCommand === 'function' && typeof candidate.sendCommand === 'function'
  );
}
