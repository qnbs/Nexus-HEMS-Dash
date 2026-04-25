/**
 * Adapter Worker — Offloads polling and data-mapping from the main thread
 *
 * This Web Worker handles:
 *   1. Periodic polling of REST-based adapters (Modbus SunSpec)
 *   2. Heavy data transformations (SunSpec register parsing, scale factors)
 *   3. JSON deserialization of large MQTT/WebSocket payloads
 *
 * Communication Protocol:
 *   Main → Worker:  { type: 'poll', adapterId, target, headers?, intervalMs? }
 *   Main → Worker:  { type: 'transform', adapterId, rawData }
 *   Main → Worker:  { type: 'stop', adapterId }
 *   Main → Worker:  { type: 'stopAll' }
 *   Worker → Main:  { type: 'data', adapterId, result }
 *   Worker → Main:  { type: 'error', adapterId, error }
 *   Worker → Main:  { type: 'latency', adapterId, ms }
 *
 * Usage from main thread:
 *   import AdapterWorker from './adapter-worker?worker';
 *   const worker = new AdapterWorker();
 *   worker.postMessage({ type: 'poll', ... });
 */

// ─── Message types ───────────────────────────────────────────────────

interface PollMessage {
  type: 'poll';
  adapterId: string;
  target: PollTarget;
  headers?: Record<string, string>;
  intervalMs?: number;
}

export interface PollTarget {
  protocol: 'http' | 'https';
  host: string;
  port?: number | undefined;
  path: string;
  query?: Record<string, string | number | boolean> | undefined;
}

interface TransformMessage {
  type: 'transform';
  adapterId: string;
  rawData: string;
  format: 'sunspec-inverter' | 'sunspec-battery' | 'sunspec-meter' | 'venus-mqtt' | 'json';
}

interface StopMessage {
  type: 'stop';
  adapterId: string;
}

interface StopAllMessage {
  type: 'stopAll';
}

type WorkerInMessage = PollMessage | TransformMessage | StopMessage | StopAllMessage;

interface DataOutMessage {
  type: 'data';
  adapterId: string;
  result: unknown;
}

interface ErrorOutMessage {
  type: 'error';
  adapterId: string;
  error: string;
}

interface LatencyOutMessage {
  type: 'latency';
  adapterId: string;
  ms: number;
}

type WorkerOutMessage = DataOutMessage | ErrorOutMessage | LatencyOutMessage;

// ─── Polling state ───────────────────────────────────────────────────

const pollers: Map<string, ReturnType<typeof setInterval>> = new Map();
const DEFAULT_POLL_INTERVAL_MS = 3000;
const MIN_POLL_INTERVAL_MS = 1000;
const MAX_POLL_INTERVAL_MS = 60_000;
const MAX_HEADER_COUNT = 16;
const MAX_HEADER_VALUE_LENGTH = 512;
const BLOCKED_HEADER_NAMES = new Set([
  'connection',
  'content-length',
  'cookie',
  'host',
  'origin',
  'proxy-authorization',
  'proxy-authenticate',
  'referer',
  'set-cookie',
  'transfer-encoding',
  'upgrade',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-proto',
]);
const SAFE_HEADER_NAME = /^[A-Za-z0-9-]{1,64}$/;
const SAFE_QUERY_KEY = /^[A-Za-z0-9._-]{1,64}$/;
const SAFE_PATH = /^\/[A-Za-z0-9._~%!$&'()*+,;=:@/-]*$/;

// ─── SunSpec scale factor helper (compute-heavy, offloaded here) ─────

function applyScaleFactor(value: number, sf: number | undefined): number {
  if (sf === undefined || sf === 0) return value;
  return value * 10 ** sf;
}

// ─── Transform functions ─────────────────────────────────────────────

function transformSunSpecInverter(raw: Record<string, unknown>): Record<string, unknown> {
  const W = Number(raw.W ?? 0);
  const WH = Number(raw.WH ?? 0);
  const W_SF = raw.W_SF != null ? Number(raw.W_SF) : undefined;
  const WH_SF = raw.WH_SF != null ? Number(raw.WH_SF) : undefined;

  return {
    totalPowerW: applyScaleFactor(W, W_SF),
    yieldTodayKWh: applyScaleFactor(WH, WH_SF) / 1000,
    voltageV: raw.PhVphA != null ? Number(raw.PhVphA) : undefined,
    currentA: raw.A != null ? Number(raw.A) : undefined,
    frequencyHz: raw.Hz != null ? Number(raw.Hz) : undefined,
    state: raw.St != null ? Number(raw.St) : undefined,
  };
}

function transformSunSpecBattery(raw: Record<string, unknown>): Record<string, unknown> {
  const W = Number(raw.W ?? 0);
  const SoC = Number(raw.SoC ?? 0);
  const W_SF = raw.W_SF != null ? Number(raw.W_SF) : undefined;
  const SoC_SF = raw.SoC_SF != null ? Number(raw.SoC_SF) : undefined;

  return {
    powerW: applyScaleFactor(W, W_SF),
    socPercent: applyScaleFactor(SoC, SoC_SF),
    voltageV: raw.V != null ? Number(raw.V) : undefined,
    currentA: raw.A != null ? Number(raw.A) : undefined,
    temperatureC: raw.TmpBdy != null ? Number(raw.TmpBdy) : undefined,
    cycleCount: raw.CycCnt != null ? Number(raw.CycCnt) : undefined,
    stateOfHealthPercent: raw.SoH != null ? Number(raw.SoH) : undefined,
  };
}

function transformSunSpecMeter(raw: Record<string, unknown>): Record<string, unknown> {
  const W = Number(raw.W ?? 0);
  const W_SF = raw.W_SF != null ? Number(raw.W_SF) : undefined;
  const TotWh_SF = raw.TotWh_SF != null ? Number(raw.TotWh_SF) : undefined;
  const TotWhImp = raw.TotWhImp != null ? Number(raw.TotWhImp) : undefined;
  const TotWhExp = raw.TotWhExp != null ? Number(raw.TotWhExp) : undefined;

  return {
    powerW: applyScaleFactor(W, W_SF),
    voltageV: raw.PhV != null ? Number(raw.PhV) : undefined,
    frequencyHz: raw.Hz != null ? Number(raw.Hz) : undefined,
    energyImportKWh: TotWhImp != null ? applyScaleFactor(TotWhImp, TotWh_SF) / 1000 : undefined,
    energyExportKWh: TotWhExp != null ? applyScaleFactor(TotWhExp, TotWh_SF) / 1000 : undefined,
  };
}

// ─── URL allowlist for SSRF prevention ───────────────────────────────

const ALLOWED_HOSTNAME_PATTERNS = [/^localhost$/, /^127\.0\.0\.1$/, /^::1$/, /^\[::1\]$/];

export function isPrivateIPv4(hostname: string): boolean {
  const parts = hostname.split('.');
  if (parts.length !== 4) return false;

  const octets: number[] = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return false;
    const n = Number(part);
    if (n < 0 || n > 255) return false;
    octets.push(n);
  }

  const [a, b] = octets;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

export function isAllowedUrl(parsed: URL): boolean {
  // Only allow http/https protocols
  if (!['http:', 'https:'].includes(parsed.protocol)) return false;
  // Block URLs with credentials (prevent credential leakage)
  if (parsed.username || parsed.password) return false;
  // Only allow requests to private/local network hosts
  const hostname = parsed.hostname.toLowerCase();
  if (ALLOWED_HOSTNAME_PATTERNS.some((p) => p.test(hostname))) return true;
  return isPrivateIPv4(hostname);
}

function sanitizeHeaderValue(value: string): string | null {
  if (/[\r\n\0]/.test(value)) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_HEADER_VALUE_LENGTH) return null;
  return trimmed;
}

export function sanitizePollHeaders(
  headers?: Record<string, string>,
): Record<string, string> | undefined {
  if (!headers) return undefined;

  const entries = Object.entries(headers).slice(0, MAX_HEADER_COUNT);
  const sanitizedEntries = entries.flatMap(([rawName, rawValue]) => {
    const name = rawName.trim();
    if (!SAFE_HEADER_NAME.test(name)) return [];

    const lowerName = name.toLowerCase();
    if (BLOCKED_HEADER_NAMES.has(lowerName)) return [];

    const sanitizedValue = sanitizeHeaderValue(rawValue);
    if (!sanitizedValue) return [];

    return [[name, sanitizedValue] as const];
  });

  if (sanitizedEntries.length === 0) return undefined;
  return Object.fromEntries(sanitizedEntries);
}

function clampPollInterval(intervalMs?: number): number {
  if (!Number.isFinite(intervalMs)) return DEFAULT_POLL_INTERVAL_MS;
  return Math.min(MAX_POLL_INTERVAL_MS, Math.max(MIN_POLL_INTERVAL_MS, Math.round(intervalMs!)));
}

export function buildAllowedPollUrl(target: PollTarget): URL | null {
  const protocol =
    target.protocol === 'https' ? 'https:' : target.protocol === 'http' ? 'http:' : null;
  if (!protocol) return null;

  const host = target.host.trim().toLowerCase();
  if (!host) return null;

  const normalizedHost = host.includes(':') && !host.startsWith('[') ? `[${host}]` : host;

  const normalizedPath = target.path.trim();
  if (
    !SAFE_PATH.test(normalizedPath) ||
    normalizedPath.includes('..') ||
    /%2e/i.test(normalizedPath) ||
    normalizedPath.includes('\\') ||
    /[\r\n\t]/.test(normalizedPath)
  ) {
    return null;
  }

  if (
    target.port !== undefined &&
    (!Number.isInteger(target.port) || target.port < 1 || target.port > 65535)
  ) {
    return null;
  }

  const authority = target.port ? `${normalizedHost}:${target.port}` : normalizedHost;

  let url: URL;
  try {
    url = new URL(`${protocol}//${authority}${normalizedPath}`);
  } catch {
    return null;
  }

  if (!isAllowedUrl(url)) return null;

  if (target.query) {
    for (const [key, value] of Object.entries(target.query)) {
      if (!SAFE_QUERY_KEY.test(key)) return null;
      const normalizedValue = String(value);
      if (/[\r\n\0]/.test(normalizedValue) || normalizedValue.length > 256) return null;
      url.searchParams.set(key, normalizedValue);
    }
  }

  return url;
}

// ─── Polling logic ───────────────────────────────────────────────────

async function executePoll(
  adapterId: string,
  url: URL,
  headers?: Record<string, string>,
): Promise<void> {
  // Re-assert URL safety at the point of use to satisfy CodeQL taint tracking
  // (buildAllowedPollUrl already validated, but CodeQL requires assertion at fetch site)
  if (!isAllowedUrl(url)) {
    postOut({ type: 'error', adapterId, error: 'Request blocked: URL failed safety re-check' });
    return;
  }

  // Break the CodeQL taint chain by reconstructing the URL from individually
  // validated and allow-listed components. Every piece is re-derived from the
  // URL object's parsed fields — never from the original user-supplied string.
  const safeProtocol = url.protocol === 'https:' ? 'https:' : 'http:';
  const safeHostname = url.hostname;
  const safePort = url.port;
  const safePath = url.pathname;
  const safeSearch = url.search;

  // Final hostname allowlist assertion (private/local networks only)
  if (
    !ALLOWED_HOSTNAME_PATTERNS.some((p) => p.test(safeHostname)) &&
    !isPrivateIPv4(safeHostname)
  ) {
    postOut({ type: 'error', adapterId, error: 'Request blocked: hostname not in allowlist' });
    return;
  }

  const authority = safePort ? `${safeHostname}:${safePort}` : safeHostname;
  const safeUrl = `${safeProtocol}//${authority}${safePath}${safeSearch}`;

  const start = performance.now();
  try {
    // safeUrl is fully reconstructed from individually validated components:
    // protocol allowlist, hostname allowlist + private-IP check, port range check,
    // path/query sanitisation. Redirects are blocked via `redirect:'error'`.
    const resp = await fetch(safeUrl, {
      // codeql[js/request-forgery]
      headers: headers ?? {},
      signal: AbortSignal.timeout(10_000),
      redirect: 'error', // block open-redirect chains
    });
    if (!resp.ok) {
      postOut({ type: 'error', adapterId, error: `HTTP ${resp.status}` });
      return;
    }
    const data = await resp.json();
    const elapsed = performance.now() - start;

    postOut({ type: 'latency', adapterId, ms: Math.round(elapsed) });
    postOut({ type: 'data', adapterId, result: data });
  } catch (err) {
    postOut({
      type: 'error',
      adapterId,
      error: err instanceof Error ? err.message : 'Poll failed',
    });
  }
}

// ─── Type-safe postMessage ───────────────────────────────────────────

function postOut(msg: WorkerOutMessage): void {
  self.postMessage(msg);
}

// ─── Message handler ─────────────────────────────────────────────────

self.onmessage = (event: MessageEvent<WorkerInMessage>) => {
  // Origin verification: only accept messages from same origin
  if (event.origin && event.origin !== '' && event.origin !== self.location?.origin) {
    return;
  }
  const msg = event.data;

  switch (msg.type) {
    case 'poll': {
      // Stop existing poller for this adapter if any
      const existing = pollers.get(msg.adapterId);
      if (existing) clearInterval(existing);

      const sanitizedUrl = buildAllowedPollUrl(msg.target);
      if (!sanitizedUrl) {
        postOut({
          type: 'error',
          adapterId: msg.adapterId,
          error: 'Request blocked: invalid poll target',
        });
        break;
      }

      const sanitizedHeaders = sanitizePollHeaders(msg.headers);

      const interval = clampPollInterval(msg.intervalMs);
      let inFlight = false;
      const pollOnce = () => {
        if (inFlight) return;
        inFlight = true;
        void executePoll(msg.adapterId, sanitizedUrl, sanitizedHeaders).finally(() => {
          inFlight = false;
        });
      };

      // Execute immediately, then schedule
      pollOnce();
      pollers.set(msg.adapterId, setInterval(pollOnce, interval));
      break;
    }

    case 'transform': {
      try {
        const raw = JSON.parse(msg.rawData) as Record<string, unknown>;
        let result: unknown;

        switch (msg.format) {
          case 'sunspec-inverter':
            result = transformSunSpecInverter(raw);
            break;
          case 'sunspec-battery':
            result = transformSunSpecBattery(raw);
            break;
          case 'sunspec-meter':
            result = transformSunSpecMeter(raw);
            break;
          default:
            result = raw;
        }

        postOut({ type: 'data', adapterId: msg.adapterId, result });
      } catch (err) {
        postOut({
          type: 'error',
          adapterId: msg.adapterId,
          error: err instanceof Error ? err.message : 'Transform failed',
        });
      }
      break;
    }

    case 'stop': {
      const timer = pollers.get(msg.adapterId);
      if (timer) {
        clearInterval(timer);
        pollers.delete(msg.adapterId);
      }
      break;
    }

    case 'stopAll': {
      for (const timer of pollers.values()) {
        clearInterval(timer);
      }
      pollers.clear();
      break;
    }
  }
};
