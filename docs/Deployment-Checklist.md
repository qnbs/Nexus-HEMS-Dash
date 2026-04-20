# Deployment Checklist — Nexus-HEMS-Dash

> Vollständige Checkliste für Produktions-Deployments mit TLS, Reverse-Proxy und Failover.

---

## Table of Contents

1. [Pre-Deployment](#pre-deployment)
2. [TLS / HTTPS](#tls--https)
3. [Reverse-Proxy (nginx)](#reverse-proxy-nginx)
4. [Docker Production](#docker-production)
5. [GitHub Pages](#github-pages)
6. [Tauri Desktop](#tauri-desktop)
7. [Failover & High Availability](#failover--high-availability)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Rollback Plan](#rollback-plan)

---

## Pre-Deployment

### Build & Quality Gates

- [ ] `node -v` zeigt Node.js 24.x für Produktions-Builds
- [ ] `pnpm install --frozen-lockfile` — saubere Installation
- [ ] `npx tsc --noEmit` — keine TypeScript-Fehler
- [ ] `pnpm lint` — keine ESLint-Warnings (`--max-warnings 0`)
- [ ] `pnpm format:check` — Prettier-konform
- [ ] `pnpm test:run` — alle Unit-Tests grün
- [ ] `pnpm test:e2e` — alle E2E-Tests grün (Playwright)
- [ ] `pnpm test:a11y` — Accessibility-Tests bestanden (WCAG 2.2 AA)
- [ ] `pnpm build` — Build erfolgreich
- [ ] `pnpm size` — Bundle-Size innerhalb der Limits

### Security Checks

- [ ] `pnpm audit --audit-level=high` — keine High/Critical-Schwachstellen
- [ ] `pnpm security:trojan` — keine Trojan-Source-Zeichen
- [ ] `pnpm security:secrets` — keine Secrets im Code (Gitleaks)
- [ ] `pnpm security:secrets` — Gitleaks Scan bestanden
- [ ] Alle API-Schlüssel nur über verschlüsseltes IndexedDB (`ai-keys.ts`)
- [ ] Keine Secrets in `.env`, `docker-compose.yml` oder CI-Logs

### i18n

- [ ] Alle neuen UI-Strings in `src/locales/de.ts` **und** `src/locales/en.ts`
- [ ] `t()` für jeden sichtbaren Text — keine hardcodierten Strings

---

## TLS / HTTPS

### Zertifikat-Ersteinrichtung (Let's Encrypt)

```bash
# Certbot installieren
sudo apt install certbot python3-certbot-nginx

# Zertifikat erstellen
sudo certbot --nginx -d hems.example.com \
  --redirect --agree-tos --email admin@example.com

# Auto-Renewal verifizieren
sudo certbot renew --dry-run
```

### TLS-Konfiguration (nginx)

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:
            ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:10m;
ssl_session_tickets off;

# HSTS — 2 Jahre
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 1.1.1.1 8.8.8.8 valid=300s;
```

### Zertifikat-Checkliste

- [ ] TLS 1.2+ erzwungen (kein TLS 1.0/1.1)
- [ ] HSTS-Header gesetzt (min. 1 Jahr)
- [ ] OCSP Stapling aktiviert
- [ ] HTTP → HTTPS Redirect konfiguriert
- [ ] Zertifikat-Renewal-Cronjob aktiv
- [ ] SSL Labs Test: **A+** Rating → https://ssllabs.com/ssltest/

---

## Reverse-Proxy (nginx)

### Produktions-Konfiguration

```nginx
upstream hems_backend {
    server 127.0.0.1:3001;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name hems.example.com;

    ssl_certificate     /etc/letsencrypt/live/hems.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hems.example.com/privkey.pem;

    root /var/www/nexus-hems/dist;
    index index.html;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "0" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' wss: https://api.tibber.com https://api.awattar.de https://api.open-meteo.com; img-src 'self' data: blob:; font-src 'self'; object-src 'none'; frame-ancestors 'none';" always;

    # SPA Fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api/ {
        proxy_pass http://hems_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # WebSocket Proxy (MQTT-over-WS, KNX, OCPP)
    location /ws/ {
        proxy_pass http://hems_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400s;
    }

    # Static Assets — Long Cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker — No Cache
    location = /sw.js {
        expires off;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Gzip
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;
}

# HTTP → HTTPS Redirect
server {
    listen 80;
    server_name hems.example.com;
    return 301 https://$host$request_uri;
}
```

### Reverse-Proxy-Checkliste

- [ ] WebSocket-Upgrade für `/ws/` konfiguriert
- [ ] Proxy-Timeout ≥ 24 h für langlebige WS-Verbindungen
- [ ] Security-Header gesetzt (CSP, HSTS, X-Frame-Options, COEP `credentialless`)
- [ ] SPA-Fallback `try_files $uri /index.html`
- [ ] Service Worker `sw.js` ohne Cache
- [ ] Statische Assets mit `Cache-Control: immutable`
- [ ] Gzip/Brotli aktiviert
- [ ] `limit_conn conn_limit 50` gesetzt (nginx Connection-Limit pro IP)

---

## Docker Production

### docker-compose.yml (Produktion)

```yaml
services:
  nexus-hems:
    image: ghcr.io/qnbs/nexus-hems-dash:4.4.0
    # Optional immutable pin:
    # image: ghcr.io/qnbs/nexus-hems-dash@sha256:<digest>
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - '3001:80'
    read_only: true
    tmpfs:
      - /tmp
      - /var/cache/nginx
      - /var/run
    security_opt:
      - no-new-privileges:true
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost/']
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 256M
```

### Docker-Checkliste

- [ ] Multi-Stage-Build (Node → nginx)
- [ ] `read_only: true` — Read-Only-Dateisystem
- [ ] `no-new-privileges: true`
- [ ] Non-Root User (`nginx`)
- [ ] Healthcheck konfiguriert
- [ ] Resource-Limits gesetzt (CPU, RAM)
- [ ] Keine Secrets im Image oder `docker-compose.yml`
- [ ] OCI-Image-Metadaten gesetzt (`org.opencontainers.image.*`)
- [ ] Produktiv-Deploy bevorzugt via immutable Digest statt mutablem Tag
- [ ] `docker scan` / Container Image-Scan bestanden (Alternative zu Trivy — z.B. Grype, Snyk)
- [ ] `restart: unless-stopped` für Auto-Recovery
- [ ] `JWT_SECRET` als Docker Secret (min. 64 Zeichen, kryptographisch zufällig)
- [ ] `API_KEYS` gesetzt (min. 1 Key, generiert via `openssl rand -hex 32`)
- [ ] `WS_ORIGINS` gesetzt (nur eigene WebSocket-Origins, kein `ws://localhost:*`)
- [ ] `RATE_LIMIT_TRUSTED_IPS` für interne Load-Balancer/Proxies konfiguriert (optional)

---

## GitHub Pages

### Deployment

```bash
# Manuell via .github/workflows/deploy.yml
# GitHub Actions → Deploy → Run workflow
# Input: approveDeploy=DEPLOY
```

### GitHub-Pages-Checkliste

- [ ] `base: '/Nexus-HEMS-Dash/'` in `vite.config.ts`
- [ ] `public/404.html` mit SPA-Redirect vorhanden
- [ ] `public/manifest.json` korrekte `start_url` + `scope`
- [ ] `public/robots.txt` aktuell
- [ ] Deploy nur nach expliziter manueller Freigabe (`approveDeploy=DEPLOY`)
- [ ] CNAME-Datei bei Custom Domain
- [ ] HTTPS erzwungen in GitHub Pages Settings

---

## Tauri Desktop

### Build-Checkliste

- [ ] `tauri.conf.json` — CSP korrekt (Trusted Types)
- [ ] Code-Signing-Zertifikat konfiguriert (`TAURI_SIGNING_PRIVATE_KEY`)
- [ ] Auto-Updater-Endpoint konfiguriert
- [ ] Alle 3 Plattformen getestet (Linux, macOS, Windows)
- [ ] `.github/workflows/tauri-build.yml` erfolgreich

---

## Failover & High Availability

### Adapter-Failover

```
Adapter-Verbindung fehlgeschlagen
    ↓
Exponential Backoff (1s → 2s → 4s → ... → 30s max)
    ↓ ±25% Jitter
Max 10 Retries
    ↓
Circuit Breaker OPEN (30s Cooldown)
    ↓
Half-Open Probe
    ↓ Erfolg → CLOSED
    ↓ Fehler → OPEN (erneut)
```

### Offline-Fallback (PWA)

1. **Service Worker** (Workbox) cached alle statischen Assets
2. **IndexedDB** (Dexie.js) cached letzte Energiedaten + Einstellungen
3. **Background Sync** synchronisiert ausstehende Befehle bei Reconnect
4. **OfflineBanner** zeigt Offline-Status an

### DNS-Failover (optional)

```
hems.example.com → Primary (192.168.1.100)
                  → Fallback (192.168.1.101)

# CloudFlare Load Balancer oder DNS Round-Robin
```

### Multi-Adapter-Redundanz

- Victron MQTT + Modbus SunSpec parallel konfigurierbar
- Bei Ausfall eines Adapters: automatischer Fallback auf verbleibende
- `useEnergyStore` mergt alle aktiven Adapter-Daten per `deepMergeModel()`

### Failover-Checkliste

- [ ] Circuit Breaker pro Adapter konfiguriert
- [ ] Exponential Backoff mit Jitter
- [ ] Offline-Cache (Dexie.js) funktional
- [ ] Background Sync getestet
- [ ] Service Worker Pre-Cache aktuell
- [ ] DNS-Failover bei Multi-Server-Setup
- [ ] Monitoring/Alerting für Adapter-Status

---

## Post-Deployment Verification

### Smoke Tests

- [ ] Dashboard lädt korrekt (`/`)
- [ ] Alle Navigationsrouten erreichbar
- [ ] Sankey-Diagramm rendert (D3.js)
- [ ] KNX-Floorplan rendert
- [ ] PWA installierbar
- [ ] Service Worker registriert
- [ ] Offline-Modus funktioniert (Flugmodus-Test)
- [ ] Sprachumschaltung DE ↔ EN funktioniert

### Performance

- [ ] Lighthouse: Performance ≥ 85%, A11y ≥ 90%, Best Practices ≥ 90%
- [ ] First Contentful Paint < 2 s
- [ ] Total Blocking Time < 300 ms
- [ ] CLS < 0.1

### Monitoring

- [ ] Prometheus-Metriken erreichbar (`/metrics`)
- [ ] Adapter-Healthchecks grün
- [ ] Error-Tracking aktiv (Sentry / Custom)

---

## Rollback Plan

### GitHub Pages

```bash
# Letztes funktionierendes Deployment wiederherstellen
git revert HEAD
git push origin main
# → deploy.yml baut und deployt automatisch
```

### Docker

```bash
# Zum vorherigen Image wechseln
docker compose down
docker tag nexus-hems-dash:latest nexus-hems-dash:rollback
docker pull nexus-hems-dash:previous
docker compose up -d

# Oder: docker rollback
docker service update --rollback nexus-hems
```

### Helm / Kubernetes

```bash
# Letzte erfolgreiche Revision ermitteln
helm history nexus-hems -n nexus

# Rollback auf Revision 12
helm rollback nexus-hems 12 -n nexus

# Alternativ Deployment-Ebene
kubectl rollout undo deploy/nexus-hems-server -n nexus
kubectl rollout undo deploy/nexus-hems-frontend -n nexus
```

### Rollback-Checkliste

- [ ] Vorheriges Docker-Image verfügbar (tagged)
- [ ] Vorherige Helm-Revision vorhanden und getestet
- [ ] Git-Revert getestet
- [ ] Datenbank-Migration rückwärtskompatibel (falls zutreffend)
- [ ] DNS-TTL niedrig genug für schnellen Switch (≤ 300 s)
