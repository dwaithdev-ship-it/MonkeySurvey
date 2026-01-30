const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../shared/auth');

// Send survey invitation
router.post('/invite', authMiddleware, async (req, res) => {
  try {
    const { surveyId, recipients, message, scheduleAt } = req.body;

    if (!surveyId || !recipients || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'surveyId and recipients are required'
        }
      });
    }

    // Mock sending invitations
    res.json({
      success: true,
      data: {
        invitationId: '507f1f77bcf86cd799439017',
        recipientCount: recipients.length,
        status: scheduleAt ? 'scheduled' : 'sent'
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

// Get notification settings
router.get('/settings', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        email: true,
        push: true,
        frequency: 'immediate',
        types: {
          newResponse: true,
          surveyComplete: true,
          weeklyReport: false
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

// Update notification settings
router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const { frequency, types } = req.body;
    const mongoose = require('mongoose');
    const User = mongoose.model('User');

    // Update the user's settings in MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          'settings.reportFrequency': frequency,
          'settings.notificationTypes': types
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User settings could not be updated.'
        }
      });
    }

    res.json({
      success: true,
      data: updatedUser.settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message
      }
    });
  }
});

module.exports = router;
