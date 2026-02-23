const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: String, // Changed from ObjectId to String to support mixed ID types
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, { _id: false });

const responseSchema = new mongoose.Schema({
  surveyId: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userName: String, // Surveyor's name/ID (person who logged in)
  respondentName: String, // Name of the person being surveyed
  respondentPhone: String, // Phone of the person being surveyed
  parliament: String,
  municipality: String,
  ward_num: String,
  Question_1: String, // The main question/answer
  googleMapsLink: String,
  location: {
    latitude: Number,
    longitude: Number
  },
  assembly: String,
  mandal: String,
  village_or_street: String,
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
  timestamps: true,
  collection: 'msr_responses', // Set specific collection name
  strict: false // Allow dynamic fields like Question_5, Question_6 etc.
});

responseSchema.index({ surveyId: 1 });
responseSchema.index({ userId: 1 });
responseSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Response', responseSchema);
