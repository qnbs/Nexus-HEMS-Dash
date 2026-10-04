import { z } from 'zod';

/** Server-side lifecycle for a single physical hardware command (FUP-IDEM-01). */
export const PhysicalCommandStateSchema = z.enum(['pending', 'unknown', 'succeeded', 'failed']);

export type PhysicalCommandState = z.infer<typeof PhysicalCommandStateSchema>;

/** Client-visible outcome on `/api/commands/replay` responses. */
export const PhysicalCommandOutcomeSchema = z.enum(['succeeded', 'failed', 'unknown']);

export type PhysicalCommandOutcome = z.infer<typeof PhysicalCommandOutcomeSchema>;
