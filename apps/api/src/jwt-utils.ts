// ── JWT Key Management & jose Utilities ──────────────────────────────
// Replaces jsonwebtoken with the modern `jose` library (async, no native deps).
// Supports secret loading from: env var → Docker secret file → auto-generated (dev only).
// Key rotation: dual-key verification with configurable rotation period.
// ─────────────────────────────────────────────────────────────────────

import crypto from 'crypto';
import fs from 'fs';
import { errors as joseErrors, jwtVerify, SignJWT } from 'jose';

// ─── Types ──────────────────────────────────────────────────────────

export interface JWTPayload {
  sub: string;
  scope: string;
  jti?: string;
  iss?: string;
  aud?: string | string[];
  iat?: number;
  exp?: number;
  kid?: string;
  // Index signature required by jose's JWTPayload constraint
  [key: string]: unknown;
}

interface KeySlot {
  secret: Uint8Array;
  kid: string;
  createdAt: number;
}

// ─── Configuration ──────────────────────────────────────────────────

const ALGORITHM = 'HS256' as const;
const DOCKER_SECRET_PATH = process.env.JWT_SECRET_FILE ?? '/run/secrets/jwt_secret';
const KEY_ROTATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const JWT_MIN_SECRET_LENGTH = 32; // bytes
const JWT_RECOMMENDED_SECRET_LENGTH = 64; // recommended for HS256

// MED-01: JWT issuer and audience for claim validation
export const JWT_ISSUER = 'nexus-hems-server';
export const JWT_AUDIENCE = 'nexus-hems-api';

// MED-02: JTI revocation — optional Redis backend (ADR-003)
// When REDIS_URL is set: revocations are stored in Redis with TTL (persists across restarts).
// When REDIS_URL is absent: graceful fallback to bounded in-memory Map (10 000 entries max).

// In-memory fallback store
const revokedJTIs = new Map<string, number>();
const MAX_REVOKED_JTIS = 10_000;

/** Minimal Redis interface — avoids hard ioredis type dependency */
interface IRedisClient {
  ping(): Promise<string>;
  set(key: string, value: string, mode: string, ttl: number): Promise<string | null>;
  exists(key: string): Promise<number>;
  on(event: string, cb: (err: Error) => void): this;
}

type OptionalRedisModule = {
  Redis: new (url: string, opts: Record<string, unknown>) => IRedisClient;
};

// Load optional runtime dependencies without making TypeScript require them locally.
const importOptionalModule = new Function('specifier', 'return import(specifier);') as (
  specifier: string,
) => Promise<unknown>;

// Redis client instance — initialized lazily on first revocation attempt
let _redisClient: IRedisClient | null = null;
let _redisInitialized = false;

async function getRedisClient(): Promise<IRedisClient | null> {
  if (_redisInitialized) return _redisClient;
  _redisInitialized = true;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  try {
    // Dynamic import — ioredis is an optional peer dep; fall back gracefully if absent
    const { Redis } = (await importOptionalModule('ioredis')) as OptionalRedisModule;
    const client = new Redis(redisUrl, {
      enableReadyCheck: true,
      maxRetriesPerRequest: 2,
      connectTimeout: 3_000,
      lazyConnect: false,
    });

    client.on('error', (err: Error) => {
      // Log the error class/message but never the connection URL
      console.error('[JWT-Redis] Connection error:', err.message);
    });

    await client.ping();
    _redisClient = client;
    console.log('[JWT] JTI revocation backend: Redis (persistent, survives restarts)');
  } catch (err) {
    console.warn(
      '[JWT] Redis connection failed — falling back to in-memory JTI revocation:',
      (err as Error).message,
    );
    _redisClient = null;
  }

  return _redisClient;
}

const REDIS_JTI_PREFIX = 'nexus:jti:revoked:';

/**
 * Revoke a JWT by its jti claim. Token will be rejected until it expires.
 * Stores in Redis (when available) for persistence across restarts,
 * or in-memory Map as fallback.
 */
export async function revokeToken(jti: string, expiresAtMs: number): Promise<void> {
  const redis = await getRedisClient();

  if (redis !== null) {
    const ttlSeconds = Math.max(1, Math.ceil((expiresAtMs - Date.now()) / 1_000));
    await redis.set(`${REDIS_JTI_PREFIX}${jti}`, '1', 'EX', ttlSeconds);
    return;
  }

  // In-memory fallback
  if (revokedJTIs.size >= MAX_REVOKED_JTIS) {
    const now = Date.now();
    for (const [k, exp] of revokedJTIs) {
      if (exp < now) revokedJTIs.delete(k);
      if (revokedJTIs.size < MAX_REVOKED_JTIS) break;
    }
  }
  revokedJTIs.set(jti, expiresAtMs);
}

/**
 * Check if a JTI is currently revoked.
 */
async function isJTIRevoked(jti: string): Promise<boolean> {
  const redis = await getRedisClient();

  if (redis !== null) {
    const result = await redis.exists(`${REDIS_JTI_PREFIX}${jti}`);
    return result === 1;
  }

  // In-memory fallback
  const exp = revokedJTIs.get(jti);
  if (exp === undefined) return false;
  if (exp < Date.now()) {
    revokedJTIs.delete(jti); // lazy cleanup
    return false;
  }
  return true;
}

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
    // Do NOT log estimatedEntropy (derived from secret) — CodeQL [js/clear-text-logging]
    console.warn(
      `[JWT] WARNING: ${source} appears to have low entropy. ` +
        'Use a cryptographically random secret (e.g., openssl rand -base64 64).',
    );
  }

  // Warn if secret is shorter than recommended
  // Compare against a pre-defined constant so the secret length itself is never logged
  if (secret.length < JWT_RECOMMENDED_SECRET_LENGTH) {
    console.warn(
      `[JWT] WARNING: ${source} is shorter than the recommended ${JWT_RECOMMENDED_SECRET_LENGTH} characters. ` +
        'Consider using a longer secret for HS256.',
    );
  }

  // Warn about common weak patterns — only the matched pattern name is logged, never the secret
  const weakPatterns = ['password', 'secret', '123456', 'admin', 'test', 'changeme', 'default'];
  const lowerSecret = secret.toLowerCase();
  for (const pattern of weakPatterns) {
    if (lowerSecret.includes(pattern)) {
      console.error(
        `[JWT] SECURITY RISK: ${source} contains a known-weak pattern. ` +
          'Use a cryptographically random secret in production!',
      );
      break;
    }
  }
}

/**
 * Load the JWT secret from available sources (priority order):
 * 1. JWT_SECRET_NEW environment variable (CRIT-03: new primary for rotation)
 * 2. JWT_SECRET environment variable
 * 3. Docker secret file (/run/secrets/jwt_secret)
 * 4. Auto-generated (development only — logged as warning)
 *
 * Rotation procedure:
 *   1. Set JWT_SECRET_NEW to a new random 64-char secret
 *   2. Restart server — new tokens will use JWT_SECRET_NEW; old tokens still verified via JWT_SECRET
 *   3. Wait for old token TTL (24h) to elapse
 *   4. Rename JWT_SECRET_NEW → JWT_SECRET, unset JWT_SECRET_NEW
 *   5. Restart server
 */
function loadSecret(preferNew = false): string {
  const isProd = process.env.NODE_ENV === 'production';

  // CRIT-03: When preferNew=true, use JWT_SECRET_NEW if configured (true rotation)
  if (preferNew) {
    const newSecret = process.env.JWT_SECRET_NEW;
    if (newSecret && newSecret.length >= JWT_MIN_SECRET_LENGTH) {
      console.log('[JWT] Using JWT_SECRET_NEW as new primary signing key (rotation in progress)');
      if (isProd) checkSecretEntropy(newSecret, 'JWT_SECRET_NEW env var');
      return newSecret;
    }
  }

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
      }
      // Do NOT log fileSecret.length — derived from the secret value — CodeQL [js/clear-text-logging]
      console.warn(
        `[JWT] Docker secret file exists but is too short (minimum ${JWT_MIN_SECRET_LENGTH} chars required)`,
      );
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
    console.log(`[JWT] Key rotation triggered (key age: ${Math.floor(age / 86400000)} days)`);
    previousKey = currentKey;
    // CRIT-03: Use JWT_SECRET_NEW if configured for true rotation; otherwise loadSecret() returns
    // the same JWT_SECRET as before — rotation is cosmetic without JWT_SECRET_NEW being different.
    const hasNewSecret = !!(
      process.env.JWT_SECRET_NEW && process.env.JWT_SECRET_NEW.length >= JWT_MIN_SECRET_LENGTH
    );
    const secret = loadSecret(hasNewSecret);
    currentKey = {
      secret: secretToUint8Array(secret),
      kid: generateKid(),
      createdAt: Date.now(),
    };
    if (!hasNewSecret) {
      console.warn(
        '[JWT] Key rotation is cosmetic: JWT_SECRET_NEW is not set. ' +
          'Set JWT_SECRET_NEW to a new random secret for true key rotation.',
      );
    }
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

  // MED-01: Add iss + aud claims for issuer/audience validation
  // MED-02: Add jti (JWT ID) for revocation support
  return new SignJWT({
    sub: payload.sub,
    scope: payload.scope,
    jti: crypto.randomUUID(),
  })
    .setProtectedHeader({ alg: ALGORITHM, kid: currentKey!.kid })
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(now + expSeconds)
    .sign(currentKey!.secret);
}

// ─── Verify ─────────────────────────────────────────────────────────

/**
 * Verify a JWT token. Tries the current key first, then the previous key
 * (graceful rotation window — allows tokens signed with the old key to remain valid).
 * MED-01: Validates iss and aud claims.
 * MED-02: Rejects tokens with revoked JTI.
 */
export async function verifyToken(token: string): Promise<JWTPayload> {
  if (!currentKey) initKeys();

  // MED-01: validate issuer and audience
  const verifyOptions = {
    algorithms: [ALGORITHM] as 'HS256'[],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  };

  let payload: JWTPayload | undefined;

  // Try current key first
  try {
    const result = await jwtVerify(token, currentKey!.secret, verifyOptions);
    payload = result.payload as unknown as JWTPayload;
  } catch (err) {
    // Graceful rotation: if signature fails and we have a previous key, try it
    if (previousKey && err instanceof joseErrors.JWSSignatureVerificationFailed) {
      try {
        const result = await jwtVerify(token, previousKey.secret, verifyOptions);
        payload = result.payload as unknown as JWTPayload;
      } catch {
        // Fall through to throw original error
      }
    }
    if (!payload) throw err;
  }

  // MED-02: Reject revoked tokens (async: Redis or in-memory fallback)
  if (payload.jti && (await isJTIRevoked(payload.jti))) {
    throw new joseErrors.JWTExpired('Token has been revoked', payload);
  }

  return payload;
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
