import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenADR31Adapter } from '../core/adapters/contrib/openadr-3-1';

// ─── OpenADR 3.1 Adapter Unit Tests ───────────────────────────────────────────
// Tests event parsing, §14a flag, SIMPLE→SG Ready mapping, and OAuth2 flow.
// The adapter's network calls are intercepted via global fetch mock.

let mockFetch: ReturnType<typeof vi.fn>;
const OPENADR_TEST_TIMEOUT_MS = 15_000;

/** Cast to access the private pollEvents method from tests */
type WithPollEvents = { pollEvents(): Promise<void> };

/**
 * Build a minimal but valid OpenADR 3.1.0 event object.
 * Uses the structure expected by OpenADR31Adapter.processEvent():
 *   - `id` (not `eventId`), `programID` (capital D)
 *   - `payloadDescriptors[0].payloadType` drives event type detection
 *   - `intervalPeriod.start` + `intervalPeriod.duration` drives active window
 */
const buildEvent = (type: string, signalLevel: number, eventId = `evt-${Date.now()}`) => ({
  id: eventId,
  eventName: `${type}-${eventId}`,
  programID: 'test-program',
  priority: 5,
  payloadDescriptors: [{ payloadType: type }],
  intervalPeriod: {
    start: new Date().toISOString(),
    duration: 'PT1H',
  },
  intervals: [
    {
      id: 0,
      intervalPeriod: {
        start: new Date().toISOString(),
        duration: 'PT1H',
      },
      payloads: [{ type, values: [signalLevel] }],
    },
  ],
  targets: [],
});

/** Build a token response */
const tokenResponse = {
  access_token: 'test-token',
  token_type: 'Bearer',
  expires_in: 3600,
};

describe('OpenADR31Adapter — event parsing', () => {
  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it(
    'parses LOAD_CONTROL event to set evDisabledBy14a',
    async () => {
      // Token request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => tokenResponse,
      });
      // LOAD_CONTROL with EV_MAX_POWER_W=0 → §14a full curtailment
      const event14a = {
        ...buildEvent('LOAD_CONTROL', 2, 'evt-14a'),
        intervals: [
          {
            id: 0,
            intervalPeriod: { start: new Date().toISOString(), duration: 'PT1H' },
            payloads: [
              { type: 'LOAD_CONTROL', values: [2] },
              { type: 'EV_MAX_POWER_W', values: [0] },
            ],
          },
        ],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [event14a],
      });

      const adapter = new OpenADR31Adapter({
        programId: 'test-program',
        pollIntervalMs: 9999999, // disable auto-poll
      });

      adapter.onData(() => {});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adapter as unknown as WithPollEvents).pollEvents();

      expect(adapter.isEVDisabledBy14a()).toBe(true);
      expect(adapter.getActiveEvents().size).toBe(1);
    },
    OPENADR_TEST_TIMEOUT_MS,
  );

  it(
    'maps SIMPLE level 1 → SG Ready state 2',
    async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => tokenResponse,
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [buildEvent('SIMPLE', 1, 'evt-simple')],
      });

      const adapter = new OpenADR31Adapter({
        programId: 'test-program',
        pollIntervalMs: 9999999,
      });

      adapter.onData(() => {});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adapter as unknown as WithPollEvents).pollEvents();

      // Level 1 → SG Ready state = level + 1 = 2, clamped 1–4
      expect(adapter.getTariffOverride()?.sgReadyState).toBe(2);
    },
    OPENADR_TEST_TIMEOUT_MS,
  );

  it(
    'maps SIMPLE level 3 → SG Ready state 4 (clamped)',
    async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => tokenResponse,
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [buildEvent('SIMPLE', 3, 'evt-sg4')],
      });

      const adapter = new OpenADR31Adapter({
        programId: 'test-program',
        pollIntervalMs: 9999999,
      });

      adapter.onData(() => {});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adapter as unknown as WithPollEvents).pollEvents();

      expect(adapter.getTariffOverride()?.sgReadyState).toBe(4);
    },
    OPENADR_TEST_TIMEOUT_MS,
  );

  it(
    'updates tariffOverride from ELECTRICITY_PRICE event',
    async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => tokenResponse,
      });
      const priceEvent = {
        id: 'evt-price',
        eventName: 'ELECTRICITY_PRICE-evt-price',
        programID: 'test-program',
        priority: 5,
        payloadDescriptors: [{ payloadType: 'ELECTRICITY_PRICE' }],
        intervalPeriod: { start: new Date().toISOString(), duration: 'PT1H' },
        intervals: [
          {
            id: 0,
            intervalPeriod: { start: new Date().toISOString(), duration: 'PT1H' },
            payloads: [{ type: 'PRICE', values: [0.45] }],
          },
        ],
        targets: [],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [priceEvent],
      });

      const adapter = new OpenADR31Adapter({
        programId: 'test-program',
        pollIntervalMs: 9999999,
      });

      adapter.onData(() => {});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adapter as unknown as WithPollEvents).pollEvents();

      expect(adapter.getTariffOverride()?.currentPriceEurKWh).toBe(0.45);
    },
    OPENADR_TEST_TIMEOUT_MS,
  );

  it(
    'getActiveEvents returns currently active events',
    async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => tokenResponse,
      });
      const evts = [buildEvent('LOAD_CONTROL', 2, 'active-1')];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => evts,
      });

      const adapter = new OpenADR31Adapter({
        programId: 'test-program',
        pollIntervalMs: 9999999,
      });

      adapter.onData(() => {});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adapter as unknown as WithPollEvents).pollEvents();

      const active = adapter.getActiveEvents();
      expect(active.size).toBe(1);
      expect(active.get('active-1')?.raw.id).toBe('active-1');
    },
    OPENADR_TEST_TIMEOUT_MS,
  );
});
