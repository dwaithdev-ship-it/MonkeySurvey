const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

// HTTP Watch - Detailed Logging
app.use((req, res, next) => {
  console.log(`[HTTP WATCH] ${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.headers['authorization']) {
    console.log('Auth: [PRESENT]');
  }
  if (req.headers['deviceid']) {
    console.log('DeviceID:', req.headers['deviceid']);
  }
  next();
});

// Relax helmet for mobile webviews
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
}));

// Explicit CORS for mobile apps
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'deviceId']
}));

// Service URLs
const SERVICES = {
  USER: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  SURVEY: process.env.SURVEY_SERVICE_URL || 'http://localhost:3002',
  RESPONSE: process.env.RESPONSE_SERVICE_URL || 'http://localhost:3003',
  ANALYTICS: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3004',
  NOTIFICATION: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005',
  AI: process.env.AI_SERVICE_URL || 'http://localhost:3006'
};

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
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[PROXY] Forwarding ${req.method} ${req.url}`);
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

app.use('/ai', createProxyMiddleware({
  target: SERVICES.AI || 'http://localhost:3004',
  ...proxyOptions
}));

app.use('/parl-cons', createProxyMiddleware({
  target: SERVICES.SURVEY,
  ...proxyOptions
}));

app.use('/api/survey-theme', createProxyMiddleware({
  target: SERVICES.SURVEY,
  ...proxyOptions
}));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'api-gateway',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

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
  console.log(`✓ API Gateway with HTTP WATCH running on port ${PORT}`);
});

module.exports = app;
