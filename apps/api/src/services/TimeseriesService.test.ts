import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { WriteApi } from '@influxdata/influxdb-client';
import type { UnifiedEnergyDatapoint } from '@nexus-hems/shared-types';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TimeseriesService } from './TimeseriesService.js';

function samplePoint(n: number): UnifiedEnergyDatapoint {
  return {
    timestamp: 1_700_000_000_000 + n,
    deviceId: 'dev-1',
    protocol: 'victron-mqtt',
    metric: 'POWER_W',
    value: n,
    qualityIndicator: 'GOOD',
  };
}

describe('TimeseriesService WAL recovery', () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const d of dirs) {
      try {
        rmSync(d, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
    dirs.length = 0;
  });

  it('does not delete WAL until recovery flush succeeds', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-ok-'));
    dirs.push(dataDir);
    const walPath = join(dataDir, 'wal.ndjson');
    const writePoint = vi.fn();
    let flushCalls = 0;
    const writeApi = {
      writePoint,
      flush: vi.fn(async () => {
        flushCalls += 1;
        if (flushCalls === 1) {
          throw new Error('influx down');
        }
      }),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;

    const svc = new TimeseriesService({ dataDir, writeApi });
    await svc.onBatch([samplePoint(1)]);

    expect(flushCalls).toBe(1);
    expect(existsSync(walPath)).toBe(true);

    await svc.recoverWAL();

    expect(writePoint).toHaveBeenCalled();
    expect(flushCalls).toBeGreaterThanOrEqual(2);
    expect(existsSync(walPath)).toBe(false);
    expect(readdirSync(dataDir).some((f) => f.startsWith('wal.ndjson.recovering'))).toBe(false);

    await svc.destroy();
  });

  it('on recovery failure, moves snapshot aside without duplicating rows onto primary', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-fail-'));
    dirs.push(dataDir);
    const walPath = join(dataDir, 'wal.ndjson');
    const writeApi = {
      writePoint: vi.fn(),
      flush: vi.fn(async () => {
        throw new Error('always fail');
      }),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;

    const svc = new TimeseriesService({ dataDir, writeApi, maxWalRecoveryAttempts: 1 });
    await svc.onBatch([samplePoint(1), samplePoint(2)]);

    await svc.recoverWAL();

    const failedSnap = readdirSync(dataDir).find((f) => f.startsWith('wal.ndjson.failed-'));
    expect(failedSnap).toBeTruthy();
    expect(existsSync(walPath)).toBe(false);
    const failedPath = join(dataDir, failedSnap!);
    const failedLines = readFileSync(failedPath, 'utf8').trim().split('\n').filter(Boolean);
    expect(failedLines.length).toBe(2);

    await svc.destroy();
  });

  it('does not grow WAL row count when recovery fails repeatedly with Influx down', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-repeat-fail-'));
    dirs.push(dataDir);
    const walPath = join(dataDir, 'wal.ndjson');
    const writeApi = {
      writePoint: vi.fn(),
      flush: vi.fn(async () => {
        throw new Error('influx stays down');
      }),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;

    const svc = new TimeseriesService({
      dataDir,
      writeApi,
      maxWalRecoveryAttempts: 1,
      walBatchSize: 1,
    });
    await svc.onBatch([samplePoint(1), samplePoint(2)]);

    const countLogicalRows = (): number => {
      let total = 0;
      for (const name of readdirSync(dataDir)) {
        if (
          name === 'wal.ndjson' ||
          name === 'wal.ndjson.recovering' ||
          (name.startsWith('wal.ndjson.failed-') && /^wal\.ndjson\.failed-\d+$/.test(name))
        ) {
          const p = join(dataDir, name);
          if (existsSync(p)) {
            total += readFileSync(p, 'utf8').trim().split('\n').filter(Boolean).length;
          }
        }
      }
      return total;
    };

    for (let cycle = 0; cycle < 5; cycle++) {
      await svc.recoverWAL();
      expect(countLogicalRows()).toBe(2);
      expect(existsSync(walPath)).toBe(false);
    }

    await svc.destroy();
  });

  it('recovers all rows after repeated failed cycles once Inflush succeeds', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-recover-after-fail-'));
    dirs.push(dataDir);
    const walPath = join(dataDir, 'wal.ndjson');
    const failingApi = {
      writePoint: vi.fn(),
      flush: vi.fn(async () => {
        throw new Error('influx down');
      }),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;

    const svcFail = new TimeseriesService({
      dataDir,
      writeApi: failingApi,
      maxWalRecoveryAttempts: 1,
      walBatchSize: 2,
    });
    await svcFail.onBatch([samplePoint(1), samplePoint(2)]);
    await svcFail.recoverWAL();
    await svcFail.recoverWAL();
    await svcFail.destroy();

    const writePoint = vi.fn();
    const okApi = {
      writePoint,
      flush: vi.fn(async () => {}),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;
    const svcOk = new TimeseriesService({ dataDir, writeApi: okApi, walBatchSize: 2 });
    await svcOk.recoverWAL();

    expect(writePoint).toHaveBeenCalledTimes(2);
    expect(existsSync(walPath)).toBe(false);
    expect(readdirSync(dataDir).some((f) => f.startsWith('wal.ndjson.failed-'))).toBe(false);

    await svcOk.destroy();
  });

  it('merges stranded .recovering into primary before replay (no primary WAL)', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-stranded-rec-'));
    dirs.push(dataDir);
    const walPath = join(dataDir, 'wal.ndjson');
    const recoveringPath = `${walPath}.recovering`;
    const line = JSON.stringify(samplePoint(99));
    writeFileSync(recoveringPath, `${line}\n`, 'utf8');

    const writePoint = vi.fn();
    const writeApi = {
      writePoint,
      flush: vi.fn(async () => {}),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;

    const svc = new TimeseriesService({ dataDir, writeApi });
    await svc.recoverWAL();

    expect(writePoint).toHaveBeenCalled();
    expect(existsSync(recoveringPath)).toBe(false);
    expect(existsSync(walPath)).toBe(false);

    await svc.destroy();
  });

  it('merges stranded .recovering without overwriting an existing primary WAL', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-merge-'));
    dirs.push(dataDir);
    const walPath = join(dataDir, 'wal.ndjson');
    const recoveringPath = `${walPath}.recovering`;
    writeFileSync(recoveringPath, `${JSON.stringify(samplePoint(1))}\n`, 'utf8');
    writeFileSync(walPath, `${JSON.stringify(samplePoint(2))}\n`, 'utf8');

    const writePoint = vi.fn();
    const writeApi = {
      writePoint,
      flush: vi.fn(async () => {}),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;

    const svc = new TimeseriesService({ dataDir, writeApi });
    await svc.recoverWAL();

    expect(writePoint).toHaveBeenCalledTimes(2);
    expect(existsSync(recoveringPath)).toBe(false);
    expect(existsSync(walPath)).toBe(false);

    await svc.destroy();
  });

  it('quarantines corrupt JSON lines and still replays valid lines', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-corrupt-'));
    dirs.push(dataDir);
    const walPath = join(dataDir, 'wal.ndjson');
    writeFileSync(
      walPath,
      `${JSON.stringify(samplePoint(1))}\nNOT_JSON\n${JSON.stringify(samplePoint(2))}\n`,
      'utf8',
    );

    const writePoint = vi.fn();
    const writeApi = {
      writePoint,
      flush: vi.fn(async () => {}),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;

    const svc = new TimeseriesService({ dataDir, writeApi });
    await svc.recoverWAL();

    expect(writePoint).toHaveBeenCalledTimes(2);
    const qPath = join(dataDir, 'wal-corrupt.ndjson');
    expect(existsSync(qPath)).toBe(true);
    const qLines = readFileSync(qPath, 'utf8').trim().split('\n').filter(Boolean);
    expect(qLines.length).toBe(1);
    expect(JSON.parse(qLines[0] ?? '{}').reason).toBe('json_parse');

    await svc.destroy();
  });

  it('resumes from recovery progress file after partial batch success', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-progress-'));
    dirs.push(dataDir);
    const walPath = join(dataDir, 'wal.ndjson');
    const lines = [samplePoint(1), samplePoint(2), samplePoint(3)]
      .map((p) => JSON.stringify(p))
      .join('\n');
    writeFileSync(walPath, `${lines}\n`, 'utf8');

    const writePoint = vi.fn();
    const writeApi = {
      writePoint,
      flush: vi.fn(async () => {
        // First recovery batch may retry; fail only when flushing the batch that contains the 3rd datapoint.
        if (writePoint.mock.calls.length > 2) {
          throw new Error('influx flaky on second batch');
        }
      }),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;

    const svc = new TimeseriesService({
      dataDir,
      writeApi,
      maxWalRecoveryAttempts: 1,
      walBatchSize: 2,
    });

    await svc.recoverWAL();

    expect(readdirSync(dataDir).some((f) => f.startsWith('wal.ndjson.recovering'))).toBe(false);
    const failedName = readdirSync(dataDir).find((f) => f.startsWith('wal.ndjson.failed-'));
    expect(failedName).toBeTruthy();

    const progressPath = `${join(dataDir, failedName!)}.recovery-progress.json`;
    expect(existsSync(progressPath)).toBe(true);
    expect(JSON.parse(readFileSync(progressPath, 'utf8').trim()).nextParsedIndex).toBe(2);
    // First batch (points 1–2) acknowledged before second batch failed.

    const writeApi2 = {
      writePoint: vi.fn(),
      flush: vi.fn(async () => {}),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;
    const svc2 = new TimeseriesService({
      dataDir,
      writeApi: writeApi2,
      walBatchSize: 2,
    });
    await svc2.recoverWAL();

    // Failed snapshot merges only rows from nextParsedIndex (point 3); no duplicate append onto primary.
    expect(writeApi2.writePoint).toHaveBeenCalledTimes(1);
    expect(existsSync(walPath)).toBe(false);

    await svc.destroy();
    await svc2.destroy();
  });

  it('failed snapshot merge appends only rows after progress cursor', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-failed-merge-'));
    dirs.push(dataDir);
    const walPath = join(dataDir, 'wal.ndjson');
    const failedPath = `${walPath}.failed-1730916000000`;
    const pts = [samplePoint(10), samplePoint(20), samplePoint(30)];
    writeFileSync(failedPath, `${pts.map((p) => JSON.stringify(p)).join('\n')}\n`, 'utf8');
    writeFileSync(
      `${failedPath}.recovery-progress.json`,
      `${JSON.stringify({ nextParsedIndex: 2 })}\n`,
      'utf8',
    );

    const writePoint = vi.fn();
    const writeApi = {
      writePoint,
      flush: vi.fn(async () => {}),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;

    const svc = new TimeseriesService({ dataDir, writeApi });
    await svc.recoverWAL();

    expect(existsSync(failedPath)).toBe(false);
    expect(writePoint).toHaveBeenCalledTimes(1);
    expect(existsSync(walPath)).toBe(false);

    await svc.destroy();
  });

  it('does not treat progress sidecars as WAL snapshots for merge', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-progress-sidecar-'));
    dirs.push(dataDir);
    const walPath = join(dataDir, 'wal.ndjson');
    const failedPath = `${walPath}.failed-1730916000001`;
    writeFileSync(failedPath, `${JSON.stringify(samplePoint(1))}\n`, 'utf8');
    writeFileSync(
      `${failedPath}.recovery-progress.json`,
      `${JSON.stringify({ nextParsedIndex: 0 })}\n`,
      'utf8',
    );
    // Poison line that would match old prefix-only logic (progress JSON misread as datapoint)
    writeFileSync(
      join(dataDir, 'wal.ndjson.failed-1730916000002.recovery-progress.json'),
      `${JSON.stringify({ nextParsedIndex: 0, forged: true })}\n`,
      'utf8',
    );

    const writePoint = vi.fn();
    const writeApi = {
      writePoint,
      flush: vi.fn(async () => {}),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;

    const svc = new TimeseriesService({ dataDir, writeApi });
    await svc.recoverWAL();

    expect(writePoint).toHaveBeenCalledTimes(1);
    expect(
      existsSync(join(dataDir, 'wal.ndjson.failed-1730916000002.recovery-progress.json')),
    ).toBe(true);
    const primaryLines = existsSync(walPath)
      ? readFileSync(walPath, 'utf8').trim().split('\n').filter(Boolean)
      : [];
    expect(primaryLines.length).toBeLessThanOrEqual(1);

    await svc.destroy();
  });

  it('quarantines JSON that fails energy datapoint schema', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-schema-'));
    dirs.push(dataDir);
    const walPath = join(dataDir, 'wal.ndjson');
    writeFileSync(
      walPath,
      `${JSON.stringify(samplePoint(1))}\n${JSON.stringify({ not: 'a datapoint' })}\n`,
      'utf8',
    );

    const writePoint = vi.fn();
    const writeApi = {
      writePoint,
      flush: vi.fn(async () => {}),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;

    const svc = new TimeseriesService({ dataDir, writeApi });
    await svc.recoverWAL();

    expect(writePoint).toHaveBeenCalledTimes(1);
    const qPath = join(dataDir, 'wal-corrupt.ndjson');
    const qLines = readFileSync(qPath, 'utf8').trim().split('\n').filter(Boolean);
    expect(qLines.some((l) => JSON.parse(l).reason === 'schema_validation')).toBe(true);

    await svc.destroy();
  });

  it('merges pre-existing wal.ndjson.recovering into primary before rename (both files present)', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-stale-rec-plus-primary-'));
    dirs.push(dataDir);
    const walPath = join(dataDir, 'wal.ndjson');
    const recoveringPath = `${walPath}.recovering`;
    writeFileSync(walPath, `${JSON.stringify(samplePoint(1))}\n`, 'utf8');
    writeFileSync(recoveringPath, `${JSON.stringify(samplePoint(2))}\n`, 'utf8');

    const writePoint = vi.fn();
    const writeApi = {
      writePoint,
      flush: vi.fn(async () => {}),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;

    const svc = new TimeseriesService({ dataDir, writeApi, walBatchSize: 200 });
    await svc.recoverWAL();

    expect(writePoint).toHaveBeenCalledTimes(2);
    expect(existsSync(recoveringPath)).toBe(false);
    expect(existsSync(walPath)).toBe(false);

    await svc.destroy();
  });

  it('recovers when only wal.ndjson.recovering exists (crash after rename, before replay)', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-only-recovering-'));
    dirs.push(dataDir);
    const walPath = join(dataDir, 'wal.ndjson');
    const recoveringPath = `${walPath}.recovering`;
    writeFileSync(recoveringPath, `${JSON.stringify(samplePoint(42))}\n`, 'utf8');

    const writePoint = vi.fn();
    const writeApi = {
      writePoint,
      flush: vi.fn(async () => {}),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;

    const svc = new TimeseriesService({ dataDir, writeApi });
    await svc.recoverWAL();

    expect(writePoint).toHaveBeenCalledTimes(1);
    expect(existsSync(recoveringPath)).toBe(false);
    expect(existsSync(walPath)).toBe(false);

    await svc.destroy();
  });

  it('serializes concurrent recoverWAL so a second run cannot merge an active .recovering snapshot', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-concurrent-rec-'));
    dirs.push(dataDir);
    const walPath = join(dataDir, 'wal.ndjson');
    const recoveringPath = `${walPath}.recovering`;
    const lines = [samplePoint(1), samplePoint(2)].map((p) => JSON.stringify(p)).join('\n');
    writeFileSync(walPath, `${lines}\n`, 'utf8');

    let releaseSecondFlush!: () => void;
    const secondFlushBarrier = new Promise<void>((resolve) => {
      releaseSecondFlush = resolve;
    });
    let flushCalls = 0;
    const writePoint = vi.fn();
    const writeApi = {
      writePoint,
      flush: vi.fn(async () => {
        flushCalls += 1;
        if (flushCalls === 1) return;
        await secondFlushBarrier;
      }),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;

    const svc = new TimeseriesService({
      dataDir,
      writeApi,
      walBatchSize: 1,
      maxWalRecoveryAttempts: 3,
    });

    const first = svc.recoverWAL();
    for (let i = 0; i < 200 && flushCalls < 2; i++) {
      await new Promise((r) => setTimeout(r, 5));
    }
    expect(flushCalls).toBe(2);
    expect(existsSync(recoveringPath)).toBe(true);

    const second = svc.recoverWAL();
    await new Promise((r) => setTimeout(r, 25));
    expect(existsSync(recoveringPath)).toBe(true);

    releaseSecondFlush();
    await first;
    await second;

    expect(existsSync(recoveringPath)).toBe(false);
    await svc.destroy();
  });

  it('getWalBacklogBytes includes recovering snapshot size', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-backlog-bytes-'));
    dirs.push(dataDir);
    const walPath = join(dataDir, 'wal.ndjson');
    const recoveringPath = `${walPath}.recovering`;
    writeFileSync(recoveringPath, `${JSON.stringify(samplePoint(1))}\n`, 'utf8');

    const svc = new TimeseriesService({ dataDir, writeApi: null });
    const bytes = svc.getWalBacklogBytes();
    expect(bytes).toBeGreaterThan(0);

    await svc.destroy();
  });
});
