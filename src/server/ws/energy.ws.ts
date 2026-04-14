import type { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { authenticateWS, type AuthenticatedClient } from '../middleware/auth.js';
import { mockData, updateMockData } from '../data/mock-data.js';
import { updateServerMetrics, setMetric, wsMessageCount } from '../middleware/metrics.js';
import { WSCommandSchema } from '../../types/protocol.js';

function validateWSCommand(parsed: unknown): { valid: boolean; error?: string } {
  const result = WSCommandSchema.safeParse(parsed);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return { valid: false, error: firstIssue?.message ?? 'Invalid command' };
  }
  return { valid: true };
}

export function setupWebSocket(wss: WebSocketServer): void {
  const requireWSAuth = process.env.NODE_ENV === 'production';
  const wsAuthMap = new WeakMap<WebSocket, AuthenticatedClient>();
  const wsRateLimits = new WeakMap<WebSocket, { count: number; resetAt: number }>();

  // Update mock data and broadcast every 2 seconds
  setInterval(() => {
    updateMockData();

    updateServerMetrics(mockData, wss.clients.size);
    setMetric(
      'hems_websocket_messages_total',
      'Total WebSocket messages received',
      'counter',
      wsMessageCount.inbound,
      { direction: 'inbound' },
    );
    setMetric(
      'hems_websocket_messages_total',
      'Total WebSocket messages received',
      'counter',
      wsMessageCount.outbound,
      { direction: 'outbound' },
    );

    const message = JSON.stringify({ type: 'ENERGY_UPDATE', data: mockData });
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(message);
        wsMessageCount.outbound++;
      }
    });
  }, 2000);

  wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
    const authResult = await authenticateWS(req);

    if (requireWSAuth && !authResult) {
      ws.close(4001, 'Authentication required');
      console.warn('[WS] Rejected unauthenticated connection');
      return;
    }

    wsAuthMap.set(
      ws,
      authResult || { clientId: 'anonymous', authenticated: false, connectedAt: Date.now() },
    );
    const clientInfo = authResult ? `authenticated:${authResult.clientId}` : 'anonymous';
    console.log(`[WS] Client connected (${clientInfo})`);

    // Send initial data
    ws.send(JSON.stringify({ type: 'ENERGY_UPDATE', data: mockData }));

    ws.on('message', (message) => {
      wsMessageCount.inbound++;

      // Rate limit per WebSocket client
      const now = Date.now();
      let rl = wsRateLimits.get(ws);
      if (!rl || now > rl.resetAt) {
        rl = { count: 0, resetAt: now + 60_000 };
        wsRateLimits.set(ws, rl);
      }
      rl.count++;
      if (rl.count > 30) {
        ws.send(JSON.stringify({ type: 'ERROR', error: 'Rate limit exceeded (30 cmd/min)' }));
        return;
      }

      try {
        const parsed = JSON.parse(message.toString());

        const validation = validateWSCommand(parsed);
        if (!validation.valid) {
          ws.send(JSON.stringify({ type: 'ERROR', error: validation.error }));
          return;
        }

        if (parsed.type === 'SET_EV_POWER') {
          mockData.evPower = parsed.value;
        } else if (parsed.type === 'SET_HEAT_PUMP_POWER') {
          mockData.heatPumpPower = parsed.value;
        } else if (parsed.type === 'SET_BATTERY_POWER') {
          mockData.batteryPower = parsed.value;
        }

        // Broadcast update immediately
        mockData.gridPower =
          mockData.houseLoad +
          mockData.batteryPower +
          mockData.evPower +
          mockData.heatPumpPower -
          mockData.pvPower;
        const updateMsg = JSON.stringify({ type: 'ENERGY_UPDATE', data: mockData });
        wss.clients.forEach((c) => {
          if (c.readyState === 1) c.send(updateMsg);
        });
      } catch (e) {
        console.error('Failed to parse message', e);
      }
    });

    ws.on('close', () => {
      const info = wsAuthMap.get(ws);
      console.log(`[WS] Client disconnected (${info?.clientId || 'unknown'})`);
    });
  });
}
