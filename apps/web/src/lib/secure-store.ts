/**
 * Secure Store — BYOK Vault for per-adapter encrypted credential storage
 *
 * Uses Web Crypto API (AES-GCM 256-bit) to encrypt adapter credentials
 * (mTLS certs, auth tokens, passwords) before storing them in IndexedDB.
 *
 * Architecture:
 *   1. Per-session master key derived via PBKDF2 from a random passphrase
 *   2. Each adapter config encrypted individually with unique IV
 *   3. Credentials NEVER stored in plaintext — only encrypted blobs in Dexie
 *   4. Session passphrase held in-memory only (cleared on page unload)
 *
 * Supports: mTLS client certs/keys, auth tokens, MQTT passwords,
 *           EEBUS SHIP SKI fingerprints, OCPP security profiles.
 *
 * HIGH-09 fix: The vault passphrase is now persisted in Dexie `settings` table
 * under key 'vault-passphrase-v1'. This survives page reloads while remaining
 * origin-isolated (same protection level as the encrypted keys themselves).
 * The passphrase is never written to localStorage or sessionStorage.
 */

import type { AdapterConnectionConfig } from '../core/adapters/EnergyAdapter';
import { decrypt, encrypt } from './crypto';
import { nexusDb } from './db';

// ─── Types ───────────────────────────────────────────────────────────

// HIGH-01: InfluxDB is now a supported credential ID (moved from localStorage)
export type AdapterCredentialId =
  | 'victron-mqtt'
  | 'modbus-sunspec'
  | 'knx'
  | 'ocpp-21'
  | 'eebus'
  | 'influxdb';

export interface AdapterCredentials {
  /** Auth token / password for the connection */
  authToken?: string;
  /** mTLS client certificate (PEM base64) */
  clientCert?: string;
  /** mTLS client key (PEM base64) */
  clientKey?: string;
  /** CA certificate for server verification (PEM base64) */
  caCert?: string;
  /** EEBUS SHIP SKI fingerprint */
  skiFingerprint?: string;
  /** OCPP security profile (0–3) */
  ocppSecurityProfile?: number;
  /** Additional provider-specific fields */
  extra?: Record<string, string>;
}

export interface EncryptedAdapterCredential {
  adapterId: string;
  encryptedPayload: string;
  updatedAt: number;
}

// ─── Persistent Vault Passphrase (HIGH-09) ───────────────────────────

/**
 * Dexie settings key used to store the vault passphrase.
 * This is an origin-bound key — same protection level as the encrypted vault entries.
 * It is never written to localStorage, sessionStorage, or any other non-IndexedDB storage.
 */
const VAULT_PASSPHRASE_KEY = 'vault-passphrase-v1';

/**
 * In-memory cache of the passphrase for the current page session.
 * Populated lazily on first call to getVaultPassphrase().
 */
let _cachedVaultPassphrase: string | null = null;

/**
 * Returns the vault passphrase.
 * HIGH-09: Passphrase is loaded from Dexie on first call (persists across reloads).
 * If not found, generates a new random passphrase and persists it to Dexie.
 */
export async function getVaultPassphrase(): Promise<string> {
  if (_cachedVaultPassphrase) return _cachedVaultPassphrase;

  try {
    const record = await nexusDb.settings.get(VAULT_PASSPHRASE_KEY);
    if (record?.value && typeof record.value === 'string') {
      _cachedVaultPassphrase = record.value;
      return _cachedVaultPassphrase;
    }
  } catch {
    // Dexie unavailable — fall through to generate new passphrase
  }

  // Generate and persist a new passphrase
  const array = crypto.getRandomValues(new Uint8Array(32));
  const passphrase = btoa(String.fromCharCode(...array));

  try {
    // biome-ignore lint/suspicious/noExplicitAny: StoredSettings is a complex union type
    await nexusDb.settings.put({ key: VAULT_PASSPHRASE_KEY, value: passphrase as any });
  } catch (err) {
    console.warn('[SecureStore] Could not persist vault passphrase to IndexedDB:', err);
  }

  _cachedVaultPassphrase = passphrase;
  return passphrase;
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Store encrypted adapter credentials in IndexedDB.
 */
export async function saveAdapterCredentials(
  adapterId: AdapterCredentialId,
  credentials: AdapterCredentials,
): Promise<void> {
  const passphrase = await getVaultPassphrase();
  const payload = JSON.stringify(credentials);
  const encryptedPayload = await encrypt(payload, passphrase);

  await nexusDb.adapterCredentials.put({
    adapterId,
    encryptedPayload,
    updatedAt: Date.now(),
  });
}

/**
 * Retrieve and decrypt adapter credentials from IndexedDB.
 * Returns null if not found or decryption fails (session expired).
 */
export async function getAdapterCredentials(
  adapterId: AdapterCredentialId,
): Promise<AdapterCredentials | null> {
  const record = await nexusDb.adapterCredentials.get(adapterId);
  if (!record) return null;

  try {
    const passphrase = await getVaultPassphrase();
    const decrypted = await decrypt(record.encryptedPayload, passphrase);
    return JSON.parse(decrypted) as AdapterCredentials;
  } catch {
    // Decryption failed — session expired, credentials must be re-entered
    return null;
  }
}

/**
 * Remove adapter credentials from IndexedDB.
 */
export async function removeAdapterCredentials(adapterId: AdapterCredentialId): Promise<void> {
  await nexusDb.adapterCredentials.delete(adapterId);
}

/**
 * List all stored adapter credential IDs (without decrypting).
 */
export async function listAdapterCredentials(): Promise<
  Array<{ adapterId: AdapterCredentialId; updatedAt: number }>
> {
  const records = await nexusDb.adapterCredentials.toArray();
  return records.map(({ adapterId, updatedAt }) => ({
    adapterId: adapterId as AdapterCredentialId,
    updatedAt,
  }));
}

/**
 * Check if credentials exist for a given adapter.
 */
export async function hasAdapterCredentials(adapterId: AdapterCredentialId): Promise<boolean> {
  const count = await nexusDb.adapterCredentials.where('adapterId').equals(adapterId).count();
  return count > 0;
}

/**
 * Merge decrypted credentials into an AdapterConnectionConfig.
 * Used by the adapter bridge to inject secrets at connect time.
 */
export async function mergeCredentialsIntoConfig(
  adapterId: AdapterCredentialId,
  config: AdapterConnectionConfig,
): Promise<AdapterConnectionConfig> {
  const creds = await getAdapterCredentials(adapterId);
  if (!creds) return config;

  return {
    ...config,
    ...(creds.authToken != null
      ? { authToken: creds.authToken }
      : config.authToken != null
        ? { authToken: config.authToken }
        : {}),
    ...(creds.clientCert != null
      ? { clientCert: creds.clientCert }
      : config.clientCert != null
        ? { clientCert: config.clientCert }
        : {}),
    ...(creds.clientKey != null
      ? { clientKey: creds.clientKey }
      : config.clientKey != null
        ? { clientKey: config.clientKey }
        : {}),
    tls: !!(creds.clientCert || config.tls),
  };
}

/**
 * Clear all adapter credentials (for full vault reset).
 */
export async function clearVault(): Promise<void> {
  await nexusDb.adapterCredentials.clear();
  _cachedVaultPassphrase = null;
}
