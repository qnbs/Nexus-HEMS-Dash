/**
 * Backend protocol command dispatch — shared types for live hardware control.
 *
 * Phase 5: bridges validated WS commands to command-capable IProtocolAdapter
 * instances (OCPP CSMS, OpenEMS, Home Assistant WS). HA MQTT service publish
 * remains deferred.
 */

import type { WSCommandType } from '@nexus-hems/shared-types';

export interface ProtocolCommandRequest {
  type: WSCommandType;
  value: number | string | boolean;
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
