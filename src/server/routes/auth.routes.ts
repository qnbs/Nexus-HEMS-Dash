import { Router } from 'express';
import { initKeys, signToken, verifyToken, getKeyHealth } from '../../../jwt-utils.js';
import { AuthTokenRequestSchema } from '../../types/protocol.js';
import { validateApiKey } from '../middleware/auth.js';
import { serverStartTime, getServerMetrics } from '../middleware/metrics.js';

const JWT_EXPIRY = '24h';

export function createAuthRoutes(): Router {
  const router = Router();

  // Initialize JWT keys
  initKeys();

  // ─── Health check (no auth required — load balancer needs it) ────
  router.get('/api/health', (_req, res) => {
    const adapters = ['victron-mqtt', 'modbus-sunspec', 'knx', 'ocpp', 'eebus'];
    const keyHealth = getKeyHealth();
    res.json({
      status: 'ok',
      uptime: (Date.now() - serverStartTime) / 1000,
      adapters: adapters.map((a) => ({ id: a, status: 'connected' })),
      metrics: { totalSamples: getServerMetrics().size },
      jwt: {
        kid: keyHealth.currentKid,
        rotationDueIn: Math.floor(keyHealth.rotationDueMs / 86400000) + 'd',
      },
    });
  });

  // ─── JWT Token Endpoint ──────────────────────────────────────────
  // In production, clients must provide a valid API key to obtain a JWT.
  // In dev mode, API key validation is skipped (auto-accept).
  router.post('/api/auth/token', async (req, res) => {
    const parsed = AuthTokenRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.issues });
      return;
    }

    const { clientId, apiKey, scope } = parsed.data;

    // Validate API key (enforced in production, optional in dev)
    if (!validateApiKey(apiKey)) {
      res.status(401).json({ error: 'Invalid or missing API key' });
      return;
    }

    const token = await signToken({ sub: clientId, scope: scope || 'readwrite' }, JWT_EXPIRY);
    res.json({ token, expiresIn: JWT_EXPIRY });
  });

  // ─── JWT Token Refresh ───────────────────────────────────────────
  router.post('/api/auth/refresh', async (req, res) => {
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

  return router;
}

export { JWT_EXPIRY };
