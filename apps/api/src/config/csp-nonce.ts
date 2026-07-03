/**
 * Extract the Vite build-time CSP nonce from production index.html.
 * Shared between Express Helmet and operational tooling.
 */
export function extractCspNonceFromIndexHtml(html: string): string | undefined {
  const match = html.match(/'nonce-([^']+)'/);
  return match?.[1];
}

/** Production style-src when a build nonce is available (AUD-02). */
export function buildProductionStyleSrc(buildNonce?: string): string[] {
  if (!buildNonce) return ["'self'", "'unsafe-inline'"];
  return ["'self'", `'nonce-${buildNonce}'`];
}

/** Production script-src when a build nonce is available (AUD-02). */
export function buildProductionScriptSrc(buildNonce?: string): string[] {
  if (!buildNonce) return ["'self'"];
  return ["'self'", `'nonce-${buildNonce}'`];
}
