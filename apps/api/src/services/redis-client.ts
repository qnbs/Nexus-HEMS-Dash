/**
 * Optional shared Redis client for HA session state (WS tickets, shares, JTI).
 * Falls back gracefully when REDIS_URL is unset or ioredis is unavailable,
 * unless REDIS_REQUIRED=true (fail closed).
 */

import { isRedisRequiredForSync } from '../config/redis-sync.js';

export interface IRedisClient {
  ping(): Promise<string>;
  /** `set(key, val, 'EX', ttl)` or `set(key, val, 'EX', ttl, 'NX')` for atomic claims. */
  set(key: string, value: string, mode?: 'EX', ttl?: number, nx?: 'NX'): Promise<string | null>;
  get(key: string): Promise<string | null>;
  getdel(key: string): Promise<string | null>;
  del(...keys: string[]): Promise<number>;
  incr(key: string): Promise<number>;
  hget(key: string, field: string): Promise<string | null>;
  hgetall(key: string): Promise<Record<string, string>>;
  hset(key: string, field: string, value: string): Promise<number>;
  hdel(key: string, ...fields: string[]): Promise<number>;
  eval(script: string, numKeys: number, ...args: string[]): Promise<unknown>;
  xrevrange(
    key: string,
    end: string,
    start: string,
    countKeyword?: 'COUNT',
    count?: number,
  ): Promise<Array<[string, string[]]>>;
  xrange(
    key: string,
    start: string,
    end: string,
    countKeyword?: 'COUNT',
    count?: number,
  ): Promise<Array<[string, string[]]>>;
  on(event: string, cb: (err: Error) => void): this;
}

type OptionalRedisModule = {
  Redis: new (url: string, opts: Record<string, unknown>) => IRedisClient;
};

const importOptionalModule = new Function('specifier', 'return import(specifier);') as (
  specifier: string,
) => Promise<unknown>;

let _client: IRedisClient | null = null;
let _initialized = false;
let _initFailed = false;

/**
 * Returns a connected Redis client when REDIS_URL is set and ioredis is available.
 * Subsequent calls reuse the same connection. Returns null on missing URL or failure.
 */
export async function getOptionalRedisClient(): Promise<IRedisClient | null> {
  if (_initialized) return _client;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    if (isRedisRequiredForSync()) {
      throw new Error('[Redis] REDIS_REQUIRED=true but REDIS_URL is unset');
    }
    _initialized = true;
    return null;
  }

  try {
    const { Redis } = (await importOptionalModule('ioredis')) as OptionalRedisModule;
    const client = new Redis(redisUrl, {
      enableReadyCheck: true,
      maxRetriesPerRequest: 2,
      connectTimeout: 3_000,
      lazyConnect: false,
    });

    client.on('error', (err: Error) => {
      console.error('[Redis] Connection error:', err.message);
    });

    await client.ping();
    _client = client;
    _initialized = true;
    console.log('[Redis] Session store backend: Redis (WS tickets, shares, offline sync)');
  } catch (err) {
    _initFailed = true;
    if (isRedisRequiredForSync()) {
      throw new Error(
        `[Redis] REDIS_REQUIRED=true but connection failed: ${(err as Error).message}`,
      );
    }
    console.warn(
      '[Redis] Connection failed — WS tickets and shares use in-memory fallback:',
      (err as Error).message,
    );
    _client = null;
    _initialized = true;
  }

  return _client;
}

/** Inject a mock client for unit tests (skips ioredis connect). */
export function setRedisClientForTests(client: IRedisClient | null): void {
  _client = client;
  _initialized = true;
  _initFailed = false;
}

/** Reset client state between tests (in-memory fallback only). */
export function resetRedisClientForTests(): void {
  _client = null;
  _initialized = false;
  _initFailed = false;
}

export function redisInitFailed(): boolean {
  return _initFailed;
}
