/**
 * Defers loading a heavy adapter module until connect() or sendCommand() runs.
 * Used for OCPP (#405) so the core adapters-* bundle stays under size-limit.
 */

import type {
  AdapterCapability,
  AdapterCommand,
  AdapterConnectionConfig,
  AdapterDataCallback,
  AdapterStatus,
  AdapterStatusCallback,
  EnergyAdapter,
  UnifiedEnergyModel,
} from './EnergyAdapter';

type AdapterCtor = new (config?: Partial<AdapterConnectionConfig>) => EnergyAdapter;

export function createLazyEnergyAdapter(
  id: string,
  displayName: string,
  loadCtor: () => Promise<{ default?: AdapterCtor; [key: string]: unknown }>,
  exportName: string,
  config?: Partial<AdapterConnectionConfig>,
): EnergyAdapter {
  let delegate: EnergyAdapter | null = null;
  let loadPromise: Promise<EnergyAdapter> | null = null;
  const pendingData: AdapterDataCallback[] = [];
  const pendingStatus: AdapterStatusCallback[] = [];

  const ensure = async (): Promise<EnergyAdapter> => {
    if (delegate) return delegate;
    if (!loadPromise) {
      loadPromise = loadCtor().then((mod) => {
        const Ctor = (mod[exportName] ?? mod.default) as AdapterCtor | undefined;
        if (!Ctor) {
          throw new Error(`[LazyEnergyAdapter] Export "${exportName}" not found for ${id}`);
        }
        delegate = new Ctor(config);
        for (const cb of pendingData) delegate.onData(cb);
        for (const cb of pendingStatus) delegate.onStatus(cb);
        pendingData.length = 0;
        pendingStatus.length = 0;
        return delegate;
      });
    }
    return loadPromise;
  };

  const lazyStatus = (): AdapterStatus => delegate?.status ?? 'disconnected';

  const lazyCapabilities = (): AdapterCapability[] => delegate?.capabilities ?? [];

  return {
    id,
    name: displayName,
    get status() {
      return lazyStatus();
    },
    get capabilities() {
      return lazyCapabilities();
    },
    async connect() {
      await (await ensure()).connect();
    },
    async disconnect() {
      if (delegate) await delegate.disconnect();
    },
    onData(callback: AdapterDataCallback) {
      if (delegate) delegate.onData(callback);
      else pendingData.push(callback);
    },
    onStatus(callback: AdapterStatusCallback) {
      if (delegate) delegate.onStatus(callback);
      else pendingStatus.push(callback);
    },
    async sendCommand(command: AdapterCommand) {
      return (await ensure()).sendCommand(command);
    },
    async poll() {
      const inner = await ensure();
      return inner.poll ? inner.poll() : Promise.resolve({});
    },
    getSnapshot(): Partial<UnifiedEnergyModel> {
      return delegate?.getSnapshot() ?? {};
    },
    destroy() {
      delegate?.destroy();
      delegate = null;
      loadPromise = null;
    },
  };
}
