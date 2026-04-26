import { describe, expect, it } from 'vitest';
import { sanitizeOutgoingWsPayload } from '../ws/energy.ws.js';

describe('sanitizeOutgoingWsPayload', () => {
  it('masks PII inside outbound websocket payloads', () => {
    const sanitized = sanitizeOutgoingWsPayload({
      type: 'ERROR',
      error: 'Reach admin@example.com at 192.168.1.42',
      data: {
        label: 'Room owner@example.com',
      },
    }) as {
      error: string;
      data: { label: string };
    };

    expect(sanitized.error).toContain('[EMAIL]');
    expect(sanitized.error).toContain('[IP]');
    expect(sanitized.error).not.toContain('admin@example.com');
    expect(sanitized.data.label).toContain('[EMAIL]');
  });
});
