/**
 * Defensive LTTB for Recharts series that use categorical X keys (hour, time)
 * instead of `ts` / `timestamp`. Maps row index (or numeric indexKey) to `ts`
 * for triangle sampling, then strips the synthetic field.
 */

import { lttbSample } from './chart-sampling';

export type IndexedSeriesRow = Record<string, string | number | boolean | undefined>;

/**
 * Downsample rows when length exceeds `threshold`, using LTTB on `yKey`.
 * X-order uses numeric `indexKey` if present and numeric, else array index.
 */
export function sampleIndexedSeriesIfNeeded<T extends IndexedSeriesRow>(
  data: T[],
  options: {
    /** Field used only for ordering (e.g. hour label — falls back to index) */
    indexKey?: keyof T & string;
    /** Primary metric for LTTB triangle area */
    yKey: string;
    threshold?: number;
    outputSize?: number;
  },
): T[] {
  const { indexKey, yKey, threshold = 300, outputSize = 120 } = options;
  if (data.length <= threshold) return data;

  const augmented = data.map((row, i) => {
    let order = i;
    if (indexKey !== undefined) {
      const v = row[indexKey];
      if (typeof v === 'number' && Number.isFinite(v)) order = v;
    }
    return { ...row, ts: order } as T & { ts: number };
  });

  const sampled = lttbSample(augmented, outputSize, yKey);
  return sampled.map(({ ts: _ts, ...rest }) => rest as T);
}
