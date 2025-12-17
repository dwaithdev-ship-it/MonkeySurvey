const express = require('express');
const router = express.Router();
const Survey = require('../models/Survey');
const { authMiddleware } = require('../../shared/auth');
const { surveySchema, validate } = require('../../shared/validation');

router.post('/', authMiddleware, validate(surveySchema), async (req, res) => {
  try {
    const surveyData = {
      ...req.body,
      createdBy: req.user.id
    };

    const survey = new Survey(surveyData);
    await survey.save();

    res.status(201).json({
      success: true,
      data: survey
    });
  } catch (error) {
    console.error('Create survey error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create survey'
      }
    });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    if (req.user.role !== 'admin') {
      query.createdBy = req.user.id;
    }

    const skip = (page - 1) * limit;
    const surveys = await Survey.find(query)
      .select('-questions')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Survey.countDocuments(query);

    res.json({
      success: true,
      data: {
        surveys,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('List surveys error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list surveys'
      }
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id).populate('createdBy', 'firstName lastName email');

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
    console.error('Get survey error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get survey'
      }
    });
  }
});

router.put('/:id', authMiddleware, validate(surveySchema), async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);

    if (!survey) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Survey not found'
        }
      });
    }

    if (survey.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this survey'
        }
      });
    }

    Object.assign(survey, req.body);
    await survey.save();

    res.json({
      success: true,
      data: survey
    });
  } catch (error) {
    console.error('Update survey error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update survey'
      }
    });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);

    if (!survey) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Survey not found'
        }
      });
    }

    if (survey.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this survey'
        }
      });
    }

    await Survey.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Survey deleted successfully'
    });
  } catch (error) {
    console.error('Delete survey error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete survey'
      }
    });
  }
});

router.post('/:id/publish', authMiddleware, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);

    if (!survey) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Survey not found'
        }
      });
    }

    if (survey.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to publish this survey'
        }
      });
    }

    survey.status = 'active';
    await survey.save();

    res.json({
      success: true,
      data: survey
    });
  } catch (error) {
    console.error('Publish survey error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to publish survey'
      }
    });
  }
});

module.exports = router;
