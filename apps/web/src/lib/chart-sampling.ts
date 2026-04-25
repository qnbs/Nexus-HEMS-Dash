/**
 * LTTB Chart Sampling — Largest-Triangle-Three-Buckets
 *
 * Visually lossless downsampling for time-series chart data.
 * Reduces chart render pressure from O(n) SVG elements to a fixed threshold
 * (default: 300 points) while preserving the visual shape of the series.
 *
 * Algorithm: LTTB (Sveinn Steinarsson, 2013)
 * - Divide the data into equal-width buckets
 * - Select the point in each bucket that forms the largest triangle with
 *   the selected point from the previous bucket and the average of the
 *   next bucket
 * - Always retains the first and last data point
 *
 * Performance: O(n) time, O(threshold) space
 *
 * Usage:
 *   import { lttbSample } from '../lib/chart-sampling';
 *   const chartData = data.length > 500 ? lttbSample(data, 300) : data;
 *
 * @see docs/Performance-Optimization-Plan.md#p3-lttb-chart-downsampling
 */

export interface TimeSeriesPoint {
  ts: number;
  [key: string]: number;
}

/**
 * Downsample a time series using the LTTB algorithm.
 *
 * @param data       Input series sorted by `ts` (ascending). Must have at least 2 points.
 * @param threshold  Maximum output length. If data.length ≤ threshold, input is returned as-is.
 * @param yKey       The primary metric key used for triangle area calculation (default: first numeric key found)
 * @returns          Downsampled series with exactly `threshold` points (or less if data is shorter).
 */
export function lttbSample<T extends TimeSeriesPoint>(
  data: T[],
  threshold = 300,
  yKey?: string,
): T[] {
  if (data.length <= threshold) return data;
  if (threshold < 2) return [data[0], data[data.length - 1]];

  // Resolve the y-key for triangle area computation
  const resolvedYKey = yKey ?? findPrimaryYKey(data[0]);

  const sampled: T[] = [data[0]];
  const bucketSize = (data.length - 2) / (threshold - 2);

  let prevSelected = 0;

  for (let i = 0; i < threshold - 2; i++) {
    const bucketStart = Math.floor((i + 1) * bucketSize) + 1;
    const bucketEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, data.length - 1);

    // Compute average of the next bucket for the triangle base
    const nextBucketStart = bucketEnd;
    const nextBucketEnd = Math.min(Math.floor((i + 3) * bucketSize) + 1, data.length - 1);
    let avgTs = 0;
    let avgY = 0;
    const nextCount = nextBucketEnd - nextBucketStart || 1;
    for (let j = nextBucketStart; j < nextBucketEnd; j++) {
      avgTs += data[j].ts;
      avgY += (data[j][resolvedYKey] as number) ?? 0;
    }
    avgTs /= nextCount;
    avgY /= nextCount;

    // Find the point in the current bucket that forms the largest triangle
    const prevPoint = data[prevSelected];
    let maxArea = -1;
    let maxIdx = bucketStart;

    for (let j = bucketStart; j < bucketEnd; j++) {
      const area = Math.abs(
        (prevPoint.ts - avgTs) *
          (((data[j][resolvedYKey] as number) ?? 0) - ((prevPoint[resolvedYKey] as number) ?? 0)) -
          (prevPoint.ts - data[j].ts) * (avgY - ((prevPoint[resolvedYKey] as number) ?? 0)),
      );
      if (area > maxArea) {
        maxArea = area;
        maxIdx = j;
      }
    }

    sampled.push(data[maxIdx]);
    prevSelected = maxIdx;
  }

  sampled.push(data[data.length - 1]);
  return sampled;
}

/**
 * Find the first numeric key (excluding `ts`) to use as the primary metric for
 * triangle area calculation when no explicit `yKey` is provided.
 */
function findPrimaryYKey(point: TimeSeriesPoint): string {
  for (const key of Object.keys(point)) {
    if (key !== 'ts' && typeof point[key] === 'number') {
      return key;
    }
  }
  return 'ts'; // fallback — degenerate case
}

/**
 * Convenience wrapper that applies LTTB sampling only when the series
 * exceeds the given threshold.
 *
 * @param data       Input time series
 * @param threshold  Sample if data.length > threshold (default: 500)
 * @param outputSize Target output length after sampling (default: 300)
 */
export function sampleIfNeeded<T extends TimeSeriesPoint>(
  data: T[],
  threshold = 500,
  outputSize = 300,
): T[] {
  return data.length > threshold ? lttbSample(data, outputSize) : data;
}
