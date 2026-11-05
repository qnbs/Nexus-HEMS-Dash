/**
 * Ephemeral synthetic credentials for Gitleaks integrity probes (#432).
 * Values are generated at test runtime only — never commit high-entropy secrets.
 */
import crypto from 'node:crypto';

/** Stable marker prefix for JSON report assertions (not a secret value). */
export function probeMarker(probeId) {
  return `GITLEAKS_INTEGRITY_${probeId}`;
}

function syntheticAlnum(length) {
  const raw = crypto.randomBytes(length * 2).toString('base64url');
  const alnum = raw.replace(/[^a-zA-Z0-9]/g, '');
  if (alnum.length < length) {
    return (alnum + syntheticAlnum(length)).slice(0, length);
  }
  return alnum.slice(0, length);
}

/** Tibber / generic API assignment value (≥24 chars). */
export function syntheticTibberToken(probeId) {
  return `${probeMarker(probeId)}${syntheticAlnum(28)}`;
}

/** aWATTar API assignment value (≥24 chars). */
export function syntheticAwattarToken(probeId) {
  return `${probeMarker(probeId)}${syntheticAlnum(28)}`;
}

/** MQTT password with literal "placeholder" substring (must still detect). */
export function syntheticMqttPasswordWithPlaceholder(probeId) {
  return `placeholder${probeMarker(probeId)}${syntheticAlnum(12)}`;
}

/** MQTT password value (≥8 chars); may include literal "example" to test allowlist narrowness. */
export function syntheticMqttPassword(probeId, { includeExampleSubstring = false } = {}) {
  const core = `${probeMarker(probeId)}${syntheticAlnum(16)}`;
  return includeExampleSubstring ? `exampleSuffix${core}` : core;
}

/** Groq-shaped key for groq-api-key rule (`gsk_[a-zA-Z0-9]{20,}` — no underscores). */
export function syntheticGroqKey(probeId) {
  const marker = probeMarker(probeId).replaceAll('_', 'X');
  return `gsk_${marker}${syntheticAlnum(12)}`;
}

export function applyTemplate(templateText, replacements) {
  let out = templateText;
  for (const [key, value] of Object.entries(replacements)) {
    out = out.replaceAll(`{{${key}}}`, value);
  }
  if (/\{\{[A-Z0-9_]+\}\}/.test(out)) {
    throw new Error('Unresolved template placeholder in gitleaks canary template');
  }
  return out;
}
