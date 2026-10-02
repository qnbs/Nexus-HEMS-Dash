/** Short Git SHA embedded at build time (`VITE_BUILD_SHA`). */
export function getBuildSha(): string | undefined {
  const raw = import.meta.env.VITE_BUILD_SHA?.trim();
  if (!raw || raw === 'dev') return undefined;
  return raw.length > 12 ? raw.slice(0, 12) : raw;
}

/** ISO build timestamp when set (`VITE_BUILD_TIME`). */
export function getBuildTimeIso(): string | undefined {
  const raw = import.meta.env.VITE_BUILD_TIME?.trim();
  return raw && raw.length > 0 ? raw : undefined;
}
