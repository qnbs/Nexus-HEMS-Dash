import { useEffect } from 'react';
import {
  type BackendAdapterMode,
  fetchBackendHealthStatus,
  setRuntimeBackendReadOnly,
} from './adapter-mode';
import { ignorePromiseRejection } from './ignore-promise-rejection';

/** Poll `/api/health` once on mount for global safety indicators (mode + read-only). */
export const useBackendHealthPoll = (setAdapterMode: (mode: BackendAdapterMode) => void): void => {
  useEffect(() => {
    const controller = new AbortController();
    fetchBackendHealthStatus(controller.signal)
      .then(({ mode, readOnly }) => {
        setAdapterMode(mode);
        setRuntimeBackendReadOnly(readOnly);
      })
      .catch(ignorePromiseRejection);
    return () => {
      controller.abort();
    };
  }, [setAdapterMode]);
};
