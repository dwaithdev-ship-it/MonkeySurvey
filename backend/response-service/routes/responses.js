const express = require('express');
const router = express.Router();
const Response = require('../models/Response');
const { authMiddleware } = require('../../shared/auth');
const { responseSchema, validate } = require('../../shared/validation');

// Optional auth middleware - allows anonymous submissions
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authMiddleware(req, res, next);
  }
  next();
};

router.post('/', optionalAuth, validate(responseSchema), async (req, res) => {
  try {
    const responseData = {
      ...req.body,
      completedAt: new Date(),
      metadata: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      }
    };

    if (req.user) {
      responseData.userId = req.user.id;
    }

    const response = new Response(responseData);
    await response.save();

    res.status(201).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Submit response error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to submit response'
      }
    });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { surveyId, page = 1, limit = 50 } = req.query;

    const query = {};
    if (surveyId) query.surveyId = surveyId;

    const skip = (page - 1) * limit;
    const responses = await Response.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Response.countDocuments(query);

    res.json({
      success: true,
      data: {
        responses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('List responses error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list responses'
      }
    });
  }
});

module.exports = router;
