const mongoose = require('mongoose');

const surveyThemeSchema = new mongoose.Schema({
    surveyId: {
        type: String,
        required: true,
        index: true
    },
    themeName: {
        type: String,
        required: true
    },
    layoutType: {
        type: String,
        enum: ['mobile', 'tablet', 'desktop'],
        default: 'mobile'
    },
    headerBackgroundColor: {
        type: String,
        default: '#09C1D8'
    },
    headerTextColor: {
        type: String,
        default: '#FFFFFF'
    },
    bodyBackgroundColor: {
        type: String,
        default: '#FFFFFF'
    },
    bodyTextColor: {
        type: String,
        default: '#444444'
    },
    bodyIconColor: {
        type: String,
        default: '#09C1D8'
    },
    inputTextColor: {
        type: String,
        default: '#444444'
    },
    groupBackgroundColor: {
        type: String,
        default: '#09C1D8'
    },
    groupTextColor: {
        type: String,
        default: '#FFFFFF'
    },
    formBackgroundImage: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'survey_themes'
});

// Ensure only one active theme per survey
surveyThemeSchema.index({ surveyId: 1, isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

module.exports = mongoose.model('SurveyTheme', surveyThemeSchema);
