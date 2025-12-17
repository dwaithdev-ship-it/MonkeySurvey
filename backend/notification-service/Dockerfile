FROM node:18-alpine

WORKDIR /app/notification-service

# Copy package files
COPY notification-service/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy shared directory to parent level
COPY shared ../shared

# Copy source code
COPY notification-service/. .

# Expose port
EXPOSE 3005

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3005/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the service
CMD ["node", "server.js"]
