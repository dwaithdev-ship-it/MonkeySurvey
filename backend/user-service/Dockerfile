FROM node:18-alpine

WORKDIR /app

# 1. Install shared dependencies
COPY shared/package*.json ./shared/
RUN cd shared && npm ci --only=production

# 2. Install service dependencies
COPY user-service/package*.json ./user-service/
RUN cd user-service && npm ci --only=production

# 3. Copy source code
COPY shared ./shared
COPY user-service ./user-service

WORKDIR /app/user-service

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the service
CMD ["node", "server.js"]
