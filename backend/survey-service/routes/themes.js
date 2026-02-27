const express = require('express');
const router = express.Router();
const SurveyTheme = require('../models/SurveyTheme');

// @route   GET /survey-theme/:surveyId
// @desc    Get active theme for a specific survey
// @access  Public
router.get('/:surveyId', async (req, res) => {
    try {
        const { surveyId } = req.params;

        // Find the active theme matching the survey ID
        const theme = await SurveyTheme.findOne({
            surveyId: surveyId,
            isActive: true
        });

        if (!theme) {
            return res.status(404).json({
                success: false,
                message: 'No active theme found for this survey'
            });
        }

        res.status(200).json({
            success: true,
            data: theme
        });
    } catch (error) {
        console.error('Error fetching survey theme:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error while fetching theme'
        });
    }
});

// @route   GET /survey-theme
// @desc    Get all active themes
// @access  Public
router.get('/', async (req, res) => {
    try {
        const themes = await SurveyTheme.find({ isActive: true });
        res.status(200).json({ success: true, data: themes });
    } catch (error) {
        console.error('Error fetching themes:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   POST /survey-theme
// @desc    Create or update a theme
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { surveyId } = req.body;
        if (!surveyId) {
            return res.status(400).json({ success: false, message: 'surveyId is required' });
        }

        const theme = await SurveyTheme.findOneAndUpdate(
            { surveyId, isActive: true },
            { $set: req.body },
            { new: true, upsert: true }
        );

        res.status(200).json({ success: true, data: theme });
    } catch (error) {
        console.error('Error saving theme:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
