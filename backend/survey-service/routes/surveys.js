const express = require('express');
const router = express.Router();
const Survey = require('../models/Survey');
const { authMiddleware } = require('../../shared/auth');

// Create survey
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, category, settings, questions } = req.body;
    
    const survey = new Survey({
      title,
      description,
      category,
      settings,
      questions,
      creatorId: req.user.userId,
      status: 'draft'
    });
    
    await survey.save();
    
    res.status(201).json({
      success: true,
      data: {
        surveyId: survey._id,
        title: survey.title,
        status: survey.status,
        shareUrl: `https://survey.monkeysurvey.com/s/${survey._id}`
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

// Get all surveys
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const query = { creatorId: req.user.userId };
    if (status) query.status = status;
    
    const surveys = await Survey.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Survey.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        surveys: surveys.map(s => ({
          id: s._id,
          title: s.title,
          status: s.status,
          responseCount: s.responseCount || 0,
          completionRate: s.completionRate || 0,
          createdAt: s.createdAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
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

// Get survey by ID
router.get('/:surveyId', authMiddleware, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.surveyId);
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Survey not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: survey
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

// Update survey
router.put('/:surveyId', authMiddleware, async (req, res) => {
  try {
    const survey = await Survey.findOneAndUpdate(
      { _id: req.params.surveyId, creatorId: req.user.userId },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Survey not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: survey
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

// Delete survey
router.delete('/:surveyId', authMiddleware, async (req, res) => {
  try {
    const survey = await Survey.findOneAndDelete({
      _id: req.params.surveyId,
      creatorId: req.user.userId
    });
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Survey not found'
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Survey deleted successfully'
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

// Publish survey
router.post('/:surveyId/publish', authMiddleware, async (req, res) => {
  try {
    const survey = await Survey.findOneAndUpdate(
      { _id: req.params.surveyId, creatorId: req.user.userId },
      { status: 'active' },
      { new: true }
    );
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Survey not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        id: survey._id,
        status: survey.status,
        shareUrl: `https://survey.monkeysurvey.com/s/${survey._id}`
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

// Get survey templates
router.get('/templates', authMiddleware, async (req, res) => {
  try {
    const { category } = req.query;
    
    // Mock templates for now
    const templates = [
      {
        id: '507f1f77bcf86cd799439014',
        name: 'Customer Feedback Template',
        description: 'Collect customer feedback',
        category: 'customer_feedback',
        thumbnail: 'https://cdn.monkeysurvey.com/templates/customer.png',
        questionCount: 8
      }
    ];
    
    const filtered = category 
      ? templates.filter(t => t.category === category)
      : templates;
    
    res.json({
      success: true,
      data: {
        templates: filtered
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
