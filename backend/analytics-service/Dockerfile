FROM node:18-alpine

WORKDIR /app
ENV NODE_ENV=production

# 1. Install shared dependencies
COPY shared/package*.json ./shared/
RUN cd shared && npm ci

# 2. Install service dependencies
COPY analytics-service/package*.json ./analytics-service/
RUN cd analytics-service && npm ci

# 3. Copy source code
COPY shared ./shared
COPY analytics-service ./analytics-service

WORKDIR /app/analytics-service
ENV NODE_ENV=production

# Expose port
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3004/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the service
CMD ["node", "server.js"]
