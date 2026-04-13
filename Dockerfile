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
FROM nginx:1.27-alpine@sha256:65645c7bb6a0661892a8b03b89d0743208a18dd2f3f17a54ef4b76fb8e2f2a10 AS production

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

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/nexus-hems.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Fix ownership for non-root user
RUN chown -R app:app /usr/share/nginx/html && \
    chown -R app:app /var/cache/nginx && \
    chown -R app:app /var/log/nginx && \
    touch /var/run/nginx.pid && chown app:app /var/run/nginx.pid

# Security headers are in nginx.conf
# Health check for orchestration
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/ || exit 1

EXPOSE 8080

# Security: run as non-root user
USER app

CMD ["nginx", "-g", "daemon off;"]
