FROM node:18-alpine

WORKDIR /app

# 1. Install shared dependencies
COPY shared/package*.json ./shared/
RUN cd shared && npm ci --only=production

# 2. Install service dependencies
COPY notification-service/package*.json ./notification-service/
RUN cd notification-service && npm ci --only=production

# 3. Copy source code
COPY shared ./shared
COPY notification-service ./notification-service

WORKDIR /app/notification-service

# Expose port
EXPOSE 3005

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3005/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the service
CMD ["node", "server.js"]
