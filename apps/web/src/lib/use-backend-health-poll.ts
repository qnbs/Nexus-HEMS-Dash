import { useEffect } from 'react';
import { useAppStore } from '../store';
import { fetchBackendHealthStatus, setRuntimeBackendReadOnly } from './adapter-mode';
import { ignorePromiseRejection } from './ignore-promise-rejection';

/** Poll `/api/health` once on mount for global safety indicators (mode + read-only). */
export const useBackendHealthPoll = (): void => {
  const setAdapterMode = useAppStore((s) => s.setAdapterMode);
  const setBackendReadOnly = useAppStore((s) => s.setBackendReadOnly);

  useEffect(() => {
    const controller = new AbortController();
    fetchBackendHealthStatus(controller.signal)
      .then(({ mode, readOnly }) => {
        setAdapterMode(mode);
        setBackendReadOnly(readOnly);
        // Non-React command-safety path reads the module flag synchronously.
        setRuntimeBackendReadOnly(readOnly);
      })
      .catch(ignorePromiseRejection);
    return () => {
      controller.abort();
    };
  }, [setAdapterMode, setBackendReadOnly]);
};
