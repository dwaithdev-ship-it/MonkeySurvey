const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, { _id: false });

const responseSchema = new mongoose.Schema({
  surveyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Survey',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  location: {
    latitude: Number,
    longitude: Number
  },
  answers: [answerSchema],
  metadata: {
    userAgent: String,
    ipAddress: String,
    deviceType: String,
    country: String
  },
  isComplete: {
    type: Boolean,
    default: true
  },
  startedAt: Date,
  completedAt: Date
}, {
  timestamps: true
});

responseSchema.index({ surveyId: 1 });
responseSchema.index({ userId: 1 });
responseSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Response', responseSchema);
