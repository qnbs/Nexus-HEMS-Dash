/**
 * TimeseriesService — Writes UnifiedEnergyDatapoint batches to InfluxDB v2.
 *
 * Features:
 *  - Subscribes to the EventBus for all adapter batches
 *  - Converts UnifiedEnergyDatapoint → InfluxDB Points
 *  - WAL (Write-Ahead Log) when InfluxDB writes fail or client is unavailable
 *  - Recovery on startup and periodic drain: rename-then-replay; **never** counts WAL append as remote success
 *  - Stranded `wal.ndjson.recovering` / `wal.ndjson.failed-*` snapshots are merged into the live WAL before replay
 *
 * **Durability scope:** Delivery is **at-least-once** (duplicates possible after a crash between remote flush and
 * progress write). WAL lines are **not** fsync'd per line; do not claim power-loss durability without OS/fsync policy.
 * Helm: default `emptyDir` is **pod-ephemeral** — use `server.walPersistence` for PVC-backed storage (see #452).
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
import {
  type EventBusSubscriber,
  energyDatapointSchema,
  type UnifiedEnergyDatapoint,
} from '@nexus-hems/shared-types';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Default matches Docker/Helm volume: `apps/api/data` (see NEXUS_HEMS_DATA_DIR). */
const DEFAULT_DATA_DIR = join(__dirname, '../../data');

const WAL_FILE = 'wal.ndjson';
const WAL_FAILED_PREFIX = 'wal.ndjson.failed-';
const WAL_PROGRESS_SUFFIX = '.recovery-progress.json';
const WAL_MERGE_STAGED_SUFFIX = '.merge-staged.json';
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

/** Crash-safe stranded merge handoff (#447): marks append completion before progress/unlink. */
interface WalMergeStaged {
  phase: 'pending' | 'appended';
  lineCount: number;
  primaryLinesBefore: number;
}

/** Exclude progress sidecars and non-snapshot files (v7: `*.recovery-progress.json` is not a datapoint snapshot). */
function isWalSnapshotBasename(name: string): boolean {
  if (name.endsWith(WAL_PROGRESS_SUFFIX)) return false;
  if (name === WAL_FILE || name === WAL_QUARANTINE) return false;
  if (name === `${WAL_FILE}.recovering`) return true;
  if (name.startsWith(`${WAL_FILE}.recovering.`)) return true;
  // `wal.ndjson.failed-<digits>` only (not `failed-*.recovery-progress.json` — excluded above)
  if (name.startsWith(WAL_FAILED_PREFIX) && /^wal\.ndjson\.failed-\d+(-\d+)?$/.test(name))
    return true;
  return false;
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
  /** Serializes Influx write/flush — one flight at a time even if WAL lock is released during recovery. */
  private influxSerial: Promise<void> = Promise.resolve();
  /**
   * Only one `recoverWAL` body at a time: concurrent callers share a queue so `mergeStrandedSnapshotsIntoPrimary`
   * cannot steal another run's active `.recovering` snapshot while flush retries hold the gate open.
   */
  private walRecoverChain: Promise<void> = Promise.resolve();
  /** Disambiguates `wal.ndjson.failed-<ts>` when `Date.now()` collides within one process. */
  private failedArchiveSeq = 0;

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
        const result = await this.withInfluxSerial(() => this.tryFlushToInflux(datapoints));
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
   * Influx retries run **outside** the WAL lock so `onBatch` can append while recovery waits on the network.
   */
  async recoverWAL(): Promise<void> {
    const next = this.walRecoverChain.then(() => this.recoverWALBody());
    this.walRecoverChain = next.catch(() => {});
    return next;
  }

  private async recoverWALBody(): Promise<void> {
    if (!this.writeApi) {
      console.warn('[TimeseriesService] WAL recovery skipped — no WriteApi');
      return;
    }

    await this.withWalLock(async () => {
      await mkdir(this.dataDir, { recursive: true });
      this.mergeStrandedSnapshotsIntoPrimary();
    });

    while (true) {
      const session = await this.takeRecoveringSnapshotUnderLock();
      if (!session) break;

      const { recoveringPath, datapoints } = session;
      let nextParsedIndex = this.readProgress(recoveringPath).nextParsedIndex;
      if (nextParsedIndex > datapoints.length) {
        nextParsedIndex = 0;
      }

      let recoveredOk = true;
      for (let start = nextParsedIndex; start < datapoints.length; start += this.walBatchSize) {
        const batch = datapoints.slice(start, start + this.walBatchSize);
        const flushed = await this.flushBatchWithRetries(batch);
        if (!flushed) {
          await this.withWalLock(async () => {
            await this.onRecoveryBatchFailedLocked(recoveringPath, datapoints, start);
          });
          recoveredOk = false;
          this.influxConnected = false;
          break;
        }
        await this.withWalLock(async () => {
          this.writeProgress(recoveringPath, start + batch.length);
        });
      }

      if (!recoveredOk) {
        return;
      }

      await this.withWalLock(async () => {
        this.removeRecoveringAfterSuccess(recoveringPath);
      });
      this.influxConnected = true;
      console.log('[TimeseriesService] WAL recovery complete.');
    }
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

  /** Bytes of WAL backlog: primary + snapshot + quarantine (not 0 while `.recovering` exists). */
  getWalBacklogBytes(): number {
    let total = 0;
    let names: string[] = [];
    try {
      names = readdirSync(this.dataDir);
    } catch {
      return 0;
    }
    for (const name of names) {
      if (
        name === WAL_FILE ||
        name === WAL_QUARANTINE ||
        isWalSnapshotBasename(name) ||
        name.endsWith(WAL_PROGRESS_SUFFIX)
      ) {
        try {
          const p = join(this.dataDir, name);
          if (statSync(p).isFile()) total += statSync(p).size;
        } catch {
          // ignore
        }
      }
    }
    return total;
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

  private async withInfluxSerial<T>(fn: () => Promise<T>): Promise<T> {
    const previous = this.influxSerial;
    let release!: () => void;
    this.influxSerial = new Promise<void>((r) => {
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
   * Move any stranded recovering/failed **snapshot** files into the live primary WAL (append), then remove the snapshot.
   */
  private countPrimaryWalLines(): number {
    if (!existsSync(this.walPath)) return 0;
    return readFileSync(this.walPath, 'utf8').trim().split('\n').filter(Boolean).length;
  }

  private readMergeStaged(snapshotPath: string): WalMergeStaged | undefined {
    const stagedPath = `${snapshotPath}${WAL_MERGE_STAGED_SUFFIX}`;
    if (!existsSync(stagedPath)) return undefined;
    try {
      const parsed = JSON.parse(readFileSync(stagedPath, 'utf8').trim()) as Partial<WalMergeStaged>;
      if (
        (parsed.phase !== 'pending' && parsed.phase !== 'appended') ||
        typeof parsed.lineCount !== 'number' ||
        typeof parsed.primaryLinesBefore !== 'number'
      ) {
        return undefined;
      }
      return {
        phase: parsed.phase,
        lineCount: parsed.lineCount,
        primaryLinesBefore: parsed.primaryLinesBefore,
      };
    } catch {
      return undefined;
    }
  }

  private writeMergeStaged(snapshotPath: string, staged: WalMergeStaged): void {
    const stagedPath = `${snapshotPath}${WAL_MERGE_STAGED_SUFFIX}`;
    writeFileSync(stagedPath, `${JSON.stringify(staged)}\n`, 'utf8');
  }

  private deleteMergeStaged(snapshotPath: string): void {
    const stagedPath = `${snapshotPath}${WAL_MERGE_STAGED_SUFFIX}`;
    try {
      unlinkSync(stagedPath);
    } catch {
      // ignore
    }
  }

  private mergeAppendAlreadyOnPrimary(staged: WalMergeStaged): boolean {
    if (staged.phase === 'appended') return true;
    return this.countPrimaryWalLines() >= staged.primaryLinesBefore + staged.lineCount;
  }

  private mergeStrandedSnapshotsIntoPrimary(): void {
    let names: string[];
    try {
      names = readdirSync(this.dataDir);
    } catch {
      return;
    }

    const stranded = names.filter(isWalSnapshotBasename);
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
      const staged = this.readMergeStaged(full);
      const skipAppend = staged !== undefined && this.mergeAppendAlreadyOnPrimary(staged);

      if (slice.length > 0 && !skipAppend) {
        const primaryLinesBefore = this.countPrimaryWalLines();
        const lines = `${slice.map((dp) => JSON.stringify(dp)).join('\n')}\n`;
        this.writeMergeStaged(full, {
          phase: 'pending',
          lineCount: slice.length,
          primaryLinesBefore,
        });
        if (existsSync(this.walPath)) {
          appendFileSync(this.walPath, lines, 'utf8');
        } else {
          writeFileSync(this.walPath, lines, 'utf8');
        }
        this.writeMergeStaged(full, {
          phase: 'appended',
          lineCount: slice.length,
          primaryLinesBefore,
        });
      }

      try {
        this.writeProgress(full, datapoints.length);
      } catch (err) {
        console.error(
          '[TimeseriesService] Could not persist stranded merge progress for',
          name,
          err,
        );
        continue;
      }
      let removed = false;
      try {
        unlinkSync(full);
        removed = true;
      } catch (err) {
        console.error('[TimeseriesService] Could not remove stranded WAL snapshot', name, err);
      }
      if (removed) {
        this.deleteMergeStaged(full);
        this.deleteProgress(full);
      }
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

  private quarantineLine(
    line: string,
    lineIndex: number,
    reason: 'json_parse' | 'schema_validation',
  ): void {
    const qPath = join(this.dataDir, WAL_QUARANTINE);
    const entry = JSON.stringify({
      ts: Date.now(),
      lineIndex,
      reason,
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
      let obj: unknown;
      try {
        obj = JSON.parse(line) as unknown;
      } catch {
        this.quarantineLine(line, i, 'json_parse');
        continue;
      }
      const valid = energyDatapointSchema.safeParse(obj);
      if (!valid.success) {
        this.quarantineLine(line, i, 'schema_validation');
        continue;
      }
      parsed.push(valid.data);
    }
    return parsed;
  }

  /** Under lock: rename primary → recovering and return parsed datapoints, or clean up and return null. */
  private async takeRecoveringSnapshotUnderLock(): Promise<{
    recoveringPath: string;
    datapoints: UnifiedEnergyDatapoint[];
  } | null> {
    return this.withWalLock(async () => {
      if (!this.writeApi) return null;
      await mkdir(this.dataDir, { recursive: true });
      /**
       * Crash consistency: never `renameSync(primary → .recovering)` while a prior `wal.ndjson.recovering` still exists
       * — on POSIX that **replaces** the destination and drops unacked rows. Re-run merge until the snapshot is gone
       * (bounded retries for transient unlink races).
       */
      const staleRecovering = `${this.walPath}.recovering`;
      for (let i = 0; i < 5; i++) {
        this.mergeStrandedSnapshotsIntoPrimary();
        if (!existsSync(staleRecovering)) break;
      }
      if (existsSync(staleRecovering)) {
        console.warn(
          '[TimeseriesService] Stale wal.ndjson.recovering still present after merge — refusing rename to avoid data loss',
        );
        return null;
      }
      if (!existsSync(this.walPath)) return null;

      const recoveringPath = this.renamePrimaryWalToRecovering();
      if (!recoveringPath) return null;

      this.deleteProgress(recoveringPath);

      const raw = readFileSync(recoveringPath, 'utf8').trimEnd();
      if (!raw) {
        this.removeRecoveringSnapshotIfEmpty(recoveringPath);
        return null;
      }

      const datapoints = this.parseRecoveringWal(recoveringPath);
      console.log(
        `[TimeseriesService] Recovering WAL snapshot (${datapoints.length} valid datapoint(s))…`,
      );

      if (datapoints.length === 0) {
        this.removeRecoveringSnapshotIfEmpty(recoveringPath);
        return null;
      }

      return { recoveringPath, datapoints };
    });
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

  private async flushBatchWithRetries(batch: UnifiedEnergyDatapoint[]): Promise<boolean> {
    for (let attempt = 0; attempt < this.maxWalRecoveryAttempts; attempt++) {
      if ((await this.withInfluxSerial(() => this.tryFlushToInflux(batch))) === 'flushed')
        return true;
      // Do not sleep after the final failed attempt — avoids extra delay on startup failure paths (v7).
      if (attempt < this.maxWalRecoveryAttempts - 1) {
        const delayMs = Math.min(1000 * 2 ** attempt, 30_000);
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
    return false;
  }

  private async onRecoveryBatchFailedLocked(
    recoveringPath: string,
    datapoints: UnifiedEnergyDatapoint[],
    start: number,
  ): Promise<void> {
    const remaining = datapoints.slice(start);
    const failedPath = `${this.walPath}.failed-${Date.now()}-${this.failedArchiveSeq++}`;
    const stagingPath = `${failedPath}.staging`;
    let archiveCommitted = false;

    try {
      copyFileSync(recoveringPath, stagingPath);
      renameSync(stagingPath, failedPath);
      this.writeProgress(failedPath, start);
      archiveCommitted = true;
    } catch (err) {
      console.error('[TimeseriesService] Could not archive failed recovery WAL:', err);
      try {
        if (existsSync(stagingPath)) unlinkSync(stagingPath);
      } catch {
        // ignore
      }
      try {
        if (existsSync(failedPath)) unlinkSync(failedPath);
      } catch {
        // ignore
      }
      this.deleteProgress(failedPath);
    }

    if (archiveCommitted) {
      try {
        unlinkSync(recoveringPath);
        this.deleteProgress(recoveringPath);
      } catch {
        // Failed archive is authoritative; mark recovering drained so merge cannot duplicate rows.
        this.writeProgress(recoveringPath, datapoints.length);
      }
      /**
       * Do **not** append `remaining` to the live primary here: `failedPath` is a full copy of the recovering snapshot,
       * and `mergeStrandedSnapshotsIntoPrimary()` will re-append from `nextParsedIndex` on the next `recoverWAL()`.
       * Writing both duplicated rows on every failed cycle (copy + append) caused exponential WAL growth when Influx
       * stayed down.
       */
      console.error(
        `[TimeseriesService] WAL recovery failed after retries — ${remaining.length} unflushed row(s) retained in failed snapshot ${failedPath} (merge on next recovery)`,
      );
    } else {
      console.error(
        `[TimeseriesService] WAL recovery failed — preserving recovering snapshot ${recoveringPath} (${remaining.length} unflushed row(s))`,
      );
    }
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
