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
    const settings = req.body;
    
    // Mock updating settings
    res.json({
      success: true,
      data: settings
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

module.exports = router;
