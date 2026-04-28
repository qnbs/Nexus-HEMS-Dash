/**
 * EEBUS routes — SHIP device pairing + trust store management.
 *
 * Endpoints:
 *   GET    /api/eebus/discover               — list mDNS-discovered devices
 *   POST   /api/eebus/pair                   — initiate SHIP handshake
 *   POST   /api/eebus/pair/pin               — submit PIN for pin_required state
 *   GET    /api/eebus/pair/status/:ski       — poll SHIP connection state
 *   GET    /api/eebus/trust                  — list trusted devices
 *   DELETE /api/eebus/trust/:ski             — remove device from trust store
 *   POST   /api/eebus/discover/register      — register mDNS-discovered device (internal)
 *
 * All endpoints require JWT auth. Mutating endpoints require admin scope.
 */

import {
  type EEBUSDeviceInfo,
  EEBUSPairRequestSchema,
  EEBUSPinSubmitSchema,
} from '@nexus-hems/shared-types';
import { Router } from 'express';
import { logger } from '../core/logger.js';
import { requireJWT, requireScope } from '../middleware/auth.js';
import { getDevice, listDevices, removeDevice, upsertDevice } from '../services/EEBusTrustStore.js';
import {
  getHandshakeState,
  initiateHandshake,
  submitPin,
  terminateSession,
} from '../services/ShipHandshakeService.js';

// ─── SSRF guard ─────────────────────────────────────────────────────
// Target host for SHIP handshake must be a private/local network address.
// This prevents an attacker with admin JWT from triggering SSRF via /pair.

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/,
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
  /^169\.254\.\d{1,3}\.\d{1,3}$/,
  /^::1$/,
  /^fe80:/i,
  /\.local$/,
];

function isPrivateHost(host: string): boolean {
  return PRIVATE_HOST_PATTERNS.some((p) => p.test(host));
}

// ─── Route factory ──────────────────────────────────────────────────

export function createEebusRoutes(): Router {
  const router = Router();

  /** In-memory cache of mDNS-discovered EEBUS devices (populated by mDNS scan) */
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
    }
  > = new Map();

  // ── GET /api/eebus/discover ─────────────────────────────────────

  router.get('/api/eebus/discover', requireJWT, async (req, res) => {
    try {
      const trustedSkis = new Set((await listDevices()).map((d) => d.ski));
      const devices = Array.from(eebusDeviceCache.values()).map((d) => ({
        ...d,
        trusted: trustedSkis.has(d.ski),
      }));
      res.json(devices);
    } catch (err) {
      logger.error('EEBUS discovery error', {
        requestId: req.requestId,
        error: err instanceof Error ? err.message : String(err),
      });
      res.status(500).json({ error: 'Discovery failed' });
    }
  });

  // ── POST /api/eebus/pair ────────────────────────────────────────
  // Initiates SHIP handshake. Requires admin scope.

  router.post('/api/eebus/pair', requireJWT, requireScope('admin'), async (req, res) => {
    const parsed = EEBUSPairRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.issues });
      return;
    }

    const { ski } = parsed.data;

    // Check if already connected
    const existing = getHandshakeState(ski);
    if (existing?.state === 'connected') {
      res.status(200).json({ status: 'connected', ski, message: 'Already paired' });
      return;
    }
    if (existing?.state === 'pin_required') {
      res.status(202).json({
        status: 'pin_required',
        ski,
        message: 'Awaiting PIN submission',
        pinHint: existing.pinHint,
      });
      return;
    }

    // Resolve hostname from mDNS cache or trust store
    const cachedDevice = eebusDeviceCache.get(ski);
    const storedDevice = await getDevice(ski);
    const hostname = cachedDevice?.host ?? storedDevice?.hostname;
    const port = cachedDevice?.port ?? storedDevice?.port ?? 4712;

    if (!hostname) {
      res.status(404).json({
        error: 'Unknown SKI — device must be discovered via /api/eebus/discover first',
      });
      return;
    }

    // SSRF guard: reject non-private hosts
    if (!isPrivateHost(hostname)) {
      res.status(403).json({
        error: `Host "${hostname}" is not a private/local address. SHIP connections are restricted to local networks.`,
      });
      return;
    }

    // Initiate handshake asynchronously
    await initiateHandshake(ski, hostname, port);

    const state = getHandshakeState(ski);
    res.status(202).json({
      status: state?.state ?? 'tls_connecting',
      ski,
      message: 'SHIP handshake initiated',
      pinHint: state?.pinHint,
    });
  });

  // ── POST /api/eebus/pair/pin ────────────────────────────────────

  router.post('/api/eebus/pair/pin', requireJWT, requireScope('admin'), (req, res) => {
    const parsed = EEBUSPinSubmitSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ errors: parsed.error.issues });
      return;
    }

    const { ski, pin } = parsed.data;
    const ok = submitPin(ski, pin);
    if (!ok) {
      const entry = getHandshakeState(ski);
      if (!entry) {
        res.status(404).json({ error: 'No active pairing session for this SKI' });
        return;
      }
      res.status(409).json({
        error: `Cannot submit PIN in state: ${entry.state}`,
        state: entry.state,
      });
      return;
    }

    res.status(202).json({ status: 'pin_submitted', ski });
  });

  // ── GET /api/eebus/pair/status/:ski ────────────────────────────

  router.get('/api/eebus/pair/status/:ski', requireJWT, (req, res) => {
    const ski = String(req.params.ski ?? '');
    if (!ski || !/^[0-9a-f]{4,128}$/i.test(ski)) {
      res.status(400).json({ error: 'Invalid SKI format' });
      return;
    }

    const entry = getHandshakeState(ski);
    if (!entry) {
      // No active session — check trust store for last known state
      getDevice(ski)
        .then((device) => {
          if (!device) {
            res.status(404).json({ error: 'No pairing session or trust store entry for this SKI' });
            return;
          }
          const status = device.status === 'trusted' ? 'connected' : 'failed';
          res.json({ status, ski, message: device.status });
        })
        .catch(() => res.status(500).json({ error: 'Trust store read failed' }));
      return;
    }

    res.json({
      status: entry.state,
      ski,
      message: entry.message,
      pinHint: entry.pinHint,
    });
  });

  // ── GET /api/eebus/trust ───────────────────────────────────────

  router.get('/api/eebus/trust', requireJWT, async (req, res) => {
    try {
      const devices = await listDevices();
      const response: EEBUSDeviceInfo[] = devices.map((d) => ({
        ski: d.ski,
        hostname: d.hostname,
        port: d.port,
        brand: d.brand,
        model: d.model,
        deviceType: d.deviceType,
        status: d.status,
        trustedAt: d.trustedAt,
        lastConnectedAt: d.lastConnectedAt,
      }));
      res.json(response);
    } catch (err) {
      logger.error('EEBUS trust store read error', {
        requestId: req.requestId,
        error: err instanceof Error ? err.message : String(err),
      });
      res.status(500).json({ error: 'Failed to read trust store' });
    }
  });

  // ── DELETE /api/eebus/trust/:ski ───────────────────────────────

  router.delete('/api/eebus/trust/:ski', requireJWT, requireScope('admin'), async (req, res) => {
    const ski = String(req.params.ski ?? '');
    if (!ski || !/^[0-9a-f]{4,128}$/i.test(ski)) {
      res.status(400).json({ error: 'Invalid SKI format' });
      return;
    }

    const removed = await removeDevice(ski);
    if (!removed) {
      res.status(404).json({ error: 'Device not found in trust store' });
      return;
    }

    // Terminate any active session
    terminateSession(ski);

    res.status(204).end();
  });

  // ── POST /api/eebus/discover/register ──────────────────────────
  // Register an mDNS-discovered device. Called by mDNS scanner (future feature).

  router.post('/api/eebus/discover/register', requireJWT, requireScope('admin'), (req, res) => {
    const body = req.body as {
      ski?: string;
      host?: string;
      port?: number;
      brand?: string;
      model?: string;
      deviceType?: string;
    };
    if (!body.ski || !body.host) {
      res.status(400).json({ error: 'ski and host are required' });
      return;
    }
    eebusDeviceCache.set(body.ski, {
      ski: body.ski,
      host: body.host,
      port: body.port ?? 4712,
      brand: body.brand ?? '',
      model: body.model ?? '',
      deviceType: body.deviceType ?? '',
      path: '/ship/',
      register: true,
    });
    // Upsert trust store entry (pending, not yet paired)
    upsertDevice({
      ski: body.ski,
      hostname: body.host,
      port: body.port ?? 4712,
      ...(body.brand !== undefined ? { brand: body.brand } : {}),
      ...(body.model !== undefined ? { model: body.model } : {}),
      ...(body.deviceType !== undefined ? { deviceType: body.deviceType } : {}),
      status: 'pending',
      trustedAt: 0,
    }).catch(() => {});
    res.status(201).json({ registered: true });
  });

  return router;
}
