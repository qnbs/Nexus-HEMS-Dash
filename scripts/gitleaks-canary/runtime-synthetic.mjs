/**
 * Ephemeral synthetic credentials for Gitleaks integrity probes (#432).
 * Values are generated at test runtime only — never commit high-entropy secrets.
 */
import crypto from 'node:crypto';

/** Stable marker prefix for JSON report assertions (not a secret value). @param {string} probeId @returns {string} */
export function probeMarker(probeId) {
  return `GITLEAKS_INTEGRITY_${probeId}`;
}

/**
 * Generate a deterministic-length alphanumeric string for synthetic secrets.
 * @param {number} length
 * @returns {string}
 */
function syntheticAlnum(length) {
  const raw = crypto.randomBytes(length * 2).toString('base64url');
  const alnum = raw.replace(/[^a-zA-Z0-9]/g, '');
  if (alnum.length < length) {
    return (alnum + syntheticAlnum(length)).slice(0, length);
  }
  return alnum.slice(0, length);
}

/** Tibber / generic API assignment value (≥24 chars). @param {string} probeId @returns {string} */
export function syntheticTibberToken(probeId) {
  return `${probeMarker(probeId)}${syntheticAlnum(28)}`;
}

/** aWATTar API assignment value (≥24 chars). @param {string} probeId @returns {string} */
export function syntheticAwattarToken(probeId) {
  return `${probeMarker(probeId)}${syntheticAlnum(28)}`;
}

/** MQTT password with literal "placeholder" substring (must still detect). @param {string} probeId @returns {string} */
export function syntheticMqttPasswordWithPlaceholder(probeId) {
  return `placeholder${probeMarker(probeId)}${syntheticAlnum(12)}`;
}

/**
 * MQTT password value (≥8 chars); optional literal "example" tests allowlist narrowness.
 * @param {string} probeId
 * @param {{ includeExampleSubstring?: boolean }} [options]
 * @returns {string}
 */
export function syntheticMqttPassword(probeId, { includeExampleSubstring = false } = {}) {
  const core = `${probeMarker(probeId)}${syntheticAlnum(16)}`;
  return includeExampleSubstring ? `exampleSuffix${core}` : core;
}

/** Groq-shaped key for groq-api-key rule. @param {string} probeId @returns {string} */
export function syntheticGroqKey(probeId) {
  const marker = probeMarker(probeId).replaceAll('_', 'X');
  return `gsk_${marker}${syntheticAlnum(12)}`;
}

/**
 * Replace `{{KEY}}` placeholders in a canary template with runtime synthetic values.
 * @param {string} templateText
 * @param {Record<string, string>} replacements
 * @returns {string}
 */
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
