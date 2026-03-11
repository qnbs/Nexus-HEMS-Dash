# ── Stage 1: Build ───────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# Install deps first (layer cache)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source & build
COPY . .
RUN npm run build

# ── Stage 2: Serve with nginx ───────────────────────────────────
FROM nginx:1.27-alpine AS production

# Security: run as non-root
RUN addgroup -S app && adduser -S app -G app

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/nexus-hems.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Security headers are in nginx.conf
# Health check for orchestration
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/ || exit 1

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
