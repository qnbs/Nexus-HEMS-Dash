import { z } from 'zod';

/** evcc loadpoint modes — shared frontend validation + adapter dispatch. */
export const EvccLoadpointModeSchema = z.enum(['off', 'now', 'minpv', 'pv']);

export type EvccLoadpointMode = z.infer<typeof EvccLoadpointModeSchema>;

/** EV AC phase selection supported by evcc integration (1 or 3 only). */
export const EvPhaseCountSchema = z.union([z.literal(1), z.literal(3)]);

export type EvPhaseCount = z.infer<typeof EvPhaseCountSchema>;
