# =========================================================================
# Lok Samadhan Backend - Production Dockerfile
# Optimized for DigitalOcean App Platform & DigitalOcean Droplets
# =========================================================================

# Stage 1: Dependency builder
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

# Stage 2: Final lightweight runtime
FROM node:22-alpine

WORKDIR /usr/src/app

# Security: Run as non-root user
USER node

# Copy production node_modules from builder
COPY --chown=node:node --from=builder /usr/src/app/node_modules ./node_modules
COPY --chown=node:node . .

# Expose HTTP port
EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

# Health check matching DigitalOcean App Platform
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "src/server.js"]
