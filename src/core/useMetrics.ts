/**
 * useMetrics – React hook for real-time Prometheus metrics
 *
 * Polls /api/metrics/json and exposes typed metric data for UI components.
 */

import { useState, useEffect, useRef } from 'react';
import type { MetricFamily } from '../lib/metrics';
import { metricsCollector } from '../lib/metrics';

export interface MetricSnapshot {
  families: MetricFamily[];
  health: {
    uptime: number;
    connections: number;
  };
  lastUpdated: number;
  error: string | null;
}

export function useMetrics(intervalMs: number = 5000): MetricSnapshot {
  const [snapshot, setSnapshot] = useState<MetricSnapshot>({
    families: [],
    health: { uptime: 0, connections: 0 },
    lastUpdated: 0,
    error: null,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/metrics/json');
      if (!res.ok) {
        setSnapshot((prev) => ({ ...prev, error: `HTTP ${res.status}` }));
        return;
      }
      const data = await res.json();
      setSnapshot({
        families: data.families ?? [],
        health: data.health ?? { uptime: 0, connections: 0 },
        lastUpdated: Date.now(),
        error: null,
      });
    } catch {
      // Fallback to client-side collector
      const families = metricsCollector.toJSON();
      const health = metricsCollector.getHealthStatus();
      setSnapshot({
        families,
        health: { uptime: health.uptime, connections: 0 },
        lastUpdated: Date.now(),
        error: null,
      });
    }
  };

  useEffect(() => {
    fetchMetrics(); // eslint-disable-line react-hooks/set-state-in-effect
    intervalRef.current = setInterval(fetchMetrics, intervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [intervalMs]);

  return snapshot;
}

/**
 * Extract a specific metric value from a snapshot
 */
export function getMetricFromSnapshot(
  families: MetricFamily[],
  name: string,
  labels?: Record<string, string>,
): number | null {
  const family = families.find((f) => f.definition.name === name);
  if (!family) return null;

  if (!labels) return family.samples[family.samples.length - 1]?.value ?? null;

  const match = family.samples.find((s) =>
    Object.entries(labels).every(([k, v]) => s.labels[k] === v),
  );
  return match?.value ?? null;
}
