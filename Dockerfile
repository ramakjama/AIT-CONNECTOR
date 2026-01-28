# ============================================================================
# AIT-CONNECTOR Dockerfile
# Multi-stage build for optimal image size
# ============================================================================

# Stage 1: Build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./
COPY libs/module-connector/package.json ./libs/module-connector/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build
RUN pnpm run build

# Remove dev dependencies
RUN pnpm prune --prod

# Stage 2: Runtime
FROM node:20-alpine

# Set environment
ENV NODE_ENV=production \
    PORT=3000

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/libs ./libs
COPY --from=builder --chown=nodejs:nodejs /app/apps ./apps
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Switch to app user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "apps/web/dist/index.js"]
