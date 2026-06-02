# ── Stage 1: Build ──────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# ── Stage 2: Production ─────────────────────────
FROM node:18-alpine AS production
WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy source
COPY . .

# Create uploads directory
RUN mkdir -p uploads/temp && chmod 755 uploads

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodeapp -u 1001
RUN chown -R nodeapp:nodejs /app
USER nodeapp

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
