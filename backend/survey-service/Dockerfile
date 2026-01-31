FROM node:18-alpine

WORKDIR /app

# 1. Install shared dependencies
COPY shared/package*.json ./shared/
RUN cd shared && npm ci --omit=dev

# 2. Install service dependencies
COPY survey-service/package*.json ./survey-service/
RUN cd survey-service && npm ci --omit=dev

# 3. Copy source code
COPY shared ./shared
COPY survey-service ./survey-service

WORKDIR /app/survey-service

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the service
CMD ["node", "server.js"]
