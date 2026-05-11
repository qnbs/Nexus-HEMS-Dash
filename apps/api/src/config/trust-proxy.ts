/**
 * MED-10 / HIGH-07 deploy: Express `trust proxy` for multi-hop (CDN + reverse proxy).
 * @see https://expressjs.com/en/guide/behind-proxies.html
 */

/**
 * Parse TRUST_PROXY env into an Express-compatible `trust proxy` value.
 * - unset → 1 (single reverse proxy, backward compatible)
 * - "true" → true
 * - "false" → false
 * - numeric string → hop count (e.g. "2")
 * - comma-separated → subnet/IP list (e.g. "loopback,10.0.0.0/8,192.168.0.1")
 */
export function resolveTrustProxy(): boolean | number | string | string[] {
  const raw = process.env.TRUST_PROXY?.trim();
  if (!raw) return 1;

  const lower = raw.toLowerCase();
  if (lower === 'true') return true;
  if (lower === 'false') return false;

  const asNum = Number.parseInt(raw, 10);
  if (!Number.isNaN(asNum) && String(asNum) === raw.trim()) {
    return Math.max(0, asNum);
  }

  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return 1;
  if (parts.length === 1) return parts[0]!;
  return parts;
}
