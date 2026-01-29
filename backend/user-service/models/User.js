const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  district: {
    type: String,
    required: false,
    trim: true
  },
  municipality: {
    type: String,
    required: false,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'creator', 'respondent'],
    default: 'creator'
  },
  profileImage: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  phoneNumber: {
    type: String,
    required: function () {
      // Phone number is required for respondent users
      return this.role === 'respondent';
    },
    unique: true,
    trim: true,
    sparse: true,
    index: true
  },
  activeSession: {
    token: { type: String, default: null },
    deviceId: { type: String, default: null },
    loginTime: { type: Date, default: null },
    ipAddress: { type: String, default: null }
  },
  registeredDeviceId: {
    type: String,
    default: null
  },
  settings: {
    notifications: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  }
}, {
  timestamps: true
});

// Index for email lookups
userSchema.index({ role: 1 });

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
