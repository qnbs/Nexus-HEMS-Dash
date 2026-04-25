# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in Nexus-HEMS Dashboard, please report it responsibly:

1. **Do NOT open a public issue.** Security vulnerabilities must be reported privately.
2. **Email**: Send a detailed report to the repository owner via [GitHub Security Advisories](https://github.com/qnbs/Nexus-HEMS-Dash/security/advisories/new).
3. **Include**: A description of the vulnerability, steps to reproduce, affected versions, and any potential impact.

### Response Timeline

- **Acknowledgement**: Within 48 hours of receiving the report.
- **Assessment**: Within 7 days, we will assess the severity and impact.
- **Fix & Disclosure**: Critical vulnerabilities will be patched within 14 days. A coordinated disclosure will follow.

## Security Measures

This project employs multiple layers of security:

- **Static Analysis**: CodeQL, Semgrep, ESLint security rules
- **Secret Detection**: Gitleaks (pre-commit + CI)
- **Dependency Scanning**: pnpm audit, Snyk, Socket.dev, Aikido Safe Chain
- **Supply Chain**: OpenSSF Scorecard, Renovate automated updates, Dependabot
- **CI Hardening**: GitHub Actions pinned to commit SHA, mandatory security workflow gate
- **Deploy Governance**: GitHub Pages deploy requires manual `workflow_dispatch` confirmation (`approveDeploy=DEPLOY`)
- **Container Security**: Grype/Snyk image scanning, read-only containers, non-root user, per-IP nginx connection limits (`limit_conn 50`), per-IP WebSocket connection limit (max 10 per IP)
- **Anti-Trojan-Source**: Unicode Bidi character detection
- **Pre-commit Hooks**: Gitleaks, detect-private-key, anti-trojan-source
- **Conventional Commits**: Enforced via commitlint
- **JWT Entropy Validation**: `apps/api/src/jwt-utils.ts` warns on low-entropy secrets, dictionary words, and short keys at startup (production only)
- **JWT Scope Tiers**: Three authorization levels — `read` (monitoring only), `readwrite` (control commands), `admin` (system configuration, pairing)
- **JTI Revocation**: `POST /api/auth/revoke` immediately invalidates a token by its JTI claim across all guarded endpoints
- **Single-Use WS Tickets**: `POST /api/auth/ws-ticket` issues 60-second single-use WebSocket tickets; prefer `?ticket=` over `?token=` for WebSocket connections to avoid long-lived tokens in URLs
- **Auth Rate Limiting**: All `/api/auth/*` endpoints limited to 10 req/min per IP (brute-force protection)
- **Trusted-IP Bypass**: `RATE_LIMIT_TRUSTED_IPS` env var allows internal load balancers to bypass rate limits safely

## Runtime Baselines

- **Production runtime**: Node.js 24 LTS (Docker + CI release path)
- **Runtime framework**: Express 5.x + `@types/express` 5.x
- **Package manager**: pnpm 10.33.0 (pinned via `packageManager` field and corepack)

## Environment Variables (Security-Relevant)

| Variable                  | Required in Production | Description                                                           |
| ------------------------- | ---------------------- | --------------------------------------------------------------------- |
| `JWT_SECRET`              | **Yes**                | HS256 signing key, minimum 64 chars, cryptographically random         |
| `API_KEYS`                | **Yes**                | Comma-separated API keys for `/api/auth/token` (generated via `openssl rand -hex 32`) |
| `WS_ORIGINS`              | **Yes**                | Allowed WebSocket origins (replaces `ws://localhost:*` in production) |
| `GRAFANA_PASSWORD`        | Yes (if Grafana used)  | Grafana admin password — no default, docker-compose fails without it  |
| `ADAPTER_MODE`            | No (default: `live`)   | `mock` for demo/testing, `live` for real hardware adapters            |
| `PROMETHEUS_BEARER_TOKEN` | No                     | Bearer token for Prometheus scrape endpoint (`/metrics`) authentication |
| `CORS_ORIGINS`            | No                     | Additional CORS-allowed origins beyond deployment domain              |
| `RATE_LIMIT_TRUSTED_IPS`  | No                     | Comma-separated IPs that bypass rate limiting (internal proxies)      |

## Encryption & Data Handling

- API keys are encrypted at rest using AES-GCM in IndexedDB (Dexie.js)
- No secrets are stored in environment variables or plain text
- TLS 1.3 with mTLS for EEBUS SPINE/SHIP communication
- All external API calls use HTTPS

## OpenSSF Scorecard

This project is tracked by the [OpenSSF Scorecard](https://scorecard.dev/viewer/?uri=github.com/qnbs/Nexus-HEMS-Dash) for supply chain security best practices.

---

## PGP Key Verification

Maintainer commits and release tags are signed with the following GPG key. Verify before applying
patches or installing artifacts from unofficial mirrors.

```
-----BEGIN PGP PUBLIC KEY BLOCK-----
Comment: Nexus-HEMS-Dash Maintainer Signing Key
Comment: Key type: Ed25519 / Curve25519
Comment: Key ID: Placeholder — replace with actual maintainer key fingerprint

[Replace this block with the actual exported GPG public key after running:
 gpg --armor --export <KEY_ID>
 Upload to keys.openpgp.org and add fingerprint to README.md]
-----END PGP PUBLIC KEY BLOCK-----
```

### Tag Signature Verification

```bash
# Verify a signed release tag
git fetch --tags
git tag -v v1.2.0

# Import maintainer key
curl -sSf "https://keys.openpgp.org/vks/v1/by-fingerprint/<FINGERPRINT>" | gpg --import

# Verify Docker image digest (from GHCR)
docker trust inspect --pretty ghcr.io/qnbs/nexus-hems-dash:latest
```

---

## SLA Matrix — Industrial Protocol Vulnerabilities

HEMS systems interact with physical energy infrastructure. The following response-time commitments
apply to security vulnerabilities in the five industrial protocol implementations:

| Severity | CVSS Score | Protocol Examples | Acknowledgement | Assessment | Patch | Disclosure |
|----------|-----------|------------------|-----------------|------------|-------|------------|
| **Critical** | 9.0–10.0 | Remote code execution via Modbus/MQTT, auth bypass in OCPP, TLS downgrade in EEBUS | **4 hours** | **24 hours** | **72 hours** | **Immediate CVE + coordinated** |
| **High** | 7.0–8.9 | Unauth command injection, JWT forgery, WebSocket DoS, KNX unauthorized control | **24 hours** | **72 hours** | **14 days** | **Coordinated after patch** |
| **Medium** | 4.0–6.9 | Information disclosure, rate limit bypass, improper input validation | **48 hours** | **7 days** | **30 days** | **After patch + 30 days** |
| **Low** | 0.1–3.9 | Minor info leak, non-exploitable misconfiguration, cosmetic issue | **7 days** | **21 days** | **90 days** | **Next minor release** |

### Protocol-Specific Concerns

| Protocol | Key Risks | Mitigations in Place |
|----------|-----------|---------------------|
| **Modbus RTU/TCP** | No auth by default; register injection; replay attacks | Read-only mode (Phase 3); network isolation via `adapters` Docker network; device-map validation |
| **MQTT** | Topic spoofing; broker compromise; payload injection | TLS 1.3 / mTLS; Zod validation on every payload; Dead-Letter Queue for malformed messages |
| **KNX/IP** | Unauthenticated bus access; actuator control | KNX Secure (IP Security) recommended; frontend-only access; no write commands without confirmation |
| **OCPP 2.1** | Unauthorized charging start/stop; firmware injection via `UpdateFirmware` | Client certificate auth; command whitelist; scope-based authorization |
| **EEBUS SPINE/SHIP** | mDNS spoofing; TLS certificate pinning bypass | TLS 1.3 mTLS enforced; trusted SKI set; hardware fingerprinting |

### Security Advisory Process

1. Reporter submits via [GitHub Security Advisories](https://github.com/qnbs/Nexus-HEMS-Dash/security/advisories/new)
2. Maintainer acknowledges within SLA (see table above)
3. CVSS score assessed; severity classified
4. Fix developed in a private fork
5. Coordinated disclosure: reporter notified before public release
6. CVE requested if CVSS ≥ 7.0
7. Release notes include `Security:` section with CVE reference and remediation guidance
8. OpenSSF Scorecard re-run after patch
