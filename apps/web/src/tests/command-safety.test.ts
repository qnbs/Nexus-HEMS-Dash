import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  checkRateLimit,
  DANGER_COMMANDS,
  describeCommand,
  logCommandAudit,
  requiresConfirmation,
  validateCommand,
} from '../core/command-safety';
import { nexusDb } from '../lib/db';

describe('command-safety', () => {
  beforeEach(async () => {
    await nexusDb.commandAudit.clear();
  });

  describe('validateCommand', () => {
    it('accepts a valid command', () => {
      const result = validateCommand({ type: 'SET_BATTERY_POWER', value: 2500 });
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects a command with an out-of-range value', () => {
      const result = validateCommand({ type: 'SET_EV_CURRENT', value: 100 });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/Invalid value/);
    });

    it('rejects a command with a negative value', () => {
      const result = validateCommand({ type: 'SET_GRID_LIMIT', value: -1 });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/Invalid value/);
    });

    it('rejects an unknown command type', () => {
      const result = validateCommand({
        type: 'UNKNOWN_COMMAND' as Parameters<typeof validateCommand>[0]['type'],
        value: 1,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/Unknown command type/);
    });

    it('rate-limits commands after 30 calls in the same window', () => {
      const command = { type: 'SET_HEAT_PUMP_MODE' as const, value: 2 };
      for (let i = 0; i < 30; i++) {
        expect(validateCommand(command).valid).toBe(true);
      }
      const limited = validateCommand(command);
      expect(limited.valid).toBe(false);
      expect(limited.error).toMatch(/Rate limit exceeded/);
    });
  });

  describe('requiresConfirmation', () => {
    it.each(Array.from(DANGER_COMMANDS))('requires confirmation for %s', (type) => {
      expect(requiresConfirmation({ type, value: 1 })).toBe(true);
    });

    it('does not require confirmation for safe commands', () => {
      expect(requiresConfirmation({ type: 'KNX_TOGGLE_LIGHTS', value: true })).toBe(false);
      expect(requiresConfirmation({ type: 'KNX_SET_TEMPERATURE', value: 21 })).toBe(false);
    });
  });

  describe('describeCommand', () => {
    it('marks grid-limit commands as danger', () => {
      const desc = describeCommand({ type: 'SET_GRID_LIMIT', value: 5000 });
      expect(desc.severity).toBe('danger');
      expect(desc.labelKey).toBe('safety.confirmGridLimit');
    });

    it('describes battery commands as warning', () => {
      const desc = describeCommand({ type: 'SET_BATTERY_MODE', value: 'auto' });
      expect(desc.severity).toBe('warning');
      expect(desc.labelKey).toBe('safety.confirmBattery');
    });

    it('falls back to a generic confirmation for unknown commands', () => {
      const desc = describeCommand({
        type: 'UNKNOWN_COMMAND' as Parameters<typeof describeCommand>[0]['type'],
        value: 1,
      });
      expect(desc.labelKey).toBe('safety.confirmGeneric');
    });
  });

  describe('logCommandAudit', () => {
    it('writes a rejected entry to the commandAudit table', async () => {
      await logCommandAudit({
        timestamp: Date.now(),
        commandType: 'SET_BATTERY_POWER',
        value: -5000,
        status: 'rejected',
        error: 'Invalid value',
      });

      const entries = await nexusDb.commandAudit.toArray();
      expect(entries).toHaveLength(1);
      expect(entries[0]?.status).toBe('rejected');
      expect(entries[0]?.commandType).toBe('SET_BATTERY_POWER');
    });

    it('writes an executed entry and records the adapter', async () => {
      await logCommandAudit({
        timestamp: Date.now(),
        commandType: 'SET_EV_CURRENT',
        value: 16,
        status: 'executed',
        adapterId: 'ocpp-21',
        targetDeviceId: 'evse-01',
      });

      const entries = await nexusDb.commandAudit.toArray();
      expect(entries).toHaveLength(1);
      expect(entries[0]?.adapterId).toBe('ocpp-21');
      expect(entries[0]?.targetDeviceId).toBe('evse-01');
    });

    it('trims commandAudit to 5000 entries after overflow', async () => {
      const base = Date.now();
      const bulk = Array.from({ length: 5002 }, (_, i) => ({
        timestamp: base + i,
        commandType: 'SET_BATTERY_POWER' as const,
        value: 100,
        status: 'executed' as const,
      }));
      await nexusDb.commandAudit.bulkAdd(bulk);
      expect(await nexusDb.commandAudit.count()).toBe(5002);

      await logCommandAudit({
        timestamp: base + 10_000,
        commandType: 'SET_EV_CURRENT',
        value: 16,
        status: 'executed',
      });

      const count = await nexusDb.commandAudit.count();
      expect(count).toBeLessThanOrEqual(5000);
      const remaining = await nexusDb.commandAudit.orderBy('timestamp').toArray();
      expect(remaining.at(-1)?.commandType).toBe('SET_EV_CURRENT');
    });
  });

  describe('checkRateLimit', () => {
    it('allows exactly 30 commands and blocks the 31st', () => {
      const type = 'RATE_LIMIT_TEST';
      for (let i = 0; i < 30; i++) {
        expect(checkRateLimit(type)).toBe(true);
      }
      expect(checkRateLimit(type)).toBe(false);
    });
  });
});
