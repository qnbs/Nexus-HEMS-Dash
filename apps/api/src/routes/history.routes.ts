/**
 * History Routes — GET /api/v1/history
 *
 * Queries InfluxDB for historical energy metrics with granularity-based
 * downsampling. Returns at most 1000 data points per request.
 *
 * When InfluxDB is unavailable, returns an empty response with
 * source: "unavailable" so the frontend can degrade gracefully.
 */

import { InfluxDB } from '@influxdata/influxdb-client';
import type { Request, Response, Router } from 'express';
import { Router as createRouter } from 'express';
import { z } from 'zod';

const MAX_POINTS = 1000;

// ---------------------------------------------------------------------------
// Request validation schema
// ---------------------------------------------------------------------------

const HistoryQuerySchema = z.object({
  metric: z.string().min(1).max(64),
  deviceId: z.string().min(1).max(128).optional(),
  from: z.string().datetime({ offset: true }),
  to: z.string().datetime({ offset: true }),
  granularity: z.enum(['1m', '5m', '15m', '1h', '1d']).default('5m'),
});

// ---------------------------------------------------------------------------
// InfluxDB client (lazy initialised, shared across requests)
// ---------------------------------------------------------------------------

let queryApi: ReturnType<InstanceType<typeof InfluxDB>['getQueryApi']> | null = null;

function getQueryApi(): ReturnType<InstanceType<typeof InfluxDB>['getQueryApi']> | null {
  if (queryApi) return queryApi;

  const url = process.env.INFLUXDB_URL ?? 'http://influxdb:8086';
  const token = process.env.INFLUXDB_TOKEN ?? 'nexus-hems-influx-token';
  const org = process.env.INFLUXDB_ORG ?? 'nexus-hems';

  try {
    queryApi = new InfluxDB({ url, token }).getQueryApi(org);
    return queryApi;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export function createHistoryRoutes(): Router {
  const router = createRouter();

  router.get('/history', async (req: Request, res: Response) => {
    const parseResult = HistoryQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Invalid query parameters',
        details: parseResult.error.issues,
      });
      return;
    }

    const { metric, deviceId, from, to, granularity } = parseResult.data;
    const api = getQueryApi();

    if (!api) {
      res.status(200).json({
        metric,
        granularity,
        points: [],
        count: 0,
        source: 'unavailable',
      });
      return;
    }

    try {
      const points = await queryInfluxDB(api, {
        metric,
        ...(deviceId !== undefined ? { deviceId } : {}),
        from,
        to,
        granularity,
        bucket: process.env.INFLUXDB_BUCKET ?? 'nexus-hems',
      });

      res.status(200).json({
        metric,
        granularity,
        points,
        count: points.length,
        source: 'influxdb',
      });
    } catch (err) {
      console.error('[History] InfluxDB query error:', err);
      res.status(200).json({
        metric,
        granularity,
        points: [],
        count: 0,
        source: 'unavailable',
      });
    }
  });

  return router;
}

// ---------------------------------------------------------------------------
// InfluxDB Flux query
// ---------------------------------------------------------------------------

interface QueryOptions {
  metric: string;
  deviceId?: string;
  from: string;
  to: string;
  granularity: string;
  bucket: string;
}

interface HistoryPoint {
  timestamp: number;
  value: number;
}

async function queryInfluxDB(
  api: ReturnType<InstanceType<typeof InfluxDB>['getQueryApi']>,
  opts: QueryOptions,
): Promise<HistoryPoint[]> {
  const deviceFilter = opts.deviceId
    ? `|> filter(fn: (r) => r["device_id"] == "${opts.deviceId}")`
    : '';

  const flux = `
from(bucket: "${opts.bucket}")
  |> range(start: ${opts.from}, stop: ${opts.to})
  |> filter(fn: (r) => r["_measurement"] == "${opts.metric}")
  ${deviceFilter}
  |> aggregateWindow(every: ${opts.granularity}, fn: mean, createEmpty: false)
  |> limit(n: ${MAX_POINTS})
  |> yield(name: "mean")
  `.trim();

  const points: HistoryPoint[] = [];

  await new Promise<void>((resolve, reject) => {
    api.queryRows(flux, {
      next(row: string[], tableMeta: { toObject: (r: string[]) => Record<string, unknown> }) {
        const obj = tableMeta.toObject(row);
        const ts = obj._time;
        const val = obj._value;
        if (typeof ts === 'string' && typeof val === 'number') {
          points.push({ timestamp: new Date(ts).getTime(), value: val });
        }
      },
      error(err: Error) {
        reject(err);
      },
      complete() {
        resolve();
      },
    });
  });

  return points;
}
