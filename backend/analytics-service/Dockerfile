FROM node:18-alpine

WORKDIR /app/analytics-service

# Copy package files
COPY analytics-service/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy shared directory to parent level
COPY shared ../shared

# Copy source code
COPY analytics-service/. .

# Expose port
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3004/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the service
CMD ["node", "server.js"]
