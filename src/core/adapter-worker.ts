/**
 * Adapter Worker — Offloads polling and data-mapping from the main thread
 *
 * This Web Worker handles:
 *   1. Periodic polling of REST-based adapters (Modbus SunSpec)
 *   2. Heavy data transformations (SunSpec register parsing, scale factors)
 *   3. JSON deserialization of large MQTT/WebSocket payloads
 *
 * Communication Protocol:
 *   Main → Worker:  { type: 'poll', adapterId, url, headers?, interval? }
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
  url: string;
  headers?: Record<string, string>;
  intervalMs?: number;
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

// ─── SunSpec scale factor helper (compute-heavy, offloaded here) ─────

function applyScaleFactor(value: number, sf: number | undefined): number {
  if (sf === undefined || sf === 0) return value;
  return value * Math.pow(10, sf);
}

// ─── Transform functions ─────────────────────────────────────────────

function transformSunSpecInverter(raw: Record<string, unknown>): Record<string, unknown> {
  const W = Number(raw['W'] ?? 0);
  const WH = Number(raw['WH'] ?? 0);
  const W_SF = raw['W_SF'] != null ? Number(raw['W_SF']) : undefined;
  const WH_SF = raw['WH_SF'] != null ? Number(raw['WH_SF']) : undefined;

  return {
    totalPowerW: applyScaleFactor(W, W_SF),
    yieldTodayKWh: applyScaleFactor(WH, WH_SF) / 1000,
    voltageV: raw['PhVphA'] != null ? Number(raw['PhVphA']) : undefined,
    currentA: raw['A'] != null ? Number(raw['A']) : undefined,
    frequencyHz: raw['Hz'] != null ? Number(raw['Hz']) : undefined,
    state: raw['St'] != null ? Number(raw['St']) : undefined,
  };
}

function transformSunSpecBattery(raw: Record<string, unknown>): Record<string, unknown> {
  const W = Number(raw['W'] ?? 0);
  const SoC = Number(raw['SoC'] ?? 0);
  const W_SF = raw['W_SF'] != null ? Number(raw['W_SF']) : undefined;
  const SoC_SF = raw['SoC_SF'] != null ? Number(raw['SoC_SF']) : undefined;

  return {
    powerW: applyScaleFactor(W, W_SF),
    socPercent: applyScaleFactor(SoC, SoC_SF),
    voltageV: raw['V'] != null ? Number(raw['V']) : undefined,
    currentA: raw['A'] != null ? Number(raw['A']) : undefined,
    temperatureC: raw['TmpBdy'] != null ? Number(raw['TmpBdy']) : undefined,
    cycleCount: raw['CycCnt'] != null ? Number(raw['CycCnt']) : undefined,
    stateOfHealthPercent: raw['SoH'] != null ? Number(raw['SoH']) : undefined,
  };
}

function transformSunSpecMeter(raw: Record<string, unknown>): Record<string, unknown> {
  const W = Number(raw['W'] ?? 0);
  const W_SF = raw['W_SF'] != null ? Number(raw['W_SF']) : undefined;
  const TotWh_SF = raw['TotWh_SF'] != null ? Number(raw['TotWh_SF']) : undefined;
  const TotWhImp = raw['TotWhImp'] != null ? Number(raw['TotWhImp']) : undefined;
  const TotWhExp = raw['TotWhExp'] != null ? Number(raw['TotWhExp']) : undefined;

  return {
    powerW: applyScaleFactor(W, W_SF),
    voltageV: raw['PhV'] != null ? Number(raw['PhV']) : undefined,
    frequencyHz: raw['Hz'] != null ? Number(raw['Hz']) : undefined,
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

// ─── Polling logic ───────────────────────────────────────────────────

async function executePoll(
  adapterId: string,
  url: string,
  headers?: Record<string, string>,
): Promise<void> {
  // Validate URL before any use (SSRF mitigation)
  let sanitizedUrl: URL;
  try {
    sanitizedUrl = new URL(url);
  } catch {
    postOut({ type: 'error', adapterId, error: 'Invalid URL' });
    return;
  }

  if (!isAllowedUrl(sanitizedUrl)) {
    postOut({ type: 'error', adapterId, error: 'Request blocked: URL not in allowlist' });
    return;
  }

  const start = performance.now();
  try {
    const resp = await fetch(sanitizedUrl.href, {
      headers: headers ?? {},
      signal: AbortSignal.timeout(10_000),
      redirect: 'error', // Block redirects to prevent SSRF via open redirect
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

      const interval = msg.intervalMs ?? 3000;
      // Execute immediately, then schedule
      void executePoll(msg.adapterId, msg.url, msg.headers);
      pollers.set(
        msg.adapterId,
        setInterval(() => void executePoll(msg.adapterId, msg.url, msg.headers), interval),
      );
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
          case 'venus-mqtt':
          case 'json':
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
