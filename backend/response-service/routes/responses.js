const express = require('express');
const router = express.Router();
const Response = require('../models/Response');
const { authMiddleware } = require('../../shared/auth');

// Submit response
router.post('/', async (req, res) => {
  try {
    const { surveyId, answers } = req.body;
    
    const response = new Response({
      surveyId,
      answers,
      respondentId: req.user?.userId,
      status: 'complete',
      completedAt: new Date(),
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });
    
    if (response.startedAt) {
      response.timeToComplete = Math.floor(
        (response.completedAt - response.startedAt) / 1000
      );
    }
    
    await response.save();
    
    res.status(201).json({
      success: true,
      data: {
        responseId: response._id,
        surveyId: response.surveyId,
        status: response.status,
        submittedAt: response.completedAt
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message
      }
    });
  }
});

// Save partial response
router.post('/partial', authMiddleware, async (req, res) => {
  try {
    const { surveyId, answers, responseId } = req.body;
    
    let response;
    
    if (responseId) {
      response = await Response.findByIdAndUpdate(
        responseId,
        { answers, status: 'incomplete' },
        { new: true }
      );
    } else {
      response = new Response({
        surveyId,
        answers,
        respondentId: req.user.userId,
        status: 'incomplete',
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        }
      });
      await response.save();
    }
    
    res.json({
      success: true,
      data: {
        responseId: response._id,
        status: response.status
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message
      }
    });
  }
});

// Get survey responses
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { surveyId, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    
    if (!surveyId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'surveyId is required'
        }
      });
    }
    
    const responses = await Response.find({ surveyId })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ completedAt: -1 });
    
    const total = await Response.countDocuments({ surveyId });
    
    res.json({
      success: true,
      data: {
        responses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

module.exports = router;
