/**
 * DATA-18: failure-atomic WAL archive handoff — injectable `node:fs` shims (ESM cannot vi.spyOn fs exports).
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { WriteApi } from '@influxdata/influxdb-client';
import type { UnifiedEnergyDatapoint } from '@nexus-hems/shared-types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type CopyFn = typeof import('node:fs').copyFileSync;
type WriteFn = typeof import('node:fs').writeFileSync;
type UnlinkFn = typeof import('node:fs').unlinkSync;

const fsFault = vi.hoisted(() => ({
  copyFileSync: null as null | CopyFn,
  writeFileSync: null as null | WriteFn,
  unlinkSync: null as null | UnlinkFn,
}));

const fsActual = vi.hoisted(() => ({
  copyFileSync: null as null | CopyFn,
  writeFileSync: null as null | WriteFn,
  unlinkSync: null as null | UnlinkFn,
  readFileSync: null as null | typeof import('node:fs').readFileSync,
}));

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  fsActual.copyFileSync = actual.copyFileSync;
  fsActual.writeFileSync = actual.writeFileSync;
  fsActual.unlinkSync = actual.unlinkSync;
  fsActual.readFileSync = actual.readFileSync;
  return {
    ...actual,
    copyFileSync: ((...args: Parameters<CopyFn>) => {
      if (fsFault.copyFileSync) return fsFault.copyFileSync(...args);
      return actual.copyFileSync(...args);
    }) as CopyFn,
    writeFileSync: ((...args: Parameters<WriteFn>) => {
      if (fsFault.writeFileSync) return fsFault.writeFileSync(...args);
      return actual.writeFileSync(...args);
    }) as WriteFn,
    unlinkSync: ((...args: Parameters<UnlinkFn>) => {
      if (fsFault.unlinkSync) return fsFault.unlinkSync(...args);
      return actual.unlinkSync(...args);
    }) as UnlinkFn,
  };
});

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

const WAL_ROW_WAL_FILE = /^(?:wal\.ndjson|wal\.ndjson\.recovering|wal\.ndjson\.failed-\d+(-\d+)?)$/;

function readWalProgressStart(progressPath: string): number {
  if (!existsSync(progressPath)) return 0;
  try {
    const parsed = JSON.parse(readFileSync(progressPath, 'utf8').trim()) as {
      nextParsedIndex?: number;
    };
    return typeof parsed.nextParsedIndex === 'number' ? parsed.nextParsedIndex : 0;
  } catch {
    return 0;
  }
}

/** Count WAL NDJSON rows not yet drained per sidecar progress (test helper). */
function countPrimaryWalLines(dataDir: string): number {
  const walPath = join(dataDir, 'wal.ndjson');
  if (!existsSync(walPath)) return 0;
  return readFileSync(walPath, 'utf8').trim().split('\n').filter(Boolean).length;
}

function countUnmergedWalRows(dataDir: string): number {
  let total = 0;
  for (const name of readdirSync(dataDir)) {
    if (!WAL_ROW_WAL_FILE.test(name)) continue;
    const filePath = join(dataDir, name);
    if (!existsSync(filePath)) continue;
    const lines = readFileSync(filePath, 'utf8').trim().split('\n').filter(Boolean);
    const start = readWalProgressStart(`${filePath}.recovery-progress.json`);
    total += lines.slice(Math.min(start, lines.length)).length;
  }
  return total;
}

describe('TimeseriesService failed recovery archive handoff (DATA-18)', () => {
  const dirs: string[] = [];

  beforeEach(() => {
    fsFault.copyFileSync = null;
    fsFault.writeFileSync = null;
    fsFault.unlinkSync = null;
  });

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

  it('preserves recovering snapshot when staging copy throws (ENOSPC-like)', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-archive-copy-fail-'));
    dirs.push(dataDir);
    const walPath = join(dataDir, 'wal.ndjson');
    const recoveringPath = `${walPath}.recovering`;
    const payload = [samplePoint(11), samplePoint(12)].map((p) => JSON.stringify(p)).join('\n');
    writeFileSync(recoveringPath, `${payload}\n`, 'utf8');
    const before = readFileSync(recoveringPath, 'utf8');

    fsFault.copyFileSync = (src, dest) => {
      if (String(dest).endsWith('.staging')) {
        throw Object.assign(new Error('no space left on device'), { code: 'ENOSPC' });
      }
      return fsActual.copyFileSync!(src, dest);
    };

    const writeApi = {
      writePoint: vi.fn(),
      flush: vi.fn(async () => {
        throw new Error('always fail');
      }),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;

    const svc = new TimeseriesService({ dataDir, writeApi, maxWalRecoveryAttempts: 1 });
    await svc.recoverWAL();

    expect(existsSync(recoveringPath)).toBe(true);
    expect(readFileSync(recoveringPath, 'utf8')).toBe(before);
    expect(readdirSync(dataDir).some((f) => /^wal\.ndjson\.failed-\d+(-\d+)?$/.test(f))).toBe(
      false,
    );
    expect(readdirSync(dataDir).some((f) => f.includes('.staging'))).toBe(false);

    await svc.destroy();
  });

  it('does not treat partial staging bytes as authoritative when copy aborts', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-archive-partial-'));
    dirs.push(dataDir);
    const walPath = join(dataDir, 'wal.ndjson');
    const recoveringPath = `${walPath}.recovering`;
    const payload = [samplePoint(21), samplePoint(22)].map((p) => JSON.stringify(p)).join('\n');
    writeFileSync(recoveringPath, `${payload}\n`, 'utf8');
    const before = readFileSync(recoveringPath, 'utf8');

    fsFault.copyFileSync = (src, dest) => {
      if (String(dest).endsWith('.staging')) {
        const buf = fsActual.readFileSync!(src);
        fsActual.writeFileSync!(dest, buf.subarray(0, Math.max(1, Math.floor(buf.length / 2))));
        throw new Error('partial copy IO error');
      }
      return fsActual.copyFileSync!(src, dest);
    };

    const writeApi = {
      writePoint: vi.fn(),
      flush: vi.fn(async () => {
        throw new Error('always fail');
      }),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;

    const svc = new TimeseriesService({ dataDir, writeApi, maxWalRecoveryAttempts: 1 });
    await svc.recoverWAL();

    expect(existsSync(recoveringPath)).toBe(true);
    expect(readFileSync(recoveringPath, 'utf8')).toBe(before);
    expect(readdirSync(dataDir).some((f) => /^wal\.ndjson\.failed-\d+(-\d+)?$/.test(f))).toBe(
      false,
    );

    await svc.destroy();
  });

  it('preserves recovering when progress cursor write fails after rename', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-archive-progress-fail-'));
    dirs.push(dataDir);
    const walPath = join(dataDir, 'wal.ndjson');
    const recoveringPath = `${walPath}.recovering`;
    writeFileSync(recoveringPath, `${JSON.stringify(samplePoint(31))}\n`, 'utf8');

    fsFault.writeFileSync = (path, data, ...rest) => {
      const p = String(path);
      if (p.includes('wal.ndjson.failed-') && p.endsWith('.recovery-progress.json')) {
        throw new Error('progress cursor persist failed');
      }
      return fsActual.writeFileSync!(path, data, ...rest);
    };

    const writeApi = {
      writePoint: vi.fn(),
      flush: vi.fn(async () => {
        throw new Error('always fail');
      }),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;

    const svc = new TimeseriesService({ dataDir, writeApi, maxWalRecoveryAttempts: 1 });
    await svc.recoverWAL();

    expect(existsSync(recoveringPath)).toBe(true);
    expect(readdirSync(dataDir).some((f) => /^wal\.ndjson\.failed-\d+(-\d+)?$/.test(f))).toBe(
      false,
    );

    await svc.destroy();
  });

  it('keeps failed archive when unlink of recovering throws after successful handoff', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-archive-unlink-fail-'));
    dirs.push(dataDir);
    const walPath = join(dataDir, 'wal.ndjson');
    const recoveringPath = `${walPath}.recovering`;
    const lines = [samplePoint(41), samplePoint(42)].map((p) => JSON.stringify(p)).join('\n');
    writeFileSync(walPath, `${lines}\n`, 'utf8');

    let unlinkFaultArmed = true;
    fsFault.unlinkSync = (path) => {
      if (unlinkFaultArmed && String(path) === recoveringPath) {
        throw Object.assign(new Error('permission denied'), { code: 'EACCES' });
      }
      return fsActual.unlinkSync!(path);
    };

    const writeApi = {
      writePoint: vi.fn(),
      flush: vi.fn(async () => {
        throw new Error('always fail');
      }),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;

    const svc = new TimeseriesService({ dataDir, writeApi, maxWalRecoveryAttempts: 1 });
    await svc.recoverWAL();

    const failedName = readdirSync(dataDir).find((f) => /^wal\.ndjson\.failed-\d+(-\d+)?$/.test(f));
    expect(failedName).toBeTruthy();
    const failedPath = join(dataDir, failedName!);
    expect(readFileSync(failedPath, 'utf8').trim().split('\n').filter(Boolean).length).toBe(2);
    expect(existsSync(`${failedPath}.recovery-progress.json`)).toBe(true);
    expect(existsSync(recoveringPath)).toBe(true);

    unlinkFaultArmed = false;

    const writeApi2 = {
      writePoint: vi.fn(),
      flush: vi.fn(async () => {}),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;
    const svc2 = new TimeseriesService({ dataDir, writeApi: writeApi2 });
    await svc2.recoverWAL();
    expect(writeApi2.writePoint).toHaveBeenCalledTimes(2);
    expect(existsSync(recoveringPath)).toBe(false);

    await svc.destroy();
    await svc2.destroy();
  });

  it('does not duplicate primary rows when stranded snapshot unlink fails during merge', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-merge-unlink-fail-'));
    dirs.push(dataDir);
    const failedPath = join(dataDir, 'wal.ndjson.failed-1700000000000-0');
    const lines = [samplePoint(91), samplePoint(92)].map((p) => JSON.stringify(p)).join('\n');
    writeFileSync(failedPath, `${lines}\n`, 'utf8');

    let failStrandedUnlink = true;
    fsFault.unlinkSync = (path) => {
      if (failStrandedUnlink && String(path) === failedPath) {
        throw Object.assign(new Error('permission denied'), { code: 'EACCES' });
      }
      return fsActual.unlinkSync!(path);
    };

    const writeApi = {
      writePoint: vi.fn(),
      flush: vi.fn(async () => {
        throw new Error('influx always down');
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
    expect(existsSync(failedPath)).toBe(true);
    expect(countUnmergedWalRows(dataDir)).toBe(2);

    await svc.recoverWAL();
    expect(countUnmergedWalRows(dataDir)).toBe(2);

    failStrandedUnlink = false;
    const svc2 = new TimeseriesService({
      dataDir,
      writeApi,
      maxWalRecoveryAttempts: 1,
      walBatchSize: 2,
    });
    await svc2.recoverWAL();
    expect(countUnmergedWalRows(dataDir)).toBe(2);

    await svc.destroy();
    await svc2.destroy();
  });

  it('does not duplicate primary WAL lines when merge progress write fails after append', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-merge-progress-fail-'));
    dirs.push(dataDir);
    const failedPath = join(dataDir, 'wal.ndjson.failed-1700000001000-0');
    const lines = [samplePoint(101), samplePoint(102)].map((p) => JSON.stringify(p)).join('\n');
    writeFileSync(failedPath, `${lines}\n`, 'utf8');

    const strandedProgressPath = `${failedPath}.recovery-progress.json`;
    let failStrandedProgressOnce = true;
    fsFault.writeFileSync = (path, content, encoding) => {
      if (failStrandedProgressOnce && String(path) === strandedProgressPath) {
        failStrandedProgressOnce = false;
        throw Object.assign(new Error('EIO during progress write'), { code: 'EIO' });
      }
      return fsActual.writeFileSync!(path, content, encoding);
    };

    const writeApi = {
      writePoint: vi.fn(),
      flush: vi.fn(async () => {
        throw new Error('influx always down');
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
    const logicalRowsAfterCrash = countPrimaryWalLines(dataDir) + countUnmergedWalRows(dataDir);
    expect(logicalRowsAfterCrash).toBe(2);

    const svc2 = new TimeseriesService({
      dataDir,
      writeApi,
      maxWalRecoveryAttempts: 1,
      walBatchSize: 2,
    });
    await svc2.recoverWAL();
    const logicalRowsAfterRetry = countPrimaryWalLines(dataDir) + countUnmergedWalRows(dataDir);
    expect(logicalRowsAfterRetry).toBe(logicalRowsAfterCrash);

    await svc.destroy();
    await svc2.destroy();
  });

  it('allocates distinct failed snapshot names when archive timestamps collide', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-failed-ts-collision-'));
    dirs.push(dataDir);
    const fixedTs = 1_730_916_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(fixedTs);

    const writeApi = {
      writePoint: vi.fn(),
      flush: vi.fn(async () => {
        throw new Error('always fail');
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

    await svc.recoverWAL();
    expect(existsSync(join(dataDir, `wal.ndjson.failed-${fixedTs}-0`))).toBe(true);

    await svc.recoverWAL();
    expect(existsSync(join(dataDir, `wal.ndjson.failed-${fixedTs}-1`))).toBe(true);

    await svc.destroy();
    vi.restoreAllMocks();
  });

  it('does not treat merge-staged sidecar basename as a WAL snapshot (#454)', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-merge-staged-basename-'));
    dirs.push(dataDir);
    const orphanMarker = join(dataDir, 'wal.ndjson.recovering.merge-staged.json');
    writeFileSync(orphanMarker, '{"phase":"pending","lineCount":1}\n', 'utf8');

    const writeApi = {
      writePoint: vi.fn(),
      flush: vi.fn(async () => {}),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;

    const svc = new TimeseriesService({ dataDir, writeApi, maxWalRecoveryAttempts: 1 });
    await svc.recoverWAL();

    expect(existsSync(orphanMarker)).toBe(true);
    expect(readdirSync(dataDir).some((n) => n === 'wal-corrupt.ndjson')).toBe(false);
    await svc.destroy();
  });

  it('re-merges when staged digest does not match current snapshot payload (#454)', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-stale-digest-'));
    dirs.push(dataDir);
    const recoveringPath = join(dataDir, 'wal.ndjson.recovering');
    const pointA = samplePoint(201);
    writeFileSync(recoveringPath, `${JSON.stringify(pointA)}\n`, 'utf8');
    writeFileSync(
      `${recoveringPath}.merge-staged.json`,
      `${JSON.stringify({
        phase: 'appended',
        lineCount: 1,
        primaryLinesBefore: 0,
        payloadDigest: 'deadbeef',
      })}\n`,
      'utf8',
    );

    const writeApi = {
      writePoint: vi.fn(),
      flush: vi.fn(async () => {
        throw new Error('keep local');
      }),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;

    const svc = new TimeseriesService({ dataDir, writeApi, maxWalRecoveryAttempts: 1 });
    await svc.recoverWAL();

    const failedName = readdirSync(dataDir).find((n) => n.startsWith('wal.ndjson.failed-'));
    expect(failedName).toBeDefined();
    expect(readFileSync(join(dataDir, failedName as string), 'utf8')).toContain('"value":201');
    await svc.destroy();
  });

  it('does not accept unrelated primary line growth as merge receipt while staged pending (#454)', async () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'wal-merge-count-trap-'));
    dirs.push(dataDir);
    const walPath = join(dataDir, 'wal.ndjson');
    const recoveringPath = join(dataDir, 'wal.ndjson.recovering');
    const pointA = samplePoint(101);
    const pointB = samplePoint(102);
    const sliceLines = `${JSON.stringify(pointA)}\n${JSON.stringify(pointB)}\n`;
    writeFileSync(recoveringPath, sliceLines, 'utf8');

    const unrelated = `${JSON.stringify(samplePoint(999))}\n${JSON.stringify(samplePoint(1000))}\n`;
    writeFileSync(walPath, unrelated, 'utf8');

    const payloadDigest = createHash('sha256').update(sliceLines, 'utf8').digest('hex');
    writeFileSync(
      `${recoveringPath}${'.merge-staged.json'}`,
      `${JSON.stringify({
        phase: 'pending',
        lineCount: 2,
        primaryLinesBefore: 0,
        payloadDigest,
      })}\n`,
      'utf8',
    );

    const writeApi = {
      writePoint: vi.fn(),
      flush: vi.fn(async () => {
        throw new Error('keep WAL local for assertion');
      }),
      close: vi.fn(async () => {}),
    } as unknown as WriteApi;

    const svc = new TimeseriesService({ dataDir, writeApi, maxWalRecoveryAttempts: 1 });
    await svc.recoverWAL();

    const failedName = readdirSync(dataDir).find((n) => n.startsWith('wal.ndjson.failed-'));
    expect(failedName).toBeDefined();
    const retained = readFileSync(join(dataDir, failedName as string), 'utf8');
    expect(retained).toContain('"value":101');
    expect(retained).toContain('"value":102');
    expect(countUnmergedWalRows(dataDir)).toBeGreaterThanOrEqual(2);

    await svc.destroy();
  });
});
