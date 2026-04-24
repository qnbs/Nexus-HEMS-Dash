import type { IncomingMessage } from 'http';
import type { WebSocket, WebSocketServer } from 'ws';
import { WSCommandSchema } from '@nexus-hems/shared-types';
import { mockData, updateMockData } from '../data/mock-data.js';
import { type AuthenticatedClient, authenticateWS, type JWTScope } from '../middleware/auth.js';
import { setMetric, updateServerMetrics, wsMessageCount } from '../middleware/metrics.js';
import { wsTickets } from '../routes/auth.routes.js';

// Zombie connection detection: ping every 30 s, terminate if no pong received
const HEARTBEAT_INTERVAL_MS = 30_000;

// CRIT-02: Command authorization levels
// Commands that require at minimum 'readwrite' scope
const WRITE_COMMANDS = new Set(['SET_EV_POWER', 'SET_HEAT_PUMP_POWER', 'SET_BATTERY_POWER']);
// Commands that require at minimum 'admin' scope
const ADMIN_COMMANDS = new Set(['SET_GRID_LIMIT']);

function validateWSCommand(parsed: unknown): { valid: boolean; error?: string } {
  const result = WSCommandSchema.safeParse(parsed);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return { valid: false, error: firstIssue?.message ?? 'Invalid command' };
  }
  return { valid: true };
}

// HIGH-07: Per-IP connection rate limiting
const wsConnectionsPerIP = new Map<string, number>();
const WS_MAX_CONNECTIONS_PER_IP = 10;

function getWSClientIP(req: IncomingMessage): string {
  // Use the socket address (not x-forwarded-for, which can be spoofed)
  return req.socket.remoteAddress ?? 'unknown';
}

const SCOPE_ORDER: Record<JWTScope, number> = { read: 0, readwrite: 1, admin: 2 };

export function setupWebSocket(wss: WebSocketServer): void {
  const requireWSAuth = process.env.NODE_ENV === 'production';
  const wsAuthMap = new WeakMap<WebSocket, AuthenticatedClient>();
  const wsRateLimits = new WeakMap<WebSocket, { count: number; resetAt: number }>();

  // ─── Heartbeat: detect and terminate zombie connections ───────────────
  // Each client is marked alive=false before every ping.
  // If a pong arrives the flag is set back to true.
  // If the next ping cycle finds alive=false the connection is terminated.
  const wsAlive = new WeakMap<WebSocket, boolean>();

  const heartbeat = setInterval(() => {
    wss.clients.forEach((client) => {
      if (wsAlive.get(client) === false) {
        // No pong received since the last ping → zombie, hard-close
        console.warn('[WS] Terminating zombie connection (no pong)');
        client.terminate();
        return;
      }
      wsAlive.set(client, false);
      try {
        client.ping();
      } catch {
        // Client already gone from the OS layer — terminate cleanly
        client.terminate();
      }
    });
  }, HEARTBEAT_INTERVAL_MS);

  // Release the interval so Node can exit cleanly
  wss.on('close', () => clearInterval(heartbeat));

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
    // HIGH-07: Per-IP connection limit
    const clientIP = getWSClientIP(req);
    const currentConnections = wsConnectionsPerIP.get(clientIP) ?? 0;
    if (currentConnections >= WS_MAX_CONNECTIONS_PER_IP) {
      ws.close(4429, 'Too many connections from this IP');
      console.warn(
        `[WS] Rejected connection from ${clientIP} (limit: ${WS_MAX_CONNECTIONS_PER_IP})`,
      );
      return;
    }
    wsConnectionsPerIP.set(clientIP, currentConnections + 1);

    // CRIT-02 + HIGH-04: Authenticate and extract scope via ticket or JWT
    const authResult = await authenticateWS(req, wsTickets);

    if (requireWSAuth && !authResult) {
      ws.close(4001, 'Authentication required');
      // Clean up per-IP counter on failed auth
      const remaining = (wsConnectionsPerIP.get(clientIP) ?? 1) - 1;
      if (remaining <= 0) wsConnectionsPerIP.delete(clientIP);
      else wsConnectionsPerIP.set(clientIP, remaining);
      console.warn('[WS] Rejected unauthenticated connection');
      return;
    }

    wsAuthMap.set(
      ws,
      authResult || {
        clientId: 'anonymous',
        scope: 'read' as JWTScope, // anonymous gets read-only
        authenticated: false,
        connectedAt: Date.now(),
      },
    );

    // Mark connection alive; update on every pong
    wsAlive.set(ws, true);
    ws.on('pong', () => wsAlive.set(ws, true));

    const clientInfo = authResult
      ? `authenticated:${authResult.clientId}(scope:${authResult.scope})`
      : 'anonymous(read)';
    console.log(`[WS] Client connected (${clientInfo}) from ${clientIP}`);

    // Send initial data
    ws.send(JSON.stringify({ type: 'ENERGY_UPDATE', data: mockData }));

    ws.on('message', (message) => {
      wsMessageCount.inbound++;

      // Rate limit per WebSocket client (30 cmd/min)
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

        // CRIT-02: Enforce scope-based command authorization
        const client = wsAuthMap.get(ws);
        const clientScope: JWTScope = client?.scope ?? 'read';

        if (WRITE_COMMANDS.has(parsed.type) && SCOPE_ORDER[clientScope] < SCOPE_ORDER.readwrite) {
          ws.send(
            JSON.stringify({
              type: 'ERROR',
              error: 'Insufficient scope: readwrite required for hardware commands',
            }),
          );
          return;
        }
        if (ADMIN_COMMANDS.has(parsed.type) && SCOPE_ORDER[clientScope] < SCOPE_ORDER.admin) {
          ws.send(
            JSON.stringify({
              type: 'ERROR',
              error: 'Insufficient scope: admin required for grid limit commands',
            }),
          );
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
      // HIGH-07: Clean up per-IP connection count
      const remaining = (wsConnectionsPerIP.get(clientIP) ?? 1) - 1;
      if (remaining <= 0) wsConnectionsPerIP.delete(clientIP);
      else wsConnectionsPerIP.set(clientIP, remaining);
    });
  });
}
