import { sanitizeObjectStrings, WSCommandSchema } from '@nexus-hems/shared-types';
import type { IncomingMessage } from 'http';
import type { WebSocket, WebSocketServer } from 'ws';
import { mockData, updateMockData } from '../data/mock-data.js';
import { type AuthenticatedClient, authenticateWS, type JWTScope } from '../middleware/auth.js';
import { setMetric, updateServerMetrics, wsMessageCount } from '../middleware/metrics.js';
import { wsTickets } from '../routes/auth.routes.js';

// Zombie connection detection: ping every 30 s, terminate if no pong received
const HEARTBEAT_INTERVAL_MS = 30_000;

// HIGH-06: Configurable WS command rate limit (default 30 cmd/min)
const WS_CMD_RATE_LIMIT =
  Number(process.env.WS_RATE_LIMIT) > 0 ? Number(process.env.WS_RATE_LIMIT) : 30;

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
  /** Per-client subscribed metric keys. Empty set = send all metrics (backward-compatible). */
  const wsSubscriptions = new WeakMap<WebSocket, Set<string>>();
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

    wss.clients.forEach((client) => {
      if (client.readyState !== 1) return;

      const subscribed = wsSubscriptions.get(client);
      // If subscribed is empty (no SUBSCRIBE sent), send full payload (backward-compatible)
      const payload =
        subscribed && subscribed.size > 0
          ? filterMockData(mockData as unknown as Record<string, unknown>, subscribed)
          : mockData;

      safeSend(client, { type: 'ENERGY_UPDATE', data: payload });
      wsMessageCount.outbound++;
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

    // Initialize empty subscription set (= receive all metrics)
    wsSubscriptions.set(ws, new Set<string>());

    const clientInfo = authResult
      ? `authenticated:${authResult.clientId}(scope:${authResult.scope})`
      : 'anonymous(read)';
    console.log(`[WS] Client connected (${clientInfo}) from ${clientIP}`);

    // Send initial data
    safeSend(ws, { type: 'ENERGY_UPDATE', data: mockData });

    ws.on('message', (message) => {
      wsMessageCount.inbound++;
      if (!checkWsRateLimit(ws, wsRateLimits)) return;
      try {
        const parsed = JSON.parse(message.toString());
        handleWsCommand(ws, parsed, wsSubscriptions, wsAuthMap, wss);
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

// ---------------------------------------------------------------------------
// Message handler helpers (extracted to keep cognitive complexity ≤ 25)
// ---------------------------------------------------------------------------

function checkWsRateLimit(
  ws: WebSocket,
  wsRateLimits: WeakMap<WebSocket, { count: number; resetAt: number }>,
): boolean {
  const now = Date.now();
  let rl = wsRateLimits.get(ws);
  if (!rl || now > rl.resetAt) {
    rl = { count: 0, resetAt: now + 60_000 };
    wsRateLimits.set(ws, rl);
  }
  rl.count++;
  if (rl.count > WS_CMD_RATE_LIMIT) {
    ws.send(
      JSON.stringify(
        sanitizeOutgoingWsPayload({
          type: 'ERROR',
          error: `Rate limit exceeded (${WS_CMD_RATE_LIMIT} cmd/min)`,
        }),
      ),
    );
    ws.close(4429, 'Rate limit exceeded');
    return false;
  }
  return true;
}

function handleSubscribeCommand(
  ws: WebSocket,
  parsed: Record<string, unknown>,
  wsSubscriptions: WeakMap<WebSocket, Set<string>>,
): boolean {
  if (parsed.type !== 'SUBSCRIBE') return false;
  const metrics = parsed.metrics;
  if (!Array.isArray(metrics) || !metrics.every((m) => typeof m === 'string')) return false;
  const sub = wsSubscriptions.get(ws) ?? new Set<string>();
  sub.clear();
  for (const m of metrics as string[]) sub.add(m);
  wsSubscriptions.set(ws, sub);
  safeSend(ws, { type: 'SUBSCRIBE_ACK', metrics: [...sub] });
  return true;
}

function checkScopeAuthorization(
  ws: WebSocket,
  parsedType: string,
  wsAuthMap: WeakMap<WebSocket, AuthenticatedClient>,
): boolean {
  const client = wsAuthMap.get(ws);
  const clientScope: JWTScope = client?.scope ?? 'read';
  if (WRITE_COMMANDS.has(parsedType) && SCOPE_ORDER[clientScope] < SCOPE_ORDER.readwrite) {
    ws.send(
      JSON.stringify(
        sanitizeOutgoingWsPayload({
          type: 'ERROR',
          error: 'Insufficient scope: readwrite required for hardware commands',
        }),
      ),
    );
    return false;
  }
  if (ADMIN_COMMANDS.has(parsedType) && SCOPE_ORDER[clientScope] < SCOPE_ORDER.admin) {
    ws.send(
      JSON.stringify(
        sanitizeOutgoingWsPayload({
          type: 'ERROR',
          error: 'Insufficient scope: admin required for grid limit commands',
        }),
      ),
    );
    return false;
  }
  return true;
}

function handleWsCommand(
  ws: WebSocket,
  parsed: unknown,
  wsSubscriptions: WeakMap<WebSocket, Set<string>>,
  wsAuthMap: WeakMap<WebSocket, AuthenticatedClient>,
  wss: WebSocketServer,
): void {
  const validation = validateWSCommand(parsed);
  if (!validation.valid) {
    // Handle SUBSCRIBE separately — it's not in WSCommandSchema
    if (parsed !== null && typeof parsed === 'object' && 'type' in parsed) {
      if (handleSubscribeCommand(ws, parsed as Record<string, unknown>, wsSubscriptions)) return;
    }
    safeSend(ws, { type: 'ERROR', error: validation.error });
    return;
  }

  // CRIT-02: Enforce scope-based command authorization
  const cmd = parsed as { type: string; value?: number };
  if (!checkScopeAuthorization(ws, cmd.type, wsAuthMap)) return;

  if (cmd.type === 'SET_EV_POWER') {
    mockData.evPower = cmd.value ?? mockData.evPower;
  } else if (cmd.type === 'SET_HEAT_PUMP_POWER') {
    mockData.heatPumpPower = cmd.value ?? mockData.heatPumpPower;
  } else if (cmd.type === 'SET_BATTERY_POWER') {
    mockData.batteryPower = cmd.value ?? mockData.batteryPower;
  }

  // Broadcast update immediately
  mockData.gridPower =
    mockData.houseLoad +
    mockData.batteryPower +
    mockData.evPower +
    mockData.heatPumpPower -
    mockData.pvPower;
  wss.clients.forEach((c) => {
    if (c.readyState === 1) safeSend(c, { type: 'ENERGY_UPDATE', data: mockData });
  });
}

export function sanitizeOutgoingWsPayload(payload: unknown): unknown {
  return sanitizeObjectStrings(payload, 160);
}

function safeSend(ws: WebSocket, payload: unknown): void {
  ws.send(JSON.stringify(sanitizeOutgoingWsPayload(payload)));
}

// ---------------------------------------------------------------------------
// Subscription filter helper
// ---------------------------------------------------------------------------

/**
 * Return only the fields of mockData that the client subscribed to.
 * If the client subscribed to e.g. ['pvPower', 'batteryPower'], only those
 * keys are included in the broadcast payload.
 */
function filterMockData(
  data: Record<string, unknown>,
  subscribed: Set<string>,
): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const key of subscribed) {
    if (Object.hasOwn(data, key)) {
      filtered[key] = data[key];
    }
  }
  return filtered;
}
