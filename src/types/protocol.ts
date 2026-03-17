/**
 * Protocol Zod Schemas — Single source of truth for all API & WS models.
 *
 * Every API response, WebSocket message, and protocol-level data structure
 * is defined here as a Zod schema. TypeScript types are derived via z.infer.
 *
 * Usage:
 *   import { EnergyUpdateSchema, type EnergyUpdate } from '../types/protocol';
 *   const parsed = EnergyUpdateSchema.parse(raw); // throws on invalid data
 */

import { z } from 'zod';

// ─── Primitive Validators ────────────────────────────────────────────

const watts = z.number().finite();
const nonNegativeWatts = z.number().finite().nonnegative();
const percentage = z.number().finite().min(0).max(100);
const volts = z.number().finite().nonnegative();
const kwh = z.number().finite().nonnegative();
const priceEurKwh = z.number().finite();

// ─── Energy Data (server ↔ client) ──────────────────────────────────

export const EnergyDataSchema = z.object({
  gridPower: watts,
  pvPower: nonNegativeWatts,
  batteryPower: watts, // positive = charging, negative = discharging
  houseLoad: nonNegativeWatts,
  batterySoC: percentage,
  heatPumpPower: nonNegativeWatts,
  evPower: nonNegativeWatts,
  gridVoltage: volts,
  batteryVoltage: volts,
  pvYieldToday: kwh,
  priceCurrent: priceEurKwh,
});

export type EnergyData = z.infer<typeof EnergyDataSchema>;

// ─── PV Data (SunSpec Model 103/160) ────────────────────────────────

export const PVStringSchema = z.object({
  id: z.number().int(),
  powerW: nonNegativeWatts,
  voltageV: volts,
  currentA: z.number().finite().nonnegative(),
});

export const PVDataSchema = z.object({
  totalPowerW: nonNegativeWatts,
  yieldTodayKWh: kwh,
  strings: z.array(PVStringSchema).optional(),
});

export type PVData = z.infer<typeof PVDataSchema>;

// ─── Battery Data (SunSpec Model 124 / Victron) ─────────────────────

export const BatteryDataSchema = z.object({
  powerW: watts,
  socPercent: percentage,
  voltageV: volts,
  currentA: z.number().finite(),
  temperatureC: z.number().finite().optional(),
  cycleCount: z.number().int().nonnegative().optional(),
  stateOfHealthPercent: percentage.optional(),
});

export type BatteryData = z.infer<typeof BatteryDataSchema>;

// ─── Grid Data (SunSpec Model 201–204) ──────────────────────────────

export const GridPhaseSchema = z.object({
  voltageV: volts,
  currentA: z.number().finite().nonnegative(),
  powerW: watts,
});

export const GridDataSchema = z.object({
  powerW: watts,
  voltageV: volts,
  frequencyHz: z.number().finite().min(45).max(65).optional(),
  energyImportKWh: kwh.optional(),
  energyExportKWh: kwh.optional(),
  phases: z.array(GridPhaseSchema).optional(),
});

export type GridData = z.infer<typeof GridDataSchema>;

// ─── Load Data ──────────────────────────────────────────────────────

export const LoadDataSchema = z.object({
  totalPowerW: nonNegativeWatts,
  heatPumpPowerW: nonNegativeWatts,
  evPowerW: nonNegativeWatts,
  otherPowerW: nonNegativeWatts,
});

export type LoadData = z.infer<typeof LoadDataSchema>;

// ─── EV Charger (OCPP 2.1 / IEC 61851) ─────────────────────────────

export const EVChargerStatusSchema = z.enum([
  'available',
  'preparing',
  'charging',
  'suspended',
  'finishing',
  'faulted',
]);

export const EVChargerDataSchema = z.object({
  status: EVChargerStatusSchema,
  powerW: nonNegativeWatts,
  energySessionKWh: kwh,
  socPercent: percentage.optional(),
  currentA: z.number().finite().nonnegative().optional(),
  voltageV: volts.optional(),
  maxCurrentA: z.number().finite().nonnegative(),
  vehicleConnected: z.boolean(),
  v2xCapable: z.boolean(),
  v2xActive: z.boolean(),
});

export type EVChargerData = z.infer<typeof EVChargerDataSchema>;

// ─── KNX Data ───────────────────────────────────────────────────────

export const KNXRoomSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  temperature: z.number().finite(),
  setpoint: z.number().finite().optional(),
  lightsOn: z.boolean(),
  brightness: z.number().int().min(0).max(100).optional(),
  windowOpen: z.boolean(),
  humidity: percentage.optional(),
  co2ppm: z.number().finite().nonnegative().optional(),
});

export const KNXDataSchema = z.object({
  rooms: z.array(KNXRoomSchema),
});

export type KNXData = z.infer<typeof KNXDataSchema>;

// ─── Tariff Data ────────────────────────────────────────────────────

export const TariffProviderSchema = z.enum(['tibber', 'awattar', 'entsoe', 'none']);
export const SGReadyStateSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);

export const TariffDataSchema = z.object({
  currentPriceEurKWh: priceEurKwh,
  provider: TariffProviderSchema,
  sgReadyState: SGReadyStateSchema.optional(),
});

export type TariffData = z.infer<typeof TariffDataSchema>;

// ─── Unified Energy Model ──────────────────────────────────────────

export const UnifiedEnergyModelSchema = z.object({
  timestamp: z.number().int().positive(),
  pv: PVDataSchema,
  battery: BatteryDataSchema,
  grid: GridDataSchema,
  load: LoadDataSchema,
  evCharger: EVChargerDataSchema.optional(),
  knx: KNXDataSchema.optional(),
  tariff: TariffDataSchema.optional(),
});

export type UnifiedEnergyModel = z.infer<typeof UnifiedEnergyModelSchema>;

// ─── WebSocket Command (client → server) ────────────────────────────

export const WSCommandTypeSchema = z.enum([
  'SET_EV_POWER',
  'SET_HEAT_PUMP_POWER',
  'SET_BATTERY_POWER',
  'SET_EV_CURRENT',
  'START_CHARGING',
  'STOP_CHARGING',
  'SET_V2X_DISCHARGE',
  'SET_HEAT_PUMP_MODE',
  'SET_BATTERY_MODE',
  'SET_GRID_LIMIT',
  'KNX_TOGGLE_LIGHTS',
  'KNX_SET_TEMPERATURE',
  'KNX_TOGGLE_WINDOW',
]);

export type WSCommandType = z.infer<typeof WSCommandTypeSchema>;

/**
 * Base WS command schema. All commands must have a `type` and `value`.
 * Value constraints are checked per-type after initial parsing.
 */
export const WSCommandSchema = z
  .object({
    type: WSCommandTypeSchema,
    value: z.union([z.number().finite(), z.string(), z.boolean()]),
  })
  .superRefine((cmd, ctx) => {
    const v = cmd.value;

    // Power-setting commands require a number
    const powerTypes = new Set([
      'SET_EV_POWER',
      'SET_HEAT_PUMP_POWER',
      'SET_EV_CURRENT',
      'SET_V2X_DISCHARGE',
      'SET_GRID_LIMIT',
    ]);

    if (powerTypes.has(cmd.type)) {
      if (typeof v !== 'number') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${cmd.type} requires a numeric value`,
        });
        return;
      }
      if (v < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Negative value not allowed for ${cmd.type}`,
        });
        return;
      }
    }

    // Battery power is bidirectional but capped
    if (cmd.type === 'SET_BATTERY_POWER') {
      if (typeof v !== 'number') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'SET_BATTERY_POWER requires a numeric value',
        });
        return;
      }
    }

    // Safety cap: 50 kW max
    if (typeof v === 'number' && Math.abs(v) > 50_000) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Value exceeds safety limit (50 kW)' });
    }
  });

export type WSCommand = z.infer<typeof WSCommandSchema>;

// ─── WebSocket Messages (server → client) ───────────────────────────

export const WSEnergyUpdateSchema = z.object({
  type: z.literal('ENERGY_UPDATE'),
  data: EnergyDataSchema,
});

export const WSErrorSchema = z.object({
  type: z.literal('ERROR'),
  error: z.string(),
});

export const WSMessageSchema = z.discriminatedUnion('type', [WSEnergyUpdateSchema, WSErrorSchema]);

export type WSMessage = z.infer<typeof WSMessageSchema>;

// ─── REST API Schemas ───────────────────────────────────────────────

/** POST /api/auth/token */
export const AuthTokenRequestSchema = z.object({
  clientId: z.string().trim().min(1).max(64),
  scope: z.enum(['read', 'readwrite', 'admin']).optional(),
});

export type AuthTokenRequest = z.infer<typeof AuthTokenRequestSchema>;

export const AuthTokenResponseSchema = z.object({
  token: z.string(),
  expiresIn: z.string(),
});

export type AuthTokenResponse = z.infer<typeof AuthTokenResponseSchema>;

/** JWT Payload */
export const JWTPayloadSchema = z.object({
  sub: z.string().min(1),
  scope: z.enum(['read', 'readwrite', 'admin']),
  iat: z.number().optional(),
  exp: z.number().optional(),
  kid: z.string().optional(),
});

export type JWTPayload = z.infer<typeof JWTPayloadSchema>;

/** POST /api/eebus/pair */
export const EEBUSPairRequestSchema = z.object({
  ski: z.string().trim().min(4).max(128),
});

export type EEBUSPairRequest = z.infer<typeof EEBUSPairRequestSchema>;

/** GET /api/health */
export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  uptime: z.number().nonnegative(),
  adapters: z.array(
    z.object({
      id: z.string(),
      status: z.string(),
    }),
  ),
  metrics: z.object({
    totalSamples: z.number().int().nonnegative(),
  }),
  jwt: z.object({
    kid: z.string(),
    rotationDueIn: z.string(),
  }),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
