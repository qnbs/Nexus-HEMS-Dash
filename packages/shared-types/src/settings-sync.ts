import { z } from 'zod';

/** Keys that must never be accepted via server settings sync (credentials). */
export const SETTINGS_SYNC_BLOCKED_KEYS = new Set([
  'influxToken',
  'apiKey',
  'apiKeys',
  'password',
  'jwtSecret',
  'mqttPassword',
  'haToken',
]);

const systemConfigSchema = z
  .object({
    presetId: z.string().max(120).optional(),
    presetName: z.string().max(200).optional(),
  })
  .passthrough();

/**
 * Allowed server-sync settings patch (one key per field).
 * Mirrors `storedSettingsImportSchema` minus credential fields.
 */
export const settingsSyncValueSchemas: Record<string, z.ZodType<unknown>> = {
  gatewayType: z.enum(['cerbo-gx', 'cerbo-gx-mk2', 'raspberry-pi']),
  systemConfig: systemConfigSchema,
  victronIp: z.string().max(253),
  knxIp: z.string().max(253),
  wsPort: z.number().int().min(1).max(65535),
  refreshRateMs: z.number().int().min(500).max(30000),
  tariffProvider: z.enum(['tibber', 'awattar', 'entsoe', 'none']),
  tariffRegion: z.string().max(32),
  dynamicGridFees: z.boolean(),
  gridOperatorName: z.string().max(120),
  chargeThreshold: z.number().min(0).max(1),
  maxGridImportKw: z.number().min(0).max(100),
  mtls: z.boolean(),
  telemetryDisabled: z.boolean(),
  twoFactor: z.boolean(),
  influxUrl: z.string().max(512),
  historyDays: z.number().int().min(1).max(365),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
  }),
  gridPriceAvg: z.number().min(0).max(10),
  animations: z.boolean(),
  compactMode: z.boolean(),
  glowEffects: z.boolean(),
  units: z.enum(['metric', 'imperial']),
  dateFormat: z.enum(['dd.mm.yyyy', 'mm/dd/yyyy', 'yyyy-mm-dd']),
  currency: z.enum(['eur', 'chf', 'gbp']),
  mqttAutoDiscovery: z.boolean(),
  fontScale: z.number().min(0.75).max(1.5),
  reducedMotion: z.boolean(),
  highContrast: z.boolean(),
  pushNotifications: z.boolean(),
  priceAlerts: z.boolean(),
  batteryAlerts: z.boolean(),
  gridAlerts: z.boolean(),
  updateNotifications: z.boolean(),
  batteryAlertThreshold: z.number().min(0).max(100),
  priceAlertThreshold: z.number().min(0).max(5),
  quietHoursEnabled: z.boolean(),
  quietHoursStart: z.string().max(8),
  quietHoursEnd: z.string().max(8),
  feedInTariff: z.number().min(0).max(1),
  gridOperator: z.string().max(120),
  monthlyBudget: z.number().min(0).max(100000),
  pvPeakKw: z.number().min(0).max(500),
  batteryCapacityKWh: z.number().min(0).max(500),
  batteryMaxChargeKW: z.number().min(0).max(500),
  batteryMinSoC: z.number().min(0).max(100),
  evMaxPowerKW: z.number().min(0).max(350),
  heatPumpPowerKW: z.number().min(0).max(50),
  feedInTariffEurKWh: z.number().min(0).max(1),
  dashboardRefreshSec: z.number().int().min(5).max(300),
  sidebarPosition: z.enum(['left', 'right']),
  debugMode: z.boolean(),
  experimentalFeatures: z.boolean(),
  performanceMode: z.boolean(),
  autoBackup: z.boolean(),
  keyboardShortcuts: z.boolean(),
  theme: z.string().max(64),
};

export const SETTINGS_SYNC_MAX_KEYS_PER_PATCH = 50;

export type SettingsSyncValidationResult =
  | { ok: true; patch: Record<string, unknown> }
  | { ok: false; error: string };

type SettingsSyncKeyResult = { ok: true; value: unknown } | { ok: false; error: string };

function isPrototypePollutionKey(key: string): boolean {
  return key === '__proto__' || key === 'constructor' || key === 'prototype';
}

function stripBlockedFromSystemConfig(data: unknown): Record<string, unknown> {
  const cleaned = { ...(data as Record<string, unknown>) };
  for (const blocked of SETTINGS_SYNC_BLOCKED_KEYS) {
    delete cleaned[blocked];
  }
  return cleaned;
}

function validateSettingsSyncKey(key: string, raw: Record<string, unknown>): SettingsSyncKeyResult {
  if (isPrototypePollutionKey(key)) {
    return { ok: false, error: `Unknown settings key: ${key}` };
  }
  if (SETTINGS_SYNC_BLOCKED_KEYS.has(key)) {
    return { ok: false, error: `Settings key "${key}" cannot be synced via API` };
  }
  if (key.startsWith('ext.')) {
    const value = raw[key];
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
      return { ok: false, error: `Extension key "${key}" must be a primitive value` };
    }
    return { ok: true, value };
  }
  const schema = settingsSyncValueSchemas[key];
  if (!schema) {
    return { ok: false, error: `Unknown settings key: ${key}` };
  }
  const parsed = schema.safeParse(raw[key]);
  if (!parsed.success) {
    return { ok: false, error: `Invalid value for settings key "${key}"` };
  }
  if (key === 'systemConfig' && parsed.data && typeof parsed.data === 'object') {
    return { ok: true, value: stripBlockedFromSystemConfig(parsed.data) };
  }
  return { ok: true, value: parsed.data };
}

/** Validate and normalize a settings sync patch (reject unknown/blocked keys). */
export function validateSettingsSyncPatch(
  raw: Record<string, unknown>,
): SettingsSyncValidationResult {
  const keys = Object.keys(raw);
  if (keys.length === 0) {
    return { ok: false, error: 'Settings patch must include at least one key' };
  }
  if (keys.length > SETTINGS_SYNC_MAX_KEYS_PER_PATCH) {
    return { ok: false, error: `Settings patch exceeds ${SETTINGS_SYNC_MAX_KEYS_PER_PATCH} keys` };
  }

  const patch = Object.create(null) as Record<string, unknown>;
  for (const key of keys) {
    if (!Object.hasOwn(raw, key)) {
      continue;
    }
    const result = validateSettingsSyncKey(key, raw);
    if (!result.ok) {
      return result;
    }
    patch[key] = result.value;
  }
  return { ok: true, patch };
}
