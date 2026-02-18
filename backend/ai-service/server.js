const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { authMiddleware, adminMiddleware } = require('@bodhasurvey/shared/auth');

const app = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20, // stricter for AI generation
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests'
        }
    }
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'ai-service',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// Routes
const aiRoutes = require('./routes/ai');
app.use('/ai', authMiddleware, adminMiddleware, aiRoutes);

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
    console.log(`✓ AI Service running on port ${PORT}`);
});

module.exports = app;
