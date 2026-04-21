# ── Stage 1: Build ───────────────────────────────────────────────
FROM node:24-alpine@sha256:01743339035a5c3c11a373cd7c83aeab6ed1457b55da6a69e014a95ac4e4700b AS build

WORKDIR /app

# Install deps first (layer cache)
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --ignore-scripts

# Copy source & build
COPY . .
RUN pnpm build

# ── Stage 2: Serve with nginx ───────────────────────────────────
FROM nginx:1.29-alpine@sha256:582c496ccf79d8aa6f8203a79d32aaf7ffd8b13362c60a701a2f9ac64886c93d AS production

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
RUN apk update && apk upgrade --no-cache && rm -rf /var/cache/apk/*

# Security: run as non-root
RUN addgroup -S app && adduser -S app -G app

# Copy custom nginx config template
COPY nginx.conf /etc/nginx/templates/nexus-hems.conf.template

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Fix ownership for non-root user
RUN chown -R app:app /usr/share/nginx/html && \
    chown -R app:app /var/cache/nginx && \
    chown -R app:app /var/log/nginx && \
    chown -R app:app /etc/nginx/templates && \
    touch /var/run/nginx.pid && chown app:app /var/run/nginx.pid

# MED-03: nginx official image processes /etc/nginx/templates/*.template via envsubst
# at startup — WS_ORIGINS env var is injected into the CSP connect-src header.
# Default: WS_ORIGINS="wss://localhost:8081" (safe fallback for dev/compose; override in prod)
ENV WS_ORIGINS="wss://localhost:8081"

# Security headers are in nginx.conf
# Health check for orchestration
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/ || exit 1

EXPOSE 8080

# Security: run as non-root user
USER app

CMD ["nginx", "-g", "daemon off;"]
