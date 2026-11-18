/**
 * Client-facing settings snapshot sanitization (credentials in URLs, blocked keys).
 */

import { SETTINGS_SYNC_BLOCKED_KEYS } from '@nexus-hems/shared-types';

function stripInfluxUrlCredentials(value: string): string {
  try {
    const url = new URL(value);
    if (!url.username && !url.password) return value;
    url.username = '';
    url.password = '';
    return url.href;
  } catch {
    return value;
  }
}

function sanitizeSettingValueForClientSync(key: string, value: unknown): unknown {
  if (key === 'influxUrl' && typeof value === 'string' && value.length > 0) {
    return stripInfluxUrlCredentials(value);
  }
  return value;
}

/** Remove blocked keys and redact credential-bearing values for GET /api/settings. */
export function sanitizeSettingsForClientSync(
  settings: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(settings)) {
    if (SETTINGS_SYNC_BLOCKED_KEYS.has(key)) continue;
    out[key] = sanitizeSettingValueForClientSync(key, value);
  }
  return out;
}
