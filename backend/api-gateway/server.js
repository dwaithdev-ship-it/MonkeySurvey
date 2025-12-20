const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
// Don't parse body here - let the proxied services handle it

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    }
  }
});
app.use(limiter);

// Service URLs
const SERVICES = {
  USER: process.env.USER_SERVICE_URL || 'http://user-service:3001',
  SURVEY: process.env.SURVEY_SERVICE_URL || 'http://survey-service:3002',
  RESPONSE: process.env.RESPONSE_SERVICE_URL || 'http://response-service:3003',
  ANALYTICS: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3004',
  NOTIFICATION: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3005'
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'api-gateway',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// API info
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'MonkeySurvey API Gateway',
    version: '1.0.0',
    endpoints: {
      users: '/users/*',
      surveys: '/surveys/*',
      responses: '/responses/*',
      analytics: '/analytics/*',
      notifications: '/notifications/*'
    }
  });
});

// Proxy configuration
const proxyOptions = {
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'The requested service is currently unavailable'
      }
    });
  }
};

// Route proxies
app.use('/users', createProxyMiddleware({
  target: SERVICES.USER,
  ...proxyOptions
}));

app.use('/surveys', createProxyMiddleware({
  target: SERVICES.SURVEY,
  ...proxyOptions
}));

app.use('/responses', createProxyMiddleware({
  target: SERVICES.RESPONSE,
  ...proxyOptions
}));

app.use('/analytics', createProxyMiddleware({
  target: SERVICES.ANALYTICS,
  ...proxyOptions
}));

app.use('/notifications', createProxyMiddleware({
  target: SERVICES.NOTIFICATION,
  ...proxyOptions
}));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An internal error occurred'
    }
  });
});

app.listen(PORT, () => {
  console.log(`✓ API Gateway running on port ${PORT}`);
  console.log('✓ Routing to services:');
  console.log(`  - User Service: ${SERVICES.USER}`);
  console.log(`  - Survey Service: ${SERVICES.SURVEY}`);
  console.log(`  - Response Service: ${SERVICES.RESPONSE}`);
  console.log(`  - Analytics Service: ${SERVICES.ANALYTICS}`);
  console.log(`  - Notification Service: ${SERVICES.NOTIFICATION}`);
});

module.exports = app;
