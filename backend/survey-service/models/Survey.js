const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['multiple_choice', 'checkbox', 'text', 'textarea', 'rating', 'scale', 'date', 'dropdown', 'matrix'],
    required: true
  },
  question: {
    type: String,
    required: true
  },
  description: String,
  required: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  options: [{
    value: String,
    label: String,
    order: Number
  }],
  validation: {
    minLength: Number,
    maxLength: Number,
    pattern: String,
    min: Number,
    max: Number,
    maxSelect: Number
  },
  logic: {
    skipTo: mongoose.Schema.Types.ObjectId,
    showIf: {
      questionId: mongoose.Schema.Types.ObjectId,
      operator: {
        type: String,
        enum: ['equals', 'contains', 'greaterThan', 'lessThan']
      },
      value: mongoose.Schema.Types.Mixed
    }
  }
}, { _id: true });

const surveySchema = new mongoose.Schema({
  title: {
    type: String,
    required: false
  },
  name: {
    type: String,
    required: false
  },
  description: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'closed', 'archived', 'UnPublished', 'Published'],
    default: 'draft'
  },
  type: String,
  surveyType: String,
  category: String,
  tags: [String],
  startDate: Date,
  endDate: Date,
  headerText: String,
  theme: String,
  layoutType: String,
  accessPin: String,
  loopSurvey: Boolean,
  pdfShowAnswered: Boolean,
  backgroundLocation: Boolean,
  isLocationMandatory: Boolean,
  thankYouDuration: Number,
  welcomeImageName: String,
  welcomeImageData: String,
  thankYouImageName: String,
  thankYouImageData: String,
  settings: {
    anonymous: {
      type: Boolean,
      default: false
    },
    multipleSubmissions: {
      type: Boolean,
      default: false
    },
    showResults: {
      type: Boolean,
      default: true
    },
    requireLogin: {
      type: Boolean,
      default: false
    },
    randomizeQuestions: {
      type: Boolean,
      default: false
    },
    maxResponses: Number
  },
  branding: {
    logo: String,
    primaryColor: String,
    backgroundColor: String
  },
  questions: [mongoose.Schema.Types.Mixed],
  pages: [mongoose.Schema.Types.Mixed],
  responseCount: {
    type: Number,
    default: 0
  },
  completionRate: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  strict: false // Allow other fields
});

// Indexes
surveySchema.index({ createdBy: 1 });
surveySchema.index({ status: 1 });
surveySchema.index({ category: 1 });
surveySchema.index({ tags: 1 });
surveySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Survey', surveySchema);
