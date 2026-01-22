const express = require('express');
const router = express.Router();
const Survey = require('../models/Survey');
const { authMiddleware } = require('../../shared/auth');

// Create survey
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('Creating survey with data:', req.body);
    console.log('User:', req.user);

    const survey = new Survey({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      questions: req.body.questions,
      createdBy: req.user.id,
      status: 'draft'
    });

    await survey.save();

    console.log('Survey created successfully:', survey._id);

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
    console.error('Create survey error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to create survey'
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

    // Non-admin users can see:
    // 1. All active/published surveys (public)
    // 2. Only their own draft/closed/archived surveys
    if (req.user.role !== 'admin') {
      query.$or = [
        { status: 'active' },  // Public active surveys
        { createdBy: req.user.id }  // Their own surveys
      ];
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

router.put('/:id', authMiddleware, async (req, res) => {
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

// Add a new question to a survey
router.post('/:id/questions', authMiddleware, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Survey not found' } });
    }
    if (survey.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to modify this survey' } });
    }
    const newQuestion = req.body.question;
    if (!newQuestion) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Question data is required' } });
    }
    survey.questions.push(newQuestion);
    await survey.save();
    res.status(201).json({ success: true, data: survey });
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to add question' } });
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
    console.log('Publishing survey:', req.params.id);
    console.log('User:', req.user);

    const survey = await Survey.findById(req.params.id);

    if (!survey) {
      console.log('Survey not found');
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Survey not found'
        }
      });
    }

    console.log('Survey createdBy:', survey.createdBy);
    console.log('User ID:', req.user.id);

    if (survey.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      console.log('Permission denied');
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

    console.log('Survey published successfully');

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
        message: error.message || 'Failed to publish survey'
      }
    });
  }
});

module.exports = router;
