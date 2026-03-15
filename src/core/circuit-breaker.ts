/**
 * Circuit Breaker Pattern for Adapter Connections
 *
 * States:
 *   CLOSED  → Normal operation. Errors increment the counter.
 *   OPEN    → Too many errors. All calls fail-fast. After cooldown → HALF_OPEN.
 *   HALF_OPEN → One probe call allowed. Success → CLOSED, failure → OPEN.
 *
 * Integrated into useEnergyStore for per-adapter circuit breaking.
 */

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerConfig {
  /** Number of failures before opening the circuit */
  failureThreshold: number;
  /** Cooldown period in ms before transitioning to half-open */
  cooldownMs: number;
  /** Success count required in half-open to close the circuit */
  halfOpenSuccessThreshold: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  cooldownMs: 30_000,
  halfOpenSuccessThreshold: 2,
};

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private readonly config: CircuitBreakerConfig;
  private stateChangeCallbacks: Array<(state: CircuitState) => void> = [];

  constructor(config?: Partial<CircuitBreakerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  get currentState(): CircuitState {
    // Auto-transition from open → half-open after cooldown
    if (this.state === 'open' && Date.now() - this.lastFailureTime >= this.config.cooldownMs) {
      this.state = 'half-open';
      this.successCount = 0;
      this.notifyStateChange();
    }
    return this.state;
  }

  /** Check if a call is allowed */
  canExecute(): boolean {
    const current = this.currentState;
    return current === 'closed' || current === 'half-open';
  }

  /** Record a successful call */
  recordSuccess(): void {
    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= this.config.halfOpenSuccessThreshold) {
        this.state = 'closed';
        this.failureCount = 0;
        this.successCount = 0;
        this.notifyStateChange();
      }
    } else if (this.state === 'closed') {
      // Reset failure count on success
      this.failureCount = 0;
    }
  }

  /** Record a failed call */
  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'half-open') {
      // Any failure in half-open goes back to open
      this.state = 'open';
      this.notifyStateChange();
    } else if (this.state === 'closed' && this.failureCount >= this.config.failureThreshold) {
      this.state = 'open';
      this.notifyStateChange();
    }
  }

  /** Force the circuit to open (e.g. emergency stop) */
  forceOpen(): void {
    this.state = 'open';
    this.lastFailureTime = Date.now();
    this.notifyStateChange();
  }

  /** Reset to closed state */
  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.notifyStateChange();
  }

  onStateChange(callback: (state: CircuitState) => void): void {
    this.stateChangeCallbacks.push(callback);
  }

  destroy(): void {
    this.stateChangeCallbacks = [];
  }

  private notifyStateChange(): void {
    for (const cb of this.stateChangeCallbacks) {
      cb(this.state);
    }
  }
}
