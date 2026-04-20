# Security Architecture — Nexus-HEMS-Dash

> Version 1.2 · April 2026

---

## Table of Contents

1. [Threat Model](#threat-model)
2. [Authentication & Authorization](#authentication--authorization)
3. [Encryption & Key Management](#encryption--key-management)
4. [Network Security](#network-security)
5. [Adapter Security](#adapter-security)
6. [Supply Chain Security](#supply-chain-security)
7. [Client-Side Security](#client-side-security)
8. [Audit & Logging](#audit--logging)
9. [Incident Response](#incident-response)

---

## Threat Model

### Attack Surface

```
┌────────────────────────────────────────────────────────────────┐
│                      Browser / PWA                             │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ React SPA   │  │ IndexedDB    │  │ Service Worker        │ │
│  │ + Zustand   │  │ (Dexie.js)   │  │ (Workbox)             │ │
│  └──────┬──────┘  └──────┬───────┘  └───────────┬───────────┘ │
├─────────┼────────────────┼──────────────────────┼─────────────┤
│         │    WebSocket / HTTPS / MQTT-over-WS    │             │
├─────────┼────────────────┼──────────────────────┼─────────────┤
│  ┌──────▼──────┐  ┌──────▼───────┐  ┌───────────▼───────────┐ │
│  │ Express     │  │ Victron/KNX  │  │ External APIs         │ │
│  │ API Server  │  │ Gateways     │  │ Tibber/aWATTar/AI     │ │
│  └─────────────┘  └──────────────┘  └───────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

### STRIDE Analysis

| Threat              | Mitigation                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------- |
| **Spoofing**        | mTLS for EEBUS SPINE/SHIP; JWT for API auth                                              |
| **Tampering**       | CSP headers; integrity checks on service worker cache                                    |
| **Repudiation**     | Command audit trail in `BaseAdapter`; structured logging                                 |
| **Info Disclosure** | AES-GCM encrypted keys in IndexedDB; no env-var secrets                                  |
| **Denial of Svc**   | Express rate limiting (global/API/auth); nginx `limit_conn`; circuit breaker per adapter |
| **Priv. Elevation** | Read-only Docker containers; non-root nginx; strict CSP                                  |

---

## Authentication & Authorization

### API Server (Express 5)

- **Helmet.js** — sets security headers (HSTS, X-Frame-Options, X-Content-Type-Options, COEP `credentialless`)
- **express-rate-limit** — three tiers: global (100 req/min), API (60 req/min), auth endpoints (10 req/min)
  - `RATE_LIMIT_TRUSTED_IPS` env var allows load-balancer IPs to bypass rate limits
  - Window randomized ±15 s to mitigate timing attacks
- **Zod** — runtime schema validation on all API endpoints and WebSocket commands
- **JWT** (`jose`) — stateless auth tokens, HS256, 24 h expiry; secret entropy validated at startup
  - `jwt-utils.ts`: warns on low-entropy secrets (< 128 bits), short keys (< 64 chars), dictionary words
  - Secret sources: `JWT_SECRET` env var → Docker secrets file → auto-generated (dev only)
- No session storage; tokens validated per request
- Production baseline runs on Node.js 24 LTS

### EEBUS SPINE/SHIP

- **TLS 1.3** with mutual TLS (mTLS) — both client and server certificates
- mDNS-SD service discovery (local network only)
- VDE-AR-E 2829-6 compliant pairing flow

### OCPP 2.1

- WebSocket with Basic Auth or certificate-based auth
- ISO 15118 Plug & Charge certificate chain validation
- §14a EnWG compliance for grid operator control signals

---

## Encryption & Key Management

### AI API Keys — AES-GCM in IndexedDB

```
User enters API key → derive AES-256 key via PBKDF2 (100k iterations)
   → encrypt with AES-GCM (random 96-bit IV)
   → store { ciphertext, iv, salt } in Dexie.js
   → key material never leaves browser
```

**Implementation**: `src/lib/ai-keys.ts` + `src/lib/crypto.ts`

| Property       | Value                            |
| -------------- | -------------------------------- |
| Algorithm      | AES-256-GCM                      |
| Key Derivation | PBKDF2 (SHA-256, 100k iter)      |
| IV             | 96-bit, cryptographically random |
| Storage        | IndexedDB via Dexie.js           |
| Key Rotation   | Manual (user re-enters key)      |

### Credential Vault Pattern

All adapter credentials (Victron IP, MQTT user/pass, KNX gateway, EEBUS certs) are stored encrypted in IndexedDB using the same AES-GCM vault. See `src/lib/secure-store.ts`.

**Never stored:**

- Environment variables
- Plain-text files
- localStorage (except non-sensitive UI preferences)
- Git history

---

## Network Security

### TLS Configuration

| Connection             | Protocol      | Auth              |
| ---------------------- | ------------- | ----------------- |
| External APIs (Tibber) | HTTPS/TLS 1.3 | API key in header |
| MQTT (Victron)         | WSS (TLS)     | User/Pass + TLS   |
| KNX/IP                 | WS (local)    | Network isolation |
| EEBUS SPINE/SHIP       | TLS 1.3 mTLS  | Client cert       |
| OCPP 2.1               | WSS           | Basic/Cert        |
| Open-Meteo Weather API | HTTPS         | None (public)     |

### Content Security Policy (CSP)

Enforced via Helmet.js and Tauri CSP:

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
connect-src 'self' wss://localhost:* wss://127.0.0.1:* https://api.tibber.com https://api.awattar.de
  https://api.open-meteo.com https://generativelanguage.googleapis.com;
img-src 'self' data: blob:;
font-src 'self';
object-src 'none';
base-uri 'self';
frame-ancestors 'none';
cross-origin-embedder-policy: credentialless;
```

> **Production**: `ws://localhost:*` is replaced by `WS_ORIGINS` env var. Never expose dev WebSocket origins in production.

```

```

### CORS

- Express CORS middleware restricts origins to deployment domain + `CORS_ORIGINS` env var
- No wildcard `*` origins in production

### nginx Connection Limits

`nginx.conf` enforces per-IP connection limits:

```nginx
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
limit_conn conn_limit 50;   # max 50 concurrent connections per IP
client_max_body_size 1m;    # request body limit
```

Prevents connection-exhaustion DoS without impacting legitimate users.

---

## Adapter Security

### Circuit Breaker

Each adapter uses `src/core/circuit-breaker.ts`:

- **Closed** → normal operation
- **Open** → after 5 consecutive failures, blocks calls for 30 s
- **Half-Open** → single probe request to test recovery
- Prevents cascade failures across adapter aggregation layer

### Command Safety

`src/core/command-safety.ts` enforces:

- **Rate limiting** — max commands per minute per adapter
- **Confirmation** — dangerous commands require user confirmation via `ConfirmDialog`
- **Audit trail** — every command logged with timestamp, user, adapter, result
- **Emergency stop** — immediate disconnect of all adapters

### Reconnect Strategy

`src/core/useReconnect.ts`:

- Exponential backoff: 1 s → 2 s → 4 s → 8 s → max 30 s
- Jitter: ±25% to prevent thundering herd
- Max retries: 10 (configurable)
- Dead letter: after max retries, adapter marked `error` + user notified

### SSRF Prevention (ModbusSunSpec)

`src/core/adapters/ModbusSunSpecAdapter.ts`:

- Host validation restricts connections to RFC 1918 / link-local / localhost addresses
- Rejects public IPs to prevent server-side request forgery via adapter configuration
- Patterns: `10.x`, `172.16–31.x`, `192.168.x`, `169.254.x`, `127.x`, `::1`, `fe80::`, `.local`

### EEBUS Connection Timeout

`src/core/adapters/EEBUSAdapter.ts`:

- 30-second connection timeout on WebSocket open
- Prevents indefinite hang if SPINE/SHIP peer is unreachable
- Auto-close + error status on timeout

---

## Supply Chain Security

### CI/CD Pipeline (14 workflows)

| Tool                   | Purpose                                                         |
| ---------------------- | --------------------------------------------------------------- |
| **CodeQL**             | Static analysis (JavaScript/TypeScript)                         |
| **Grype/Snyk**         | Container + filesystem vulnerability scan (Trivy-Ersatz, folgt) |
| **Gitleaks**           | Secret detection (pre-commit + CI)                              |
| **anti-trojan-source** | Unicode Bidi character detection                                |
| **pnpm audit**         | Dependency vulnerability check                                  |
| **OpenSSF Scorecard**  | Supply chain security rating                                    |
| **Renovate**           | Automated dependency updates                                    |
| **Chromatic**          | Visual regression + Storybook CI                                |

### Runtime Governance

- Production containers and release workflows are pinned to Node.js 24 LTS
- Deploy workflow requires explicit manual confirmation token before GitHub Pages rollout
- `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` environment variable set across all CI workflows

### Dependency Pinning

- All GitHub Actions pinned to commit SHA (not tags)
- `pnpm-lock.yaml` committed; `pnpm install --frozen-lockfile` in CI
- Renovate auto-updates with lockfile maintenance
- Helm chart supports immutable digest-based image references (`repository@sha256:...`) for auditable rollouts

### Docker Security

```dockerfile
# Multi-stage build
FROM node:24-alpine AS build    # Build stage (discarded)
FROM nginx:1.29-alpine AS prod  # Minimal runtime

# Security hardening
USER nginx                      # Non-root
read_only: true                 # Read-only filesystem
tmpfs: [/tmp, /var/cache/nginx] # Writable tmpfs only
no-new-privileges: true         # No privilege escalation
healthcheck: curl -f http://localhost/
```

---

## Client-Side Security

### XSS Prevention

- React's JSX auto-escapes all interpolated values
- i18next `escapeValue: false` — safe because React handles escaping
- No `dangerouslySetInnerHTML` usage
- CSP blocks inline scripts

### IndexedDB Security

- Dexie.js stores encrypted blobs only
- No sensitive data in localStorage (only UI preferences: theme, locale, sidebar position)
- Service Worker cache: only static assets + API responses (no keys)

### Trusted Types (Tauri)

- Tauri v2 enforces strict CSP with Trusted Types
- No dynamic script/style injection

---

## Audit & Logging

### Command Audit Trail

Every adapter command is logged:

```typescript
{
  timestamp: ISO8601,
  adapterId: string,
  command: string,
  params: Record<string, unknown>,
  result: 'success' | 'error' | 'timeout',
  userId: string | 'anonymous',
  source: 'ui' | 'automation' | 'api'
}
```

### Metrics Collection

`src/core/useMetrics.ts` + `src/lib/metrics.ts`:

- Adapter connection duration, error rates, message throughput
- Prometheus-compatible `/metrics` endpoint on Express server
- Grafana-ready labels: `adapter_id`, `status`, `protocol`

### Monitoring Panel

`src/components/MonitoringPanel.tsx`:

- Real-time adapter health status
- Circuit breaker state visualization
- WebSocket connection quality indicators

---

## Incident Response

### Emergency Stop

`src/components/EmergencyStop.tsx`:

1. Immediate disconnect of all active adapters
2. All pending commands cancelled
3. Circuit breakers forced open
4. User notified via toast + audit log entry
5. Located in Settings → Danger Zone for authorized access

### Vulnerability Response SLA

| Severity | Acknowledgement | Patch        | Disclosure  |
| -------- | --------------- | ------------ | ----------- |
| Critical | 24 h            | 72 h         | After patch |
| High     | 48 h            | 7 days       | After patch |
| Medium   | 7 days          | 30 days      | Coordinated |
| Low      | 14 days         | Next release | Changelog   |

See [SECURITY.md](../SECURITY.md) for reporting instructions.

---

## References

- [OWASP Top 10 (2021)](https://owasp.org/Top10/)
- [EEBUS SPINE/SHIP Protocol Security](https://www.eebus.org/)
- [VDE-AR-E 2829-6](https://www.vde.com/)
- [§14a EnWG — Steuerbare Verbrauchseinrichtungen](https://www.gesetze-im-internet.de/enwg_2005/)
- [OpenSSF Supply Chain Security](https://openssf.org/)
