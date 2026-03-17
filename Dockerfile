# ── Stage 1: Build ───────────────────────────────────────────────
FROM node:25-alpine@sha256:5209bcaca9836eb3448b650396213dbe9d9a34d31840c2ae1f206cb2986a8543 AS build

WORKDIR /app

# Install deps first (layer cache)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source & build
COPY . .
RUN npm run build

# ── Stage 2: Serve with nginx ───────────────────────────────────
FROM nginx:1.27-alpine@sha256:65645c7bb6a0661892a8b03b89d0743208a18dd2f3f17a54ef4b76fb8e2f2a10 AS production

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
