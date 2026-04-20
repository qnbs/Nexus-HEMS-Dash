// ── JWT Key Management & jose Utilities ──────────────────────────────
// Replaces jsonwebtoken with the modern `jose` library (async, no native deps).
// Supports secret loading from: env var → Docker secret file → auto-generated (dev only).
// Key rotation: dual-key verification with configurable rotation period.
// ─────────────────────────────────────────────────────────────────────

import { SignJWT, jwtVerify, errors as joseErrors } from 'jose';
import crypto from 'crypto';
import fs from 'fs';

// ─── Types ──────────────────────────────────────────────────────────

export interface JWTPayload {
  sub: string;
  scope: string;
  iat?: number;
  exp?: number;
  kid?: string;
}

interface KeySlot {
  secret: Uint8Array;
  kid: string;
  createdAt: number;
}

// ─── Configuration ──────────────────────────────────────────────────

const ALGORITHM = 'HS256' as const;
const DOCKER_SECRET_PATH = '/run/secrets/jwt_secret';
const KEY_ROTATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const JWT_MIN_SECRET_LENGTH = 32; // bytes
const JWT_RECOMMENDED_SECRET_LENGTH = 64; // recommended for HS256

// ─── Key Store ──────────────────────────────────────────────────────

let currentKey: KeySlot | null = null;
let previousKey: KeySlot | null = null;

function generateKid(): string {
  return crypto.randomBytes(8).toString('hex');
}

function secretToUint8Array(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

/**
 * Estimate entropy of a secret string (rough heuristic).
 * Warns if the secret appears to have low entropy (dictionary words, patterns).
 */
function checkSecretEntropy(secret: string, source: string): void {
  // Basic entropy checks
  const hasLower = /[a-z]/.test(secret);
  const hasUpper = /[A-Z]/.test(secret);
  const hasDigit = /\d/.test(secret);
  const hasSpecial = /[^a-zA-Z0-9]/.test(secret);
  const charsetSize =
    (hasLower ? 26 : 0) + (hasUpper ? 26 : 0) + (hasDigit ? 10 : 0) + (hasSpecial ? 32 : 0);
  const estimatedEntropy = secret.length * Math.log2(charsetSize || 1);

  // Warn if entropy is low (< 128 bits is weak for cryptographic use)
  if (estimatedEntropy < 128) {
    console.warn(
      `[JWT] WARNING: ${source} appears to have low entropy (est. ${Math.floor(estimatedEntropy)} bits). ` +
        'Use a cryptographically random secret (e.g., openssl rand -base64 64).',
    );
  }

  // Warn if secret is shorter than recommended
  if (secret.length < JWT_RECOMMENDED_SECRET_LENGTH) {
    console.warn(
      `[JWT] WARNING: ${source} is shorter than recommended (${secret.length} < ${JWT_RECOMMENDED_SECRET_LENGTH} chars). ` +
        'Consider using a longer secret for HS256.',
    );
  }

  // Warn about common weak patterns
  const weakPatterns = ['password', 'secret', '123456', 'admin', 'test', 'changeme', 'default'];
  const lowerSecret = secret.toLowerCase();
  for (const pattern of weakPatterns) {
    if (lowerSecret.includes(pattern)) {
      console.error(
        `[JWT] SECURITY RISK: ${source} contains weak pattern "${pattern}". ` +
          'Use a cryptographically random secret in production!',
      );
      break;
    }
  }
}

/**
 * Load the JWT secret from available sources (priority order):
 * 1. JWT_SECRET environment variable
 * 2. Docker secret file (/run/secrets/jwt_secret)
 * 3. Auto-generated (development only — logged as warning)
 */
function loadSecret(): string {
  const isProd = process.env.NODE_ENV === 'production';

  // 1. Environment variable
  const envSecret = process.env.JWT_SECRET;
  if (envSecret && envSecret.length >= JWT_MIN_SECRET_LENGTH) {
    console.log('[JWT] Secret loaded from JWT_SECRET environment variable');
    if (isProd) checkSecretEntropy(envSecret, 'JWT_SECRET env var');
    return envSecret;
  }

  // 2. Docker secret file
  try {
    if (fs.existsSync(DOCKER_SECRET_PATH)) {
      const fileSecret = fs.readFileSync(DOCKER_SECRET_PATH, 'utf-8').trim();
      if (fileSecret.length >= JWT_MIN_SECRET_LENGTH) {
        console.log('[JWT] Secret loaded from Docker secret file');
        if (isProd) checkSecretEntropy(fileSecret, 'Docker secret file');
        return fileSecret;
      } else {
        console.warn(
          `[JWT] Docker secret file exists but is too short (${fileSecret.length} < ${JWT_MIN_SECRET_LENGTH} chars)`,
        );
      }
    }
  } catch (err) {
    // File not accessible — continue to fallback
    if (isProd) {
      console.warn('[JWT] Docker secret file not accessible:', (err as Error).message);
    }
  }

  // 3. Auto-generated (dev only)
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[JWT] FATAL: No JWT_SECRET configured in production! ' +
        'Set JWT_SECRET env var (min 32 chars) or mount Docker secret at ' +
        DOCKER_SECRET_PATH,
    );
  }

  const generated = crypto.randomBytes(64).toString('hex');
  console.warn('[JWT] Using auto-generated secret (NOT suitable for production or multi-instance)');
  return generated;
}

// ─── Initialization ─────────────────────────────────────────────────

/**
 * Initialize the key store. Call once at server startup.
 */
export function initKeys(): void {
  const secret = loadSecret();
  currentKey = {
    secret: secretToUint8Array(secret),
    kid: generateKid(),
    createdAt: Date.now(),
  };
  previousKey = null;
}

/**
 * Check if key rotation is needed and rotate if so.
 * Call periodically (e.g., on each sign operation or via interval).
 */
export function rotateIfNeeded(): void {
  if (!currentKey) {
    initKeys();
    return;
  }

  const age = Date.now() - currentKey.createdAt;
  if (age >= KEY_ROTATION_MS) {
    console.log('[JWT] Key rotation triggered (key age: ' + Math.floor(age / 86400000) + ' days)');
    previousKey = currentKey;
    const secret = loadSecret();
    currentKey = {
      secret: secretToUint8Array(secret),
      kid: generateKid(),
      createdAt: Date.now(),
    };
  }
}

// ─── Sign ───────────────────────────────────────────────────────────

export async function signToken(
  payload: { sub: string; scope: string },
  expiresIn: string,
): Promise<string> {
  if (!currentKey) initKeys();
  rotateIfNeeded();

  const now = Math.floor(Date.now() / 1000);
  const expSeconds = parseExpiry(expiresIn);

  return new SignJWT({ sub: payload.sub, scope: payload.scope })
    .setProtectedHeader({ alg: ALGORITHM, kid: currentKey!.kid })
    .setIssuedAt(now)
    .setExpirationTime(now + expSeconds)
    .sign(currentKey!.secret);
}

// ─── Verify ─────────────────────────────────────────────────────────

/**
 * Verify a JWT token. Tries the current key first, then the previous key
 * (graceful rotation window).
 */
export async function verifyToken(token: string): Promise<JWTPayload> {
  if (!currentKey) initKeys();

  // Try current key
  try {
    const { payload } = await jwtVerify(token, currentKey!.secret, {
      algorithms: [ALGORITHM],
    });
    return payload as unknown as JWTPayload;
  } catch (err) {
    // If we have a previous key and the error is a signature mismatch, try it
    if (previousKey && err instanceof joseErrors.JWSSignatureVerificationFailed) {
      try {
        const { payload } = await jwtVerify(token, previousKey.secret, {
          algorithms: [ALGORITHM],
        });
        return payload as unknown as JWTPayload;
      } catch {
        // Fall through to throw original error
      }
    }
    throw err;
  }
}

// ─── Health Info ─────────────────────────────────────────────────────

export function getKeyHealth(): {
  currentKid: string;
  currentAgeMs: number;
  rotationDueMs: number;
  hasPreviousKey: boolean;
} {
  if (!currentKey) initKeys();
  const age = Date.now() - currentKey!.createdAt;
  return {
    currentKid: currentKey!.kid,
    currentAgeMs: age,
    rotationDueMs: Math.max(0, KEY_ROTATION_MS - age),
    hasPreviousKey: previousKey !== null,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────

/** Parse duration strings like '24h', '7d', '30m' to seconds */
function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) {
    // Default to 24 hours if format is unrecognized
    return 86400;
  }
  const value = parseInt(match[1], 10);
  switch (match[2]) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    default:
      return 86400;
  }
}

export { joseErrors };
