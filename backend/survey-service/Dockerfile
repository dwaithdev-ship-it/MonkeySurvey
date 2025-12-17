FROM node:18-alpine

WORKDIR /app/survey-service

# Copy package files
COPY survey-service/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy shared directory to parent level
COPY shared ../shared

# Copy source code
COPY survey-service/. .

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the service
CMD ["node", "server.js"]
