/**
 * BaseAdapter — Abstract base class for all HEMS protocol adapters
 *
 * Every concrete adapter (Victron, Modbus, KNX, OCPP, EEBUS) extends this
 * class to get safety-critical features built-in:
 *
 *   1. Circuit Breaker  — per-adapter, auto-opens after N failures
 *   2. Zod Validation   — every command validated before dispatch
 *   3. Double-Confirm   — injectable confirmation delegate for danger commands
 *   4. Audit Trail      — every command logged to IndexedDB + Prometheus
 *   5. Reconnect Logic  — exponential backoff with jitter, navigator.onLine
 *   6. Lifecycle Mgmt   — connect/disconnect/destroy with guard checks
 *
 * Subclasses implement three abstract methods:
 *   _connect()     — establish the actual connection
 *   _disconnect()  — close the actual connection
 *   _sendCommand() — send a command to the hardware
 */

import type {
  EnergyAdapter,
  AdapterStatus,
  AdapterCapability,
  AdapterConnectionConfig,
  AdapterCommand,
  AdapterDataCallback,
  AdapterStatusCallback,
  UnifiedEnergyModel,
} from './EnergyAdapter';
import { CircuitBreaker, type CircuitBreakerConfig } from '../circuit-breaker';
import { validateCommand, logCommandAudit, requiresConfirmation } from '../command-safety';

// ─── Error types ─────────────────────────────────────────────────────

export class CommandCancelledError extends Error {
  constructor(commandType: string) {
    super(`Command "${commandType}" was cancelled by the user`);
    this.name = 'CommandCancelledError';
  }
}

// ─── Confirmation delegate ───────────────────────────────────────────

/**
 * Injected by the React layer (e.g. useAdapterBridge) to show a
 * Radix UI confirmation dialog for danger commands.
 */
export type CommandConfirmFn = (command: AdapterCommand) => Promise<boolean>;

// ─── Default reconnect config ────────────────────────────────────────

const BASE_RECONNECT = {
  enabled: true,
  initialDelayMs: 1500,
  maxDelayMs: 60_000,
  backoffMultiplier: 2,
};

// ─── Abstract Base Class ─────────────────────────────────────────────

export abstract class BaseAdapter implements EnergyAdapter {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly capabilities: AdapterCapability[];

  protected _status: AdapterStatus = 'disconnected';
  protected dataCallbacks: AdapterDataCallback[] = [];
  protected statusCallbacks: AdapterStatusCallback[] = [];
  protected snapshot: Partial<UnifiedEnergyModel> = {};
  protected destroyed = false;
  protected reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  protected retryDelay: number;
  protected config: AdapterConnectionConfig;

  /** Public circuit breaker — the store reads this for reactive UI state */
  readonly circuitBreaker: CircuitBreaker;

  /** Injected by the React layer for double-confirm on danger commands */
  confirmCommand?: CommandConfirmFn;

  constructor(
    config: AdapterConnectionConfig,
    circuitBreakerConfig?: Partial<CircuitBreakerConfig>,
  ) {
    this.config = config;
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      cooldownMs: 30_000,
      halfOpenSuccessThreshold: 2,
      ...circuitBreakerConfig,
    });
    this.retryDelay = config.reconnect?.initialDelayMs ?? BASE_RECONNECT.initialDelayMs;
  }

  // ─── Public getters ─────────────────────────────────────────────

  get status(): AdapterStatus {
    return this._status;
  }

  // ─── Lifecycle (Template Method) ────────────────────────────────

  async connect(): Promise<void> {
    if (this._status === 'connected' || this._status === 'connecting') return;
    if (!this.circuitBreaker.canExecute()) return;
    this.destroyed = false;
    await this._connect();
  }

  async disconnect(): Promise<void> {
    this.clearReconnect();
    await this._disconnect();
    this.setStatus('disconnected');
  }

  destroy(): void {
    this.destroyed = true;
    this.clearReconnect();
    this._cleanup();
    this.dataCallbacks = [];
    this.statusCallbacks = [];
    this.circuitBreaker.destroy();
  }

  // ─── Subscriptions ──────────────────────────────────────────────

  onData(callback: AdapterDataCallback): void {
    this.dataCallbacks.push(callback);
  }

  onStatus(callback: AdapterStatusCallback): void {
    this.statusCallbacks.push(callback);
  }

  // ─── Command dispatch (Template Method) ─────────────────────────

  /**
   * Send a command through the full safety pipeline:
   *   Zod validation → Circuit breaker check → Double-confirm → Online check → Execute + Audit
   */
  async sendCommand(command: AdapterCommand): Promise<boolean> {
    // 1. Validate via Zod schema
    const validation = validateCommand(command);
    if (!validation.valid) {
      void logCommandAudit({
        timestamp: Date.now(),
        commandType: command.type,
        value: command.value,
        targetDeviceId: command.targetDeviceId,
        status: 'rejected',
        error: validation.error,
        adapterId: this.id,
      });
      return false;
    }

    // 2. Check circuit breaker
    if (!this.circuitBreaker.canExecute()) {
      void logCommandAudit({
        timestamp: Date.now(),
        commandType: command.type,
        value: command.value,
        targetDeviceId: command.targetDeviceId,
        status: 'rejected',
        error: 'Circuit breaker is open',
        adapterId: this.id,
      });
      return false;
    }

    // 3. Double-confirm for danger commands (delegate from React layer)
    if (requiresConfirmation(command) && this.confirmCommand) {
      const confirmed = await this.confirmCommand(command);
      if (!confirmed) {
        void logCommandAudit({
          timestamp: Date.now(),
          commandType: command.type,
          value: command.value,
          targetDeviceId: command.targetDeviceId,
          status: 'rejected',
          error: 'User cancelled',
          adapterId: this.id,
        });
        throw new CommandCancelledError(command.type);
      }
    }

    // 4. Check online connectivity
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      void logCommandAudit({
        timestamp: Date.now(),
        commandType: command.type,
        value: command.value,
        targetDeviceId: command.targetDeviceId,
        status: 'failed',
        error: 'Device is offline',
        adapterId: this.id,
      });
      return false;
    }

    // 5. Execute through circuit breaker with audit
    try {
      const result = await this.circuitBreaker.execute(() => this._sendCommand(command));
      void logCommandAudit({
        timestamp: Date.now(),
        commandType: command.type,
        value: command.value,
        targetDeviceId: command.targetDeviceId,
        status: result ? 'executed' : 'failed',
        adapterId: this.id,
        error: result ? undefined : 'Adapter rejected command',
      });
      return result;
    } catch (error) {
      void logCommandAudit({
        timestamp: Date.now(),
        commandType: command.type,
        value: command.value,
        targetDeviceId: command.targetDeviceId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        adapterId: this.id,
      });
      return false;
    }
  }

  getSnapshot(): Partial<UnifiedEnergyModel> {
    return { ...this.snapshot };
  }

  // ─── Protected helpers (shared by all adapters) ─────────────────

  protected setStatus(status: AdapterStatus, error?: string): void {
    this._status = status;
    for (const cb of this.statusCallbacks) cb(status, error);
  }

  protected emitData(model: Partial<UnifiedEnergyModel>): void {
    this.snapshot = model;
    for (const cb of this.dataCallbacks) cb(model);
  }

  protected scheduleReconnect(): void {
    this.clearReconnect();
    if (this.destroyed) return;

    const reconnectCfg = this.config.reconnect ?? BASE_RECONNECT;
    if (!reconnectCfg.enabled) return;

    this.reconnectTimer = setTimeout(() => {
      const maxDelay = reconnectCfg.maxDelayMs ?? BASE_RECONNECT.maxDelayMs;
      const multiplier = reconnectCfg.backoffMultiplier ?? BASE_RECONNECT.backoffMultiplier;
      this.retryDelay = Math.min(this.retryDelay * multiplier, maxDelay);
      void this._connect();
    }, this.retryDelay);
  }

  protected resetRetryDelay(): void {
    this.retryDelay = this.config.reconnect?.initialDelayMs ?? BASE_RECONNECT.initialDelayMs;
  }

  protected clearReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // ─── Abstract methods (subclasses MUST implement) ───────────────

  /** Establish the actual connection (WebSocket, HTTP polling, etc.) */
  protected abstract _connect(): Promise<void>;

  /** Close the actual connection gracefully */
  protected abstract _disconnect(): Promise<void>;

  /** Send a single command to the hardware. Return true if handled. */
  protected abstract _sendCommand(command: AdapterCommand): Promise<boolean>;

  /** Optional: cleanup adapter-specific resources on destroy */
  protected _cleanup(): void {
    /* Subclasses can override to release WebSockets, timers, etc. */
  }
}
