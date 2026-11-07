/** Kubernetes / compose WAL backing store hint (#452). Set via Helm `NEXUS_HEMS_WAL_STORAGE_CLASS`. */
export type WalStorageClass = 'ephemeral' | 'persistent' | 'unknown';

export function resolveWalStorageClass(): WalStorageClass {
  const raw = process.env.NEXUS_HEMS_WAL_STORAGE_CLASS?.trim().toLowerCase();
  if (raw === 'ephemeral' || raw === 'emptydir') return 'ephemeral';
  if (raw === 'pvc' || raw === 'persistent') return 'persistent';
  return 'unknown';
}
