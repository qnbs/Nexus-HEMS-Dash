import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer } from 'ws';
import http from 'http';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import type { IncomingMessage } from 'http';
import { initKeys, signToken, verifyToken, getKeyHealth } from './jwt-utils.js';
import {
  WSCommandSchema,
  AuthTokenRequestSchema,
  EEBUSPairRequestSchema,
  type EnergyData,
} from './src/types/protocol.js';

// ─── Prometheus Metrics (server-side) ─────────────────────────────
interface ServerMetricSample {
  name: string;
  help: string;
  type: string;
  labels: Record<string, string>;
  value: number;
  timestamp: number;
}

const serverMetrics: Map<string, ServerMetricSample[]> = new Map();
const serverStartTime = Date.now();
const wsMessageCount = { inbound: 0, outbound: 0 };

function setMetric(
  name: string,
  help: string,
  type: string,
  value: number,
  labels: Record<string, string> = {},
): void {
  if (!serverMetrics.has(name)) {
    serverMetrics.set(name, []);
  }
  const arr = serverMetrics.get(name)!;
  const existingIdx = arr.findIndex(
    (s) =>
      Object.keys(labels).length === Object.keys(s.labels).length &&
      Object.entries(labels).every(([k, v]) => s.labels[k] === v),
  );
  const sample: ServerMetricSample = { name, help, type, labels, value, timestamp: Date.now() };
  if (existingIdx >= 0) arr[existingIdx] = sample;
  else arr.push(sample);
}

function formatMetricLabels(labels: Record<string, string>): string {
  const entries = Object.entries(labels);
  if (entries.length === 0) return '';
  return '{' + entries.map(([k, v]) => `${k}="${v}"`).join(',') + '}';
}

function renderPrometheusText(): string {
  const lines: string[] = [];
  for (const [, samples] of serverMetrics) {
    if (samples.length === 0) continue;
    const first = samples[0];
    lines.push(`# HELP ${first.name} ${first.help}`);
    lines.push(`# TYPE ${first.name} ${first.type}`);
    for (const s of samples) {
      lines.push(`${s.name}${formatMetricLabels(s.labels)} ${s.value} ${s.timestamp}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function updateServerMetrics(data: Record<string, number>): void {
  setMetric('hems_pv_power_watts', 'Current PV generation power in watts', 'gauge', data.pvPower, {
    inverter: 'primary',
  });
  setMetric(
    'hems_battery_power_watts',
    'Battery power (positive=charging, negative=discharging)',
    'gauge',
    data.batteryPower,
    { battery_id: 'main' },
  );
  setMetric(
    'hems_grid_power_watts',
    'Grid power (positive=import, negative=export)',
    'gauge',
    data.gridPower,
    { phase: 'total' },
  );
  setMetric(
    'hems_house_load_watts',
    'Total household consumption in watts',
    'gauge',
    data.houseLoad,
  );
  setMetric('hems_ev_charger_power_watts', 'EV charger power in watts', 'gauge', data.evPower, {
    charger_id: 'wallbox-1',
  });
  setMetric(
    'hems_heat_pump_power_watts',
    'Heat pump power consumption in watts',
    'gauge',
    data.heatPumpPower,
  );
  setMetric('hems_battery_soc_percent', 'Battery state of charge', 'gauge', data.batterySoC, {
    battery_id: 'main',
  });
  setMetric('hems_grid_voltage_volts', 'Grid voltage', 'gauge', data.gridVoltage, { phase: 'L1' });
  setMetric('hems_battery_voltage_volts', 'Battery voltage', 'gauge', data.batteryVoltage, {
    battery_id: 'main',
  });
  setMetric('hems_pv_yield_today_kwh', 'PV yield today in kWh', 'counter', data.pvYieldToday);
  setMetric(
    'hems_tariff_price_eur_per_kwh',
    'Current electricity tariff price',
    'gauge',
    data.priceCurrent,
    { provider: 'tibber' },
  );
  setMetric(
    'hems_uptime_seconds',
    'Dashboard uptime in seconds',
    'counter',
    (Date.now() - serverStartTime) / 1000,
  );
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
  setMetric(
    'hems_websocket_connections_active',
    'Number of active WebSocket connections',
    'gauge',
    0,
  );
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isDev = process.env.NODE_ENV !== 'production';

  // ─── JWT Key Initialization ───────────────────────────────────────
  initKeys();
  const JWT_EXPIRY = '24h';

  // ─── CORS — Origin Whitelist ─────────────────────────────────────────
  const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  // Default origins for development and production
  const DEFAULT_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:4173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4173',
    'https://qnbs.github.io',
  ];
  const allowedOriginSet = new Set([...DEFAULT_ORIGINS, ...ALLOWED_ORIGINS]);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (non-browser like curl, mobile apps)
        if (!origin || allowedOriginSet.has(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400,
    }),
  );

  // ─── Trust Proxy (required behind nginx/Docker) ───────────────────
  app.set('trust proxy', 1);

  // ─── Disable Express fingerprint ─────────────────────────────────
  app.disable('x-powered-by');

  // ─── Security Headers (Helmet) ───────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: isDev
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'blob:'],
              connectSrc: ["'self'", 'ws:', 'wss:', 'http:', 'https:'],
              fontSrc: ["'self'"],
              objectSrc: ["'none'"],
              baseUri: ["'self'"],
              formAction: ["'self'"],
              upgradeInsecureRequests: null,
            },
          }
        : {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'blob:'],
              connectSrc: [
                "'self'",
                'ws://localhost:*',
                'wss://localhost:*',
                'ws://127.0.0.1:*',
                'wss://127.0.0.1:*',
                'https://api.tibber.com',
                'https://api.awattar.at',
                'https://api.awattar.de',
                'https://api.open-meteo.com',
                'https://generativelanguage.googleapis.com',
              ],
              fontSrc: ["'self'"],
              objectSrc: ["'none'"],
              frameAncestors: ["'none'"],
              baseUri: ["'self'"],
              formAction: ["'self'"],
              upgradeInsecureRequests: [],
            },
          },
      crossOriginEmbedderPolicy: { policy: 'credentialless' },
      // HSTS must stay production-only. On the local HTTP dev server it can
      // make Firefox/WebKit upgrade module requests to HTTPS and break boot.
      hsts: isDev ? false : { maxAge: 31536000, includeSubDomains: true, preload: true },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xFrameOptions: { action: 'deny' },
    }),
  );

  // ─── Rate Limiting ───────────────────────────────────────────────────
  // Global rate limit: relaxed in dev/test (Vite serves many modules per page load)
  const globalLimiter = rateLimit({
    // ±25% jitter to prevent thundering-herd synchronisation across clients
    windowMs: 60_000 + Math.floor((Math.random() - 0.5) * 30_000),
    max: isDev ? 0 : 100, // 0 = disabled in dev mode
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
    keyGenerator: (req) => {
      // Use X-Forwarded-For behind reverse proxy, fall back to socket address
      const forwarded = req.headers['x-forwarded-for'];
      if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
      return req.socket.remoteAddress || 'unknown';
    },
  });

  if (!isDev) app.use(globalLimiter);

  // Stricter limit for API endpoints (60 req/min)
  const apiLimiter = rateLimit({
    // ±25% jitter to desynchronise client retry storms
    windowMs: 60_000 + Math.floor((Math.random() - 0.5) * 30_000),
    max: isDev ? 0 : 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many API requests, please try again later.' },
  });

  if (!isDev) app.use('/api/', apiLimiter);

  // Parse JSON for POST routes
  app.use(express.json({ limit: '10kb' }));

  // ─── Input Validation for WS commands (Zod) ──────────────────────
  function validateWSCommand(parsed: unknown): { valid: boolean; error?: string } {
    const result = WSCommandSchema.safeParse(parsed);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return { valid: false, error: firstIssue?.message ?? 'Invalid command' };
    }
    return { valid: true };
  }

  // Per-client WS command rate tracking
  const wsRateLimits = new WeakMap<import('ws').WebSocket, { count: number; resetAt: number }>();

  // ─── Authenticated client tracking ─────────────────────────────────
  interface AuthenticatedClient {
    clientId: string;
    authenticated: boolean;
    connectedAt: number;
  }
  const wsAuthMap = new WeakMap<import('ws').WebSocket, AuthenticatedClient>();

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, maxPayload: 64 * 1024 }); // 64 KB max message size

  // API routes FIRST
  app.get('/api/health', (_req, res) => {
    const adapters = ['victron-mqtt', 'modbus-sunspec', 'knx', 'ocpp', 'eebus'];
    const keyHealth = getKeyHealth();
    res.json({
      status: 'ok',
      uptime: (Date.now() - serverStartTime) / 1000,
      adapters: adapters.map((a) => ({ id: a, status: 'connected' })),
      metrics: { totalSamples: serverMetrics.size },
      jwt: {
        kid: keyHealth.currentKid,
        rotationDueIn: Math.floor(keyHealth.rotationDueMs / 86400000) + 'd',
      },
    });
  });

  // ─── JWT Token Endpoint ──────────────────────────────────────────────
  // Clients authenticate to obtain a JWT for WebSocket connections.
  // In production, this should verify credentials against an external IdP.
  app.post('/api/auth/token', async (req, res) => {
    const parsed = AuthTokenRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.issues });
      return;
    }

    const { clientId, scope } = parsed.data;
    const token = await signToken({ sub: clientId, scope: scope || 'readwrite' }, JWT_EXPIRY);
    res.json({ token, expiresIn: JWT_EXPIRY });
  });

  // ─── JWT Token Refresh ───────────────────────────────────────────────
  app.post('/api/auth/refresh', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing Authorization header' });
      return;
    }
    try {
      const decoded = await verifyToken(authHeader.slice(7));
      const token = await signToken({ sub: decoded.sub, scope: decoded.scope }, JWT_EXPIRY);
      res.json({ token, expiresIn: JWT_EXPIRY });
    } catch {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  });

  // ─── Prometheus scrape endpoint ───────────────────────────────────
  app.get('/metrics', (_req, res) => {
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(renderPrometheusText());
  });

  // ─── EEBUS Server-Side Endpoints ─────────────────────────────────
  // mDNS discovery and SKI-based pairing must run server-side because
  // browsers cannot perform mDNS queries or establish mTLS connections.

  /** In-memory cache of discovered EEBUS devices (populated by mDNS scan) */
  const eebusDeviceCache: Map<
    string,
    {
      ski: string;
      brand: string;
      model: string;
      deviceType: string;
      host: string;
      port: number;
      path: string;
      register: boolean;
      trusted: boolean;
    }
  > = new Map();
  /** Set of SKIs that have been paired (trusted) */
  const eebusTrustedSKIs: Set<string> = new Set();

  app.get('/api/eebus/discover', async (_req, res) => {
    try {
      // In production, this would use dns-sd / mdns / bonjour to scan for _ship._tcp services.
      // For now, return cached devices (populated on server start or previous scans).
      // Real implementation would use: import Bonjour from 'bonjour-service';
      // const bonjour = new Bonjour(); bonjour.find({ type: 'ship', protocol: 'tcp' }, cb);

      const devices = Array.from(eebusDeviceCache.values()).map((d) => ({
        ...d,
        trusted: eebusTrustedSKIs.has(d.ski),
      }));

      res.json(devices);
    } catch (err) {
      console.error('[EEBUS] Discovery error:', err);
      res.status(500).json({ error: 'Discovery failed' });
    }
  });

  app.post('/api/eebus/pair', (req, res) => {
    const parsed = EEBUSPairRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.issues });
      return;
    }

    const { ski } = parsed.data;

    // Security: verify SKI corresponds to a known discovered device
    const device = eebusDeviceCache.get(ski);
    if (!device) {
      res.status(404).json({
        error: 'Unknown SKI — device must be discovered via /api/eebus/discover first',
      });
      return;
    }

    // TODO (production): Before trusting, implement full SHIP handshake:
    // 1. Establish TLS 1.3 connection to device.host:device.port
    // 2. Verify TLS certificate SKI matches the requested SKI
    // 3. Complete SHIP PIN verification (5/6-digit code exchange)
    // 4. Store trust relationship persistently (not in-memory)

    eebusTrustedSKIs.add(ski);
    device.trusted = true;

    res.json({ success: true, ski });
  });

  // ─── JSON metrics endpoint (for in-app dashboard) ────────────────
  app.get('/api/metrics/json', (_req, res) => {
    const families: Array<{
      name: string;
      help: string;
      type: string;
      samples: Array<{ labels: Record<string, string>; value: number; timestamp: number }>;
    }> = [];
    for (const [name, samples] of serverMetrics) {
      if (samples.length === 0) continue;
      families.push({
        name,
        help: samples[0].help,
        type: samples[0].type,
        samples: samples.map((s) => ({ labels: s.labels, value: s.value, timestamp: s.timestamp })),
      });
    }
    res.json({
      families,
      health: { uptime: (Date.now() - serverStartTime) / 1000, connections: wss.clients.size },
    });
  });

  // ─── Grafana Dashboard provisioning endpoint ─────────────────────
  app.get('/api/grafana/dashboard', (_req, res) => {
    res.json({
      dashboard: {
        id: null,
        uid: 'nexus-hems-overview',
        title: 'Nexus HEMS — Energy Overview',
        timezone: 'browser',
        refresh: '5s',
        time: { from: 'now-1h', to: 'now' },
        panels: [
          {
            title: 'PV Generation',
            type: 'timeseries',
            gridPos: { h: 8, w: 12, x: 0, y: 0 },
            targets: [{ expr: 'hems_pv_power_watts', legendFormat: 'PV Power' }],
            fieldConfig: {
              defaults: { unit: 'watt', color: { mode: 'fixed', fixedColor: 'yellow' } },
            },
          },
          {
            title: 'Grid Power',
            type: 'timeseries',
            gridPos: { h: 8, w: 12, x: 12, y: 0 },
            targets: [
              { expr: 'hems_grid_power_watts', legendFormat: 'Grid (+ import / - export)' },
            ],
            fieldConfig: { defaults: { unit: 'watt' } },
          },
          {
            title: 'Battery SoC',
            type: 'gauge',
            gridPos: { h: 8, w: 6, x: 0, y: 8 },
            targets: [{ expr: 'hems_battery_soc_percent' }],
            fieldConfig: { defaults: { unit: 'percent', min: 0, max: 100 } },
          },
          {
            title: 'House Load',
            type: 'stat',
            gridPos: { h: 4, w: 6, x: 6, y: 8 },
            targets: [{ expr: 'hems_house_load_watts' }],
            fieldConfig: { defaults: { unit: 'watt' } },
          },
          {
            title: 'Electricity Price',
            type: 'timeseries',
            gridPos: { h: 8, w: 12, x: 12, y: 8 },
            targets: [{ expr: 'hems_tariff_price_eur_per_kwh', legendFormat: '{{provider}}' }],
            fieldConfig: { defaults: { unit: 'currencyEUR', decimals: 3 } },
          },
          {
            title: 'Adapter Status',
            type: 'table',
            gridPos: { h: 6, w: 24, x: 0, y: 16 },
            targets: [{ expr: 'hems_adapter_connected', format: 'table', instant: true }],
          },
        ],
        templating: {
          list: [
            {
              name: 'adapter',
              type: 'query',
              query: 'label_values(hems_adapter_connected, adapter)',
              refresh: 2,
              multi: true,
              includeAll: true,
            },
          ],
        },
      },
      overwrite: true,
    });
  });

  // Mock data generation for the dashboard
  const mockData: EnergyData = {
    gridPower: 0,
    pvPower: 2500,
    batteryPower: -500,
    houseLoad: 2000,
    batterySoC: 65,
    heatPumpPower: 800,
    evPower: 0,
    gridVoltage: 230,
    batteryVoltage: 51.2,
    pvYieldToday: 12.5,
    priceCurrent: 0.15,
  };

  // Update mock data periodically
  setInterval(() => {
    // Add some random noise to the data
    mockData.pvPower = Math.max(0, mockData.pvPower + (Math.random() * 200 - 100));
    mockData.houseLoad = Math.max(300, mockData.houseLoad + (Math.random() * 100 - 50));

    // Simple energy balance: Grid = House + Battery + EV + HeatPump - PV
    mockData.gridPower =
      mockData.houseLoad +
      mockData.batteryPower +
      mockData.evPower +
      mockData.heatPumpPower -
      mockData.pvPower;

    // Update Prometheus metrics
    updateServerMetrics(mockData);
    setMetric(
      'hems_websocket_connections_active',
      'Number of active WebSocket connections',
      'gauge',
      wss.clients.size,
    );

    // Broadcast to all connected clients
    const message = JSON.stringify({ type: 'ENERGY_UPDATE', data: mockData });
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        // OPEN
        client.send(message);
        wsMessageCount.outbound++;
      }
    });
  }, 2000);

  // ─── WebSocket JWT Authentication Helper ──────────────────────────
  async function authenticateWS(req: IncomingMessage): Promise<AuthenticatedClient | null> {
    try {
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const token = url.searchParams.get('token');

      // Also check Authorization header (Sec-WebSocket-Protocol or upgrade header)
      const authHeader = req.headers.authorization;
      const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

      const jwtToken = token || bearerToken;
      if (!jwtToken) return null;

      const decoded = await verifyToken(jwtToken);
      return {
        clientId: decoded.sub || 'unknown',
        authenticated: true,
        connectedAt: Date.now(),
      };
    } catch {
      return null;
    }
  }

  // Allow unauthenticated WS in dev mode, require auth in production
  const requireWSAuth = process.env.NODE_ENV === 'production';

  wss.on('connection', async (ws, req) => {
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

        // Validate command
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
