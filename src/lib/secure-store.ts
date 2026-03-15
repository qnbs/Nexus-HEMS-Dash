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
 *   4. Session passphrase cleared on tab close (sessionStorage)
 *
 * Supports: mTLS client certs/keys, auth tokens, MQTT passwords,
 *           EEBUS SHIP SKI fingerprints, OCPP security profiles.
 */

import { nexusDb } from './db';
import { encrypt, decrypt } from './crypto';
import type { AdapterConnectionConfig } from '../core/adapters/EnergyAdapter';

// ─── Types ───────────────────────────────────────────────────────────

export type AdapterCredentialId = 'victron-mqtt' | 'modbus-sunspec' | 'knx' | 'ocpp-21' | 'eebus';

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

// ─── Session Passphrase ──────────────────────────────────────────────

const SESSION_KEY = 'nexus-hems-vault-key';

function getVaultPassphrase(): string {
  let passphrase = sessionStorage.getItem(SESSION_KEY);
  if (!passphrase) {
    const array = crypto.getRandomValues(new Uint8Array(32));
    passphrase = btoa(String.fromCharCode(...array));
    sessionStorage.setItem(SESSION_KEY, passphrase);
  }
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
  const passphrase = getVaultPassphrase();
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
    const passphrase = getVaultPassphrase();
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
    authToken: creds.authToken ?? config.authToken,
    clientCert: creds.clientCert ?? config.clientCert,
    clientKey: creds.clientKey ?? config.clientKey,
    tls: !!(creds.clientCert || config.tls),
  };
}

/**
 * Clear all adapter credentials (for full vault reset).
 */
export async function clearVault(): Promise<void> {
  await nexusDb.adapterCredentials.clear();
  sessionStorage.removeItem(SESSION_KEY);
}
