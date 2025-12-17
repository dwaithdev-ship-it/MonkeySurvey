const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  surveyId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Survey'
  },
  respondentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    value: mongoose.Schema.Types.Mixed,
    answeredAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['incomplete', 'complete'],
    default: 'incomplete'
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    device: String,
    location: {
      country: String,
      city: String
    }
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  timeToComplete: Number
}, {
  timestamps: true
});

responseSchema.index({ surveyId: 1, createdAt: -1 });
responseSchema.index({ respondentId: 1 });

module.exports = mongoose.model('Response', responseSchema);
