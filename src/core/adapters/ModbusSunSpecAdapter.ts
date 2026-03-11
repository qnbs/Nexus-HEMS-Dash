/**
 * ModbusSunSpecAdapter — Modbus TCP / SunSpec polling adapter
 *
 * Polls SunSpec-compliant inverters and meters via a Modbus-TCP-to-HTTP
 * bridge (e.g. node-red-contrib-modbus, modbus-proxy, or a local REST gateway).
 *
 * SunSpec Models used:
 *   • Model 1    – Common block (manufacturer, serial)
 *   • Model 101–103 – Single/Split/Three-Phase Inverter
 *   • Model 124  – Storage (battery)
 *   • Model 160  – Multiple MPPT Inverter Extension
 *   • Model 201–204 – Meter (single/split/three phase, delta)
 *
 * The adapter polls a REST endpoint that exposes Modbus register values:
 *   GET /api/modbus/sunspec?model=103  →  JSON with register values
 *
 * In production, replace the fetch gateway URL with your bridge.
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
  PVData,
  BatteryData,
  GridData,
} from './EnergyAdapter';

// ─── SunSpec register response shapes ────────────────────────────────

interface SunSpecInverterRegs {
  /** AC Power (W) — Model 103, register 14 */
  W: number;
  /** AC Energy — lifetime kWh */
  WH: number;
  /** DC Power per string */
  strings?: { DCA: number; DCV: number; DCW: number }[];
}

interface SunSpecBatteryRegs {
  /** Charge/discharge W (positive = charge) */
  W: number;
  /** State of charge (%) */
  SoC: number;
  /** Battery voltage (V) */
  V: number;
  /** Battery current (A) */
  A: number;
  /** Temperature (°C) */
  TmpBdy?: number;
  /** Cycle count */
  CycCnt?: number;
  /** State of health (%) */
  SoH?: number;
}

interface SunSpecMeterRegs {
  /** Total real power (W), positive = import */
  W: number;
  /** Line voltage L-N avg (V) */
  PhV: number;
  /** Frequency (Hz) */
  Hz?: number;
  /** Total energy imported (Wh) */
  TotWhImp?: number;
  /** Total energy exported (Wh) */
  TotWhExp?: number;
  /** Per-phase readings */
  phases?: { PhV: number; A: number; W: number }[];
}

const DEFAULT_POLL_INTERVAL_MS = 3000;

const DEFAULT_RECONNECT = {
  enabled: true,
  initialDelayMs: 2000,
  maxDelayMs: 30_000,
  backoffMultiplier: 2,
};

export class ModbusSunSpecAdapter implements EnergyAdapter {
  readonly id = 'modbus-sunspec';
  readonly name = 'Modbus TCP / SunSpec';
  readonly capabilities: AdapterCapability[] = ['pv', 'battery', 'grid'];

  private _status: AdapterStatus = 'disconnected';
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;
  private consecutiveErrors = 0;

  private dataCallbacks: AdapterDataCallback[] = [];
  private statusCallbacks: AdapterStatusCallback[] = [];
  private snapshot: Partial<UnifiedEnergyModel> = {};

  private readonly config: AdapterConnectionConfig;
  private readonly baseUrl: string;

  constructor(config?: Partial<AdapterConnectionConfig>) {
    this.config = {
      name: 'Modbus SunSpec',
      host: config?.host ?? '192.168.1.100',
      port: config?.port ?? 502,
      tls: config?.tls ?? false,
      pollIntervalMs: config?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS,
      reconnect: { ...DEFAULT_RECONNECT, ...config?.reconnect },
      ...config,
    };
    const proto = this.config.tls ? 'https' : 'http';
    this.baseUrl = `${proto}://${this.config.host}:${this.config.port}`;
  }

  get status(): AdapterStatus {
    return this._status;
  }

  // ─── Lifecycle ────────────────────────────────────────────────────

  async connect(): Promise<void> {
    if (this._status === 'connected' || this._status === 'connecting') return;
    this.destroyed = false;
    this.setStatus('connecting');

    try {
      // Test connectivity with a lightweight probe
      await this.fetchModel('common');
      this.consecutiveErrors = 0;
      this.setStatus('connected');
      this.startPolling();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      this.setStatus('error', msg);
      if (this.config.reconnect?.enabled) {
        this.scheduleReconnect();
      }
    }
  }

  async disconnect(): Promise<void> {
    this.stopPolling();
    this.setStatus('disconnected');
  }

  destroy(): void {
    this.destroyed = true;
    this.stopPolling();
    this.dataCallbacks = [];
    this.statusCallbacks = [];
  }

  // ─── Subscriptions ───────────────────────────────────────────────

  onData(callback: AdapterDataCallback): void {
    this.dataCallbacks.push(callback);
  }

  onStatus(callback: AdapterStatusCallback): void {
    this.statusCallbacks.push(callback);
  }

  // ─── Commands ─────────────────────────────────────────────────────

  async sendCommand(command: AdapterCommand): Promise<boolean> {
    // Modbus write — only battery & grid limit supported
    const allowed = ['SET_BATTERY_POWER', 'SET_BATTERY_MODE', 'SET_GRID_LIMIT'];
    if (!allowed.includes(command.type)) return false;

    try {
      const res = await fetch(`${this.baseUrl}/api/modbus/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          register: command.type,
          value: command.value,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async poll(): Promise<Partial<UnifiedEnergyModel>> {
    const [inverter, battery, meter] = await Promise.allSettled([
      this.fetchModel<SunSpecInverterRegs>('inverter'),
      this.fetchModel<SunSpecBatteryRegs>('battery'),
      this.fetchModel<SunSpecMeterRegs>('meter'),
    ]);

    const pv = this.parseInverter(inverter.status === 'fulfilled' ? inverter.value : null);
    const bat = this.parseBattery(battery.status === 'fulfilled' ? battery.value : null);
    const grid = this.parseMeter(meter.status === 'fulfilled' ? meter.value : null);

    const model: Partial<UnifiedEnergyModel> = {
      timestamp: Date.now(),
      ...(pv && { pv }),
      ...(bat && { battery: bat }),
      ...(grid && { grid }),
    };

    this.snapshot = model;
    return model;
  }

  getSnapshot(): Partial<UnifiedEnergyModel> {
    return { ...this.snapshot };
  }

  // ─── Internal ─────────────────────────────────────────────────────

  private startPolling(): void {
    this.stopPolling();
    const interval = this.config.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;

    // Throttled polling: runs poll, waits for result, then schedules next
    const doPoll = async () => {
      try {
        const model = await this.poll();
        this.consecutiveErrors = 0;
        if (this._status !== 'connected') this.setStatus('connected');
        for (const cb of this.dataCallbacks) cb(model);
      } catch {
        this.consecutiveErrors++;
        if (this.consecutiveErrors >= 5) {
          this.setStatus('error', `${this.consecutiveErrors} consecutive poll failures`);
        }
      }
    };

    void doPoll(); // Initial poll immediately
    this.pollTimer = setInterval(() => void doPoll(), interval);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.destroyed) return;
    const delay = this.config.reconnect?.initialDelayMs ?? DEFAULT_RECONNECT.initialDelayMs;
    setTimeout(() => {
      if (!this.destroyed) void this.connect();
    }, delay);
  }

  private setStatus(status: AdapterStatus, error?: string): void {
    this._status = status;
    for (const cb of this.statusCallbacks) cb(status, error);
  }

  private async fetchModel<T>(model: string): Promise<T> {
    const url = `${this.baseUrl}/api/modbus/sunspec?model=${encodeURIComponent(model)}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (this.config.authToken) {
      headers['Authorization'] = `Bearer ${this.config.authToken}`;
    }

    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      throw new Error(`Modbus gateway HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
  }

  // ─── SunSpec parsers ──────────────────────────────────────────────

  private parseInverter(regs: SunSpecInverterRegs | null): PVData | undefined {
    if (!regs) return undefined;
    return {
      totalPowerW: regs.W,
      yieldTodayKWh: regs.WH / 1000,
      strings: regs.strings?.map((s, i) => ({
        id: i + 1,
        powerW: s.DCW,
        voltageV: s.DCV,
        currentA: s.DCA,
      })),
    };
  }

  private parseBattery(regs: SunSpecBatteryRegs | null): BatteryData | undefined {
    if (!regs) return undefined;
    return {
      powerW: regs.W,
      socPercent: regs.SoC,
      voltageV: regs.V,
      currentA: regs.A,
      temperatureC: regs.TmpBdy,
      cycleCount: regs.CycCnt,
      stateOfHealthPercent: regs.SoH,
    };
  }

  private parseMeter(regs: SunSpecMeterRegs | null): GridData | undefined {
    if (!regs) return undefined;
    return {
      powerW: regs.W,
      voltageV: regs.PhV,
      frequencyHz: regs.Hz,
      energyImportKWh: regs.TotWhImp ? regs.TotWhImp / 1000 : undefined,
      energyExportKWh: regs.TotWhExp ? regs.TotWhExp / 1000 : undefined,
      phases: regs.phases?.map((p) => ({
        voltageV: p.PhV,
        currentA: p.A,
        powerW: p.W,
      })),
    };
  }
}
