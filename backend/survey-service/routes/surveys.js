const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Survey = require('../models/Survey');
const { authMiddleware } = require('../../shared/auth');

// Create survey
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('Creating survey with data:', req.body);
    console.log('User:', req.user);

    const survey = new Survey({
      ...req.body,
      title: req.body.name || req.body.title, // Support both
      createdBy: req.user.id,
      status: req.body.status || 'draft'
    });

    await survey.save();

    console.log('Survey created successfully:', survey._id);

    const frontendUrl = process.env.NODE_ENV === 'production'
      ? 'https://bodhasurvey.duckdns.org'
      : 'http://localhost:4000';

    res.status(201).json({
      success: true,
      data: {
        surveyId: survey._id,
        title: survey.title,
        status: survey.status,
        shareUrl: `${frontendUrl}/s/${survey._id}`
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

    if (status) {
      // Normalize: 'Published' maps to 'active' in the DB
      const normalizedStatus = (status === 'Published') ? 'active' : status;
      query.status = normalizedStatus;
    }
    if (category) query.category = category;

    // Non-admin users can only see published (active/Published) surveys
    if (req.user.role !== 'admin') {
      query.status = { $in: ['active', 'Published'] };
    }

    const skip = (page - 1) * limit;
    const surveys = await Survey.find(query)
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
    const { id } = req.params;

    // Check if ID is a valid MongoDB ObjectId
    const isValidId = mongoose.Types.ObjectId.isValid(id);

    let survey;
    if (isValidId) {
      survey = await Survey.findById(id);
    } else {
      // Try searching by name/title (slug matching)
      // Convert slug back to a search pattern (case insensitive)
      const slugPattern = new RegExp('^' + id.replace(/-/g, '[\\s-]') + '$', 'i');
      survey = await Survey.findOne({
        $or: [
          { name: slugPattern },
          { title: slugPattern }
        ]
      });
    }

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

// Unpublish a survey (admin only)
router.post('/:id/unpublish', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only admins can unpublish surveys' }
      });
    }

    const survey = await Survey.findById(req.params.id);
    if (!survey) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Survey not found' }
      });
    }

    survey.status = 'UnPublished';
    await survey.save();

    res.json({ success: true, data: survey });
  } catch (error) {
    console.error('Unpublish survey error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to unpublish survey' }
    });
  }
});

module.exports = router;
