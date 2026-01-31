FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY api-gateway/package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy source code
COPY api-gateway/. .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the service
CMD ["node", "server.js"]
