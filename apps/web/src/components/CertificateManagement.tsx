/**
 * CertificateManagement — EEBUS TLS 1.3 mTLS device certificate manager
 *
 * Displays trusted EEBUS device certificates stored in Dexie and allows
 * import / export / revocation. Uses Radix UI Dialog for accessible modals.
 *
 * Also shows the SHIP Trust Store (paired devices via SHIP handshake) fetched
 * from the API, with PIN dialog support for devices in pin_required state.
 */

import type { EEBUSDeviceInfo } from '@nexus-hems/shared-types';
import * as Dialog from '@radix-ui/react-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  FileKey,
  FilePlus,
  Link2Off,
  ShieldCheck,
  ShieldOff,
  ShieldX,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

// ── Types ──────────────────────────────────────────────────────────────────

type CertStatus = 'trusted' | 'revoked' | 'expired';

export interface EEBUSCertRecord {
  /** IndexedDB primary key */
  id?: number;
  deviceName: string;
  /** SHA-256 fingerprint (hex colon-separated) */
  fingerprint: string;
  /** PEM-encoded certificate (stored encrypted in production usage) */
  pemData: string;
  validUntil: number;
  createdAt: number;
  status: CertStatus;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function deriveCertStatus(record: EEBUSCertRecord): CertStatus {
  if (record.status === 'revoked') return 'revoked';
  if (record.validUntil < Date.now()) return 'expired';
  return 'trusted';
}

function formatFingerprint(hex: string): string {
  // Format as XX:XX:XX... (groups of 2, first 6 shown then '...')
  const pairs = hex.replace(/:/g, '').match(/.{1,2}/g) ?? [];
  const display = pairs.slice(0, 6).join(':');
  return pairs.length > 6 ? `${display}:…` : display;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Very basic PEM parse — validates structure only; real validation happens server-side */
function parsePEM(pem: string): { fingerprint: string; validUntil: number } | null {
  const trimmed = pem.trim();
  if (
    !trimmed.startsWith('-----BEGIN CERTIFICATE-----') ||
    !trimmed.endsWith('-----END CERTIFICATE-----')
  ) {
    return null;
  }
  // Derive a deterministic (but fake) fingerprint from PEM content for the UI demo
  // In production this would be computed via SubtleCrypto over the DER bytes
  const body = trimmed
    .replace('-----BEGIN CERTIFICATE-----', '')
    .replace('-----END CERTIFICATE-----', '')
    .replace(/\s/g, '');
  let hash = 0;
  for (let i = 0; i < body.length; i++) {
    hash = ((hash << 5) - hash + body.charCodeAt(i)) | 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0').repeat(8).slice(0, 64);
  const fingerprint = (hex.match(/.{1,2}/g) ?? []).join(':');
  // Set validity to 1 year from now for imported certs (demo)
  const validUntil = Date.now() + 365 * 24 * 3600 * 1000;
  return { fingerprint, validUntil };
}

// ── Status badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CertStatus }) {
  const { t } = useTranslation();
  const config = {
    trusted: {
      Icon: ShieldCheck,
      label: t('certManagement.statusTrusted'),
      cls: 'bg-[var(--color-neon-green)]/15 text-[var(--color-neon-green)]',
    },
    revoked: {
      Icon: ShieldX,
      label: t('certManagement.statusRevoked'),
      cls: 'bg-red-500/15 text-red-400',
    },
    expired: {
      Icon: ShieldOff,
      label: t('certManagement.statusExpired'),
      cls: 'bg-yellow-500/15 text-yellow-400',
    },
  } as const;
  const { Icon, label, cls } = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-xs ${cls}`}
    >
      <Icon aria-hidden className="size-3" />
      {label}
    </span>
  );
}

// ── Import dialog ──────────────────────────────────────────────────────────

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (pem: string, deviceName: string) => Promise<void>;
}

function ImportDialog({ open, onClose, onImport }: ImportDialogProps) {
  const { t } = useTranslation();
  const [pem, setPem] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPem((ev.target?.result as string | null) ?? '');
    };
    reader.readAsText(file);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = parsePEM(pem);
    if (!parsed) {
      setError(t('certManagement.importError'));
      return;
    }
    setLoading(true);
    try {
      await onImport(pem, deviceName || 'EEBUS Device');
      setPem('');
      setDeviceName('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-modal-backdrop bg-black/80 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in" />
        <Dialog.Content
          className="glass-panel-strong fixed top-1/2 left-1/2 z-modal w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 shadow-2xl focus:outline-none"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="mb-5 flex items-start justify-between">
            <div>
              <Dialog.Title className="font-semibold text-(--color-text-primary) text-lg">
                {t('certManagement.importDialogTitle')}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-(--color-text-secondary) text-sm">
                {t('certManagement.importHint')}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="focus-ring ml-4 rounded-lg p-1.5 text-(--color-text-secondary) transition-colors hover:bg-white/10 hover:text-(--color-text-primary)"
                aria-label={t('common.close')}
              >
                <X aria-hidden className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="cert-device-name"
                className="mb-1.5 block font-medium text-(--color-text-secondary) text-sm"
              >
                {t('certManagement.deviceName')}
              </label>
              <input
                id="cert-device-name"
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="EEBUS Heat Pump 01"
                className="focus-ring w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-(--color-text-primary) text-sm placeholder:text-(--color-text-secondary)/50 focus:border-(--color-electric-blue)/50"
              />
            </div>

            <div>
              <label
                htmlFor="cert-pem"
                className="mb-1.5 block font-medium text-(--color-text-secondary) text-sm"
              >
                PEM
              </label>
              <textarea
                id="cert-pem"
                ref={textareaRef}
                value={pem}
                onChange={(e) => setPem(e.target.value)}
                rows={8}
                spellCheck={false}
                className="focus-ring w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-(--color-text-primary) text-xs placeholder:text-(--color-text-secondary)/50 focus:border-(--color-electric-blue)/50"
                placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-red-500/15 px-3 py-2 text-red-400 text-sm">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="focus-ring rounded-lg border border-white/10 px-4 py-2 font-medium text-(--color-text-secondary) text-sm transition-colors hover:bg-white/10"
                >
                  {t('common.cancel')}
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={loading || !pem.trim()}
                className="focus-ring flex items-center gap-2 rounded-lg bg-(--color-electric-blue)/20 px-4 py-2 font-medium text-(--color-electric-blue) text-sm transition-colors hover:bg-(--color-electric-blue)/30 disabled:pointer-events-none disabled:opacity-50"
              >
                <FilePlus aria-hidden className="size-4" />
                {t('certManagement.importCert')}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Delete confirmation ────────────────────────────────────────────────────

interface DeleteConfirmProps {
  cert: EEBUSCertRecord | null;
  onClose: () => void;
  onConfirm: (id: number) => Promise<void>;
}

function DeleteConfirm({ cert, onClose, onConfirm }: DeleteConfirmProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!cert?.id) return;
    setLoading(true);
    try {
      await onConfirm(cert.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root
      open={cert !== null}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-modal-backdrop bg-black/80 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in" />
        <Dialog.Content className="glass-panel-strong fixed top-1/2 left-1/2 z-modal w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 shadow-2xl focus:outline-none">
          <VisuallyHidden.Root>
            <Dialog.Title>
              {t('certManagement.confirmDelete', { device: cert?.deviceName ?? '' })}
            </Dialog.Title>
          </VisuallyHidden.Root>

          <div className="flex items-start gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-500/20">
              <Trash2 aria-hidden className="size-5 text-red-400" />
            </span>
            <div>
              <p className="font-semibold text-(--color-text-primary)">
                {t('certManagement.confirmDelete', { device: cert?.deviceName ?? '' })}
              </p>
              <p className="mt-1 text-(--color-text-secondary) text-sm">
                {t('certManagement.confirmDeleteDesc')}
              </p>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                type="button"
                className="focus-ring rounded-lg border border-white/10 px-4 py-2 font-medium text-(--color-text-secondary) text-sm transition-colors hover:bg-white/10"
              >
                {t('common.cancel')}
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="focus-ring flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 font-medium text-red-400 text-sm transition-colors hover:bg-red-500/30 disabled:pointer-events-none disabled:opacity-50"
            >
              <Trash2 aria-hidden className="size-4" />
              {t('certManagement.deleteCert')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── SHIP Trust Store section ───────────────────────────────────────────────

/**
 * PIN dialog: shown when a device pairing enters `pin_required` state.
 * The caller polls /api/eebus/pair/status/:ski to detect this transition.
 */
interface PinDialogProps {
  open: boolean;
  ski: string;
  pinHint?: string;
  onClose: () => void;
  onSubmit: (pin: string) => Promise<void>;
}

function PinDialog({ open, ski, pinHint, onClose, onSubmit }: PinDialogProps) {
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{5,6}$/.test(pin)) {
      setError(t('shipPairing.invalidPin'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onSubmit(pin);
      setPin('');
      onClose();
    } catch {
      setError(t('shipPairing.statusFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-modal-backdrop bg-black/80 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in" />
        <Dialog.Content className="glass-panel-strong fixed top-1/2 left-1/2 z-modal w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 shadow-2xl focus:outline-none">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <Dialog.Title className="font-semibold text-(--color-text-primary) text-lg">
                {t('shipPairing.pinDialogTitle')}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-(--color-text-secondary) text-sm">
                {pinHint ?? t('shipPairing.pinDialogDesc')}
              </Dialog.Description>
              <p className="mt-1 font-mono text-(--color-text-secondary)/60 text-xs">
                SKI: {ski.slice(0, 16)}…
              </p>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="focus-ring ml-4 rounded-lg p-1.5 text-(--color-text-secondary) transition-colors hover:bg-white/10 hover:text-(--color-text-primary)"
                aria-label={t('common.close')}
              >
                <X aria-hidden className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{5,6}"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={t('shipPairing.pinPlaceholder')}
              className="focus-ring w-full rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-center font-mono text-(--color-text-primary) text-2xl tracking-[0.4em] placeholder:text-(--color-text-secondary)/40"
              aria-label={t('shipPairing.pinDialogTitle')}
            />
            {error && (
              <p role="alert" className="rounded-lg bg-red-500/15 px-3 py-2 text-red-400 text-sm">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="focus-ring rounded-lg border border-white/10 px-4 py-2 font-medium text-(--color-text-secondary) text-sm transition-colors hover:bg-white/10"
                >
                  {t('shipPairing.pinCancel')}
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={loading || pin.length < 5}
                className="focus-ring flex items-center gap-2 rounded-lg bg-(--color-neon-green)/20 px-4 py-2 font-medium text-(--color-neon-green) text-sm transition-colors hover:bg-(--color-neon-green)/30 disabled:pointer-events-none disabled:opacity-50"
              >
                <ShieldCheck aria-hidden className="size-4" />
                {t('shipPairing.pinSubmit')}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Remove-trust confirmation dialog */
interface RemoveTrustDialogProps {
  device: EEBUSDeviceInfo | null;
  onClose: () => void;
  onConfirm: (ski: string) => Promise<void>;
}

function RemoveTrustDialog({ device, onClose, onConfirm }: RemoveTrustDialogProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const label =
    device?.brand && device.model
      ? `${device.brand} ${device.model}`
      : (device?.hostname ?? device?.ski?.slice(0, 12) ?? '');

  const handleConfirm = async () => {
    if (!device) return;
    setLoading(true);
    try {
      await onConfirm(device.ski);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root
      open={device !== null}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-modal-backdrop bg-black/80 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in" />
        <Dialog.Content className="glass-panel-strong fixed top-1/2 left-1/2 z-modal w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 shadow-2xl focus:outline-none">
          <VisuallyHidden.Root>
            <Dialog.Title>{t('shipPairing.confirmRemove', { device: label })}</Dialog.Title>
          </VisuallyHidden.Root>
          <div className="flex items-start gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-500/20">
              <Link2Off aria-hidden className="size-5 text-red-400" />
            </span>
            <div>
              <p className="font-semibold text-(--color-text-primary)">
                {t('shipPairing.confirmRemove', { device: label })}
              </p>
              <p className="mt-1 text-(--color-text-secondary) text-sm">
                {t('shipPairing.confirmRemoveDesc')}
              </p>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                type="button"
                className="focus-ring rounded-lg border border-white/10 px-4 py-2 font-medium text-(--color-text-secondary) text-sm transition-colors hover:bg-white/10"
              >
                {t('common.cancel')}
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="focus-ring flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 font-medium text-red-400 text-sm transition-colors hover:bg-red-500/30 disabled:pointer-events-none disabled:opacity-50"
            >
              <Trash2 aria-hidden className="size-4" />
              {t('shipPairing.removeTrust')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function formatDateShort(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * SHIP Trust Store section — reads from the API (/api/eebus/trust).
 * Shows all devices that have been paired via the SHIP handshake.
 */
function ShipTrustStore() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [removingDevice, setRemovingDevice] = useState<EEBUSDeviceInfo | null>(null);
  const [pinSki, setPinSki] = useState<string | null>(null);
  const [pinHint, setPinHint] = useState<string | undefined>(undefined);

  const {
    data: devices,
    isLoading,
    error,
  } = useQuery<EEBUSDeviceInfo[]>({
    queryKey: ['eebus-trust'],
    queryFn: async () => {
      const resp = await fetch('/api/eebus/trust');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return resp.json() as Promise<EEBUSDeviceInfo[]>;
    },
    refetchInterval: 10_000,
    retry: 1,
  });

  const removeMutation = useMutation({
    mutationFn: async (ski: string) => {
      const resp = await fetch(`/api/eebus/trust/${encodeURIComponent(ski)}`, {
        method: 'DELETE',
      });
      if (!resp.ok && resp.status !== 204) throw new Error(`HTTP ${resp.status}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eebus-trust'] });
    },
  });

  const submitPinMutation = useMutation({
    mutationFn: async ({ ski, pin }: { ski: string; pin: string }) => {
      const resp = await fetch('/api/eebus/pair/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ski, pin }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eebus-trust'] });
    },
  });

  const handlePinSubmit = async (pin: string) => {
    if (!pinSki) return;
    await submitPinMutation.mutateAsync({ ski: pinSki, pin });
    setPinSki(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-(--color-text-secondary) text-sm">
        <span className="mr-2 animate-spin">⟳</span>
        {t('common.loading')}
      </div>
    );
  }

  if (error) {
    return (
      <p role="alert" className="rounded-lg bg-red-500/15 px-3 py-2 text-red-400 text-sm">
        {t('shipPairing.loadError')}
      </p>
    );
  }

  return (
    <section aria-labelledby="ship-trust-heading" className="mt-8 space-y-4">
      <div>
        <h2
          id="ship-trust-heading"
          className="flex items-center gap-2 font-semibold text-(--color-text-primary) text-base"
        >
          <ShieldCheck aria-hidden className="size-5 text-(--color-neon-green)" />
          {t('shipPairing.trustStoreTitle')}
        </h2>
        <p className="mt-0.5 text-(--color-text-secondary) text-sm">
          {t('shipPairing.trustStoreDesc')}
        </p>
      </div>

      {!devices?.length ? (
        <div className="glass-panel flex flex-col items-center gap-3 rounded-2xl py-10 text-center">
          <ShieldOff aria-hidden className="size-10 text-(--color-text-secondary)/40" />
          <p className="font-medium text-(--color-text-secondary)">
            {t('shipPairing.noTrustedDevices')}
          </p>
          <p className="max-w-xs text-(--color-text-secondary)/70 text-sm">
            {t('shipPairing.noTrustedDevicesDesc')}
          </p>
        </div>
      ) : (
        <ul className="space-y-2" aria-label={t('shipPairing.trustStoreTitle')}>
          {devices.map((device) => {
            const deviceLabel =
              device.brand && device.model ? `${device.brand} ${device.model}` : device.hostname;
            const isPinRequired = device.status === 'pending';
            return (
              <li
                key={device.ski}
                className="glass-panel flex flex-wrap items-center gap-4 rounded-xl px-4 py-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                      device.status === 'trusted'
                        ? 'bg-(--color-neon-green)/15'
                        : device.status === 'failed'
                          ? 'bg-red-500/15'
                          : 'bg-yellow-500/15'
                    }`}
                  >
                    {device.status === 'trusted' ? (
                      <ShieldCheck aria-hidden className="size-4 text-(--color-neon-green)" />
                    ) : device.status === 'failed' ? (
                      <ShieldX aria-hidden className="size-4 text-red-400" />
                    ) : (
                      <ShieldOff aria-hidden className="size-4 text-yellow-400" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-(--color-text-primary)">
                      {deviceLabel}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-(--color-text-secondary) text-xs">
                      SKI: {device.ski.slice(0, 20)}…
                    </p>
                    <p className="text-(--color-text-secondary)/70 text-xs">
                      {device.hostname}:{device.port}
                      {device.deviceType ? ` · ${device.deviceType}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 text-right text-(--color-text-secondary) text-xs">
                  {device.trustedAt > 0 && (
                    <span>
                      {t('shipPairing.pairedAt')} {formatDateShort(device.trustedAt)}
                    </span>
                  )}
                  {device.lastConnectedAt && (
                    <span>
                      {t('shipPairing.lastConnected')} {formatDateShort(device.lastConnectedAt)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {isPinRequired && (
                    <button
                      type="button"
                      onClick={() => {
                        setPinSki(device.ski);
                        setPinHint(t('shipPairing.pinDialogDesc'));
                      }}
                      className="focus-ring rounded-lg bg-yellow-500/15 px-2 py-1.5 font-medium text-xs text-yellow-400 transition-colors hover:bg-yellow-500/25"
                    >
                      {t('shipPairing.statusPinRequired')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setRemovingDevice(device)}
                    className="focus-ring rounded-lg p-1.5 text-(--color-text-secondary) transition-colors hover:bg-red-500/15 hover:text-red-400"
                    aria-label={`${t('shipPairing.removeTrust')} — ${deviceLabel}`}
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <PinDialog
        open={pinSki !== null}
        ski={pinSki ?? ''}
        {...(pinHint !== undefined ? { pinHint } : {})}
        onClose={() => setPinSki(null)}
        onSubmit={handlePinSubmit}
      />
      <RemoveTrustDialog
        device={removingDevice}
        onClose={() => setRemovingDevice(null)}
        onConfirm={async (ski) => {
          await removeMutation.mutateAsync(ski);
        }}
      />
    </section>
  );
}
// migration. For now the component uses a local React state list with
// localStorage serialisation so it integrates without a schema bump.
const LS_KEY = 'nexus:eebus-certs';

function loadFromStorage(): EEBUSCertRecord[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as EEBUSCertRecord[];
  } catch {
    return [];
  }
}

function saveToStorage(certs: EEBUSCertRecord[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(certs));
  } catch {
    // Storage quota exceeded — silently ignore
  }
}

export function CertificateManagement() {
  const { t } = useTranslation();
  // Lazy initializer: read localStorage once on mount (avoids useEffect + setState-in-effect)
  const [certs, setCerts] = useState<EEBUSCertRecord[]>(loadFromStorage);
  const [importOpen, setImportOpen] = useState(false);
  const [deletingCert, setDeletingCert] = useState<EEBUSCertRecord | null>(null);

  const persistCerts = (next: EEBUSCertRecord[]) => {
    setCerts(next);
    saveToStorage(next);
  };

  const handleImport = async (pem: string, deviceName: string) => {
    const parsed = parsePEM(pem);
    if (!parsed) throw new Error('invalid-pem');
    const newCert: EEBUSCertRecord = {
      id: Date.now(),
      deviceName,
      fingerprint: parsed.fingerprint,
      pemData: pem,
      validUntil: parsed.validUntil,
      createdAt: Date.now(),
      status: 'trusted',
    };
    persistCerts([...certs, newCert]);
  };

  const handleDelete = async (id: number) => {
    persistCerts(certs.filter((c) => c.id !== id));
  };

  const handleExport = (cert: EEBUSCertRecord) => {
    const blob = new Blob([cert.pemData], { type: 'application/x-pem-file' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cert.deviceName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pem`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const revokedCount = certs.filter((c) => deriveCertStatus(c) !== 'trusted').length;

  return (
    <section aria-labelledby="cert-mgmt-heading" className="space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="cert-mgmt-heading"
            className="flex items-center gap-2 font-semibold text-(--color-text-primary) text-base"
          >
            <FileKey aria-hidden className="size-5 text-(--color-electric-blue)" />
            {t('certManagement.title')}
          </h2>
          <p className="mt-0.5 text-(--color-text-secondary) text-sm">
            {t('certManagement.description')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setImportOpen(true)}
          className="focus-ring flex items-center gap-2 rounded-lg bg-(--color-electric-blue)/15 px-3 py-1.5 font-medium text-(--color-electric-blue) text-sm transition-colors hover:bg-(--color-electric-blue)/25"
        >
          <FilePlus aria-hidden className="size-4" />
          {t('certManagement.importCert')}
        </button>
      </div>

      {/* ── Revoked/expired warning banner ── */}
      {revokedCount > 0 && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2.5 text-sm text-yellow-400"
        >
          <ShieldOff aria-hidden className="size-4 shrink-0" />
          <span>
            {revokedCount === 1
              ? t('certManagement.statusRevoked')
              : `${revokedCount} certificates need attention`}
          </span>
        </div>
      )}

      {/* ── Certificate list ── */}
      {certs.length === 0 ? (
        <div className="glass-panel flex flex-col items-center gap-3 rounded-2xl py-12 text-center">
          <ShieldCheck aria-hidden className="size-10 text-(--color-text-secondary)/40" />
          <p className="font-medium text-(--color-text-secondary)">{t('certManagement.noCerts')}</p>
          <p className="max-w-xs text-(--color-text-secondary)/70 text-sm">
            {t('certManagement.noCertsDesc')}
          </p>
        </div>
      ) : (
        <ul className="space-y-2" aria-label={t('certManagement.title')}>
          {certs.map((cert) => {
            const effectiveStatus = deriveCertStatus(cert);
            return (
              <li
                key={cert.id}
                className="glass-panel flex flex-wrap items-center gap-4 rounded-xl px-4 py-3"
              >
                {/* Device icon + name */}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--color-electric-blue)/15">
                    <ShieldCheck aria-hidden className="size-4 text-(--color-electric-blue)" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-(--color-text-primary)">
                      {cert.deviceName}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-(--color-text-secondary) text-xs">
                      {t('certManagement.fingerprint')}:{' '}
                      <span title={cert.fingerprint}>{formatFingerprint(cert.fingerprint)}</span>
                    </p>
                  </div>
                </div>

                {/* Validity + status */}
                <div className="flex flex-col items-end gap-1 text-right">
                  <StatusBadge status={effectiveStatus} />
                  <p className="text-(--color-text-secondary) text-xs">
                    {t('certManagement.validUntil')} {formatDate(cert.validUntil)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleExport(cert)}
                    className="focus-ring rounded-lg p-1.5 text-(--color-text-secondary) transition-colors hover:bg-white/10 hover:text-(--color-text-primary)"
                    aria-label={`${t('certManagement.exportCert')} — ${cert.deviceName}`}
                  >
                    <Download aria-hidden className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingCert(cert)}
                    className="focus-ring rounded-lg p-1.5 text-(--color-text-secondary) transition-colors hover:bg-red-500/15 hover:text-red-400"
                    aria-label={`${t('certManagement.deleteCert')} — ${cert.deviceName}`}
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* ── Dialogs ── */}
      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
      />
      <DeleteConfirm
        cert={deletingCert}
        onClose={() => setDeletingCert(null)}
        onConfirm={handleDelete}
      />

      {/* ── SHIP Trust Store (API-backed) ── */}
      <ShipTrustStore />
    </section>
  );
}
