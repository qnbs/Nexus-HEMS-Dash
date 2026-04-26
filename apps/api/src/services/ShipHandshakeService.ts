/**
 * ShipHandshakeService — SHIP v1.0.1 state machine for EEBUS device pairing.
 *
 * Implements the SHIP (Smart Home IP) transport layer for EEBUS SPINE messages.
 * Handles TLS 1.3 mTLS connection, SKI verification, HELLO exchange, and PIN pairing.
 *
 * Reference: SHIP v1.0.1 specification (EEBus Initiative e.V.), VDE-AR-E 2829-6
 * Port: 4712 (IANA registered EEBUS SHIP port)
 */

import { generateKeyPairSync, X509Certificate } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import https from 'https';
import { dirname, resolve } from 'path';
import { WebSocket } from 'ws';
import { upsertDevice } from './EEBusTrustStore.js';

// ─── Types ─────────────────────────────────────────────────────────

/** SHIP handshake connection states (SHIP v1.0.1 §7.3) */
export type SHIPState =
  | 'init'
  | 'tls_connecting'
  | 'tls_connected'
  | 'cmi_hello'
  | 'protocol'
  | 'pin_required'
  | 'pin_submitted'
  | 'connected'
  | 'failed'
  | 'timeout';

export interface SHIPHandshakeEntry {
  ski: string;
  state: SHIPState;
  message?: string;
  pinHint?: string;
  hostname: string;
  port: number;
  startedAt: number;
  ws?: WebSocket;
  pinResolve?: (pin: string) => void;
  /** Number of failed PIN attempts in this session */
  pinAttempts: number;
}

// ─── Constants ─────────────────────────────────────────────────────

const CERT_FILE = resolve(
  process.cwd(),
  process.env.EEBUS_CERT_FILE ?? 'data/eebus-server.cert.pem',
);
const KEY_FILE = resolve(process.cwd(), process.env.EEBUS_KEY_FILE ?? 'data/eebus-server.key.pem');

/** Total handshake timeout (ms). Connection enters 'timeout' state if exceeded. */
const HANDSHAKE_TIMEOUT_MS = 60_000;

/** Maximum failed PIN attempts per session before session is terminated */
const MAX_PIN_ATTEMPTS = 3;

/** SHIP message type identifiers (SHIP v1.0.1 §7.3) */
const SHIP_MSG_HELLO = '"CMI_HEAD_MESSAGE"';
const SHIP_MSG_PIN_REQ = '"PIN_STATE_REQUEST"';
const SHIP_MSG_ACCESS = '"ACCESS_METHODS_RESPONSE"';

// ─── Server Certificate ────────────────────────────────────────────

let _certPem: string | null = null;
let _keyPem: string | null = null;

async function loadOrGenerateCert(): Promise<{ cert: string; key: string }> {
  if (_certPem && _keyPem) return { cert: _certPem, key: _keyPem };
  try {
    _certPem = await readFile(CERT_FILE, 'utf-8');
    _keyPem = await readFile(KEY_FILE, 'utf-8');
    return { cert: _certPem, key: _keyPem };
  } catch {
    // Generate ECDSA P-256 self-signed certificate (SHIP preferred curve)
    console.info('[SHIP] Generating ECDSA P-256 server certificate...');
    const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    // Build a minimal self-signed certificate via Node's crypto APIs
    // Use node-forge or a similar library in production for full X.509 support.
    // Here we create a minimal DER structure and wrap in PEM for compatibility.
    const keyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;

    // Fallback: create a temporary cert using openssl subprocess only if available
    // For environments where openssl is not available, we log a warning and use
    // a pre-baked test certificate (NOT for production use).
    try {
      const { execSync } = await import('child_process');
      const tmpDir = dirname(CERT_FILE);
      await mkdir(tmpDir, { recursive: true });
      execSync(
        `openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 ` +
          `-keyout "${KEY_FILE}" -out "${CERT_FILE}" -days 3650 -nodes ` +
          `-subj "/CN=nexus-hems-eebus/O=Nexus HEMS" 2>/dev/null`,
      );
      _certPem = await readFile(CERT_FILE, 'utf-8');
      _keyPem = await readFile(KEY_FILE, 'utf-8');
      console.info('[SHIP] Server certificate generated at', CERT_FILE);
      return { cert: _certPem, key: _keyPem };
    } catch {
      // openssl not available — write key and use placeholder cert
      console.warn(
        '[SHIP] openssl not available. Writing key; EEBUS TLS will operate in dev mode.',
      );
      await mkdir(dirname(KEY_FILE), { recursive: true });
      await writeFile(KEY_FILE, keyPem, { mode: 0o600 });
      void publicKey; // not used in this fallback path
      _keyPem = keyPem;
      // No cert in fallback path — skip cert write
      _certPem = '';
      return { cert: '', key: keyPem };
    }
  }
}

// ─── SKI Extraction ────────────────────────────────────────────────

/**
 * Extract the Subject Key Identifier from a peer certificate.
 * Returns hex string without colons, lowercase. Falls back to SHA-256 fingerprint.
 */
function extractSKI(rawDerCert: Buffer): string {
  try {
    const cert = new X509Certificate(rawDerCert);
    // subjectKeyIdentifier is available in Node.js ≥ 17.7.0 but not in all @types/node versions
    const ski = (cert as unknown as Record<string, unknown>).subjectKeyIdentifier;
    if (typeof ski === 'string' && ski.length > 0) {
      return ski.replace(/:/g, '').toLowerCase();
    }
    // Fallback: use SHA-256 fingerprint
    return cert.fingerprint256.replace(/:/g, '').toLowerCase();
  } catch {
    return '';
  }
}

// ─── Active Sessions ───────────────────────────────────────────────

/** In-flight handshake sessions keyed by SKI */
const sessions = new Map<string, SHIPHandshakeEntry>();

// ─── Handshake Implementation ──────────────────────────────────────

/**
 * Initiate a SHIP handshake to the device at host:port.
 * The caller should poll `getHandshakeState(ski)` to track progress.
 * The handshake runs asynchronously after this function returns.
 *
 * @param ski      Expected SKI of the target device (hex, no colons)
 * @param hostname Target host (must be private/local network)
 * @param port     Target port (default 4712)
 */
export async function initiateHandshake(ski: string, hostname: string, port = 4712): Promise<void> {
  // If an active session exists, do nothing
  if (sessions.has(ski)) return;

  const entry: SHIPHandshakeEntry = {
    ski,
    hostname,
    port,
    state: 'tls_connecting',
    startedAt: Date.now(),
    pinAttempts: 0,
  };
  sessions.set(ski, entry);

  // Persist as pending in trust store
  await upsertDevice({
    ski,
    hostname,
    port,
    status: 'pending',
    trustedAt: 0,
  });

  // Run handshake asynchronously — errors update state to 'failed'
  runHandshake(entry).catch((err: unknown) => {
    console.error('[SHIP] Unexpected error in handshake for', ski, err);
    entry.state = 'failed';
    entry.message = String(err);
    cleanupSession(entry);
  });
}

async function runHandshake(entry: SHIPHandshakeEntry): Promise<void> {
  const { ski, hostname, port } = entry;

  let serverCert: string;
  let serverKey: string;
  try {
    const certs = await loadOrGenerateCert();
    serverCert = certs.cert;
    serverKey = certs.key;
  } catch (err) {
    entry.state = 'failed';
    entry.message = `Failed to load server certificate: ${String(err)}`;
    return;
  }

  const tlsAgent = serverCert
    ? new https.Agent({
        cert: serverCert,
        key: serverKey,
        rejectUnauthorized: false, // SKI-pinned trust; no CA chain
        minVersion: 'TLSv1.3',
        maxVersion: 'TLSv1.3',
      } as unknown as https.AgentOptions)
    : undefined;

  const url = `wss://${hostname}:${port}/ship/`;

  let ws: WebSocket;
  try {
    ws = new WebSocket(url, ['ship'], {
      agent: tlsAgent,
    } as ConstructorParameters<typeof WebSocket>[2]);
  } catch (err) {
    entry.state = 'failed';
    entry.message = `WebSocket creation failed: ${String(err)}`;
    return;
  }

  entry.ws = ws;

  // Set global timeout
  const timeoutHandle = setTimeout(() => {
    if (entry.state !== 'connected' && entry.state !== 'failed') {
      entry.state = 'timeout';
      entry.message = 'Handshake timed out';
      ws.terminate();
      cleanupSession(entry);
    }
  }, HANDSHAKE_TIMEOUT_MS);

  return new Promise<void>((resolve) => {
    ws.on('open', () => {
      // Verify SKI from peer certificate via the underlying TLS socket
      const tlsSocket = (ws as unknown as { _socket?: unknown })._socket as
        | {
            getPeerCertificate?: (detailed: boolean) => { raw?: Buffer };
          }
        | undefined;
      if (tlsSocket?.getPeerCertificate) {
        const peerCert = tlsSocket.getPeerCertificate(true);
        if (peerCert?.raw) {
          const peerSKI = extractSKI(peerCert.raw);
          if (peerSKI && peerSKI !== ski) {
            entry.state = 'failed';
            entry.message = `SKI mismatch: expected ${ski}, got ${peerSKI}`;
            ws.terminate();
            clearTimeout(timeoutHandle);
            cleanupSession(entry);
            resolve();
            return;
          }
        }
      }
      entry.state = 'cmi_hello';

      // Send SHIP ConnectionHello message
      const helloMsg = JSON.stringify({
        connectionHello: [{ phase: 'ready', waiting: false }],
      });
      ws.send(helloMsg);
    });

    ws.on('message', (data: Buffer | string) => {
      const raw = typeof data === 'string' ? data : data.toString('utf-8');
      handleShipMessage(entry, raw, ws, resolve, clearTimeout.bind(null, timeoutHandle));
    });

    ws.on('error', (err: Error) => {
      entry.state = 'failed';
      entry.message = `WebSocket error: ${err.message}`;
      clearTimeout(timeoutHandle);
      cleanupSession(entry);
      resolve();
    });

    ws.on('close', () => {
      if (entry.state !== 'connected' && entry.state !== 'failed' && entry.state !== 'timeout') {
        entry.state = 'failed';
        entry.message = 'Connection closed unexpectedly';
      }
      clearTimeout(timeoutHandle);
      cleanupSession(entry);
      resolve();
    });
  });
}

function handleShipMessage(
  entry: SHIPHandshakeEntry,
  raw: string,
  ws: WebSocket,
  done: () => void,
  cancelTimeout: () => void,
): void {
  const { ski } = entry;

  // Minimal JSON parse — SHIP messages are JSON-encoded
  let msg: unknown;
  try {
    msg = JSON.parse(raw);
  } catch {
    // Possibly binary SHIP framing — skip for now
    return;
  }

  const msgStr = raw;

  // SHIP HELLO response — proceed to protocol/access methods phase
  if (
    entry.state === 'cmi_hello' &&
    (msgStr.includes('connectionHello') || msgStr.includes(SHIP_MSG_HELLO))
  ) {
    entry.state = 'protocol';
    // Request access methods
    ws.send(JSON.stringify({ accessMethodsRequest: {} }));
    return;
  }

  // Access methods response — check if already trusted
  if (
    entry.state === 'protocol' &&
    (msgStr.includes('accessMethods') || msgStr.includes(SHIP_MSG_ACCESS))
  ) {
    // If device indicates PIN is not required (already trusted), mark connected
    if (msgStr.includes('"noPinRequired"') || msgStr.includes('"trustedDeviceList"')) {
      markConnected(entry, ws, cancelTimeout, done);
    } else {
      // PIN exchange required
      entry.state = 'pin_required';
      entry.pinHint = 'Enter the PIN shown on your EEBUS device display';
    }
    return;
  }

  // PIN state request from device
  if (msgStr.includes('pinState') || msgStr.includes(SHIP_MSG_PIN_REQ)) {
    entry.state = 'pin_required';
    entry.pinHint = 'Enter the PIN shown on your EEBUS device display';

    // Wait for PIN via submitPin()
    new Promise<string>((resolve) => {
      entry.pinResolve = resolve;
    }).then((pin) => {
      entry.state = 'pin_submitted';
      ws.send(JSON.stringify({ pinInput: { pin } }));
    });
    return;
  }

  // PIN accepted
  if (entry.state === 'pin_submitted' && msgStr.includes('"accepted"')) {
    markConnected(entry, ws, cancelTimeout, done);
    return;
  }

  // PIN rejected
  if (
    entry.state === 'pin_submitted' &&
    (msgStr.includes('"denied"') || msgStr.includes('"rejected"'))
  ) {
    entry.pinAttempts += 1;
    if (entry.pinAttempts >= MAX_PIN_ATTEMPTS) {
      entry.state = 'failed';
      entry.message = `PIN rejected after ${MAX_PIN_ATTEMPTS} attempts`;
      ws.terminate();
      cancelTimeout();
      cleanupSession(entry);
      done();
    } else {
      // Allow another PIN attempt
      entry.state = 'pin_required';
      entry.message = `PIN rejected — attempt ${entry.pinAttempts} of ${MAX_PIN_ATTEMPTS}`;
    }
    return;
  }

  // Suppress unused variable warning
  void msg;
  void ski;
}

async function markConnected(
  entry: SHIPHandshakeEntry,
  _ws: WebSocket,
  cancelTimeout: () => void,
  done: () => void,
): Promise<void> {
  entry.state = 'connected';
  entry.message = 'SHIP handshake completed';
  cancelTimeout();
  const now = Date.now();
  await upsertDevice({
    ski: entry.ski,
    hostname: entry.hostname,
    port: entry.port,
    status: 'trusted',
    trustedAt: now,
    lastConnectedAt: now,
  });
  // Keep session open for SPINE message exchange
  done();
}

function cleanupSession(entry: SHIPHandshakeEntry): void {
  if (entry.state === 'failed' || entry.state === 'timeout') {
    upsertDevice({
      ski: entry.ski,
      hostname: entry.hostname,
      port: entry.port,
      status: 'failed',
      trustedAt: 0,
    }).catch(() => {});
    // Remove failed sessions after a delay to allow status polling
    setTimeout(() => sessions.delete(entry.ski), 30_000);
  }
}

// ─── Public State API ──────────────────────────────────────────────

/**
 * Get the current SHIP handshake state for a SKI.
 * Returns null if no session is active (device not being paired).
 */
export function getHandshakeState(ski: string): SHIPHandshakeEntry | null {
  return sessions.get(ski) ?? null;
}

/**
 * Submit a PIN for a device in `pin_required` state.
 * @returns false if the device is not in `pin_required` state.
 */
export function submitPin(ski: string, pin: string): boolean {
  const entry = sessions.get(ski);
  if (!entry || entry.state !== 'pin_required') return false;
  if (entry.pinResolve) {
    entry.pinResolve(pin);
    delete entry.pinResolve;
  } else if (entry.ws?.readyState === WebSocket.OPEN) {
    // Direct send if ws is available
    entry.ws.send(JSON.stringify({ pinInput: { pin } }));
    entry.state = 'pin_submitted';
  }
  entry.state = 'pin_submitted';
  return true;
}

/**
 * Terminate an active session.
 */
export function terminateSession(ski: string): void {
  const entry = sessions.get(ski);
  if (entry?.ws) {
    entry.ws.terminate();
  }
  sessions.delete(ski);
}
