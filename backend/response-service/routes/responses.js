const express = require('express');
const router = express.Router();
const Response = require('../models/Response');
const { authMiddleware } = require('../../shared/auth');

// Optional auth middleware - allows anonymous submissions
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authMiddleware(req, res, next);
  }
  next();
};

router.post('/', optionalAuth, async (req, res) => {
  try {
    console.log('Submitting response:', req.body);

    const {
      surveyId,
      userName,
      parliament,
      municipality,
      ward_num,
      Question_1_answer,
      location,
      answers
    } = req.body;

    let googleMapsLink = '';
    if (location && location.latitude && location.longitude) {
      googleMapsLink = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    }

    const responseData = {
      surveyId,
      userName: userName || (req.user ? req.user.name : 'Anonymous'),
      parliament,
      municipality,
      ward_num,
      Question_1: Question_1_answer,
      googleMapsLink,
      location,
      answers,
      submittedAt: new Date(),
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

    console.log('Response saved successfully:', response._id);

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
        message: error.message || 'Failed to submit response'
      }
    });
  }
});

// List responses (optional auth to allow public count fetching)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { surveyId, page = 1, limit = 50, userName } = req.query;

    const query = {};
    if (surveyId) query.surveyId = surveyId;
    if (userName) query.userName = userName;

    console.log('Querying responses with:', query);

    const skip = (page - 1) * limit;
    const responses = await Response.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Response.countDocuments(query);
    const globalTotal = await Response.countDocuments({}); // Total across all surveys
    console.log('Found total responses for query:', total, 'Global total:', globalTotal);

    res.json({
      success: true,
      data: {
        responses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          globalTotal,
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
