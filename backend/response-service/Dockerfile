FROM node:18-alpine

WORKDIR /app
ENV NODE_ENV=production

# 1. Install shared dependencies
COPY shared/package*.json ./shared/
RUN cd shared && npm install --production --no-audit --no-fund

# 2. Install service dependencies
COPY response-service/package*.json ./response-service/
RUN cd response-service && npm install --production --no-audit --no-fund

# 3. Copy source code
COPY shared ./shared
COPY response-service ./response-service

WORKDIR /app/response-service
ENV NODE_ENV=production

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the service
CMD ["node", "server.js"]
