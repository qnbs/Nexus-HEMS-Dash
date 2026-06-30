/** SSRF guard — SHIP targets must be private/local network addresses only. */

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/,
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
  /^169\.254\.\d{1,3}\.\d{1,3}$/,
  /^::1$/,
  /^fe80:/i,
  /\.local$/,
];

export function isPrivateHost(host: string): boolean {
  return PRIVATE_HOST_PATTERNS.some((p) => p.test(host));
}
