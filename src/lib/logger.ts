/**
 * Structured Logger with Sentry Error Tracking
 *
 * Production-grade logging for Nexus HEMS Dashboard:
 * - Structured log entries with level, context, timestamp
 * - Console output in development
 * - Sentry error/warning capture in production
 * - Ring buffer for recent log history (last 200 entries)
 * - Context tagging (adapter, component, subsystem)
 */

// ─── Types ──────────────────────────────────────────────────────────

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: Record<string, unknown>;
  timestamp: number;
  error?: Error;
}

export interface LoggerConfig {
  /** Minimum level to output (default: 'info' in prod, 'debug' in dev) */
  minLevel: LogLevel;
  /** Enable Sentry integration (from centralized sentry.ts) */
  sentryEnabled: boolean;
  /** Max log ring buffer size */
  bufferSize: number;
}

// ─── Level Ordering ─────────────────────────────────────────────────

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

// ─── Sentry Integration ─────────────────────────────────────────────

// Sentry is initialized centrally via src/lib/sentry.ts (called in main.tsx).
// The logger imports the already-initialized SDK and checks sentryEnabled.
import { Sentry, sentryEnabled } from './sentry';

function captureToSentry(entry: LogEntry): void {
  if (!sentryEnabled) return;
  try {
    if (entry.error) {
      Sentry.captureException(entry.error, {
        tags: { context: entry.context ?? 'unknown' },
        extra: entry.data,
      });
    } else if (entry.level === 'error' || entry.level === 'fatal') {
      Sentry.captureMessage(entry.message, {
        level: entry.level === 'fatal' ? 'fatal' : 'error',
        tags: { context: entry.context ?? 'unknown' },
        extra: entry.data,
      });
    } else if (entry.level === 'warn') {
      Sentry.captureMessage(entry.message, {
        level: 'warning',
        tags: { context: entry.context ?? 'unknown' },
        extra: entry.data,
      });
    }
  } catch {
    // Silently fail — logging must never crash the app
  }
}

// ─── App Version ────────────────────────────────────────────────────

declare const __APP_VERSION__: string;

// ─── Logger ─────────────────────────────────────────────────────────

class Logger {
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];

  constructor() {
    const isProd = import.meta.env.PROD;

    this.config = {
      minLevel: isProd ? 'info' : 'debug',
      sentryEnabled,
      bufferSize: 200,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_ORDER[level] >= LEVEL_ORDER[this.config.minLevel];
  }

  private addToBuffer(entry: LogEntry): void {
    this.buffer.push(entry);
    if (this.buffer.length > this.config.bufferSize) {
      this.buffer.shift();
    }
  }

  private log(
    level: LogLevel,
    message: string,
    context?: string,
    data?: Record<string, unknown>,
    error?: Error,
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      context,
      data,
      timestamp: Date.now(),
      error,
    };

    this.addToBuffer(entry);

    // Console output
    const prefix = context ? `[${context}]` : '';
    const consoleMethod = level === 'fatal' ? 'error' : level;
    const consoleFn = console[consoleMethod] ?? console.log;

    if (error) {
      consoleFn(`${prefix} ${message}`, data ?? '', error);
    } else if (data) {
      consoleFn(`${prefix} ${message}`, data);
    } else {
      consoleFn(`${prefix} ${message}`);
    }

    // Sentry capture for error/warn/fatal
    if (this.config.sentryEnabled && LEVEL_ORDER[level] >= LEVEL_ORDER['warn']) {
      void captureToSentry(entry);
    }
  }

  debug(message: string, context?: string, data?: Record<string, unknown>): void {
    this.log('debug', message, context, data);
  }

  info(message: string, context?: string, data?: Record<string, unknown>): void {
    this.log('info', message, context, data);
  }

  warn(message: string, context?: string, data?: Record<string, unknown>): void {
    this.log('warn', message, context, data);
  }

  error(message: string, error?: Error, context?: string, data?: Record<string, unknown>): void {
    this.log('error', message, context, data, error ?? undefined);
  }

  fatal(message: string, error?: Error, context?: string, data?: Record<string, unknown>): void {
    this.log('fatal', message, context, data, error ?? undefined);
  }

  /** Get recent log entries (ring buffer) */
  getRecentLogs(): ReadonlyArray<LogEntry> {
    return [...this.buffer];
  }

  /** Create a child logger with a fixed context */
  child(context: string): ContextLogger {
    return new ContextLogger(this, context);
  }
}

/** Logger scoped to a specific context (adapter, component, subsystem) */
class ContextLogger {
  constructor(
    private parent: Logger,
    private context: string,
  ) {}

  debug(message: string, data?: Record<string, unknown>): void {
    this.parent.debug(message, this.context, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.parent.info(message, this.context, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.parent.warn(message, this.context, data);
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.parent.error(message, error, this.context, data);
  }

  fatal(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.parent.fatal(message, error, this.context, data);
  }
}

// ─── Singleton ──────────────────────────────────────────────────────

export const logger = new Logger();
