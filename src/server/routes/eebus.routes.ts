import { Router } from 'express';
import { requireJWT } from '../middleware/auth.js';
import { EEBUSPairRequestSchema } from '../../types/protocol.js';

export function createEebusRoutes(): Router {
  const router = Router();

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

  // All EEBUS endpoints require JWT authentication
  router.get('/api/eebus/discover', requireJWT, async (_req, res) => {
    try {
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

  router.post('/api/eebus/pair', requireJWT, (req, res) => {
    const parsed = EEBUSPairRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.issues });
      return;
    }

    const { ski } = parsed.data;

    const device = eebusDeviceCache.get(ski);
    if (!device) {
      res.status(404).json({
        error: 'Unknown SKI — device must be discovered via /api/eebus/discover first',
      });
      return;
    }

    // TODO (production): Implement full SHIP handshake:
    // 1. Establish TLS 1.3 connection to device.host:device.port
    // 2. Verify TLS certificate SKI matches the requested SKI
    // 3. Complete SHIP PIN verification (5/6-digit code exchange)
    // 4. Store trust relationship persistently (not in-memory)

    eebusTrustedSKIs.add(ski);
    device.trusted = true;

    res.json({ success: true, ski });
  });

  return router;
}
