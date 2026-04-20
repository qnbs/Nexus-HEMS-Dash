# Deployment Guide

Nexus HEMS Dashboard supports three deployment targets: **GitHub Pages** (static SPA), **Docker Compose** (full stack), and **Kubernetes via Helm**.

---

## 1 GitHub Pages (Static SPA)

### Prerequisites

- Repository secret `GITHUB_TOKEN` with `pages: write` and `id-token: write`
- GitHub Pages enabled in repo Settings → Pages → Source: **GitHub Actions**

### Deploy

Trigger the `deploy.yml` workflow manually:

```bash
gh workflow run deploy.yml -f approveDeploy=DEPLOY
```

The workflow builds with `pnpm build` (`NODE_ENV=production`) and deploys the `dist/` folder. Assets are served at `https://<user>.github.io/Nexus-HEMS-Dash/`.

The Vite config sets `base: '/Nexus-HEMS-Dash/'` for correct sub-path routing.

---

## 2 Docker Compose (Full Stack)

### Architecture

| Service          | Image                              | Port | Purpose                                      |
| ---------------- | ---------------------------------- | ---- | -------------------------------------------- |
| `nexus-hems`     | Dockerfile (nginx:1.29-alpine)     | 8080 | SPA + static assets                          |
| `nexus-server`   | Dockerfile.server (node:24-alpine) | 3000 | Express + WebSocket + Prometheus /metrics    |
| `adapter-bridge` | Dockerfile.server                  | —    | Protocol bridge (MQTT/Modbus/KNX/OCPP/EEBUS) |
| `prometheus`     | prom/prometheus:v2.53.0            | 9090 | Metrics collection (profile: monitoring)     |
| `grafana`        | grafana/grafana:11.1.0             | 3001 | Dashboards (profile: monitoring)             |

### Quick Start

```bash
# Create JWT secret
mkdir -p .secrets
openssl rand -base64 32 > .secrets/jwt_secret

# Start core services
docker compose up -d nexus-hems nexus-server

# Start with monitoring stack
docker compose --profile monitoring up -d
```

### Environment Variables

| Variable                 | Default         | Description                                                                  |
| ------------------------ | --------------- | ---------------------------------------------------------------------------- |
| `PORT`                   | `3000`          | Server listen port                                                           |
| `NODE_ENV`               | `production`    | Environment mode                                                             |
| `JWT_SECRET`             | —               | HMAC-SHA256 secret (min 32 chars, 64+ recommended); auto-generated in dev    |
| `API_KEYS`               | —               | Comma-separated API keys for `/api/auth/token`; required in production       |
| `CORS_ORIGINS`           | —               | Comma-separated allowed CORS origins                                         |
| `WS_ORIGINS`             | —               | Comma-separated allowed WebSocket origins for CSP `connect-src` (production) |
| `RATE_LIMIT_TRUSTED_IPS` | —               | Comma-separated IPs that bypass rate limiting (load balancers, proxies)      |
| `TZ`                     | `Europe/Berlin` | Timezone                                                                     |
| `GRAFANA_PASSWORD`       | —               | Grafana admin password                                                       |
| `ADAPTER_MODE`           | `live`          | `mock` for demo data; `live` for real protocol adapters                      |

### Security

- All containers run as **non-root** with `read_only` filesystem
- `no-new-privileges` security opt enabled
- JWT secret loaded via Docker secrets (`/run/secrets/jwt_secret`)
- tmpfs mounts for nginx cache/run directories
- Auth endpoints rate-limited to 10 req/min per IP (brute-force protection)
- Trusted IPs can bypass rate limiting via `RATE_LIMIT_TRUSTED_IPS` env var

### Networks

- **frontend** — Public-facing (nginx)
- **backend** — Internal (server ↔ monitoring)
- **adapters** — Device protocol bridge

---

## 3 Kubernetes (Helm)

### Prerequisites

- Kubernetes 1.28+
- Helm 3.12+
- cert-manager (for TLS)
- nginx ingress controller

### Install

```bash
helm install nexus-hems ./helm/nexus-hems \
  --set ingress.hosts[0].host=hems.example.com \
  --set frontend.image.tag=latest \
  --set server.image.tag=latest
```

### Key Values (`values.yaml`)

| Value                               | Default        | Description               |
| ----------------------------------- | -------------- | ------------------------- |
| `frontend.replicaCount`             | 2              | Frontend replicas         |
| `server.replicaCount`               | 2              | Server replicas           |
| `ingress.enabled`                   | true           | Enable Ingress            |
| `ingress.className`                 | nginx          | Ingress class             |
| `ingress.tls.secretName`            | nexus-hems-tls | TLS certificate secret    |
| `hpa.enabled`                       | true           | Horizontal Pod Autoscaler |
| `hpa.maxReplicas`                   | 8              | Max scale-out             |
| `monitoring.serviceMonitor.enabled` | true           | Prometheus ServiceMonitor |
| `networkPolicy.enabled`             | true           | Restrict pod traffic      |

### Security Defaults

- `runAsNonRoot: true` (UID 65534)
- `readOnlyRootFilesystem: true`
- `allowPrivilegeEscalation: false`
- All capabilities dropped
- Seccomp profile: `RuntimeDefault`
- PodDisruptionBudget: `minAvailable: 1`

### Ingress Annotations

WebSocket support and rate limiting are configured automatically:

```yaml
nginx.ingress.kubernetes.io/proxy-read-timeout: '3600'
nginx.ingress.kubernetes.io/proxy-send-timeout: '3600'
nginx.ingress.kubernetes.io/limit-rps: '100'
```

---

## 4 Tauri (Desktop)

Desktop builds are produced by the `release.yml` workflow via `tauri-apps/tauri-action`. Binaries for Linux (AppImage/deb), macOS (dmg), and Windows (msi/nsis) are attached to GitHub Releases.

Configuration: `src-tauri/tauri.conf.json`

| Property             | Value |
| -------------------- | ----- |
| Tauri version        | 2.2   |
| Rust edition         | 2024  |
| Minimum rust-version | 1.85  |
| Crate version        | 4.5.0 |

### Build Locally

```bash
pnpm tauri build
```

Requires Rust toolchain ≥ 1.85 and platform-specific dependencies (see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)).

---

## 5 nginx Configuration

The production nginx (`nginx.conf`) enforces:

- **Connection limits**: `limit_conn conn_limit 50` per IP (DoS hardening)
- **Rate limiting**: 100 req/min global, 30 req/min for `/api/`
- **Security headers**: HSTS (1 year, preload), CSP, X-Frame-Options: DENY, COOP/CORP, COEP `credentialless`
- **Caching**: `/assets/` → 1 year immutable, `/sw.js` → no-cache
- **Compression**: gzip level 6
- **SPA fallback**: `try_files $uri $uri/ /index.html`
- **Blocked paths**: dotfiles, `.env`, `.git`, lockfiles

> Replace `wss://localhost:*` in CSP `connect-src` with your actual WebSocket origins via the `WS_ORIGINS` env var or nginx `envsubst`.

---

## CI/CD Pipeline

The `ci.yml` workflow runs on every push/PR to `main`:

```
lint-typecheck ─┬── unit-tests ───┐
                ├── build ────────┤── ci-passed
                └── security      │
                                  ├── e2e-tests
                                  └── docker-build
```

Security scanning (`security-full.yml`) runs CodeQL, Trivy, Semgrep, gitleaks, Scorecard, and npm audit.
