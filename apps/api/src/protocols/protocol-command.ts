/**
 * Backend protocol command dispatch — shared types for live hardware control.
 *
 * Phase 5: bridges validated WS commands to command-capable IProtocolAdapter
 * instances (OCPP CSMS, OpenEMS, Home Assistant WS). HA MQTT service publish
 * remains deferred.
 */

import { type WSCommand, WSCommandSchema, type WSCommandType } from '@nexus-hems/shared-types';

export const ProtocolCommandRequestSchema = WSCommandSchema;
export type ValidatedProtocolCommandRequest = WSCommand;

export interface ProtocolCommandRequest {
  type: WSCommandType;
  value: number | string | boolean;
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
