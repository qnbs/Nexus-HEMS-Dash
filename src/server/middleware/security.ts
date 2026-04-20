import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import type { Express, Request } from 'express';

// ─── CORS — Origin Whitelist ─────────────────────────────────────────

export function configureCors(app: Express): void {
  const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
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
}

// ─── Security Headers (Helmet) ───────────────────────────────────────

export function configureHelmet(app: Express, isDev: boolean): void {
  // Production CSP: configurable WebSocket origins via WS_ORIGINS env var.
  // No more blanket ws://localhost:* in production.
  const wsOrigins = (process.env.WS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

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
                ...wsOrigins,
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
      hsts: isDev ? false : { maxAge: 31536000, includeSubDomains: true, preload: true },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xFrameOptions: { action: 'deny' },
    }),
  );
}

// ─── Rate Limiting ───────────────────────────────────────────────────
// Note: windowMs is randomized ±15s to mitigate timing attacks and
// prevent synchronized retry storms.

export function configureRateLimiting(app: Express, isDev: boolean): void {
  // Skip rate limiting for trusted proxy IPs (e.g., internal load balancers)
  const trustedIPs = new Set(
    (process.env.RATE_LIMIT_TRUSTED_IPS || '')
      .split(',')
      .map((ip) => ip.trim())
      .filter(Boolean),
  );

  const skipIfTrusted = (req: Request): boolean => {
    const clientIP = getClientIP(req);
    return trustedIPs.has(clientIP);
  };

  const getClientIP = (req: Request): string => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
    return req.socket.remoteAddress || 'unknown';
  };

  // Global rate limiter: 100 req/min
  const globalLimiter = rateLimit({
    windowMs: 60_000 + Math.floor((Math.random() - 0.5) * 30_000),
    max: isDev ? 0 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
    keyGenerator: getClientIP,
    skip: skipIfTrusted,
  });

  if (!isDev) app.use(globalLimiter);

  // API rate limiter: 60 req/min
  const apiLimiter = rateLimit({
    windowMs: 60_000 + Math.floor((Math.random() - 0.5) * 30_000),
    max: isDev ? 0 : 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many API requests, please try again later.' },
    keyGenerator: getClientIP,
    skip: skipIfTrusted,
  });

  if (!isDev) app.use('/api/', apiLimiter);

  // Auth endpoint rate limiter: 10 req/min (stricter to prevent brute force)
  const authLimiter = rateLimit({
    windowMs: 60_000 + Math.floor((Math.random() - 0.5) * 30_000),
    max: isDev ? 0 : 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts, please try again later.' },
    keyGenerator: getClientIP,
    skip: skipIfTrusted,
  });

  if (!isDev) {
    app.use('/api/auth/token', authLimiter);
    app.use('/api/auth/refresh', authLimiter);
  }
}
