/**
 * useAdapterWorker — React hook for offloading adapter polling to a Web Worker
 *
 * Manages the adapter-worker lifecycle and bridges poll results back to the
 * main thread via the useEnergyStore.mergeData() pipeline.
 *
 * Usage:
 *   const { startPolling, stopPolling, stopAll } = useAdapterWorker();
 *   startPolling('modbus-sunspec', 'http://192.168.1.50/api/modbus/sunspec?model=inverter');
 */

import { useEffect, useRef } from 'react';
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
    url: string,
    headers?: Record<string, string>,
    intervalMs?: number,
  ): void => {
    workerRef.current?.postMessage({ type: 'poll', adapterId, url, headers, intervalMs });
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
