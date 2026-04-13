/**
 * useAdapterWorker — React hook for offloading adapter polling to a Web Worker
 *
 * Manages the adapter-worker lifecycle and bridges poll results back to the
 * main thread via the useEnergyStore.mergeData() pipeline.
 *
 * Usage:
 *   const { startPolling, stopPolling, stopAll } = useAdapterWorker();
 *   startPolling('modbus-sunspec', {
 *     protocol: 'http',
 *     host: '192.168.1.50',
 *     path: '/api/modbus/sunspec',
 *     query: { model: 'inverter' },
 *   });
 */

import { useEffect, useRef } from 'react';
import type { PollTarget } from './adapter-worker';
import { useEnergyStoreBase } from './useEnergyStore';
import { metricsCollector } from '../lib/metrics';

interface WorkerDataMessage {
  type: 'data';
  adapterId: string;
  result: unknown;
}

interface WorkerErrorMessage {
  type: 'error';
  adapterId: string;
  error: string;
}

interface WorkerLatencyMessage {
  type: 'latency';
  adapterId: string;
  ms: number;
}

type WorkerOutMessage = WorkerDataMessage | WorkerErrorMessage | WorkerLatencyMessage;

export function useAdapterWorker() {
  const workerRef = useRef<Worker | null>(null);

  const toPollTarget = (target: string | PollTarget): PollTarget | null => {
    if (typeof target !== 'string') return target;

    try {
      const parsed = new URL(target);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;

      const query = Object.fromEntries(parsed.searchParams.entries());
      return {
        protocol: parsed.protocol === 'https:' ? 'https' : 'http',
        host: parsed.hostname,
        port: parsed.port ? Number(parsed.port) : undefined,
        path: parsed.pathname,
        query: Object.keys(query).length > 0 ? query : undefined,
      };
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const worker = new Worker(new URL('./adapter-worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerOutMessage>) => {
      const msg = event.data;

      switch (msg.type) {
        case 'data':
          // Route data through the store merge pipeline
          useEnergyStoreBase
            .getState()
            .mergeData(msg.adapterId, msg.result as Record<string, unknown>);
          break;
        case 'error':
          metricsCollector.recordAdapterError(msg.adapterId, msg.error);
          break;
        case 'latency':
          metricsCollector.recordAdapterStatus(msg.adapterId, msg.adapterId, true, msg.ms);
          break;
      }
    };

    return () => {
      worker.postMessage({ type: 'stopAll' });
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const startPolling = (
    adapterId: string,
    target: string | PollTarget,
    headers?: Record<string, string>,
    intervalMs?: number,
  ): void => {
    const normalizedTarget = toPollTarget(target);
    if (!normalizedTarget) {
      workerRef.current?.postMessage({ type: 'stop', adapterId });
      if (import.meta.env.DEV) {
        console.warn('[useAdapterWorker] Ignored invalid poll target for', adapterId);
      }
      return;
    }

    workerRef.current?.postMessage({
      type: 'poll',
      adapterId,
      target: normalizedTarget,
      headers,
      intervalMs,
    });
  };

  const stopPolling = (adapterId: string): void => {
    workerRef.current?.postMessage({ type: 'stop', adapterId });
  };

  const transform = (
    adapterId: string,
    rawData: string,
    format: 'sunspec-inverter' | 'sunspec-battery' | 'sunspec-meter' | 'venus-mqtt' | 'json',
  ): void => {
    workerRef.current?.postMessage({ type: 'transform', adapterId, rawData, format });
  };

  const stopAll = (): void => {
    workerRef.current?.postMessage({ type: 'stopAll' });
  };

  return { startPolling, stopPolling, transform, stopAll };
}
