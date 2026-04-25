# ── Stage 1: Build ───────────────────────────────────────────────
FROM node:24-alpine@sha256:01743339035a5c3c11a373cd7c83aeab6ed1457b55da6a69e014a95ac4e4700b AS build

WORKDIR /app

# Install deps first (layer cache)
# Copy all workspace manifests so pnpm resolves sub-packages correctly
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN corepack enable && pnpm install --frozen-lockfile --ignore-scripts

# Copy source & build
COPY . .
RUN pnpm --filter @nexus-hems/web build

# ── Stage 2: Serve with nginx (unprivileged) ──────────────────
# nginxinc/nginx-unprivileged runs as non-root user (uid 101 / nginx) by
# default — reduced attack surface vs the official nginx image.
# NOTE: Pin to an immutable SHA256 digest in production via build-arg or
# image policy (e.g. Kyverno imagePolicyWebhook).
FROM nginxinc/nginx-unprivileged:1.29-alpine-slim AS production

ARG VCS_REF=unknown
ARG BUILD_DATE=unknown
ARG VERSION=dev

LABEL org.opencontainers.image.title="Nexus-HEMS Dashboard Frontend" \
  org.opencontainers.image.description="Production frontend image for Nexus-HEMS-Dash" \
  org.opencontainers.image.source="https://github.com/qnbs/Nexus-HEMS-Dash" \
  org.opencontainers.image.revision="$VCS_REF" \
  org.opencontainers.image.created="$BUILD_DATE" \
  org.opencontainers.image.version="$VERSION"

# Security: upgrade all OS packages to fix CVEs (libxml2, openssl, libpng, etc.)
# The '|| true' prevents transient Alpine mirror timeouts (exit 99) from breaking CI.
RUN apk update && (apk upgrade --no-cache || true) && rm -rf /var/cache/apk/*

# Security: nginx-unprivileged already creates a non-root 'nginx' user (uid 101).
# No need to create a separate app user.

# Copy custom nginx config template
COPY apps/web/nginx.conf /etc/nginx/templates/nexus-hems.conf.template

# Copy built assets from build stage
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

# Fix ownership for nginx user (uid 101)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/templates

# MED-03: nginx official image processes /etc/nginx/templates/*.template via envsubst
# at startup — WS_ORIGINS env var is injected into the CSP connect-src header.
# Default: WS_ORIGINS="wss://localhost:8081" (safe fallback for dev/compose; override in prod)
ENV WS_ORIGINS="wss://localhost:8081"

# Security headers are in nginx.conf
# Health check for orchestration
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/ || exit 1

EXPOSE 8080

# Security: nginx-unprivileged defaults to nginx user (uid 101)
USER nginx

CMD ["nginx", "-g", "daemon off;"]
