/**
 * TimeseriesService — Writes UnifiedEnergyDatapoint batches to InfluxDB v2.
 *
 * Features:
 *  - Subscribes to the EventBus for all adapter batches
 *  - Converts UnifiedEnergyDatapoint → InfluxDB Points
 *  - WAL (Write-Ahead Log) when InfluxDB writes fail or client is unavailable
 *  - Recovery on startup and periodic drain: rename-then-replay; **never** counts WAL append as remote success
 *  - Stranded `wal.ndjson.recovering` / `wal.ndjson.failed-*` snapshots are merged into the live WAL before replay (no overwrite of unflushed data)
 */

import {
  appendFileSync,
  copyFileSync,
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { InfluxDB, Point, type WriteApi } from '@influxdata/influxdb-client';
import type { EventBusSubscriber, UnifiedEnergyDatapoint } from '@nexus-hems/shared-types';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Default matches Docker/Helm volume: `apps/api/data` (see NEXUS_HEMS_DATA_DIR). */
const DEFAULT_DATA_DIR = join(__dirname, '../../data');

const WAL_FILE = 'wal.ndjson';
const WAL_RECOVERING_PREFIX = 'wal.ndjson.recovering';
const WAL_FAILED_PREFIX = 'wal.ndjson.failed-';
const WAL_PROGRESS_SUFFIX = '.recovery-progress.json';
const WAL_QUARANTINE = 'wal-corrupt.ndjson';

const DEFAULT_WAL_BATCH_SIZE = 200;
const MAX_RETRY_ATTEMPTS = 5;
const BACKGROUND_WAL_MS = 60_000;

function getEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

/** Result of attempting a remote Influx write + flush. */
export type InfluxFlushResult = 'flushed' | 'remote_failed';

export interface TimeseriesServiceDeps {
  /** Override data directory (default: env NEXUS_HEMS_DATA_DIR or apps/api/data). */
  dataDir?: string;
  /** Inject a WriteApi (e.g. mock) for tests; when set, skips real InfluxDB client construction. */
  writeApi?: WriteApi | null;
  /** When not using injected writeApi, set false to start in WAL-only mode without connecting. */
  connectInflux?: boolean;
  /** Per-batch retry count during `recoverWAL` only (default: MAX_RETRY_ATTEMPTS). */
  maxWalRecoveryAttempts?: number;
  /** Background WAL replay interval (ms); set 0 to disable (default: BACKGROUND_WAL_MS). */
  walBackgroundIntervalMs?: number;
  /** Recovery batch size (default: 200). Lower in tests to exercise progress file. */
  walBatchSize?: number;
}

interface WalRecoveryProgress {
  /** Next index into the parsed datapoint array to flush (exclusive of already flushed). */
  nextParsedIndex: number;
}

export class TimeseriesService implements EventBusSubscriber {
  private readonly writeApi: WriteApi | null;
  private influxConnected = false;
  private readonly dataDir: string;
  private readonly walPath: string;
  private readonly maxWalRecoveryAttempts: number;
  private readonly walBackgroundIntervalMs: number;
  private readonly walBatchSize: number;
  private backgroundTimer: ReturnType<typeof setInterval> | undefined;
  /** Serializes WAL file mutations vs recovery rename/replay. */
  private walGate: Promise<void> = Promise.resolve();

  constructor(deps?: TimeseriesServiceDeps) {
    this.dataDir = deps?.dataDir ?? getEnv('NEXUS_HEMS_DATA_DIR', DEFAULT_DATA_DIR);
    this.walPath = join(this.dataDir, WAL_FILE);
    this.maxWalRecoveryAttempts = deps?.maxWalRecoveryAttempts ?? MAX_RETRY_ATTEMPTS;
    this.walBackgroundIntervalMs = deps?.walBackgroundIntervalMs ?? BACKGROUND_WAL_MS;
    this.walBatchSize = deps?.walBatchSize ?? DEFAULT_WAL_BATCH_SIZE;

    if (deps?.writeApi !== undefined) {
      this.writeApi = deps.writeApi;
      this.influxConnected = deps.writeApi !== null;
      return;
    }

    const url = getEnv('INFLUXDB_URL', 'http://influxdb:8086');
    const token = getEnv('INFLUXDB_TOKEN', 'nexus-hems-influx-token');
    const org = getEnv('INFLUXDB_ORG', 'nexus-hems');
    const bucket = getEnv('INFLUXDB_BUCKET', 'nexus-hems');
    const shouldConnect = deps?.connectInflux !== false;

    if (!shouldConnect) {
      this.writeApi = null;
      this.influxConnected = false;
      return;
    }

    try {
      const client = new InfluxDB({ url, token });
      this.writeApi = client.getWriteApi(org, bucket, 'ms');
      this.influxConnected = true;
    } catch (err) {
      console.warn('[TimeseriesService] InfluxDB init failed — WAL mode only:', err);
      this.writeApi = null;
    }
  }

  /** Called by EventBus on each flush cycle. */
  async onBatch(datapoints: UnifiedEnergyDatapoint[]): Promise<void> {
    if (datapoints.length === 0) return;

    await this.withWalLock(async () => {
      if (this.writeApi && this.influxConnected) {
        const result = await this.tryFlushToInflux(datapoints);
        if (result === 'flushed') {
          return;
        }
        console.error('[TimeseriesService] InfluxDB write error — falling back to WAL');
        this.influxConnected = false;
        await this.writeToWALUnlocked(datapoints);
        return;
      }
      await this.writeToWALUnlocked(datapoints);
    });
  }

  /**
   * Merge stranded snapshots into the live WAL, then replay the live WAL to InfluxDB.
   * Uses rename-then-replay so concurrent `onBatch` appends go to a fresh primary file.
   * At-least-once delivery: replays may duplicate points in Influx after a crash between flush and progress write.
   */
  async recoverWAL(): Promise<void> {
    if (!this.writeApi) {
      console.warn('[TimeseriesService] WAL recovery skipped — no WriteApi');
      return;
    }

    await this.withWalLock(async () => {
      await mkdir(this.dataDir, { recursive: true });
      this.mergeStrandedSnapshotsIntoPrimary();
      await this.recoverPrimaryWalUnlocked();
    });
  }

  /**
   * Periodic drain when Influx was down or WAL still has backlog. Best-effort; errors are logged only.
   */
  startBackgroundWalDrain(): void {
    if (!this.writeApi || this.walBackgroundIntervalMs <= 0) return;
    if (this.backgroundTimer) return;
    this.backgroundTimer = setInterval(() => {
      void this.recoverWAL().catch((err: unknown) => {
        console.warn('[TimeseriesService] Background WAL drain failed:', err);
      });
    }, this.walBackgroundIntervalMs);
  }

  stopBackgroundWalDrain(): void {
    if (this.backgroundTimer) {
      clearInterval(this.backgroundTimer);
      this.backgroundTimer = undefined;
    }
  }

  /** Bytes of primary WAL file if present (for health metrics). */
  getWalBacklogBytes(): number {
    try {
      return statSync(this.walPath).size;
    } catch {
      return 0;
    }
  }

  /** Graceful shutdown. */
  async destroy(): Promise<void> {
    this.stopBackgroundWalDrain();
    if (this.writeApi) {
      try {
        await this.writeApi.close();
      } catch {
        // ignore close errors
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private async withWalLock<T>(fn: () => Promise<T>): Promise<T> {
    const previous = this.walGate;
    let release!: () => void;
    this.walGate = new Promise<void>((r) => {
      release = r;
    });
    await previous;
    try {
      return await fn();
    } finally {
      release();
    }
  }

  /**
   * Move any `wal.ndjson.recovering*` or `wal.ndjson.failed-*` files into the live primary WAL (append), then remove the snapshot.
   * Avoids abandoning data when the primary was recreated after a partial recovery.
   */
  private mergeStrandedSnapshotsIntoPrimary(): void {
    let names: string[];
    try {
      names = readdirSync(this.dataDir);
    } catch {
      return;
    }

    const stranded = names.filter(
      (n) => n.startsWith(WAL_RECOVERING_PREFIX) || n.startsWith(WAL_FAILED_PREFIX),
    );
    stranded.sort();

    for (const name of stranded) {
      const full = join(this.dataDir, name);
      try {
        if (!statSync(full).isFile()) continue;
      } catch {
        continue;
      }
      const datapoints = this.parseRecoveringWal(full);
      const { nextParsedIndex } = this.readProgress(full);
      const slice = datapoints.slice(Math.min(nextParsedIndex, datapoints.length));
      if (slice.length > 0) {
        const lines = `${slice.map((dp) => JSON.stringify(dp)).join('\n')}\n`;
        if (existsSync(this.walPath)) {
          appendFileSync(this.walPath, lines, 'utf8');
        } else {
          writeFileSync(this.walPath, lines, 'utf8');
        }
      }
      try {
        unlinkSync(full);
      } catch (err) {
        console.error(`[TimeseriesService] Could not remove stranded WAL snapshot ${name}:`, err);
      }
      this.deleteProgress(full);
    }
  }

  private progressPathFor(recoveringPath: string): string {
    return `${recoveringPath}${WAL_PROGRESS_SUFFIX}`;
  }

  private readProgress(recoveringPath: string): WalRecoveryProgress {
    const p = this.progressPathFor(recoveringPath);
    if (!existsSync(p)) return { nextParsedIndex: 0 };
    try {
      const raw = readFileSync(p, 'utf8').trim();
      const parsed = JSON.parse(raw) as Partial<WalRecoveryProgress>;
      const next = typeof parsed.nextParsedIndex === 'number' ? parsed.nextParsedIndex : 0;
      return { nextParsedIndex: Math.max(0, next) };
    } catch {
      return { nextParsedIndex: 0 };
    }
  }

  private writeProgress(recoveringPath: string, nextParsedIndex: number): void {
    const p = this.progressPathFor(recoveringPath);
    writeFileSync(p, `${JSON.stringify({ nextParsedIndex })}\n`, 'utf8');
  }

  private deleteProgress(recoveringPath: string): void {
    const p = this.progressPathFor(recoveringPath);
    try {
      unlinkSync(p);
    } catch {
      // ignore
    }
  }

  private quarantineCorruptLine(line: string, lineIndex: number): void {
    const qPath = join(this.dataDir, WAL_QUARANTINE);
    const entry = JSON.stringify({
      ts: Date.now(),
      lineIndex,
      reason: 'json_parse',
      raw: line.length > 4096 ? `${line.slice(0, 4096)}…` : line,
    });
    appendFileSync(qPath, `${entry}\n`, 'utf8');
  }

  private parseRecoveringWal(recoveringPath: string): UnifiedEnergyDatapoint[] {
    const raw = readFileSync(recoveringPath, 'utf8');
    const lines = raw.split('\n');
    const parsed: UnifiedEnergyDatapoint[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line === undefined || line === '') continue;
      try {
        parsed.push(JSON.parse(line) as UnifiedEnergyDatapoint);
      } catch {
        this.quarantineCorruptLine(line, i);
      }
    }
    return parsed;
  }

  private async recoverPrimaryWalUnlocked(): Promise<void> {
    if (!this.writeApi) return;
    if (!existsSync(this.walPath)) return;

    const recoveringPath = this.renamePrimaryWalToRecovering();
    if (!recoveringPath) return;

    this.deleteProgress(recoveringPath);

    const raw = readFileSync(recoveringPath, 'utf8').trimEnd();
    if (!raw) {
      this.removeRecoveringSnapshotIfEmpty(recoveringPath);
      return;
    }

    const datapoints = this.parseRecoveringWal(recoveringPath);
    console.log(
      `[TimeseriesService] Recovering WAL snapshot (${datapoints.length} valid datapoint(s))…`,
    );

    if (datapoints.length === 0) {
      this.removeRecoveringSnapshotIfEmpty(recoveringPath);
      return;
    }

    const done = await this.flushRecoveringBatches(recoveringPath, datapoints);
    if (!done) return;

    this.removeRecoveringAfterSuccess(recoveringPath);
    this.influxConnected = true;
    console.log('[TimeseriesService] WAL recovery complete.');
  }

  private renamePrimaryWalToRecovering(): string | undefined {
    const recoveringPath = `${this.walPath}.recovering`;
    try {
      renameSync(this.walPath, recoveringPath);
      return recoveringPath;
    } catch (err) {
      console.warn('[TimeseriesService] WAL rename for recovery failed:', err);
      return undefined;
    }
  }

  private removeRecoveringSnapshotIfEmpty(recoveringPath: string): void {
    try {
      unlinkSync(recoveringPath);
    } catch {
      // ignore
    }
    this.deleteProgress(recoveringPath);
  }

  private removeRecoveringAfterSuccess(recoveringPath: string): void {
    try {
      unlinkSync(recoveringPath);
    } catch {
      // ignore
    }
    this.deleteProgress(recoveringPath);
  }

  /** @returns true if fully flushed, false if stopped early (failure path). */
  private async flushRecoveringBatches(
    recoveringPath: string,
    datapoints: UnifiedEnergyDatapoint[],
  ): Promise<boolean> {
    let nextParsedIndex = this.readProgress(recoveringPath).nextParsedIndex;
    if (nextParsedIndex > datapoints.length) {
      nextParsedIndex = 0;
    }

    for (let start = nextParsedIndex; start < datapoints.length; start += this.walBatchSize) {
      const batch = datapoints.slice(start, start + this.walBatchSize);
      const flushed = await this.flushBatchWithRetries(batch);
      if (!flushed) {
        await this.onRecoveryBatchFailed(recoveringPath, datapoints, start);
        return false;
      }
      this.writeProgress(recoveringPath, start + batch.length);
    }
    return true;
  }

  private async flushBatchWithRetries(batch: UnifiedEnergyDatapoint[]): Promise<boolean> {
    let attempt = 0;
    while (attempt < this.maxWalRecoveryAttempts) {
      if ((await this.tryFlushToInflux(batch)) === 'flushed') return true;
      const delayMs = Math.min(1000 * 2 ** attempt, 30_000);
      await new Promise((r) => setTimeout(r, delayMs));
      attempt++;
    }
    return false;
  }

  private async onRecoveryBatchFailed(
    recoveringPath: string,
    datapoints: UnifiedEnergyDatapoint[],
    start: number,
  ): Promise<void> {
    const remaining = datapoints.slice(start);
    await this.writeToWALUnlocked(remaining);
    const failedPath = `${this.walPath}.failed-${Date.now()}`;
    try {
      copyFileSync(recoveringPath, failedPath);
      this.writeProgress(failedPath, start);
    } catch (err) {
      console.error('[TimeseriesService] Could not copy failed recovery WAL:', err);
    }
    try {
      unlinkSync(recoveringPath);
    } catch {
      // ignore
    }
    this.deleteProgress(recoveringPath);
    console.error(
      `[TimeseriesService] WAL recovery failed after retries — ${remaining.length} row(s) re-staged to WAL; snapshot at ${failedPath}`,
    );
  }

  /**
   * Flush datapoints to Influx only. Does not write WAL on failure.
   */
  private async tryFlushToInflux(datapoints: UnifiedEnergyDatapoint[]): Promise<InfluxFlushResult> {
    if (!this.writeApi || datapoints.length === 0) return 'remote_failed';
    try {
      for (const dp of datapoints) {
        const point = new Point(dp.metric)
          .tag('device_id', dp.deviceId)
          .tag('protocol', dp.protocol)
          .tag('quality', dp.qualityIndicator)
          .floatField('value', dp.value)
          .timestamp(dp.timestamp);
        this.writeApi.writePoint(point);
      }
      await this.writeApi.flush();
      return 'flushed';
    } catch (err) {
      console.error('[TimeseriesService] Influx flush error:', err);
      return 'remote_failed';
    }
  }

  private async writeToWALUnlocked(datapoints: UnifiedEnergyDatapoint[]): Promise<void> {
    await mkdir(this.dataDir, { recursive: true });
    const lines = `${datapoints.map((dp) => JSON.stringify(dp)).join('\n')}\n`;
    appendFileSync(this.walPath, lines, 'utf8');
  }
}
